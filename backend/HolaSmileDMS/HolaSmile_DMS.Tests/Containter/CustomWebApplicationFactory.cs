using System.Text;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HolaSmile_DMS.Tests.Containter;

public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            });

            builder.ConfigureServices(services =>
            {
                // Replace DbContext with InMemory version
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("SystemTestDb");
                });

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.EnsureCreated();
                SeedTestData(db);
                builder.UseSetting(WebHostDefaults.ServerUrlsKey, "https://localhost:5001");
            });
        }
        private void SeedTestData(ApplicationDbContext db)
{
    var now = DateTime.Now;

    // Users (phải hash mật khẩu và đặt Status = true)
    var users = new List<User>
    {
        new User { UserID = 1, Username = "dentist1", Password = "$2a$11$hG0O/IBqvdXmNdMha0E0Z.CpIlGAhXaM.fG5slesV0Ggkm4aLDvYW", Phone = "0333538991", CreatedAt = now, Status = true },
        new User { UserID = 2, Username = "receptionist1", Password = "$2a$11$hG0O/IBqvdXmNdMha0E0Z.CpIlGAhXaM.fG5slesV0Ggkm4aLDvYW", Phone = "0333538992", CreatedAt = now, Status = true },
        new User { UserID = 3, Username = "patient1", Password = "$2a$11$hG0O/IBqvdXmNdMha0E0Z.CpIlGAhXaM.fG5slesV0Ggkm4aLDvYW", Phone = "0333538993", CreatedAt = now, Status = true }
    };
    db.Users.AddRange(users);

    // Roles
    db.Dentists.Add(new Dentist { DentistId = 1, UserId = 1 });
    db.Receptionists.Add(new Receptionist { ReceptionistId = 1, UserId = 2 });
    db.Patients.Add(new Patient { PatientID = 1, UserID = 3, CreatedAt = now });

    // Procedures
    db.Procedures.Add(new Procedure
    {
        ProcedureId = 5,
        ProcedureName = "Trám răng",
        Price = 500000,
        CreatedAt = now,
        IsDeleted = false
    });

    // Appointments
    db.Appointments.Add(new Appointment
    {
        AppointmentId = 1,
        PatientId = 1,
        DentistId = 1,
        Status = "Confirmed",
        AppointmentType = "Khám",
        IsNewPatient = false,
        AppointmentDate = DateTime.Today,
        AppointmentTime = new TimeSpan(9, 0, 0),
        CreatedAt = now,
        IsDeleted = false
    });

    // TreatmentRecord
    db.TreatmentRecords.Add(new TreatmentRecord
    {
        TreatmentRecordID = 1,
        AppointmentID = 1,
        DentistID = 1,
        ProcedureID = 5,
        ToothPosition = "R11",
        Quantity = 1,
        UnitPrice = 500000,
        TotalAmount = 500000,
        TreatmentDate = DateTime.Today,
        CreatedAt = now,
        IsDeleted = false
    });

    // TreatmentProgress
    db.TreatmentProgresses.Add(new TreatmentProgress
    {
        TreatmentProgressID = 1,
        DentistID = 1,
        PatientID = 1,
        TreatmentRecordID = 1,
        ProgressName = "Tiến trình test",
        ProgressContent = "Nội dung test",
        Status = "Done",
        CreatedAt = now
    });

    db.SaveChanges();
}
    }