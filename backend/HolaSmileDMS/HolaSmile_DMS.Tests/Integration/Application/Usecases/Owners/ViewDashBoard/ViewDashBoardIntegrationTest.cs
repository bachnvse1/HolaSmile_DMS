using Application.Constants;
using Application.Usecases.Owner.ViewDashboard;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owners
{
    public class ViewDashboardIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDashboardIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("ViewDashboardDb")
                .Options;

            _context = new ApplicationDbContext(options);
            _httpContextAccessor = new HttpContextAccessor();

            SeedTestData();
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext { User = user };
            _httpContextAccessor.HttpContext = httpContext;
        }

        /// <summary>
        /// Seed dữ liệu mẫu cho DB InMemory
        /// </summary>
        private void SeedTestData()
        {
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            // Invoices
            _context.Invoices.AddRange(new[]
            {
                new Invoice { InvoiceId = 1, PaidAmount = 1000, CreatedAt = DateTime.Now },
                new Invoice { InvoiceId = 2, PaidAmount = 500, CreatedAt = DateTime.Now.AddDays(-3) },
                new Invoice { InvoiceId = 3, PaidAmount = 200, CreatedAt = DateTime.Now.AddMonths(-1) }
            });

            // Appointments
            _context.Appointments.AddRange(new[]
            {
                new Appointment { AppointmentId = 1, PatientId = 1, CreatedAt = DateTime.Now },
                new Appointment { AppointmentId = 2, PatientId = 1, CreatedAt = DateTime.Now.AddDays(-5) }
            });

            // Users (employees, patients, owner)
            _context.Users.AddRange(new[]
            {
                new User { UserID = 1, Fullname = "Owner", Username = "owner1", Phone = "000111222", CreatedAt = DateTime.Now },
                new User { UserID = 2, Fullname = "Employee 1", Username = "employee1", Phone = "000111223", CreatedAt = DateTime.Now },
                new User { UserID = 3, Fullname = "Patient 1", Username = "patient1", Phone = "000111224", CreatedAt = DateTime.Now.AddDays(-2) },
                new User { UserID = 4, Fullname = "Employee 2", Username = "employee2", Phone = "000111225", CreatedAt = DateTime.Now.AddDays(-10) }
            });

            // Patients
            _context.Patients.AddRange(new[]
            {
                new Patient { PatientID = 1, UserID = 3, CreatedAt = DateTime.Now.AddDays(-2) }
            });

            // Owners
            _context.Owners.Add(new Owner { OwnerId = 1, UserId = 1 });

            _context.SaveChanges();
        }

        [Fact]
        public async System.Threading.Tasks.Task ITCID01_Should_ReturnDashboardData_WhenRoleIsOwner()
        {
            SetupHttpContext("Owner", "1");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            var command = new ViewDashboardCommand { Filter = "today" };

            var result = await handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.True(result.TotalRevenue >= 0);
            Assert.True(result.TotalAppointments >= 0);
            Assert.True(result.TotalPatient >= 0);
            Assert.True(result.TotalEmployee >= 0);
            Assert.True(result.NewPatient >= 0);
        }

        [Fact]
        public async System.Threading.Tasks.Task ITCID02_Should_ThrowUnauthorized_WhenRoleIsNotOwner()
        {
            SetupHttpContext("Assistant", "2");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            var command = new ViewDashboardCommand { Filter = "today" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ITCID03_Should_CalculateTotalRevenueCorrectly_WhenFilterIsMonth()
        {
            SetupHttpContext("Owner", "1");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            var revenue = await handler.CalculateTotalRevenue("month");

            Assert.Equal(1000 + 500, revenue); // Invoice 3 nằm ngoài tháng hiện tại
        }

   
    }
}
