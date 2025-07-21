using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class ViewDetailFinancialTransactionsHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock = new();
        private readonly Mock<ITransactionRepository> _transactionRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

        private readonly ViewDetailFinancialTransactionsHandler _handler;

        public ViewDetailFinancialTransactionsHandlerTests()
        {
            _handler = new ViewDetailFinancialTransactionsHandler(
                _userRepoMock.Object,
                _transactionRepoMock.Object,
                _httpContextAccessorMock.Object
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

        [Fact(DisplayName = "UTCID01 - Throw when role is null")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenRoleIsNull()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);

            var command = new ViewDetailFinancialTransactionsCommand(1);
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG53);
        }

        [Fact(DisplayName = "UTCID02 - Throw when role is not receptionist or owner")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenInvalidRole()
        {
            SetupHttpContext("assistant");

            var command = new ViewDetailFinancialTransactionsCommand(1);
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID03 - Throw when transaction does not exist")]
        public async System.Threading.Tasks.Task UTCID03_Throw_WhenTransactionNotFound()
        {
            SetupHttpContext("receptionist");

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(1))
                .ReturnsAsync((FinancialTransaction?)null);

            var command = new ViewDetailFinancialTransactionsCommand(1);
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG16);
        }

        [Fact(DisplayName = "UTCID04 - Throw when createdBy user not found")]
        public async System.Threading.Tasks.Task UTCID04_Throw_WhenCreatedByUserNotFound()
        {
            SetupHttpContext("receptionist");

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(1))
                .ReturnsAsync(new FinancialTransaction
                {
                    TransactionID = 1,
                    CreatedBy = 100
                });

            _userRepoMock.Setup(x => x.GetByIdAsync(100, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            var command = new ViewDetailFinancialTransactionsCommand(1);
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<Exception>()
                .WithMessage(MessageConstants.MSG.MSG16);
        }

        [Fact(DisplayName = "UTCID05 - Return correct DTO when data is valid")]
        public async System.Threading.Tasks.Task UTCID05_ReturnSuccess_WhenValid()
        {
            SetupHttpContext("owner");

            var transaction = new FinancialTransaction
            {
                TransactionID = 1,
                TransactionDate = new DateTime(2024, 1, 1),
                TransactionType = true,
                Category = "Khám bệnh",
                PaymentMethod = true,
                Amount = 500000,
                Description = "Nội dung",
                CreatedBy = 10,
                UpdatedBy = 20,
                CreatedAt = new DateTime(2024, 1, 1),
                UpdatedAt = new DateTime(2024, 1, 2)
            };

            var creator = new User { UserID = 10, Fullname = "Người tạo" };
            var updater = new User { UserID = 20, Fullname = "Người cập nhật" };

            _transactionRepoMock.Setup(x => x.GetTransactionByIdAsync(1))
                .ReturnsAsync(transaction);

            _userRepoMock.Setup(x => x.GetByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(creator);

            _userRepoMock.Setup(x => x.GetByIdAsync(20, It.IsAny<CancellationToken>()))
                .ReturnsAsync(updater);

            var command = new ViewDetailFinancialTransactionsCommand(1);

            var result = await _handler.Handle(command, CancellationToken.None);

            result.Should().NotBeNull();
            result.TransactionID.Should().Be(1);
            result.TransactionType.Should().Be("Thu");
            result.PaymentMethod.Should().Be("Tiền mặt");
            result.CreateBy.Should().Be("Người tạo");
            result.UpdateBy.Should().Be("Người cập nhật");
        }
    }
}
