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
        public DbSet<GuestInfo> GuestInfos { get; set; }
        

        // Add these DbSets
        public DbSet<FinancialTransaction> FinancialTransactions { get; set; }
        public DbSet<DiscountProgram> DiscountPrograms { get; set; }
        public DbSet<ProcedureDiscountProgram> ProcedureDiscountPrograms { get; set; }
        public DbSet<ChatBotKnowledge> ChatBotKnowledge { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Map entity names to actual database table names (lowercase)
            modelBuilder.Entity<Schedule>().ToTable("schedules");
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Patient>().ToTable("patients");
            modelBuilder.Entity<Appointment>().ToTable("appointments");
            modelBuilder.Entity<Dentist>().ToTable("dentists");
            modelBuilder.Entity<Assistant>().ToTable("assistants");
            modelBuilder.Entity<Receptionist>().ToTable("receptionists");
            modelBuilder.Entity<Administrator>().ToTable("administrators");
            modelBuilder.Entity<Owner>().ToTable("owners");
            modelBuilder.Entity<Supplies>().ToTable("supplies");
            modelBuilder.Entity<Procedure>().ToTable("procedures");
            modelBuilder.Entity<FinancialTransaction>().ToTable("financialtransactions");
            modelBuilder.Entity<Prescription>().ToTable("prescriptions");
            modelBuilder.Entity<TreatmentRecord>().ToTable("treatmentrecords");
            modelBuilder.Entity<TreatmentProgress>().ToTable("treatmentprogresses");
            modelBuilder.Entity<WarrantyCard>().ToTable("warrantycards");
            modelBuilder.Entity<Task>().ToTable("tasks");
            modelBuilder.Entity<Notification>().ToTable("notifications");
            modelBuilder.Entity<ChatMessage>().ToTable("chatmessages");
            modelBuilder.Entity<Invoice>().ToTable("invoices");
            modelBuilder.Entity<GuestInfo>().ToTable("guestinfos");
            modelBuilder.Entity<Image>().ToTable("images");
            modelBuilder.Entity<Instruction>().ToTable("instructions");
            modelBuilder.Entity<InstructionTemplate>().ToTable("instructiontemplates");
            modelBuilder.Entity<PrescriptionTemplate>().ToTable("prescriptiontemplates");
            modelBuilder.Entity<DiscountProgram>().ToTable("discountprograms");
            modelBuilder.Entity<EquipmentMaintenance>().ToTable("equipmentmaintenances");
            modelBuilder.Entity<OrthodonticTreatmentPlan>().ToTable("orthodontictreatmentplans");
            modelBuilder.Entity<SMS>().ToTable("smses");
            modelBuilder.Entity<Salary>().ToTable("salaries");
            modelBuilder.Entity<SalaryComponent>().ToTable("salarycomponents");
            modelBuilder.Entity<ChatBotKnowledge>().ToTable("chatbotknowledge");
            modelBuilder.Entity<MaintenanceSupply>().ToTable("maintenancesupplies");
            modelBuilder.Entity<SuppliesUsed>().ToTable("suppliesuseds");
            modelBuilder.Entity<ProcedureDiscountProgram>().ToTable("procedurediscountprograms");

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