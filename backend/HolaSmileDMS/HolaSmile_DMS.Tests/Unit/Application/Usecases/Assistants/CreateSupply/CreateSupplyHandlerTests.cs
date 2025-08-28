using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateSupply;
using Application.Usecases.SendNotification;
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
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepositoryMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreateSupplyHandler _handler;

        public CreateSupplyHandlerTests()
        {
            _handler = new CreateSupplyHandler(
                _httpContextAccessorMock.Object,
                _supplyRepositoryMock.Object,
                _ownerRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
                _mediatorMock.Object
            );
        }

        // ===== Helpers =====
        private void SetupHttpContext(string role = "assistant", string userId = "101")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            var http = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(http);
        }

        private static List<Supplies> SuppliesList(params (int id, string name, bool deleted)[] items)
        {
            return items.Select(t => new Supplies
            {
                SupplyId = t.id,
                Name = t.name,
                Unit = "Box",
                Price = 1000m,
                CreatedBy = 1,
                CreatedAt = DateTime.Now,
                IsDeleted = t.deleted
            }).ToList();
        }

        // ===== Tests =====

        [Fact(DisplayName = "UTCID01 - Throw when role is not assistant")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenInvalidRole()
        {
            // Arrange
            SetupHttpContext(role: "receptionist");
            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(new List<Supplies>());

            var cmd = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "cái",
                Price = 10000
            };

            // Act
            var act = async () => await _handler.Handle(cmd, default);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Theory(DisplayName = "UTCID02 - Throw when SupplyName or Unit is empty")]
        [InlineData("", "cái")]
        [InlineData("   ", "cái")]
        [InlineData("Gauze", "")]
        [InlineData("Gauze", "   ")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenInvalidNameOrUnit(string name, string unit)
        {
            // Arrange
            SetupHttpContext();
            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(new List<Supplies>());

            var cmd = new CreateSupplyCommand { SupplyName = name, Unit = unit, Price = 5000 };

            // Act
            var act = async () => await _handler.Handle(cmd, default);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG07);
        }

        [Theory(DisplayName = "UTCID03 - Throw when Price <= 0")]
        [InlineData(0)]
        [InlineData(-1)]
        public async System.Threading.Tasks.Task UTCID03_Throw_WhenInvalidPrice(decimal price)
        {
            // Arrange
            SetupHttpContext();
            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(new List<Supplies>());

            var cmd = new CreateSupplyCommand { SupplyName = "Gauze", Unit = "cái", Price = price };

            // Act
            var act = async () => await _handler.Handle(cmd, default);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage(MessageConstants.MSG.MSG95);
        }

        [Theory(DisplayName = "UTCID04 - Throw when duplicate name (case-insensitive)")]
        [InlineData("Bông Gạc", "bông gạc")]
        [InlineData("mask", "MASK")]
        public async System.Threading.Tasks.Task UTCID04_Throw_When_DuplicateName(string existing, string incoming)
        {
            // Arrange
            SetupHttpContext();
            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(SuppliesList((1, existing, false)));

            var cmd = new CreateSupplyCommand
            {
                SupplyName = incoming,
                Unit = "Gói",
                Price = 1000m
            };

            // Act
            var act = async () => await _handler.Handle(cmd, default);

            // Assert
            (await act.Should().ThrowAsync<Exception>())
                .WithMessage("Tên vật tư đã tồn tại");
            _supplyRepositoryMock.Verify(r => r.CreateSupplyAsync(It.IsAny<Supplies>()), Times.Never);
        }

        [Fact(DisplayName = "UTCID05 - Create supply successfully and notify owners")]
        public async System.Threading.Tasks.Task UTCID05_Create_Success_And_NotifyOwners()
        {
            // Arrange
            var currentUserId = "123";
            SetupHttpContext(userId: currentUserId);

            // Không có trùng tên
            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(SuppliesList());

            // CreateSupplyAsync: set id giả
            Supplies? captured = null;
            _supplyRepositoryMock
                .Setup(r => r.CreateSupplyAsync(It.IsAny<Supplies>()))
                .Callback<Supplies>(s => { s.SupplyId = 999; captured = s; })
                .ReturnsAsync(true);

            // Owners nhận notify
            _ownerRepositoryMock.Setup(r => r.GetAllOwnersAsync())
                .ReturnsAsync(new List<Owner>
                {
                    new Owner { OwnerId = 1, User = new User { UserID = 201, Fullname = "Owner A" } },
                    new Owner { OwnerId = 2, User = new User { UserID = 202, Fullname = "Owner B" } }
                });

            // Assistant info
            _userCommonRepositoryMock
                .Setup(r => r.GetByIdAsync(int.Parse(currentUserId), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = int.Parse(currentUserId), Fullname = "Assistant K" });

            var cmd = new CreateSupplyCommand
            {
                SupplyName = "  Bông gạc  ",
                Unit = "Gói",
                Price = 123.4567m
            };

            // Act
            var ok = await _handler.Handle(cmd, default);

            // Assert
            ok.Should().BeTrue();

            captured.Should().NotBeNull();
            captured!.Name.Should().Be("Bông gạc");     // trimmed
            captured.Unit.Should().Be("Gói");
            captured.Price.Should().Be(123.46m);        // rounded 2 decimals
            captured.CreatedBy.Should().Be(int.Parse(currentUserId));
            captured.IsDeleted.Should().BeFalse();

        }

        [Fact(DisplayName = "UTCID06 - Return false when CreateSupplyAsync returns false")]
        public async System.Threading.Tasks.Task UTCID06_ReturnFalse_When_CreateFails()
        {
            // Arrange
            SetupHttpContext();

            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync())
                                 .ReturnsAsync(SuppliesList()); // không trùng tên

            _supplyRepositoryMock
                .Setup(r => r.CreateSupplyAsync(It.IsAny<Supplies>()))
                .ReturnsAsync(false);

            _ownerRepositoryMock
                .Setup(r => r.GetAllOwnersAsync())
                .ReturnsAsync(new List<Owner>()); // không owner

            _userCommonRepositoryMock
                .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = 321, Fullname = "Assistant M" });

            var cmd = new CreateSupplyCommand { SupplyName = "Găng tay", Unit = "Hộp", Price = 10000m };

            // Act
            var ok = await _handler.Handle(cmd, default);

            // Assert
            ok.Should().BeFalse();
            _supplyRepositoryMock.Verify(r => r.CreateSupplyAsync(It.IsAny<Supplies>()), Times.Once);
            // Không owner ⇒ không gửi notify
            _mediatorMock.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}
