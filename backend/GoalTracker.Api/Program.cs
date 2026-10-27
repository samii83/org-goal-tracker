using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GoalTracker.Api;

var builder = WebApplication.CreateBuilder(args);
var databasePath = builder.Configuration["DATABASE_PATH"] ?? Path.Combine(builder.Environment.ContentRootPath, "data", "goaltrack.db");
if (!Path.IsPathRooted(databasePath))
{
    databasePath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, databasePath));
}
Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);
builder.Services.AddDbContext<GoalTrackerDbContext>(options => options.UseSqlite($"Data Source={databasePath}"));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "goaltrack_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GoalTrackerDbContext>();
    await DatabaseSeeder.InitializeAsync(db);
}

app.MapGet("/api/health", async (GoalTrackerDbContext db) =>
{
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        return Results.Ok(new { status = "ok", database = "connected", database_url_configured = true, error = (string?)null, timestamp = DateTime.UtcNow, environment = app.Environment.EnvironmentName });
    }
    catch (Exception exception)
    {
        app.Logger.LogError(exception, "Database health check failed");
        return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Database unavailable");
    }
});
app.MapGet("/health", () => Results.Redirect("/api/health"));

app.MapPost("/api/auth/login", async (LoginRequest request, HttpContext context, GoalTrackerDbContext db) =>
{
    var email = request.Email?.Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(email))
    {
        return ValidationProblem(new Dictionary<string, string[]> { ["email"] = ["Email is required."] });
    }

    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(candidate => candidate.Email.ToLower() == email);
    if (user is null)
    {
        return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "User not found", detail: "Please verify the email address.");
    }

    if (!string.IsNullOrEmpty(request.Password) && request.Password != "password123")
    {
        return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid password", detail: "The demo password is password123.");
    }

    var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(CultureInfo.InvariantCulture)), new Claim(ClaimTypes.Name, user.Name), new Claim(ClaimTypes.Role, user.Role) };
    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
    return Results.Ok(ToUserResponse(user));
});
app.MapPost("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { message = "Logged out successfully" });
});
app.MapGet("/api/auth/me", async (ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var user = await CurrentUserAsync(principal, db);
    return user is null ? Results.Unauthorized() : Results.Ok(ToUserResponse(user));
});

app.MapGet("/api/users", async (GoalTrackerDbContext db) =>
    Results.Ok(await db.Users.AsNoTracking().OrderBy(user => user.Id).Select(user => new
    {
        id = user.Id, name = user.Name, email = user.Email, role = user.Role, dept = user.Dept, managerId = user.ManagerId, teamId = user.TeamId
    }).ToListAsync()));
app.MapGet("/api/teams", async (GoalTrackerDbContext db) =>
    Results.Ok(await db.Teams.AsNoTracking().OrderBy(team => team.Id).Select(team => new { id = team.Id, name = team.Name, description = team.Description }).ToListAsync()));

app.MapGet("/api/goals", async (int? employee_id, GoalTrackerDbContext db) =>
{
    var query = db.Goals.AsNoTracking().Include(goal => goal.CheckIns).OrderBy(goal => goal.Id);
    var goals = employee_id is null
        ? await query.ToListAsync()
        : await query.Where(goal => goal.EmployeeId == employee_id).ToListAsync();
    return Results.Ok(goals.Select(ToGoalResponse));
});

