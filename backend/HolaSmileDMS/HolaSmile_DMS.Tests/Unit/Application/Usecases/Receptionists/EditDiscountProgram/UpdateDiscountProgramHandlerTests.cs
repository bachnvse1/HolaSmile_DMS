using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Receptionist.UpdateDiscountProgram;
using Domain.Entities;
using Moq;
using Xunit;
using Microsoft.AspNetCore.Http;
using MediatR;
using Application.Usecases.Receptionist.CreateDiscountProgram;
using FluentAssertions;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{

    public class UpdateDiscountProgramHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPromotionRepository> _promotionRepoMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepoMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();

        private readonly UpdateDiscountProgramHandler _handler;

        public UpdateDiscountProgramHandlerTests()
        {
            _handler = new UpdateDiscountProgramHandler(
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

            var command = new UpdateDiscountProgramCommand();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Throw when ProgramName is empty")]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenProgramNameIsEmpty()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand { ProgramName = "   " };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Throw when EndDate < StartDate")]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenEndDateLessThanStartDate()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramName = "Test",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(-1)
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Throw when ListProcedure is empty")]
        public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenNoProcedure()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramName = "Test",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>()
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID05 - Throw when DiscountProgram not found")]
        public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenDiscountProgramNotFound()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramId = 999,
                ProgramName = "Test",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(999))
                .ReturnsAsync((DiscountProgram?)null);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID06 - Throw when procedure invalid")]
        public async System.Threading.Tasks.Task UTCID06_ShouldThrow_WhenProcedureInvalid()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramId = 1,
                ProgramName = "Test",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 5, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1))
                .ReturnsAsync(new DiscountProgram());

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync())
                .ReturnsAsync(new List<int> { 1, 2 });

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID07 - Throw when discount < 0")]
        public async System.Threading.Tasks.Task UTCID07_ShouldThrow_WhenDiscountNegative()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramId = 1,
                ProgramName = "Test",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = -5 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1))
                .ReturnsAsync(new DiscountProgram());

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync())
                .ReturnsAsync(new List<int> { 1 });

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID08 - Return true when update successfully")]
        public async System.Threading.Tasks.Task UTCID08_ShouldReturnTrue_WhenSuccess()
        {
            SetupHttpContext();

            var command = new UpdateDiscountProgramCommand
            {
                ProgramId = 1,
                ProgramName = "Promo",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 1, DiscountAmount = 10 }
            }
            };

            _promotionRepoMock.Setup(x => x.GetDiscountProgramByIdAsync(1))
                .ReturnsAsync(new DiscountProgram());

            _procedureRepoMock.Setup(x => x.GetAllProceddureIdAsync())
                .ReturnsAsync(new List<int> { 1 });

            _promotionRepoMock.Setup(x => x.UpdateDiscountProgramAsync(It.IsAny<DiscountProgram>()))
                .ReturnsAsync(true);

            _promotionRepoMock.Setup(x => x.DeleteProcedureDiscountsByProgramIdAsync(1))
                .ReturnsAsync(true);

            _promotionRepoMock.Setup(x => x.CreateProcedureDiscountProgramAsync(It.IsAny<ProcedureDiscountProgram>()))
                .ReturnsAsync(true);

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Should().BeTrue();
        }
    }



}
