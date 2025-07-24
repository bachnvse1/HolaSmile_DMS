using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewInstruction;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients
{
    public class ViewInstructionHandlerTests
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IInstructionTemplateRepository> _templateRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewInstructionHandler _handler;

        public ViewInstructionHandlerTests()
        {
            _instructionRepoMock = new Mock<IInstructionRepository>();
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _templateRepoMock = new Mock<IInstructionTemplateRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new ViewInstructionHandler(
                _instructionRepoMock.Object,
                _appointmentRepoMock.Object,
                _httpContextAccessorMock.Object,
                _templateRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Patient xem tất cả chỉ dẫn thành công (có template)")]
        public async System.Threading.Tasks.Task UTCID01_Patient_ViewAllInstructions_Success_WithTemplate()
        {
            // Arrange
            SetupHttpContext("Patient", 1);
            var appointments = new List<Appointment>
            {
                new Appointment
                {
                    AppointmentId = 10,
                    Dentist = new Dentist { User = new User { Fullname = "Dr. A" } }
                }
            };
            var instructions = new List<Instruction>
            {
                new Instruction
                {
                    InstructionID = 100,
                    AppointmentId = 10,
                    Content = "Nội dung A",
                    CreatedAt = DateTime.Today,
                    Instruc_TemplateID = 5,
                    IsDeleted = false
                }
            };
            var template = new InstructionTemplate
            {
                Instruc_TemplateID = 5,
                Instruc_TemplateName = "T1",
                Instruc_TemplateContext = "Context 1",
                IsDeleted = false
            };

            _appointmentRepoMock.Setup(x => x.GetAppointmentsByPatient(1)).ReturnsAsync(appointments);
            _instructionRepoMock.Setup(x => x.GetInstructionsByAppointmentIdsAsync(It.IsAny<List<int>>()))
                .ReturnsAsync(instructions);
            _templateRepoMock.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(template);

            // Act
            var result = await _handler.Handle(new ViewInstructionCommand(), default);

            // Assert
            Assert.Single(result);
            Assert.Equal(100, result[0].InstructionId);
            Assert.Equal("Dr. A", result[0].DentistName);
            Assert.Equal("T1", result[0].Instruc_TemplateName);
        }

        [Fact(DisplayName = "UTCID02 - Patient xem chỉ dẫn thành công không có template")]
        public async System.Threading.Tasks.Task UTCID02_Patient_ViewInstructions_NoTemplate_Success()
        {
            SetupHttpContext("Patient", 2);
            var appointments = new List<Appointment>
            {
                new Appointment
                {
                    AppointmentId = 20,
                    Dentist = new Dentist { User = new User { Fullname = "Dr. B" } }
                }
            };
            var instructions = new List<Instruction>
            {
                new Instruction
                {
                    InstructionID = 200,
                    AppointmentId = 20,
                    Content = "Nội dung B",
                    CreatedAt = DateTime.Today,
                    Instruc_TemplateID = null,
                    IsDeleted = false
                }
            };

            _appointmentRepoMock.Setup(x => x.GetAppointmentsByPatient(2)).ReturnsAsync(appointments);
            _instructionRepoMock.Setup(x => x.GetInstructionsByAppointmentIdsAsync(It.IsAny<List<int>>()))
                .ReturnsAsync(instructions);

            var result = await _handler.Handle(new ViewInstructionCommand(), default);

            Assert.Single(result);
            Assert.Equal(200, result[0].InstructionId);
            Assert.Null(result[0].Instruc_TemplateName);
        }

        [Fact(DisplayName = "UTCID03 - Patient truyền AppointmentId không thuộc về mình sẽ bị chặn")]
        public async System.Threading.Tasks.Task UTCID03_Patient_AppointmentIdNotBelongToPatient_Throws()
        {
            SetupHttpContext("Patient", 3);
            var appointments = new List<Appointment>
            {
                new Appointment { AppointmentId = 30 }
            };
            _appointmentRepoMock.Setup(x => x.GetAppointmentsByPatient(3)).ReturnsAsync(appointments);

            var cmd = new ViewInstructionCommand { AppointmentId = 999 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(cmd, default));
            Assert.Equal("Lịch hẹn của bạn không tồn tại", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Assistant xem chỉ dẫn của 1 lịch hẹn")]
        public async System.Threading.Tasks.Task UTCID04_Assistant_ViewInstructions_ByAppointmentId_Success()
        {
            SetupHttpContext("Assistant", 10);
            var appointment = new Appointment
            {
                AppointmentId = 40,
                Dentist = new Dentist { User = new User { Fullname = "Dr. C" } }
            };
            var instructions = new List<Instruction>
            {
                new Instruction
                {
                    InstructionID = 300,
                    AppointmentId = 40,
                    Content = "Nội dung C",
                    CreatedAt = DateTime.Today,
                    Instruc_TemplateID = null,
                    IsDeleted = false
                }
            };

            _appointmentRepoMock.Setup(x => x.GetAppointmentByIdAsync(40)).ReturnsAsync(appointment);
            _instructionRepoMock.Setup(x => x.GetInstructionsByAppointmentIdsAsync(It.IsAny<List<int>>()))
                .ReturnsAsync(instructions);

            var result = await _handler.Handle(new ViewInstructionCommand { AppointmentId = 40 }, default);

            Assert.Single(result);
            Assert.Equal("Dr. C", result[0].DentistName);
        }

        [Fact(DisplayName = "UTCID05 - Role không hợp lệ sẽ bị chặn truy cập")]
        public async System.Threading.Tasks.Task UTCID05_InvalidRole_Throws()
        {
            SetupHttpContext("Admin", 99);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewInstructionCommand(), default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
