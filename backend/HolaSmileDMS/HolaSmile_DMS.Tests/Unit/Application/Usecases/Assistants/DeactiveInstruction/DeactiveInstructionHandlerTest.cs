using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.DeactiveInstruction;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class DeactiveInstructionHandlerTest
    {
        private readonly Mock<IInstructionRepository> _instructionRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly DeactiveInstructionHandler _handler;

        public DeactiveInstructionHandlerTest()
        {
            _handler = new DeactiveInstructionHandler(_instructionRepoMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Role, role),
                new(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext { User = claimsPrincipal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);
        }

        [Fact(DisplayName = "UTCID01 - Normal - Assistant deactivates instruction successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Deactive_Success()
        {
            // Arrange
            SetupHttpContext("assistant", 1);
            var instruction = new Instruction { InstructionID = 10, IsDeleted = false };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(10, default)).ReturnsAsync(instruction);
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default)).ReturnsAsync(true);

            var command = new DeactiveInstructionCommand(10);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG112, result);
            Assert.True(instruction.IsDeleted);
            Assert.Equal(1, instruction.UpdatedBy);
        }

        [Fact(DisplayName = "UTCID02 - Normal - Dentist deactivates instruction successfully")]
        public async System.Threading.Tasks.Task UTCID02_Dentist_Deactive_Success()
        {
            SetupHttpContext("dentist", 2);
            var instruction = new Instruction { InstructionID = 20, IsDeleted = false };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(20, default)).ReturnsAsync(instruction);
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default)).ReturnsAsync(true);

            var command = new DeactiveInstructionCommand(20);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG112, result);
            Assert.True(instruction.IsDeleted);
            Assert.Equal(2, instruction.UpdatedBy);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Not logged in throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotLoggedIn_Throws()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext()); // No user

            var command = new DeactiveInstructionCommand(1);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Invalid role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID04_InvalidRole_Throws()
        {
            SetupHttpContext("receptionist", 3);

            var command = new DeactiveInstructionCommand(1);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Instruction not found throws MSG115")]
        public async System.Threading.Tasks.Task UTCID05_InstructionNotFound_Throws()
        {
            SetupHttpContext("assistant", 1);
            _instructionRepoMock.Setup(r => r.GetByIdAsync(99, default)).ReturnsAsync((Instruction?)null);

            var command = new DeactiveInstructionCommand(99);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Instruction already deleted throws MSG115")]
        public async System.Threading.Tasks.Task UTCID06_InstructionAlreadyDeleted_Throws()
        {
            SetupHttpContext("assistant", 1);
            var instruction = new Instruction { InstructionID = 11, IsDeleted = true };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(11, default)).ReturnsAsync(instruction);

            var command = new DeactiveInstructionCommand(11);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
        }

        [Fact(DisplayName = "UTCID07 - Abnormal - Update fails throws MSG58")]
        public async System.Threading.Tasks.Task UTCID07_UpdateFails_Throws()
        {
            SetupHttpContext("assistant", 1);
            var instruction = new Instruction { InstructionID = 12, IsDeleted = false };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(12, default)).ReturnsAsync(instruction);
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default)).ReturnsAsync(false);

            var command = new DeactiveInstructionCommand(12);

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }
    }
}