app.MapPost("/api/goals", async (CreateGoalRequest request, int? employee_id, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var errors = ValidateGoal(request.ThrustArea, request.Title, request.Uom, request.Target, request.Weightage);
    if (request.Description is { Length: > 2000 }) errors["description"] = ["Description must be 2000 characters or fewer."];
    if (errors.Count != 0)
    {
        return ValidationProblem(errors);
    }
    var employeeId = employee_id ?? CurrentUserId(principal);
    if (employeeId is null || !await db.Users.AnyAsync(user => user.Id == employeeId))
    {
        return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid employee", detail: "A valid employee_id or signed-in employee is required.");
    }
    var activeCount = await db.Goals.CountAsync(goal => goal.EmployeeId == employeeId && goal.Status != "rejected");
    if (activeCount >= 8)
    {
        return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Goal limit reached", detail: "Maximum 8 goals allowed per employee.");
    }

    var goal = new Goal
    {
        EmployeeId = employeeId.Value, ThrustArea = request.ThrustArea!.Trim(), Title = request.Title!.Trim(),
        Description = request.Description?.Trim() ?? "", Uom = request.Uom!, Target = FlexibleValue(request.Target),
        Weightage = request.Weightage!.Value, Status = "draft", Locked = false
    };
    db.Goals.Add(goal);
    AddAudit(db, principal, "Goal created", goal.Title, "Draft created", goal.Id);
    await db.SaveChangesAsync();
    await db.Entry(goal).Collection(item => item.CheckIns).LoadAsync();
    return Results.Created($"/api/goals/{goal.Id}", ToGoalResponse(goal));
});

app.MapPut("/api/goals/{goalId:int}", async (int goalId, UpdateGoalRequest request, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var goal = await db.Goals.Include(item => item.CheckIns).FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    var sharedWeightOnly = goal.IsShared && request.Weightage.HasValue &&
        request.ThrustArea is null && request.Title is null && request.Description is null &&
        request.Uom is null && request.Target is null && request.Status is null && request.Locked is null;
    if (goal.Locked && !sharedWeightOnly && !principal.IsInRole("manager") && !principal.IsInRole("admin"))
    {
        return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Goal is locked", detail: "A locked goal cannot be edited.");
    }

    var errors = ValidateGoal(request.ThrustArea ?? goal.ThrustArea, request.Title ?? goal.Title, request.Uom ?? goal.Uom,
        request.Target ?? JsonSerializer.SerializeToElement(goal.Target), request.Weightage ?? goal.Weightage, allowZeroWeight: goal.IsShared);
    if (request.Description is { Length: > 2000 }) errors["description"] = ["Description must be 2000 characters or fewer."];
    if (request.Status is not null && request.Status is not ("draft" or "pending" or "approved" or "rejected"))
        errors["status"] = ["Status must be draft, pending, approved, or rejected."];
    if (errors.Count != 0) return ValidationProblem(errors);
    if (!goal.IsShared)
    {
        if (request.ThrustArea is not null) goal.ThrustArea = request.ThrustArea.Trim();
        if (request.Title is not null) goal.Title = request.Title.Trim();
        if (request.Description is not null) goal.Description = request.Description.Trim();
        if (request.Uom is not null) goal.Uom = request.Uom;
        if (request.Target.HasValue) goal.Target = FlexibleValue(request.Target.Value);
    }
    if (request.Weightage.HasValue) goal.Weightage = request.Weightage.Value;
    if (request.Status is not null) goal.Status = request.Status;
    if (request.Locked.HasValue && principal.IsInRole("admin")) goal.Locked = request.Locked.Value;
    AddAudit(db, principal, "Goal edited", goal.Title, "Updated goal parameters", goal.Id);
    await db.SaveChangesAsync();
    return Results.Ok(ToGoalResponse(goal));
});

app.MapDelete("/api/goals/{goalId:int}", async (int goalId, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var goal = await db.Goals.FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    if (goal.Locked) return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Goal is locked", detail: "Cannot delete a locked goal.");
    db.Goals.Remove(goal);
    AddAudit(db, principal, "Goal deleted", goal.Title, $"Deleted goal #{goalId}", goal.Id);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = $"Goal '{goal.Title}' deleted successfully." });
});

