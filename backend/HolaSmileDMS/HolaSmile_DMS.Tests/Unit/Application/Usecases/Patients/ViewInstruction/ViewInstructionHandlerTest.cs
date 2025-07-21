using Application.Interfaces;
using Application.Usecases.Patients.ViewInstruction;
using Application.Usecases.UserCommon.ViewAppointment;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients
{
    public class ViewInstructionHandlerTest
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IInstructionTemplateRepository> _templateRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewInstructionHandler _handler;

        public ViewInstructionHandlerTest()
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
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            var context = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Patient xem chỉ dẫn thành công, có template")]
        public async System.Threading.Tasks.Task Patient_ViewInstructions_Success_WithTemplate()
        {
            // Arrange
            SetupHttpContext("Patient", 1);
            var appointments = new List<AppointmentDTO>
            {
                new AppointmentDTO { AppointmentId = 10, DentistName = "Dr. A" }
            };
            var instructions = new List<Instruction>
            {
                new Instruction
                {
                    InstructionID = 100,
                    AppointmentId = 10,
                    Content = "Nội dung chỉ dẫn",
                    CreatedAt = DateTime.Today,
                    Instruc_TemplateID = 5,
                    IsDeleted = false
                }
            };
            var template = new InstructionTemplate
            {
                Instruc_TemplateID = 5,
                Instruc_TemplateName = "Template A",
                Instruc_TemplateContext = "Context A",
                IsDeleted = false
            };

            _appointmentRepoMock.Setup(r => r.GetAppointmentsByPatientIdAsync(1))
                .ReturnsAsync(appointments);
            _instructionRepoMock.Setup(r => r.GetInstructionsByAppointmentIdsAsync(It.IsAny<List<int>>()))
                .ReturnsAsync(instructions);
            _templateRepoMock.Setup(r => r.GetByIdAsync(5, default))
                .ReturnsAsync(template);

            var command = new ViewInstructionCommand();

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Single(result);
            var dto = result.First();
            Assert.Equal(100, dto.InstructionId);
            Assert.Equal(10, dto.AppointmentId);
            Assert.Equal("Nội dung chỉ dẫn", dto.Content);
            Assert.Equal("Dr. A", dto.DentistName);
            Assert.Equal(5, dto.Instruc_TemplateID);
            Assert.Equal("Template A", dto.Instruc_TemplateName);
            Assert.Equal("Context A", dto.Instruc_TemplateContext);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Patient xem chỉ dẫn thành công, không có template")]
        public async System.Threading.Tasks.Task Patient_ViewInstructions_Success_WithoutTemplate()
        {
            SetupHttpContext("Patient", 2);
            var appointments = new List<AppointmentDTO>
            {
                new AppointmentDTO { AppointmentId = 20, DentistName = "Dr. B" }
            };
            var instructions = new List<Instruction>
            {
                new Instruction
                {
                    InstructionID = 200,
                    AppointmentId = 20,
                    Content = "Chỉ dẫn không template",
                    CreatedAt = DateTime.Today,
                    Instruc_TemplateID = null,
                    IsDeleted = false
                }
            };

            _appointmentRepoMock.Setup(r => r.GetAppointmentsByPatientIdAsync(2))
                .ReturnsAsync(appointments);
            _instructionRepoMock.Setup(r => r.GetInstructionsByAppointmentIdsAsync(It.IsAny<List<int>>()))
                .ReturnsAsync(instructions);

            var command = new ViewInstructionCommand();

            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            var dto = result.First();
            Assert.Equal(200, dto.InstructionId);
            Assert.Equal(20, dto.AppointmentId);
            Assert.Equal("Chỉ dẫn không template", dto.Content);
            Assert.Equal("Dr. B", dto.DentistName);
            Assert.Null(dto.Instruc_TemplateID);
            Assert.Null(dto.Instruc_TemplateName);
            Assert.Null(dto.Instruc_TemplateContext);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Patient truyền appointmentId không thuộc về mình sẽ bị chặn")]
        public async System.Threading.Tasks.Task Patient_ViewInstructions_InvalidAppointment_Throws()
        {
            SetupHttpContext("Patient", 3);
            var appointments = new List<AppointmentDTO>
            {
                new AppointmentDTO { AppointmentId = 30, DentistName = "Dr. C" }
            };
            _appointmentRepoMock.Setup(r => r.GetAppointmentsByPatientIdAsync(3))
                .ReturnsAsync(appointments);

            var command = new ViewInstructionCommand { AppointmentId = 999 };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Role không phải Patient sẽ bị chặn")]
        public async System.Threading.Tasks.Task NotPatientRole_Throws()
        {
            SetupHttpContext("Assistant", 4);
            var command = new ViewInstructionCommand();
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }
    }
}