//using Application.Constants;
//using Application.Interfaces;
//using Application.Usecases.Receptionist.EditFinancialTransaction;
//using Domain.Entities;
//using MediatR;
//using Microsoft.AspNetCore.Http;
//using Moq;
//using System.Security.Claims;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
//{
//    public class EditFinancialTransactionHandlerTests
//    {
//        private readonly Mock<ITransactionRepository> _transactionRepoMock;
//        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
//        private readonly Mock<IOwnerRepository> _ownerRepoMock;
//        private readonly Mock<IMediator> _mediatorMock;
//        private readonly EditFinancialTransactionHandler _handler;

//        public EditFinancialTransactionHandlerTests()
//        {
//            _transactionRepoMock = new Mock<ITransactionRepository>();
//            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
//            _ownerRepoMock = new Mock<IOwnerRepository>();
//            _mediatorMock = new Mock<IMediator>();

//            _handler = new EditFinancialTransactionHandler(
//                _transactionRepoMock.Object,
//                _httpContextAccessorMock.Object,
//                _ownerRepoMock.Object,
//                _mediatorMock.Object
//            );
//        }

//        private void SetupHttpContext(string role, int userId = 1)
//        {
//            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
//            {
//            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
//            new Claim(ClaimTypes.Role, role)
//        }, "mock"));

//            var context = new DefaultHttpContext { User = user };
//            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
//        }

//        [Fact(DisplayName = "UTCID01 - Edit success by receptionist")]
//        public async System.Threading.Tasks.Task UTCID01_Edit_Success_By_Receptionist()
//        {
//            // Arrange
//            SetupHttpContext("receptionist");

//            var existingTransaction = new FinancialTransaction
//            {
//                TransactionID = 1,
//                Amount = 50000,
//                TransactionType = false
//            };

//            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(1))
//                .ReturnsAsync(existingTransaction);

//            _transactionRepoMock.Setup(x => x.UpdateTransactionAsync(It.IsAny<FinancialTransaction>()))
//                .ReturnsAsync(true);

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 1,
//                Amount = 70000,
//                Category = "Chi tiền mặt",
//                Description = "Cập nhật lại chi",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = false
//            };

//            // Act
//            var result = await _handler.Handle(command, CancellationToken.None);

//            // Assert
//            Assert.True(result);
//        }

//        [Fact(DisplayName = "UTCID02 - Edit success by owner")]
//        public async System.Threading.Tasks.Task UTCID02_Edit_Success_By_Owner()
//        {
//            // Arrange
//            SetupHttpContext("owner");

//            var existingTransaction = new FinancialTransaction
//            {
//                TransactionID = 2,
//                Amount = 60000,
//                TransactionType = true
//            };

//            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(2))
//                .ReturnsAsync(existingTransaction);

//            _transactionRepoMock.Setup(x => x.UpdateTransactionAsync(It.IsAny<FinancialTransaction>()))
//                .ReturnsAsync(true);

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 2,
//                Amount = 80000,
//                Category = "Thu phí dịch vụ",
//                Description = "Chỉnh sửa thu",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = true
//            };

//            // Act
//            var result = await _handler.Handle(command, CancellationToken.None);

//            // Assert
//            Assert.True(result);
//        }

//        [Fact(DisplayName = "UTCID03 - Unauthorized when role is invalid")]
//        public async System.Threading.Tasks.Task UTCID03_Throw_Unauthorized_Invalid_Role()
//        {
//            // Arrange
//            SetupHttpContext("assistant");

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 1,
//                Amount = 10000,
//                Description = "Chi thử",
//                Category = "Chi khác",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = false
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
//            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
//        }

//        [Fact(DisplayName = "UTCID04 - Throw exception when description is empty")]
//        public async System.Threading.Tasks.Task UTCID04_Throw_Empty_Description()
//        {
//            // Arrange
//            SetupHttpContext("owner");

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 3,
//                Amount = 10000,
//                Description = "   ",
//                Category = "Chi",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = false
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
//            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
//        }

//        [Fact(DisplayName = "UTCID05 - Throw exception when amount <= 0")]
//        public async System.Threading.Tasks.Task UTCID05_Throw_Invalid_Amount()
//        {
//            // Arrange
//            SetupHttpContext("receptionist");

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 4,
//                Amount = 0,
//                Description = "Chi lỗi",
//                Category = "Chi",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = false
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
//            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
//        }

//        [Fact(DisplayName = "UTCID06 - Throw exception when transaction not found")]
//        public async System.Threading.Tasks.Task UTCID06_Throw_Transaction_Not_Found()
//        {
//            // Arrange
//            SetupHttpContext("receptionist");

//            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(5))
//                .ReturnsAsync((FinancialTransaction?)null);

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 5,
//                Amount = 20000,
//                Description = "Giao dịch không tồn tại",
//                Category = "Chi",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                TransactionType = false
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
//            Assert.Equal(MessageConstants.MSG.MSG127, ex.Message);
//        }
//    }

//}
