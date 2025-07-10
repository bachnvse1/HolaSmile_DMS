using Microsoft.EntityFrameworkCore;

public class FakeAppDbContext : DbContext
{
    public FakeAppDbContext(DbContextOptions<FakeAppDbContext> options) : base(options) { }

    public DbSet<TreatmentRecord> TreatmentRecords => Set<TreatmentRecord>();
    public DbSet<Patient> Patients => Set<Patient>();
}
