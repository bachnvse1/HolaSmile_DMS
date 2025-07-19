using Domain.Entities;
using HDMS_API.Application.Usecases.UserCommon.Login;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

        public DbSet<Administrator> Administrators { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Assistant> Assistants { get; set; }
        public DbSet<Dentist> Dentists { get; set; }
        public DbSet<EquipmentMaintenance> EquipmentMaintenances { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<Instruction> Instructions { get; set; }
        public DbSet<InstructionTemplate> InstructionTemplates { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<MaintenanceSupply> MaintenanceSupplies { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<OrthodonticTreatmentPlan> OrthodonticTreatmentPlans { get; set; }
        public DbSet<Owner> Owners { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<PrescriptionTemplate> PrescriptionTemplates { get; set; }
        public DbSet<Procedure> Procedures { get; set; }
        public DbSet<Receptionist> Receptionists { get; set; }
        public DbSet<Salary> Salaries { get; set; }
        public DbSet<SalaryComponent> SalaryComponents { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<SMS> SMSes { get; set; }
        public DbSet<Supplies> Supplies { get; set; }
        public DbSet<SuppliesUsed> SuppliesUseds { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<TreatmentProgress> TreatmentProgresses { get; set; }
        public DbSet<TreatmentRecord> TreatmentRecords { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<WarrantyCard> WarrantyCards { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        // Add these DbSets
        public DbSet<FinancialTransaction> FinancialTransactions { get; set; }
        public DbSet<DiscountProgram> DiscountPrograms { get; set; }
        public DbSet<ProcedureDiscountProgram> ProcedureDiscountPrograms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Composite key for MaintenanceSupply
            modelBuilder.Entity<MaintenanceSupply>()
                .HasKey(ms => new { ms.SupplyId, ms.MaintenanceId });

            // Composite key for SuppliesUsed
            modelBuilder.Entity<SuppliesUsed>()
                .HasKey(su => new { su.ProcedureId, su.SupplyId });

            // Composite key for ProcedureDiscountProgram
            modelBuilder.Entity<ProcedureDiscountProgram>()
                .HasKey(pdp => new { pdp.ProcedureId, pdp.DiscountProgramId });

            modelBuilder.Entity<UserRoleResult>().HasNoKey();
        }
    }
}