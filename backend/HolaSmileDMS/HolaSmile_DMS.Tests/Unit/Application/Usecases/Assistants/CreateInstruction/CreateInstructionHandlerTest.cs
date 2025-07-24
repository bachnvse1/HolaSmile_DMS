using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreateInstruction;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class CreateInstructionHandlerTest
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock = new();
        private readonly Mock<IInstructionTemplateRepository> _templateRepoMock = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new(); // Thêm dòng này

        private CreateInstructionHandler CreateHandlerWithRole(string? role, string? userId)
        {
            var claims = new List<Claim>();
            if (role != null)
                claims.Add(new Claim(ClaimTypes.Role, role));
            if (userId != null)
                claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));

            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);

            _httpContextAccessorMock.Setup(h => h.HttpContext!.User).Returns(user);

            return new CreateInstructionHandler(
                _instructionRepoMock.Object,
                _httpContextAccessorMock.Object,
                _templateRepoMock.Object,
                _appointmentRepoMock.Object,
                _mediatorMock.Object // Truyền vào đây
            );
        }

        [Fact(DisplayName = "Abnormal - UTCID01 - Role không phải Dentist sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID01_RoleIsNotAssistantOrDentist_Throws()
        {
            var handler = CreateHandlerWithRole("Patient", "1");
            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - UserId không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_InvalidUserId_Throws()
        {
            var handler = CreateHandlerWithRole("Dentist", "abc"); // not an integer
            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG27);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Appointment không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_AppointmentNotFound_Throws()
        {
            var handler = CreateHandlerWithRole("Dentist", "2");

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync((Appointment?)null);

            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG28);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Đã có instruction cho appointment này sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_InstructionAlreadyExists_Throws()
        {
            var handler = CreateHandlerWithRole("Dentist", "2");

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(new Appointment { AppointmentId = 1, IsDeleted = false });

            _instructionRepoMock
                .Setup(r => r.ExistsByAppointmentIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage("Chỉ dẫn cho lịch hẹn này đã tồn tại, không thể tạo mới.");
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Template không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_TemplateNotFound_Throws()
        {
            var handler = CreateHandlerWithRole("Dentist", "3");

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(new Appointment { AppointmentId = 1, IsDeleted = false });

            _instructionRepoMock
                .Setup(r => r.ExistsByAppointmentIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _templateRepoMock
                .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync((InstructionTemplate?)null);

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 10,
                Content = "Test content"
            };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG115);
        }

        [Fact(DisplayName = "Normal - UTCID06 - Tạo chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID06_CreateInstruction_Success()
        {
            var handler = CreateHandlerWithRole("Dentist", "3");

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(new Appointment { AppointmentId = 1, IsDeleted = false });

            _instructionRepoMock
                .Setup(r => r.ExistsByAppointmentIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _templateRepoMock
                .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new InstructionTemplate { Instruc_TemplateID = 10, IsDeleted = false });

            _instructionRepoMock
                .Setup(r => r.CreateAsync(It.IsAny<Instruction>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 10,
                Content = "Test content"
            };

            var result = await handler.Handle(command, CancellationToken.None);

            result.Should().Be(MessageConstants.MSG.MSG114);
        }
    }
}