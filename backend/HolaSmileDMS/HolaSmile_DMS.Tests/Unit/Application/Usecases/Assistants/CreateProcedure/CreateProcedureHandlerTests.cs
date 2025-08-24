using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using Application.Usecases.SendNotification;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateProcedureHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock = new();
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepositoryMock = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreateProcedureHandler _handler;

        public CreateProcedureHandlerTests()
        {
            _handler = new CreateProcedureHandler(
                _procedureRepositoryMock.Object,
                _supplyRepositoryMock.Object,
                _ownerRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role = "assistant", string userId = "1")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when role is not assistant or dentist")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenInvalidRole()
        {
            SetupHttpContext("receptionist");

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 1000000,
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID02 - Throw when ProcedureName is empty")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenProcedureNameEmpty()
        {
            SetupHttpContext();

            var command = new CreateProcedureCommand
            {
                ProcedureName = "",
                OriginalPrice = 1000000,
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG07);
        }

        [Fact(DisplayName = "UTCID03 - Throw when Price or OriginalPrice is invalid")]
        public async System.Threading.Tasks.Task UTCID03_Throw_WhenInvalidPrice()
        {
            SetupHttpContext();

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 0,
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG95);
        }

        //[Fact(DisplayName = "UTCID04 - Throw when commission rates are invalid")]
        //public async System.Threading.Tasks.Task UTCID04_Throw_WhenInvalidCommissionRates()
        //{
        //    SetupHttpContext();

        //    var command = new CreateProcedureCommand
        //    {
        //        ProcedureName = "Nhổ răng",
        //        OriginalPrice = 1000000,
        //        ReferralCommissionRate = -1,
        //        DoctorCommissionRate = -101,
        //        AssistantCommissionRate = -5,
        //        TechnicianCommissionRate = 110
        //    };

        //    var act = async () => await _handler.Handle(command, default);

        //    await act.Should().ThrowAsync<Exception>()
        //        .WithMessage(MessageConstants.MSG.MSG125);
        //}

        [Fact(DisplayName = "UTCID05 - Throw when supply not found")]
        public async System.Threading.Tasks.Task UTCID05_Throw_WhenSupplyNotFound()
        {
            SetupHttpContext();

            _supplyRepositoryMock.Setup(x => x.GetSupplyBySupplyIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Supplies?)null);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 1000000,
                SuppliesUsed = new List<SupplyUsedDTO> { new SupplyUsedDTO { SupplyId = 999, Quantity = 1 } }
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage("Supply với ID 999 không tồn tại.");
        }

        [Fact(DisplayName = "UTCID06 - Calculate correct price with supplies")]
        public async System.Threading.Tasks.Task UTCID06_CalculateCorrectPriceWithSupplies()
        {
            SetupHttpContext();

            var supply = new Supplies { SupplyId = 1, Price = 50000, Unit = "cái" };
            _supplyRepositoryMock.Setup(x => x.GetSupplyBySupplyIdAsync(1))
                .ReturnsAsync(supply);

            _procedureRepositoryMock.Setup(x => x.CreateProcedure(It.IsAny<Procedure>()))
                .ReturnsAsync(true);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 1000000,
                ConsumableCost = 200000,

                SuppliesUsed = new List<SupplyUsedDTO> { new SupplyUsedDTO { SupplyId = 1, Quantity = 2 } }
            };

            var result = await _handler.Handle(command, default);

            result.Should().BeTrue();
            _procedureRepositoryMock.Verify(x => x.CreateProcedure(It.Is<Procedure>(p =>
                p.Price == 1300000 && // 1,000,000 + 200,000 + (50,000 * 2)
                p.ConsumableCost == 300000)), // 200,000 + (50,000 * 2)
                Times.Once);
        }

        [Fact(DisplayName = "UTCID07 - Send notification to owners")]
        public async System.Threading.Tasks.Task UTCID07_SendNotificationToOwners()
        {
            SetupHttpContext();

            var owners = new List<Owner>
            {
                new Owner { User = new User { UserID = 2 } },
                new Owner { User = new User { UserID = 3 } }
            };

            _ownerRepositoryMock.Setup(x => x.GetAllOwnersAsync())
                .ReturnsAsync(owners);

            _userCommonRepositoryMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { Fullname = "Nguyen Van A" });

            _procedureRepositoryMock.Setup(x => x.CreateProcedure(It.IsAny<Procedure>()))
                .ReturnsAsync(true);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 1000000,
            };

            var result = await _handler.Handle(command, default);

            _mediatorMock.Verify(x => x.Send(It.Is<SendNotificationCommand>(n =>
                n.UserId == 2 || n.UserId == 3),
                It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact(DisplayName = "UTCID08 - Successfully create procedure without supplies")]
        public async System.Threading.Tasks.Task UTCID08_SuccessfullyCreateProcedureWithoutSupplies()
        {
            SetupHttpContext();

            _procedureRepositoryMock.Setup(x => x.CreateProcedure(It.IsAny<Procedure>()))
                .ReturnsAsync(true);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Nhổ răng",
                OriginalPrice = 1000000,
            };

            var result = await _handler.Handle(command, default);

            result.Should().BeTrue();
            _procedureRepositoryMock.Verify(x => x.CreateProcedure(It.Is<Procedure>(p =>
                p.ProcedureName == "Nhổ răng" &&
                p.SuppliesUsed.Count == 0)),
                Times.Once);
        }
    }
}