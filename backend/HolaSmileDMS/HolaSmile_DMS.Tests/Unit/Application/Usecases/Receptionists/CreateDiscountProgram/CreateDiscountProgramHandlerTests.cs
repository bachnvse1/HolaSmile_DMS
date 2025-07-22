using System.Security.Claims;
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
        private readonly Mock<IPromotionrepository> _promotionRepoMock = new();
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
            new Claim(ClaimTypes.Role, role),
        }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when user is not receptionist")]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenNotReceptionist()
        {
            SetupHttpContext(role: "assistant");

            var command = new CreateDiscountProgramCommand();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Throw when ProgramName is empty")]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenProgramNameIsEmpty()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand { ProgramName = "   " };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Throw when EndDate < CreateDate")]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenEndDateLessThanCreateDate()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Test",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(-1)
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Throw when ListProcedure is null or empty")]
        public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenNoProcedure()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Test",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>()
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID05 - Throw when procedure is invalid")]
        public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenInvalidProcedure()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 999, DiscountAmount = 10 }
            }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync())
                .ReturnsAsync(new List<int> { 1, 2, 3 });

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID06 - Throw when discount is out of range")]
        public async System.Threading.Tasks.Task UTCID06_ShouldThrow_WhenDiscountInvalid()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 120 }
            }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync())
                .ReturnsAsync(new List<int> { 1 });

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID07 - Return true when create successfully")]
        public async System.Threading.Tasks.Task UTCID07_ShouldReturnTrue_WhenSuccess()
        {
            SetupHttpContext();

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Promo",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync()).ReturnsAsync(new List<int> { 1 });

            _promotionRepoMock.Setup(x => x.CreateDiscountProgramAsync(It.IsAny<DiscountProgram>()))
                .Callback<DiscountProgram>(dp => dp.DiscountProgramID = 100)
                .ReturnsAsync(true);

            _promotionRepoMock.Setup(x => x.CreateProcedureDiscountProgramAsync(It.IsAny<ProcedureDiscountProgram>()))
                .ReturnsAsync(true);

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Should().BeTrue();
        }
    }

}
