using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFinancialTransaction;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class CreateFinancialTransactionHandlerTests
    {
        private readonly Mock<ITransactionRepository> _transactionRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IOwnerRepository> _ownerRepoMock;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly CreateFinancialTransactionHandler _handler;

        public CreateFinancialTransactionHandlerTests()
        {
            _transactionRepoMock = new Mock<ITransactionRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _ownerRepoMock = new Mock<IOwnerRepository>();
            _mediatorMock = new Mock<IMediator>();

            _handler = new CreateFinancialTransactionHandler(
                _transactionRepoMock.Object,
                _httpContextAccessorMock.Object,
                _ownerRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId = 1)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }, "mock"));

            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Return true when receptionist creates valid transaction")]
        public async System.Threading.Tasks.Task UTCID01_Create_Success_By_Receptionist()
        {
            // Arrange
            SetupHttpContext("receptionist");
            var command = new CreateFinancialTransactionCommand
            {
                Amount = 100000,
                Category = "Thu khác",
                Description = "Thu tiền khác",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            _transactionRepoMock.Setup(x => x.CreateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID02 - Return true when owner creates valid transaction")]
        public async System.Threading.Tasks.Task UTCID02_Create_Success_By_Owner()
        {
            // Arrange
            SetupHttpContext("owner");
            var command = new CreateFinancialTransactionCommand
            {
                Amount = 50000,
                Category = "Chi văn phòng phẩm",
                Description = "Mua giấy in",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = false
            };

            _transactionRepoMock.Setup(x => x.CreateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID03 - Throw exception when not receptionist or owner")]
        public async System.Threading.Tasks.Task UTCID03_Throw_Unauthorized_For_Invalid_Role()
        {
            // Arrange
            SetupHttpContext("assistant");

            var command = new CreateFinancialTransactionCommand
            {
                Amount = 10000,
                Description = "Chi tiền",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = false,
                Category = "Chi khác"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Throw exception when description is empty")]
        public async System.Threading.Tasks.Task UTCID04_Throw_Validation_Empty_Description()
        {
            // Arrange
            SetupHttpContext("receptionist");

            var command = new CreateFinancialTransactionCommand
            {
                Amount = 10000,
                Description = "   ",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true,
                Category = "Thu"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Throw exception when amount <= 0")]
        public async System.Threading.Tasks.Task UTCID05_Throw_Validation_Invalid_Amount()
        {
            // Arrange
            SetupHttpContext("owner");

            var command = new CreateFinancialTransactionCommand
            {
                Amount = 0,
                Description = "Chi tiền sai",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = false,
                Category = "Chi khác"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }
    }
}
