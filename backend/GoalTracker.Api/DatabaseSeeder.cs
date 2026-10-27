using Microsoft.EntityFrameworkCore;

namespace GoalTracker.Api;

public static class DatabaseSeeder
{
    public static async Task InitializeAsync(GoalTrackerDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var teams = new[]
        {
            new Team { Id = 1, Name = "Sales", Description = "Sales and Business Development" },
            new Team { Id = 2, Name = "Operations", Description = "Manufacturing and Supply Chain Operations" },
            new Team { Id = 3, Name = "HR", Description = "Human Resources and People Operations" }
        };
        db.Teams.AddRange(teams);
        db.Users.AddRange(
            new User { Id = 1, Name = "Priya Sharma", Email = "priya@atomberg.com", Role = "employee", Dept = "Sales", ManagerId = 2, TeamId = 1 },
            new User { Id = 2, Name = "Rajesh Kumar", Email = "rajesh@atomberg.com", Role = "manager", Dept = "Sales", ManagerId = 3, TeamId = 1 },
            new User { Id = 3, Name = "Admin HR", Email = "admin@atomberg.com", Role = "admin", Dept = "HR", TeamId = 3 },
            new User { Id = 4, Name = "Anita Singh", Email = "anita@atomberg.com", Role = "employee", Dept = "Sales", ManagerId = 2, TeamId = 1 },
            new User { Id = 5, Name = "Vikram Nair", Email = "vikram@atomberg.com", Role = "employee", Dept = "Operations", ManagerId = 2, TeamId = 2 });

        var goals = new[]
        {
            NewGoal(1, 1, "Revenue Growth", "Achieve Sales Target", "Hit Rs 50L quarterly sales revenue", "Numeric (Higher is Better)", "5000000", 40, "approved", true),
            NewGoal(2, 1, "Customer Success", "Improve CSAT Score", "Customer satisfaction above 4.5/5", "Numeric (Higher is Better)", "4.5", 30, "approved", true),
            NewGoal(3, 1, "Operational Excellence", "Reduce TAT", "Turnaround time below 2 days", "Numeric (Lower is Better)", "2", 20, "approved", true),
            NewGoal(4, 1, "People & Culture", "Training Completion", "Finish all mandatory training by Sep", "Timeline", "2026-09-30", 10, "approved", true),
            NewGoal(5, 4, "Revenue Growth", "Lead Generation", "100 qualified leads per quarter", "Numeric (Higher is Better)", "100", 60, "pending", false),
            NewGoal(6, 4, "Cost Optimization", "Reduce Travel Expenses", "Keep travel under Rs 50K budget", "Numeric (Lower is Better)", "50000", 40, "pending", false),
            NewGoal(7, 5, "Operational Excellence", "Process Efficiency", "Reduce process time by 20%", "Numeric (Higher is Better)", "20", 50, "approved", true),
            NewGoal(8, 5, "Cost Optimization", "Safety Incidents Zero", "Zero safety incidents in plant", "Zero-based", "0", 30, "approved", true),
            NewGoal(9, 5, "People & Culture", "Team Training Hours", "Complete 40 hrs of team training", "Numeric (Higher is Better)", "40", 20, "approved", true),
            NewGoal(10, 1, "Revenue Growth", "Q2 Sales Blitz KPI", "Dept-wide Q2 sales push target", "Numeric (Higher is Better)", "8000000", 0, "approved", true, true, "sg1", 1),
            NewGoal(11, 4, "Revenue Growth", "Q2 Sales Blitz KPI", "Dept-wide Q2 sales push target", "Numeric (Higher is Better)", "8000000", 0, "approved", true, true, "sg1", 1)
        };
        db.Goals.AddRange(goals);
        db.CheckIns.AddRange(
            new QuarterlyCheckIn { GoalId = 1, Quarter = "Q1 (July)", Actual = "3200000", Status = "On Track", Comment = "Good momentum, keep pushing!", ManagerName = "Rajesh Kumar", ReviewedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new QuarterlyCheckIn { GoalId = 7, Quarter = "Q1 (July)", Actual = "14", Status = "On Track" },
            new QuarterlyCheckIn { GoalId = 8, Quarter = "Q1 (July)", Actual = "0", Status = "Completed" });
        db.AuditEvents.AddRange(
            new AuditEvent { Action = "Goal approved", UserName = "Rajesh Kumar", GoalTitle = "Achieve Sales Target", Timestamp = DateTime.UtcNow.AddDays(-20), Details = "Approved and locked" },
            new AuditEvent { Action = "Achievement logged", UserName = "Priya Sharma", GoalTitle = "Achieve Sales Target", Timestamp = DateTime.UtcNow.AddDays(-10), Details = "Q1 actual: 3,200,000" },
            new AuditEvent { Action = "Goal approved", UserName = "Rajesh Kumar", GoalTitle = "Process Efficiency", Timestamp = DateTime.UtcNow.AddDays(-19), Details = "Approved and locked" },
            new AuditEvent { Action = "Shared goal pushed", UserName = "Admin HR", GoalTitle = "Q2 Sales Blitz KPI", Timestamp = DateTime.UtcNow.AddDays(-18), Details = "Pushed to 2 Sales employees" });
        db.Escalations.AddRange(
            new Escalation { Id = 1, Type = "Goal not submitted", EmployeeId = 5, EmployeeName = "Vikram Nair", ManagerId = 2, ManagerName = "Rajesh Kumar", TriggeredAt = DateTime.UtcNow.AddDays(-15), Status = "resolved", ResolvedAt = DateTime.UtcNow.AddDays(-14), Note = "Goals submitted after reminder" },
            new Escalation { Id = 2, Type = "Check-in overdue", EmployeeId = 5, EmployeeName = "Vikram Nair", ManagerId = 2, ManagerName = "Rajesh Kumar", TriggeredAt = DateTime.UtcNow.AddDays(-5), Status = "open" });

        await db.SaveChangesAsync();
    }

    private static Goal NewGoal(int id, int employeeId, string thrust, string title, string description, string uom,
        string target, double weight, string status, bool locked, bool shared = false, string? group = null, int? ownerId = null) =>
        new()
        {
            Id = id,
            EmployeeId = employeeId,
            ThrustArea = thrust,
            Title = title,
            Description = description,
            Uom = uom,
            Target = target,
            Weightage = weight,
            Status = status,
            Locked = locked,
            IsShared = shared,
            SharedGroupId = group,
            PrimaryOwnerId = ownerId,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };
}
