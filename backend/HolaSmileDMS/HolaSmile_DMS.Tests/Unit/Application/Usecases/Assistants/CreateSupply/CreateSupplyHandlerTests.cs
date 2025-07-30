using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateSupply;
using Domain.Entities;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateSupplyHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock = new();
        private readonly Mock<ITransactionRepository> _transactionRepositoryMock = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepositoryMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreateSupplyHandler _handler;

        public CreateSupplyHandlerTests()
        {
            _handler = new CreateSupplyHandler(
                _httpContextAccessorMock.Object,
                _supplyRepositoryMock.Object,
                _transactionRepositoryMock.Object,
                _ownerRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
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

        [Fact(DisplayName = "UTCID01 - Throw when role is not assistant")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenInvalidRole()
        {
            SetupHttpContext("receptionist");

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 10,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(1)
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID02 - Throw when SupplyName or Unit is empty")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenInvalidNameOrUnit()
        {
            SetupHttpContext();

            var command = new CreateSupplyCommand
            {
                SupplyName = "",
                Unit = "",
                QuantityInStock = 10,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(1)
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG07);
        }

        [Fact(DisplayName = "UTCID03 - Throw when QuantityInStock is less than or equal to 0")]
        public async System.Threading.Tasks.Task UTCID03_Throw_WhenInvalidQuantity()
        {
            SetupHttpContext();

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 0,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(1)
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG94);
        }

        [Fact(DisplayName = "UTCID04 - Throw when Price is less than or equal to 0")]
        public async System.Threading.Tasks.Task UTCID04_Throw_WhenInvalidPrice()
        {
            SetupHttpContext();

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 10,
                Price = 0,
                ExpiryDate = DateTime.Today.AddDays(1)
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG95);
        }

        [Fact(DisplayName = "UTCID05 - Throw when ExpiryDate is in the past")]
        public async System.Threading.Tasks.Task UTCID05_Throw_WhenInvalidExpiryDate()
        {
            SetupHttpContext();

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 10,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(-1)
            };

            var act = async () => await _handler.Handle(command, default);

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG96);
        }

        [Fact(DisplayName = "UTCID06 - Increase quantity when supply already exists")]
        public async System.Threading.Tasks.Task UTCID06_UpdateQuantity_WhenSupplyExists()
        {
            SetupHttpContext();

            var existSupply = new Supplies
            {
                Name = "Gauze",
                QuantityInStock = 5,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(10)
            };

            _supplyRepositoryMock.Setup(x => x.GetExistSupply("Gauze", 10000, It.IsAny<DateTime?>()))
                .ReturnsAsync(existSupply);
            _supplyRepositoryMock.Setup(x => x.EditSupplyAsync(It.IsAny<Supplies>()))
                .ReturnsAsync(true);

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 10,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(10)
            };

            var result = await _handler.Handle(command, default);

            result.Should().BeTrue();
            existSupply.QuantityInStock.Should().Be(15);
        }

        [Fact(DisplayName = "UTCID07 - Create new supply and transaction if not exists")]
        public async System.Threading.Tasks.Task UTCID07_CreateSupplyAndTransaction_WhenNotExist()
        {
            SetupHttpContext();

            _supplyRepositoryMock.Setup(x => x.GetExistSupply("Gauze", 10000, It.IsAny<DateTime?>()))
                .ReturnsAsync((Supplies?)null);

            _transactionRepositoryMock.Setup(x => x.CreateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            _supplyRepositoryMock.Setup(x => x.CreateSupplyAsync(It.IsAny<Supplies>()))
                .ReturnsAsync(true);

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                QuantityInStock = 10,
                Price = 10000,
                ExpiryDate = DateTime.Today.AddDays(10)
            };

            var result = await _handler.Handle(command, default);

            result.Should().BeTrue();
        }
    }
}
