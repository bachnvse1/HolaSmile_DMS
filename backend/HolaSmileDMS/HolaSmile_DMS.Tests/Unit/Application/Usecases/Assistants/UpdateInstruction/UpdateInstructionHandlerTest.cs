using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.UpdateInstruction;
using Application.Usecases.SendNotification;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class UpdateInstructionHandlerTest
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock = new();
        private readonly Mock<IInstructionTemplateRepository> _templateRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly UpdateInstructionHandler _handler;

        public UpdateInstructionHandlerTest()
        {
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            _handler = new UpdateInstructionHandler(
                _instructionRepoMock.Object,
                _templateRepoMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string userId = "2", string fullName = "Test Assistant")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.GivenName, fullName)
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "Abnormal - UTCID01 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID01_NotLoggedIn_Throws()
        {
            // Arrange
            SetupHttpContext(null);
            var command = new UpdateInstructionCommand { InstructionId = 1 };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Role không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_InvalidRole_Throws()
        {
            // Arrange
            SetupHttpContext("Receptionist");
            var command = new UpdateInstructionCommand { InstructionId = 1 };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Instruction không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InstructionNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");
            _instructionRepoMock.Setup(r => r.GetByIdAsync(999, default))
                .ReturnsAsync((Instruction?)null);

            var command = new UpdateInstructionCommand { InstructionId = 999 };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Template không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_TemplateNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Dentist", "3");

            var instruction = new Instruction
            {
                InstructionID = 1,
                IsDeleted = false
            };

            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default))
                .ReturnsAsync(instruction);
            _templateRepoMock.Setup(r => r.GetByIdAsync(10, default))
                .ReturnsAsync((InstructionTemplate?)null);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 1,
                Instruc_TemplateID = 10
            };

            // Act & Assert
            var act = async () => await _handler.Handle(command, default);
            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG115);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - UpdateAsync trả về false sẽ báo lỗi")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_UpdateFailed_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var instruction = new Instruction
            {
                InstructionID = 1,
                IsDeleted = false
            };

            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default))
                .ReturnsAsync(instruction);
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default))
                .ReturnsAsync(false);

            var command = new UpdateInstructionCommand { InstructionId = 1 };

            // Act & Assert
            var act = async () => await _handler.Handle(command, default);
            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG58);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Normal - UTCID06 - Assistant cập nhật chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID06_Assistant_UpdateInstruction_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "2", "Test Assistant");

            var patient = new Patient
            {
                PatientID = 1,
                UserID = 10,
                User = new User { UserID = 10, Fullname = "Test Patient" }
            };

            var appointment = new Appointment
            {
                AppointmentId = 5,
                PatientId = 1,
                Patient = patient
            };

            var instruction = new Instruction
            {
                InstructionID = 1,
                Content = "Old content",
                Instruc_TemplateID = 1,
                IsDeleted = false,
                AppointmentId = 5,
                Appointment = appointment
            };

            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default))
                .ReturnsAsync(instruction);
            _templateRepoMock.Setup(r => r.GetByIdAsync(1, default))
                .ReturnsAsync(new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false });
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default))
                .ReturnsAsync(true);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 1,
                Content = "New content",
                Instruc_TemplateID = 1
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            result.Should().Be("Cập nhật chỉ dẫn thành công");
            instruction.Content.Should().Be("New content");
            instruction.Instruc_TemplateID.Should().Be(1);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 10 &&
                    n.Title == "Cập nhật chỉ dẫn điều trị" &&
                    n.Message == "Chỉ dẫn điều trị của bạn vừa được cập nhật." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == instruction.InstructionID &&
                    n.MappingUrl == $"/patient/instructions/{instruction.AppointmentId}"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }
    }
}