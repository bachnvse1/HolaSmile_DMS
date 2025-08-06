using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateDiscountProgram;
using Domain.Entities;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class CreateDiscountProgramHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPromotionRepository> _promotionRepoMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepoMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();

        private readonly CreateDiscountProgramHandler _handler;

        public CreateDiscountProgramHandlerTests()
        {
            _handler = new CreateDiscountProgramHandler(
                _httpContextAccessorMock.Object,
                _promotionRepoMock.Object,
                _procedureRepoMock.Object,
                _ownerRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role = "receptionist", string userId = "1")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when user is not receptionist")]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenUserNotReceptionist()
        {
            SetupHttpContext(role: "assistant");

            var command = new CreateDiscountProgramCommand();

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID02 - Throw when ProgramName is empty")]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenProgramNameEmpty()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "   ",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                { 
                    new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 } 
                }
            };

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG07);
        }

        [Fact(DisplayName = "UTCID03 - Throw when EndDate < CreateDate")]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenEndDateLessThanCreateDate()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(-1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                {
                    new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 }
                }
            };

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG34);
        }

        [Fact(DisplayName = "UTCID04 - Throw when ListProcedure is null or empty")]
        public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenListProcedureEmpty()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>()
            };

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG99);
        }

        [Fact(DisplayName = "UTCID05 - Throw when CreateDate overlaps another program")]
        public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenCreateDateOverlaps()
        {
            SetupHttpContext();

            // Giả lập chương trình khác trùng ngày
            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync())
                .ReturnsAsync(new List<DiscountProgram>
                {
                    new DiscountProgram { CreateDate = DateTime.Today, EndDate = DateTime.Today.AddDays(2) }
                });

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(3),
                ListProcedure = new List<ProcedureDiscountProgramDTO> { new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 } }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync()).ReturnsAsync(new List<int> { 1 });

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG128);
        }

        [Fact(DisplayName = "UTCID06 - Throw when procedure is invalid")]
        public async System.Threading.Tasks.Task UTCID06_ShouldThrow_WhenProcedureInvalid()
        {
            SetupHttpContext();

            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync()).ReturnsAsync(new List<DiscountProgram>());

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO> { new ProcedureDiscountProgramDTO { ProcedureId = 99, DiscountAmount = 10 } }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync()).ReturnsAsync(new List<int> { 1, 2 });

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG99);
        }

        [Fact(DisplayName = "UTCID07 - Throw when discount amount is out of range")]
        public async System.Threading.Tasks.Task UTCID07_ShouldThrow_WhenDiscountAmountInvalid()
        {
            SetupHttpContext();

            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync()).ReturnsAsync(new List<DiscountProgram>());

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO> { new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 1000 } }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync()).ReturnsAsync(new List<int> { 1 });

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG125);
        }

        [Fact(DisplayName = "UTCID08 - Return true when create discount program successfully")]
        public async System.Threading.Tasks.Task UTCID08_ShouldReturnTrue_WhenSuccess()
        {
            SetupHttpContext();

            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync()).ReturnsAsync(new List<DiscountProgram>());

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync()).ReturnsAsync(new List<int> { 1 });

            _promotionRepoMock.Setup(x => x.CreateDiscountProgramAsync(It.IsAny<DiscountProgram>()))
                .Callback<DiscountProgram>(dp => dp.DiscountProgramID = 100)
                .ReturnsAsync(true);

            _promotionRepoMock.Setup(x => x.CreateProcedureDiscountProgramAsync(It.IsAny<ProcedureDiscountProgram>()))
                .ReturnsAsync(true);

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO> { new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 } }
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Should().BeTrue();
        }
    }
}
