using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Receptionist.De_ActivePromotion;
using Domain.Entities;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class DeactivePromotionHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPromotionRepository> _promotionRepoMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepoMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();

        private readonly DeactivePromotionHandler _handler;

        public DeactivePromotionHandlerTests()
        {
            _handler = new DeactivePromotionHandler(
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
            new Claim(ClaimTypes.Role, role),
        }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when user is not receptionist")]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenNotReceptionist()
        {
            SetupHttpContext("assistant");

            var command = new DeactivePromotionCommand(1);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Throw when program not found")]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenProgramNotFound()
        {
            SetupHttpContext();

            var command = new DeactivePromotionCommand(1);

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync((DiscountProgram)null!);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Throw when switching to active and another active exists")]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenAnotherActiveProgramExists()
        {
            SetupHttpContext();

            var command = new DeactivePromotionCommand(1);

            var discountProgram = new DiscountProgram
            {
                DiscountProgramID = 1,
                IsDelete = true,
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>()
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(discountProgram);
            _promotionRepoMock.Setup(x => x.GetProgramActiveAsync()).ReturnsAsync(new DiscountProgram { DiscountProgramID = 2 });

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Throw when update procedure failed during activate")]
        public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenUpdateProcedureFails_Activate()
        {
            SetupHttpContext();

            var command = new DeactivePromotionCommand(1);
            var discountProgram = new DiscountProgram
            {
                DiscountProgramID = 1,
                IsDelete = true,
                DiscountProgramName = "Khuyến mãi hè",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(5),
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(discountProgram);
            _promotionRepoMock.Setup(x => x.GetProgramActiveAsync()).ReturnsAsync((DiscountProgram)null);

            _procedureRepoMock.Setup(x => x.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1, Price = 100 });

            _procedureRepoMock.Setup(x => x.UpdateProcedureAsync(It.IsAny<Procedure>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID05 - Throw when update procedure failed during deactivate")]
        public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenUpdateProcedureFails_Deactivate()
        {
            SetupHttpContext();

            var command = new DeactivePromotionCommand(1);
            var discountProgram = new DiscountProgram
            {
                DiscountProgramID = 1,
                IsDelete = false,
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(discountProgram);

            _procedureRepoMock.Setup(x => x.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1, Price = 100 });

            _procedureRepoMock.Setup(x => x.UpdateProcedureAsync(It.IsAny<Procedure>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID06 - Return true when deactivated successfully")]
        public async System.Threading.Tasks.Task UTCID06_ShouldReturnTrue_WhenDeactivateSuccess()
        {
            SetupHttpContext();

            var command = new DeactivePromotionCommand(1);
            var discountProgram = new DiscountProgram
            {
                DiscountProgramID = 1,
                IsDelete = false,
                DiscountProgramName = "Promo",
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(discountProgram);

            _procedureRepoMock.Setup(x => x.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1, Price = 100 });

            _procedureRepoMock.Setup(x => x.UpdateProcedureAsync(It.IsAny<Procedure>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            _promotionRepoMock.Setup(x => x.UpdateDiscountProgramAsync(It.IsAny<DiscountProgram>()))
                .ReturnsAsync(true);

            var result = await _handler.Handle(command, CancellationToken.None);
            result.Should().BeTrue();
        }
    }

}
