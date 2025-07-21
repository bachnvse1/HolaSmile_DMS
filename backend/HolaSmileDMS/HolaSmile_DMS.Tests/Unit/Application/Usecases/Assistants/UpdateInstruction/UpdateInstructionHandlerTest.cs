using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.UpdateInstruction;
using FluentAssertions;
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
        private readonly UpdateInstructionHandler _handler;

        public UpdateInstructionHandlerTest()
        {
            _handler = new UpdateInstructionHandler(
                _instructionRepoMock.Object,
                _templateRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "Abnormal - UTCID01 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID01_NotLoggedIn_Throws()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext?)null);
            var command = new UpdateInstructionCommand { InstructionId = 1 };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Role không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist", "2");
            var command = new UpdateInstructionCommand { InstructionId = 1 };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Instruction không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InstructionNotFound_Throws()
        {
            SetupHttpContext("Assistant", "2");
            _instructionRepoMock.Setup(r => r.GetByIdAsync(999, default)).ReturnsAsync((Instruction?)null);
            var command = new UpdateInstructionCommand { InstructionId = 999 };
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Template không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_TemplateNotFound_Throws()
        {
            SetupHttpContext("Dentist", "3");
            var instruction = new Instruction
            {
                InstructionID = 1,
                IsDeleted = false
            };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default)).ReturnsAsync(instruction);
            _templateRepoMock.Setup(r => r.GetByIdAsync(10, default)).ReturnsAsync((InstructionTemplate?)null);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 1,
                Instruc_TemplateID = 10
            };

            var act = async () => await _handler.Handle(command, default);
            await act.Should().ThrowAsync<Exception>().WithMessage(MessageConstants.MSG.MSG115);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - UpdateAsync trả về false sẽ báo lỗi")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_UpdateFailed_Throws()
        {
            SetupHttpContext("Assistant", "2");
            var instruction = new Instruction
            {
                InstructionID = 1,
                IsDeleted = false
            };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default)).ReturnsAsync(instruction);
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default)).ReturnsAsync(false);

            var command = new UpdateInstructionCommand { InstructionId = 1 };
            var act = async () => await _handler.Handle(command, default);
            await act.Should().ThrowAsync<Exception>().WithMessage(MessageConstants.MSG.MSG58);
        }

        [Fact(DisplayName = "Normal - UTCID06 - Assistant cập nhật chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID06_Assistant_UpdateInstruction_Success()
        {
            SetupHttpContext("Assistant", "2");
            var instruction = new Instruction
            {
                InstructionID = 1,
                Content = "Old content",
                Instruc_TemplateID = 1,
                IsDeleted = false
            };
            _instructionRepoMock.Setup(r => r.GetByIdAsync(1, default)).ReturnsAsync(instruction);
            _templateRepoMock.Setup(r => r.GetByIdAsync(1, default)).ReturnsAsync(new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false });
            _instructionRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Instruction>(), default)).ReturnsAsync(true);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 1,
                Content = "New content",
                Instruc_TemplateID = 1
            };

            var result = await _handler.Handle(command, default);

            result.Should().Be("Cập nhật chỉ dẫn thành công");
            instruction.Content.Should().Be("New content");
            instruction.Instruc_TemplateID.Should().Be(1);
        }
    }
}