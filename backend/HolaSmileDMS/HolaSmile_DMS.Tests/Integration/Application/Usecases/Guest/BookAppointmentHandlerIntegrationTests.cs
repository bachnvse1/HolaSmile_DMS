using Application.Constants;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Guests
{
    public class BookAppointmentHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly BookAppointmentHandler _handler;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IDentistRepository> _dentistRepositoryMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BookAppointmentHandlerIntegrationTests()
        {
            // Setup InMemory Database
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(Guid.NewGuid().ToString()));

            services.AddHttpContextAccessor();
            services.AddAutoMapper(typeof(BookAppointmentHandler).Assembly);

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _mapper = provider.GetRequiredService<IMapper>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            // Mock repositories
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _dentistRepositoryMock = new Mock<IDentistRepository>();
            _emailServiceMock = new Mock<IEmailService>();
            _mediator = new Mock<IMediator>().Object;

            _handler = new BookAppointmentHandler(
                _appointmentRepositoryMock.Object,
                _mediator,
                _patientRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
                _mapper,
                _dentistRepositoryMock.Object,
                _httpContextAccessor,
                _emailServiceMock.Object
            );
        }

        // --------- TEST CASES ---------

        [Fact]
        public async System.Threading.Tasks.Task BookAppointment_Guest_FirstTime_Success()
        {
            // Arrange
            var command = new BookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "guest@test.com",
                PhoneNumber = "0912345678",
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                CaptchaValue = "123456",
                CaptchaInput = "123456",
                DentistId = 1,
                MedicalIssue = "Sâu răng"
            };

            // Mock guest flow
            _userCommonRepositoryMock.Setup(x => x.CreatePatientAccountAsync(It.IsAny<CreatePatientDto>(), "123456"))
                .ReturnsAsync(new User { UserID = 99, Email = command.Email });

            _patientRepositoryMock.Setup(x => x.CreatePatientAsync(It.IsAny<CreatePatientDto>(), 99))
                .ReturnsAsync(new Patient { PatientID = 1, UserID = 99 });

            _appointmentRepositoryMock.Setup(x => x.CreateAppointmentAsync(It.IsAny<Appointment>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async System.Threading.Tasks.Task BookAppointment_Patient_FollowUp_Success()
        {
            // Arrange
            var patientUserId = 2;

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, "patient"),
                new Claim(ClaimTypes.NameIdentifier, patientUserId.ToString())
            }));

            _httpContextAccessor.HttpContext = new DefaultHttpContext { User = user };

            var command = new BookAppointmentCommand
            {
                FullName = "Le Thi B",
                Email = "patient@test.com",
                PhoneNumber = "0987654321",
                AppointmentDate = DateTime.Now.AddDays(2),
                AppointmentTime = new TimeSpan(9, 0, 0),
                DentistId = 1,
                MedicalIssue = "Khám định kỳ"
            };

            // Mock patient flow
            _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(patientUserId))
                .ReturnsAsync(new Patient { PatientID = 2, UserID = patientUserId });

            _appointmentRepositoryMock.Setup(x => x.GetLatestAppointmentByPatientIdAsync(2))
                .ReturnsAsync((Appointment)null); // không có lịch hẹn trước


            _appointmentRepositoryMock.Setup(x => x.CreateAppointmentAsync(It.IsAny<Appointment>()))
                .ReturnsAsync(true); // Return a boolean value as expected by the method signature

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async System.Threading.Tasks.Task BookAppointment_InvalidDate_ThrowsException()
        {
            // Arrange
            var command = new BookAppointmentCommand
            {
                AppointmentDate = DateTime.Now.AddDays(-1), // Ngày quá khứ
                AppointmentTime = new TimeSpan(10, 0, 0),
                FullName = "Nguyen Van C",
                Email = "invalid@test.com",
                PhoneNumber = "0911111111",
                DentistId = 1,
                MedicalIssue = "Nhổ răng"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG74, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task BookAppointment_InvalidCaptcha_ThrowsException()
        {
            // Arrange
            var command = new BookAppointmentCommand
            {
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                FullName = "Nguyen Van D",
                Email = "captcha@test.com",
                PhoneNumber = "0911222333",
                CaptchaValue = "123",
                CaptchaInput = "456", // Sai captcha
                DentistId = 1,
                MedicalIssue = "Trám răng"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG124, ex.Message);
        }
    }
}
