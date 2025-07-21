using System.Security.Claims;
using Application.Usecases.Receptionist.EditPatientInformation;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class EditPatientInformationHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EditPatientInformationHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditPatientInformationHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_EditPatient"));
            services.AddHttpContextAccessor();

            var mockMediator = new Mock<IMediator>();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new EditPatientInformationHandler(
                new PatientRepository(_context),
                _httpContextAccessor,
                mockMediator.Object
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.SaveChanges();

            var user = new User
            {
                UserID = 3001,
                Username = "0123456789",
                Phone = "0123456789",
                Fullname = "Nguyen Van A",
                Email = "old@email.com",
                Address = "123 Street",
                Status = true
            };
            _context.Users.Add(user);
            _context.SaveChanges();

            _context.Patients.Add(new Patient
            {
                PatientID = 4001,
                UserID = user.UserID,
                UnderlyingConditions = "None"
            });
            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }, "Test"));
            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[Integration - Normal] Receptionist updates patient successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Receptionist_Updates_Patient_Successfully()
        {
            SetupHttpContext("receptionist", 9999);

            var command = new EditPatientInformationCommand
            {
                PatientID = 4001,
                FullName = "Nguyen Van B",
                Email = "new@email.com",
                Dob = "1990-01-01",
                Gender = true,
                Address = "456 New St",
                UnderlyingConditions = "None"
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            var updated = _context.Users.FirstOrDefault(u => u.UserID == 3001);
            Assert.NotNull(updated);
            Assert.Equal("Nguyen Van B", updated.Fullname);
            Assert.Equal("new@email.com", updated.Email);
            Assert.Equal("456 New St", updated.Address);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-receptionist tries to update patient")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Non_Receptionist_Cannot_Update()
        {
            SetupHttpContext("assistant", 9999);

            var command = new EditPatientInformationCommand
            {
                PatientID = 4001,
                FullName = "Hack",
                Email = "hacker@email.com",
                Dob = "1990-01-01",
                Gender = false,
                Address = "Hack St",
                UnderlyingConditions = "Hack"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Edit patient that doesn't exist")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Edit_Non_Existent_Patient()
        {
            SetupHttpContext("receptionist", 9999);

            var command = new EditPatientInformationCommand
            {
                PatientID = 9999,
                FullName = "Ghost",
                Email = "ghost@email.com",
                Dob = "2000-01-01",
                Gender = false,
                Address = "Nowhere",
                UnderlyingConditions = "None"
            };

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(command, default));
        }
    }
}
