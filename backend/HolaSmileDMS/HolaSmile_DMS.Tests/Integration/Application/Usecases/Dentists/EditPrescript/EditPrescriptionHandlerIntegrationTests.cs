using Application.Usecases.Dentists.EditPrescription;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.EditPrescript
{
    public class EditPrescriptionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EditPrescriptionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditPrescriptionHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_EditPrescription"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new EditPrescriptionHandler(
                _httpContextAccessor,
                new PrescriptionRepository(_context)
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Prescriptions.RemoveRange(_context.Prescriptions);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User
                {
                    UserID = 2001,
                    Username = "0123456789",
                    Phone = "0123456789",
                    Fullname = "Dr. A"
                },
                new User
                {
                    UserID = 9999,
                    Username = "assistant",
                    Phone = "0999999999",
                    Fullname = "Assistant"
                }
            );

            _context.Dentists.Add(new Dentist
            {
                DentistId = 1001,
                UserId = 2001
            });

            _context.Prescriptions.Add(new Prescription
            {
                PrescriptionId = 3001,
                AppointmentId = 4001,
                Content = "Old content",
                CreateBy = 2001,
                CreatedAt = DateTime.Now,
                IsDeleted = false
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

        [Fact(DisplayName = "[Integration - Normal] Dentist updates prescription successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Dentist_Updates_Prescription_Successfully()
        {
            SetupHttpContext("dentist", 2001);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 3001,
                contents = "Updated content"
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            var updated = _context.Prescriptions.FirstOrDefault(p => p.PrescriptionId == 3001);
            Assert.NotNull(updated);
            Assert.Equal("Updated content", updated.Content);
            Assert.Equal(2001, updated.UpdatedBy);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-dentist tries to edit prescription")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Non_Dentist_Cannot_Edit()
        {
            SetupHttpContext("assistant", 9999);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 3001,
                contents = "Hack content"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Edit nonexistent prescription")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Edit_Nonexistent_Prescription()
        {
            SetupHttpContext("dentist", 2001);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 9999,
                contents = "New content"
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Edit with empty content")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Edit_With_Empty_Content()
        {
            SetupHttpContext("dentist", 2001);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 3001,
                contents = "   "
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }
    }
}
