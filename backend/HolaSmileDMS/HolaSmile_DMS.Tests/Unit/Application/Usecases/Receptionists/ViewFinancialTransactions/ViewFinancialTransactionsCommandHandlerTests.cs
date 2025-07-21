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
    public class ViewFinancialTransactionsCommandHandlerTests
    {
        private readonly Mock<ITransactionRepository> _transactionRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

        private readonly ViewFinancialTransactionsCommandHandler _handler;

        public ViewFinancialTransactionsCommandHandlerTests()
        {
            _handler = new ViewFinancialTransactionsCommandHandler(
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

        [Fact(DisplayName = "UTCID01 - Throw when user role is null")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenRoleIsNull()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);

            var command = new ViewFinancialTransactionsCommand();
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG53);
        }

        [Fact(DisplayName = "UTCID02 - Throw when user is not receptionist or owner")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenInvalidRole()
        {
            SetupHttpContext("assistant");

            var command = new ViewFinancialTransactionsCommand();
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID03 - Return empty list when no transactions")]
        public async System.Threading.Tasks.Task UTCID03_ReturnEmptyList_WhenNoTransactions()
        {
            SetupHttpContext("receptionist");

            _transactionRepoMock.Setup(x => x.GetAllFinancialTransactionsAsync())
                .ReturnsAsync((List<FinancialTransaction>)null!);

            var result = await _handler.Handle(new ViewFinancialTransactionsCommand(), CancellationToken.None);

            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact(DisplayName = "UTCID04 - Return correct data when valid")]
        public async System.Threading.Tasks.Task UTCID04_ReturnTransactions_WhenValid()
        {
            SetupHttpContext("owner");

            var data = new List<FinancialTransaction>
            {
                new FinancialTransaction
                {
                    TransactionID = 1,
                    TransactionDate = new DateTime(2024, 1, 1),
                    TransactionType = true, // Thu
                    Category = "Khám bệnh",
                    PaymentMethod = true, // Tiền mặt
                    Amount = 500000,
                    Description = "Ghi chú"
                }
            };

            _transactionRepoMock.Setup(x => x.GetAllFinancialTransactionsAsync())
                .ReturnsAsync(data);

            var result = await _handler.Handle(new ViewFinancialTransactionsCommand(), CancellationToken.None);

            result.Should().HaveCount(1);
            var item = result.First();
            item.TransactionID.Should().Be(1);
            item.TransactionType.Should().Be("Thu");
            item.PaymentMethod.Should().Be("Tiền mặt");
            item.Category.Should().Be("Khám bệnh");
            item.Amount.Should().Be(500000);
            item.Description.Should().Be("Ghi chú");
        }
    }
}
