using Microsoft.EntityFrameworkCore;

namespace GoalTracker.Api;

public sealed class GoalTrackerDbContext(DbContextOptions<GoalTrackerDbContext> options) : DbContext(options)
{
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<QuarterlyCheckIn> CheckIns => Set<QuarterlyCheckIn>();
    public DbSet<Approval> Approvals => Set<Approval>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<Escalation> Escalations => Set<Escalation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Team>().HasIndex(team => team.Name).IsUnique();
        modelBuilder.Entity<User>().HasIndex(user => user.Email).IsUnique();
        modelBuilder.Entity<User>().HasOne(user => user.Manager).WithMany().HasForeignKey(user => user.ManagerId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<User>().HasOne(user => user.Team).WithMany().HasForeignKey(user => user.TeamId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Goal>().HasOne(goal => goal.Employee).WithMany().HasForeignKey(goal => goal.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Goal>().HasOne(goal => goal.PrimaryOwner).WithMany().HasForeignKey(goal => goal.PrimaryOwnerId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Goal>().HasIndex(goal => new { goal.EmployeeId, goal.Status });
        modelBuilder.Entity<Goal>().HasIndex(goal => goal.SharedGroupId);
        modelBuilder.Entity<QuarterlyCheckIn>().HasOne(checkIn => checkIn.Goal).WithMany(goal => goal.CheckIns).HasForeignKey(checkIn => checkIn.GoalId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<QuarterlyCheckIn>().HasIndex(checkIn => new { checkIn.GoalId, checkIn.Quarter }).IsUnique();
        modelBuilder.Entity<Approval>().HasOne(approval => approval.Goal).WithMany().HasForeignKey(approval => approval.GoalId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AuditEvent>().HasIndex(entry => entry.Timestamp);
    }
}

public sealed class Team
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
}

public sealed class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required string Dept { get; set; }
    public int? ManagerId { get; set; }
    public int? TeamId { get; set; }
    public User? Manager { get; set; }
    public Team? Team { get; set; }
}

public sealed class Goal
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public required string ThrustArea { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = "";
    public required string Uom { get; set; }
    public required string Target { get; set; }
    public double Weightage { get; set; }
    public string Status { get; set; } = "draft";
    public bool Locked { get; set; }
    public bool IsShared { get; set; }
    public string? SharedGroupId { get; set; }
    public int? PrimaryOwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User? Employee { get; set; }
    public User? PrimaryOwner { get; set; }
    public List<QuarterlyCheckIn> CheckIns { get; set; } = [];
}

public sealed class QuarterlyCheckIn
{
    public int Id { get; set; }
    public int GoalId { get; set; }
    public required string Quarter { get; set; }
    public string? Actual { get; set; }
    public string? Status { get; set; }
    public string? Comment { get; set; }
    public string? ManagerName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Goal? Goal { get; set; }
}

public sealed class Approval
{
    public int Id { get; set; }
    public int GoalId { get; set; }
    public int? ReviewerId { get; set; }
    public required string Action { get; set; }
    public string? Comments { get; set; }
    public string? PreviousStatus { get; set; }
    public required string NewStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Goal? Goal { get; set; }
}

public sealed class AuditEvent
{
    public int Id { get; set; }
    public required string Action { get; set; }
    public required string UserName { get; set; }
    public int? UserId { get; set; }
    public string? GoalTitle { get; set; }
    public int? GoalId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }
}

public sealed class Escalation
{
    public int Id { get; set; }
    public required string Type { get; set; }
    public int EmployeeId { get; set; }
    public required string EmployeeName { get; set; }
    public int? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "open";
    public DateTime? ResolvedAt { get; set; }
    public string? Note { get; set; }
}
