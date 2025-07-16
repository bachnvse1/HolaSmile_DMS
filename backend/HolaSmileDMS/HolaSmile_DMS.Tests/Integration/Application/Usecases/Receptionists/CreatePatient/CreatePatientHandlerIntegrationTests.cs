using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class CreatePatientHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IMapper _mapper;
        private readonly CreatePatientHandler _handler;

        public CreatePatientHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreatePatient"));
            services.AddHttpContextAccessor();
            services.AddMemoryCache();

            // Add AutoMapper with only CreatePatientProfile
            services.AddAutoMapper(typeof(CreatePatientCommand).Assembly);

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();
            _mapper = provider.GetRequiredService<IMapper>();
            SeedData();

            _userCommonRepository = new UserCommonRepository(_context, new Mock<IEmailService>().Object, memoryCache);
            _patientRepository = new PatientRepository(_context);

            _handler = new CreatePatientHandler(_userCommonRepository, _patientRepository, _mapper, _httpContextAccessor);
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.SaveChanges();

            _context.Users.Add(new User
            {
                UserID = 1001,
                Username = "receptionist1",
                Fullname = "Receptionist A",
                Phone = "0999999999",
                Email = "receptionist1@example.com"
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

        [Fact(DisplayName = "[Integration - Normal] Receptionist creates patient account successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Receptionist_Creates_Patient_Successfully()
        {
            // Arrange
            SetupHttpContext("receptionist", 1001);
            var command = new CreatePatientCommand
            {
                FullName = "Patient One",
                Gender = true,
                PhoneNumber = "0998888888",
                Email = "patient1@example.com"
            };

            // Act
            var patientId = await _handler.Handle(command, default);

            // Assert
            Assert.True(patientId > 0);
            var createdUser = _context.Users.FirstOrDefault(u => u.Phone == "0998888888");
            Assert.NotNull(createdUser);
            var createdPatient = _context.Patients.FirstOrDefault(p => p.PatientID == patientId);
            Assert.NotNull(createdPatient);
            Assert.Equal("Patient One", createdPatient.User.Fullname);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-receptionist cannot create patient")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Non_Receptionist_Cannot_Create_Patient()
        {
            SetupHttpContext("assistant", 1001);
            var command = new CreatePatientCommand
            {
                FullName = "Patient Two",
                Gender = true,
                PhoneNumber = "0997777777",
                Email = "patient2@example.com"
            };

            // Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }
    }
}
