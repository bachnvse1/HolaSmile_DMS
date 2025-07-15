using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreateInstruction;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateInstructionHandlerTest
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock = new();
        private readonly Mock<IInstructionTemplateRepository> _templateRepoMock = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

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
                _appointmentRepoMock.Object
            );
        }

        [Fact]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenRoleIsNotAssistantOrDentist()
        {
            var handler = CreateHandlerWithRole("Patient", "1");

            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenUserIdIsInvalid()
        {
            var handler = CreateHandlerWithRole("Assistant", "abc"); // not an integer

            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG27);
        }

        [Fact]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenAppointmentNotFound()
        {
            var handler = CreateHandlerWithRole("Assistant", "2");

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync((Appointment?)null);

            var command = new CreateInstructionCommand { AppointmentId = 1 };

            var act = async () => await handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG28);
        }

        [Fact]
        public async System.Threading.Tasks.Task UTCID04_ShouldReturnSuccess_WhenInputValid()
        {
            var handler = CreateHandlerWithRole("Dentist", "3");

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 10,
                Content = "Test content"
            };

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(new Appointment { AppointmentId = 1, IsDeleted = false });

            _templateRepoMock
                .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new InstructionTemplate { Instruc_TemplateID = 10, IsDeleted = false });

            _instructionRepoMock
                .Setup(r => r.CreateAsync(It.IsAny<Instruction>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await handler.Handle(command, CancellationToken.None);

            result.Should().Be(MessageConstants.MSG.MSG114);
        }
    }
}