app.MapPost("/api/goals/submit", async (int? employee_id, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var employeeId = employee_id ?? CurrentUserId(principal);
    if (employeeId is null) return Results.Problem(statusCode: 400, title: "Employee ID required");
    var activeGoals = await db.Goals.Where(goal => goal.EmployeeId == employeeId && goal.Status != "rejected").ToListAsync();
    var totalWeight = activeGoals.Sum(goal => goal.Weightage);
    if (Math.Round(totalWeight, 2) != 100)
    {
        return Results.Problem(statusCode: 400, title: "Invalid goal weightage", detail: $"Total weightage must equal 100%. Currently: {totalWeight}%");
    }
    var drafts = activeGoals.Where(goal => goal.Status == "draft").ToList();
    if (drafts.Count == 0) return Results.Problem(statusCode: 400, title: "No draft goals", detail: "There are no draft goals to submit.");
    foreach (var goal in drafts) goal.Status = "pending";
    AddAudit(db, principal, "Goals submitted for approval", "(All drafts)", $"{drafts.Count} goals submitted for approval");
    await db.SaveChangesAsync();
    return Results.Ok(new { message = $"Successfully submitted {drafts.Count} goal(s) for manager approval." });
});

app.MapPost("/api/goals/{goalId:int}/approve", async (int goalId, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
    await UpdateGoalReview(goalId, principal, db, approve: true));
app.MapPost("/api/goals/{goalId:int}/reject", async (int goalId, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
    await UpdateGoalReview(goalId, principal, db, approve: false));

app.MapPost("/api/goals/{goalId:int}/achievement", async (int goalId, AchievementRequest request, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var goal = await db.Goals.FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    var errors = ValidateQuarter(request.Quarter);
    if (request.Actual.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null) errors["actual"] = ["Actual progress is required."];
    else if (goal.Uom == "Timeline")
    {
        var actualDate = FlexibleValue(request.Actual);
        if (!DateOnly.TryParseExact(actualDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            errors["actual"] = ["Actual must be a date in YYYY-MM-DD format for timeline goals."];
    }
    else if (!decimal.TryParse(FlexibleValue(request.Actual), NumberStyles.Float, CultureInfo.InvariantCulture, out var actual) || actual < 0)
        errors["actual"] = ["Actual must be a non-negative number."];
    if (request.Status is not null && request.Status is not ("Not Started" or "On Track" or "Completed"))
        errors["status"] = ["Status must be Not Started, On Track, or Completed."];
    if (errors.Count != 0) return ValidationProblem(errors);

    var goals = new List<Goal> { goal };
    var userId = CurrentUserId(principal);
    if (goal.IsShared && goal.SharedGroupId is not null && goal.PrimaryOwnerId == userId)
    {
        goals.AddRange(await db.Goals.Where(peer => peer.SharedGroupId == goal.SharedGroupId && peer.Id != goal.Id).ToListAsync());
    }
    var actualValue = FlexibleValue(request.Actual);
    foreach (var item in goals)
    {
        var checkIn = await db.CheckIns.FirstOrDefaultAsync(value => value.GoalId == item.Id && value.Quarter == request.Quarter);
        if (checkIn is null)
        {
            checkIn = new QuarterlyCheckIn { GoalId = item.Id, Quarter = request.Quarter! };
            db.CheckIns.Add(checkIn);
        }
        checkIn.Actual = actualValue;
        checkIn.Status = request.Status ?? "On Track";
        checkIn.UpdatedAt = DateTime.UtcNow;
    }
    AddAudit(db, principal, "Achievement logged", goal.Title, $"{request.Quarter}: actual={actualValue}", goal.Id);
    await db.SaveChangesAsync();
    await db.Entry(goal).Collection(item => item.CheckIns).LoadAsync();
    return Results.Ok(ToGoalResponse(goal));
});

app.MapPost("/api/goals/{goalId:int}/checkin", async (int goalId, CheckInRequest request, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var goal = await db.Goals.Include(item => item.CheckIns).FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    var errors = ValidateQuarter(request.Quarter);
    if (string.IsNullOrWhiteSpace(request.Comment) || request.Comment.Length > 2000) errors["comment"] = ["Comment is required and must be 2000 characters or fewer."];
    if (errors.Count != 0) return ValidationProblem(errors);
    var checkIn = goal.CheckIns.FirstOrDefault(value => value.Quarter == request.Quarter);
    if (checkIn is null)
    {
        checkIn = new QuarterlyCheckIn { GoalId = goal.Id, Quarter = request.Quarter! };
        goal.CheckIns.Add(checkIn);
    }
    checkIn.Comment = request.Comment!.Trim();
    checkIn.ManagerName = principal.Identity?.Name ?? "Manager";
    checkIn.ReviewedAt = DateTime.UtcNow;
    checkIn.UpdatedAt = DateTime.UtcNow;
    AddAudit(db, principal, "Check-in completed", goal.Title, $"{request.Quarter} check-in saved", goal.Id);
    await db.SaveChangesAsync();
    return Results.Ok(ToGoalResponse(goal));
});

app.MapPost("/api/goals/shared", async (SharedGoalRequest request, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var errors = ValidateGoal(request.Thrust, request.Title, request.Uom, request.Target, 0, allowZeroWeight: true);
    if (string.IsNullOrWhiteSpace(request.Dept)) errors["dept"] = ["Department is required."];
    if (errors.Count != 0) return ValidationProblem(errors);
    var recipients = await db.Users.Where(user => user.Role == "employee" && user.Dept == request.Dept).ToListAsync();
    if (recipients.Count == 0) return Results.Problem(statusCode: 400, title: "No employees found", detail: $"No employees found in department '{request.Dept}'.");
    var groupId = $"sg_{Guid.NewGuid():N}";
    foreach (var employee in recipients)
    {
        db.Goals.Add(new Goal
        {
            EmployeeId = employee.Id, ThrustArea = request.Thrust!.Trim(), Title = request.Title!.Trim(),
            Description = request.Desc?.Trim() ?? "", Uom = request.Uom!, Target = FlexibleValue(request.Target),
            Weightage = 0, Status = "approved", Locked = true, IsShared = true, SharedGroupId = groupId,
            PrimaryOwnerId = recipients[0].Id
        });
    }
    AddAudit(db, principal, "Shared goal pushed", request.Title, $"Pushed to {recipients.Count} employees in {request.Dept}");
    await db.SaveChangesAsync();
    return Results.Ok(new { message = $"Shared goal successfully pushed to {recipients.Count} employees in {request.Dept}." });
});

app.MapPost("/api/goals/{goalId:int}/unlock", async (int goalId, ClaimsPrincipal principal, GoalTrackerDbContext db) =>
{
    var goal = await db.Goals.FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    goal.Locked = false;
    AddAudit(db, principal, "Goal unlocked (Admin override)", goal.Title, "Admin unlocked for editing", goal.Id);
    await db.SaveChangesAsync();
    await db.Entry(goal).Collection(item => item.CheckIns).LoadAsync();
    return Results.Ok(ToGoalResponse(goal));
});

app.MapGet("/api/audit", async (GoalTrackerDbContext db) =>
    Results.Ok(await db.AuditEvents.AsNoTracking().OrderByDescending(entry => entry.Timestamp).Select(entry => new
    {
        id = entry.Id, action = entry.Action, user = entry.UserName, goalTitle = entry.GoalTitle,
        timestamp = entry.Timestamp.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture), details = entry.Details ?? ""
    }).ToListAsync()));
app.MapGet("/api/escalations", async (GoalTrackerDbContext db) =>
{
    var escalations = await db.Escalations.AsNoTracking().OrderByDescending(entry => entry.TriggeredAt).ToListAsync();
    return Results.Ok(escalations.Select(ToEscalationResponse));
});
app.MapPost("/api/escalations/{escalationId:int}/resolve", async (int escalationId, GoalTrackerDbContext db) =>
{
    var escalation = await db.Escalations.FirstOrDefaultAsync(entry => entry.Id == escalationId);
    if (escalation is null) return NotFound("Escalation not found.");
    escalation.Status = "resolved";
    escalation.ResolvedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(ToEscalationResponse(escalation));
});

app.MapGet("/api/dashboard/stats", async (GoalTrackerDbContext db) =>
{
    var goals = await db.Goals.AsNoTracking().Include(goal => goal.CheckIns).ToListAsync();
    var completed = goals.Count(goal => goal.Status == "completed" || goal.CheckIns.Any(checkIn => checkIn.Status == "Completed"));
    var overdueTimeline = goals.Count(goal => goal.Uom == "Timeline" && DateOnly.TryParse(goal.Target, out var target) &&
        target < DateOnly.FromDateTime(DateTime.UtcNow) && !goal.CheckIns.Any(checkIn => checkIn.Status == "Completed"));
    var overdueEscalations = await db.Escalations.CountAsync(entry => entry.Status == "open" && EF.Functions.Like(entry.Type, "%overdue%"));
    return Results.Ok(new { total_goals = goals.Count, completed_goals = completed, overdue_goals = overdueTimeline + overdueEscalations, in_progress_goals = Math.Max(0, goals.Count - completed) });
});

var webRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(webRoot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}

app.Run();

static Dictionary<string, string[]> ValidateGoal(string? thrust, string? title, string? uom, JsonElement target, double? weightage, bool allowZeroWeight = false)
{
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(thrust) || thrust.Length > 100) errors["thrustArea"] = ["Thrust area is required and must be 100 characters or fewer."];
    if (string.IsNullOrWhiteSpace(title) || title.Length > 255) errors["title"] = ["Title is required and must be 255 characters or fewer."];
    if (uom is not ("Numeric (Higher is Better)" or "Numeric (Lower is Better)" or "Timeline" or "Zero-based"))
        errors["uom"] = ["Choose a supported unit of measure."];
    if (target.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        errors["target"] = ["Target is required."];
    else if (uom == "Timeline")
    {
        if (!DateOnly.TryParseExact(FlexibleValue(target), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            errors["target"] = ["Timeline targets must be dates in YYYY-MM-DD format."];
    }
    else if (!decimal.TryParse(FlexibleValue(target), NumberStyles.Float, CultureInfo.InvariantCulture, out var targetNumber) ||
        (uom == "Zero-based" ? targetNumber != 0 : targetNumber <= 0))
        errors["target"] = [uom == "Zero-based" ? "Zero-based goal targets must be zero." : "Target must be a positive number."];
    if (weightage is null || (allowZeroWeight ? weightage < 0 || weightage > 100 : weightage < 10 || weightage > 100))
        errors["weightage"] = [allowZeroWeight ? "Weightage must be between 0 and 100." : "Weightage must be between 10 and 100."];
    return errors;
}

static Dictionary<string, string[]> ValidateQuarter(string? quarter) =>
    quarter is "Q1 (July)" or "Q2 (October)" or "Q3 (January)" or "Q4/Annual (March)"
        ? []
        : new Dictionary<string, string[]> { ["quarter"] = ["Choose a supported quarter."] };

static IResult ValidationProblem(Dictionary<string, string[]> errors) =>
    Results.ValidationProblem(errors, statusCode: StatusCodes.Status400BadRequest, title: "Request validation failed.");

static IResult NotFound(string detail) =>
    Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: detail);

static async Task<IResult> UpdateGoalReview(int goalId, ClaimsPrincipal principal, GoalTrackerDbContext db, bool approve)
{
    var goal = await db.Goals.Include(item => item.CheckIns).FirstOrDefaultAsync(item => item.Id == goalId);
    if (goal is null) return NotFound("Goal not found.");
    var previousStatus = goal.Status;
    goal.Status = approve ? "approved" : "rejected";
    goal.Locked = approve;
    db.Approvals.Add(new Approval
    {
        GoalId = goal.Id, ReviewerId = CurrentUserId(principal), Action = approve ? "approved" : "rejected",
        Comments = approve ? "Approved and locked" : "Returned to employee for rework",
        PreviousStatus = previousStatus, NewStatus = goal.Status
    });
    AddAudit(db, principal, approve ? "Goal approved" : "Goal returned for rework", goal.Title,
        approve ? "Approved and locked" : "Returned to employee", goal.Id);
    await db.SaveChangesAsync();
    return Results.Ok(ToGoalResponse(goal));
}

static void AddAudit(GoalTrackerDbContext db, ClaimsPrincipal principal, string action, string? title, string? details, int? goalId = null)
{
    var userId = CurrentUserId(principal);
    db.AuditEvents.Add(new AuditEvent
    {
        Action = action, UserId = userId, UserName = principal.Identity?.Name ?? (userId is null ? "System" : $"User #{userId}"),
        GoalTitle = title, GoalId = goalId is > 0 ? goalId : null, Details = details, Timestamp = DateTime.UtcNow
    });
}

static int? CurrentUserId(ClaimsPrincipal principal) =>
    int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

static Task<User?> CurrentUserAsync(ClaimsPrincipal principal, GoalTrackerDbContext db)
{
    var id = CurrentUserId(principal);
    return id is null ? Task.FromResult<User?>(null) : db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == id);
}

static object ToUserResponse(User user) => new
{
    id = user.Id, name = user.Name, email = user.Email, role = user.Role, dept = user.Dept, managerId = user.ManagerId, teamId = user.TeamId
};

static object ToGoalResponse(Goal goal)
{
    var achievements = goal.CheckIns
        .Where(checkIn => checkIn.Actual is not null || checkIn.Status is not null)
        .ToDictionary(checkIn => checkIn.Quarter, checkIn => (object)new
        {
            actual = OutputValue(checkIn.Actual), status = checkIn.Status ?? "On Track", updatedAt = checkIn.UpdatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
        });
    var checkins = goal.CheckIns
        .Where(checkIn => !string.IsNullOrEmpty(checkIn.Comment))
        .ToDictionary(checkIn => checkIn.Quarter, checkIn => (object)new
        {
            comment = checkIn.Comment, managerName = checkIn.ManagerName ?? "Manager",
            date = (checkIn.ReviewedAt ?? checkIn.UpdatedAt).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
        });
    return new
    {
        id = goal.Id, employeeId = goal.EmployeeId, thrustArea = goal.ThrustArea, title = goal.Title,
        description = goal.Description, uom = goal.Uom, target = OutputValue(goal.Target), weightage = goal.Weightage,
        status = goal.Status, locked = goal.Locked, isShared = goal.IsShared, sharedGroupId = goal.SharedGroupId,
        primaryOwnerId = goal.PrimaryOwnerId, createdAt = goal.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        achievements, checkins
    };
}

static object? OutputValue(string? value) =>
    decimal.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) ? number : value;

static string FlexibleValue(JsonElement value) =>
    value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : value.GetRawText();

static object ToEscalationResponse(Escalation escalation) => new
{
    id = escalation.Id, type = escalation.Type, employeeId = escalation.EmployeeId, employeeName = escalation.EmployeeName,
    managerId = escalation.ManagerId, managerName = escalation.ManagerName,
    triggeredAt = escalation.TriggeredAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), status = escalation.Status,
    resolvedAt = escalation.ResolvedAt?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), note = escalation.Note ?? ""
};

public sealed class CreateGoalRequest
{
    public string? ThrustArea { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Uom { get; set; }
    public JsonElement Target { get; set; }
    public double? Weightage { get; set; }
}

public sealed class UpdateGoalRequest
{
    public string? ThrustArea { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Uom { get; set; }
    public JsonElement? Target { get; set; }
    public double? Weightage { get; set; }
    public string? Status { get; set; }
    public bool? Locked { get; set; }
}

public sealed class LoginRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public sealed class AchievementRequest
{
    public string? Quarter { get; set; }
    public JsonElement Actual { get; set; }
    public string? Status { get; set; }
}

public sealed class CheckInRequest
{
    public string? Quarter { get; set; }
    public string? Comment { get; set; }
}

public sealed class SharedGoalRequest
{
    public string? Dept { get; set; }
    public string? Thrust { get; set; }
    public string? Title { get; set; }
    public string? Desc { get; set; }
    public string? Uom { get; set; }
    public JsonElement Target { get; set; }
}

public partial class Program;
