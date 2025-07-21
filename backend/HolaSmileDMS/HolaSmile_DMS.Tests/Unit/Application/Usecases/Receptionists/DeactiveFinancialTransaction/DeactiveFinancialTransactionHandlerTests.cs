using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.DeactiveFinancialTransaction;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class DeactiveFinancialTransactionHandlerTests
    {
        private readonly Mock<ITransactionRepository> _transactionRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IOwnerRepository> _ownerRepoMock;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly DeactiveFinancialTransactionHandler _handler;

        public DeactiveFinancialTransactionHandlerTests()
        {
            _transactionRepoMock = new Mock<ITransactionRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _ownerRepoMock = new Mock<IOwnerRepository>();
            _mediatorMock = new Mock<IMediator>();

            _handler = new DeactiveFinancialTransactionHandler(
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

        [Fact(DisplayName = "UTCID01 - Deactivate success by receptionist")]
        public async System.Threading.Tasks.Task UTCID01_Deactivate_Success_By_Receptionist()
        {
            // Arrange
            SetupHttpContext("receptionist");

            var transaction = new FinancialTransaction
            {
                TransactionID = 1,
                IsDelete = false,
                TransactionType = true
            };

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(1))
                .ReturnsAsync(transaction);

            _transactionRepoMock.Setup(x => x.UpdateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            var command = new DeactiveFinancialTransactionCommand(1);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
            Assert.True(transaction.IsDelete); // đã bị đánh dấu xóa
        }

        [Fact(DisplayName = "UTCID02 - Deactivate success by owner")]
        public async System.Threading.Tasks.Task UTCID02_Deactivate_Success_By_Owner()
        {
            // Arrange
            SetupHttpContext("owner");

            var transaction = new FinancialTransaction
            {
                TransactionID = 2,
                IsDelete = false,
                TransactionType = false
            };

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(2))
                .ReturnsAsync(transaction);

            _transactionRepoMock.Setup(x => x.UpdateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            var command = new DeactiveFinancialTransactionCommand(2);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
            Assert.True(transaction.IsDelete);
        }

        [Fact(DisplayName = "UTCID03 - Unauthorized when role invalid")]
        public async System.Threading.Tasks.Task UTCID03_Unauthorized_Invalid_Role()
        {
            // Arrange
            SetupHttpContext("assistant");

            var command = new DeactiveFinancialTransactionCommand(3);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Throw exception when transaction not found")]
        public async System.Threading.Tasks.Task UTCID04_Transaction_Not_Found()
        {
            // Arrange
            SetupHttpContext("receptionist");

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(4))
                .ReturnsAsync((FinancialTransaction?)null);

            var command = new DeactiveFinancialTransactionCommand(4);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG122, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Toggle active back if already deactivated")]
        public async System.Threading.Tasks.Task UTCID05_Toggle_Back_To_Active()
        {
            // Arrange
            SetupHttpContext("receptionist");

            var transaction = new FinancialTransaction
            {
                TransactionID = 5,
                IsDelete = true,
                TransactionType = false
            };

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(5))
                .ReturnsAsync(transaction);

            _transactionRepoMock.Setup(x => x.UpdateTransactionAsync(It.IsAny<FinancialTransaction>()))
                .ReturnsAsync(true);

            var command = new DeactiveFinancialTransactionCommand(5);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
            Assert.False(transaction.IsDelete); // bật lại (kích hoạt lại)
        }
    }
}
