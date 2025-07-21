using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.ViewPromotionProgram;
using Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class ViewDetailPromotionProgramHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPromotionrepository> _promotionRepositoryMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock = new();

        private readonly ViewDetailPromotionProgramHandler _handler;

        public ViewDetailPromotionProgramHandlerTests()
        {
            _handler = new ViewDetailPromotionProgramHandler(
                _httpContextAccessorMock.Object,
                _promotionRepositoryMock.Object,
                _procedureRepositoryMock.Object,
                _userCommonRepositoryMock.Object
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

        [Fact(DisplayName = "UTCID01 - Throw when promotion not found")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenPromotionNotFound()
        {
            SetupHttpContext();

            _promotionRepositoryMock.Setup(x => x.GetDiscountProgramByIdAsync(1))
                .ReturnsAsync((DiscountProgram)null!);

            var act = async () => await _handler.Handle(new ViewDetailPromotionProgramCommand(1), CancellationToken.None);

            await act.Should().ThrowAsync<Exception>().WithMessage(MessageConstants.MSG.MSG119);
        }

        [Fact(DisplayName = "UTCID02 - Throw when CreatedBy user not found")]
        public async System.Threading.Tasks.Task UTCID02_Throw_WhenCreatedByUserNotFound()
        {
            SetupHttpContext();

            var program = new DiscountProgram
            {
                DiscountProgramID = 1,
                DiscountProgramName = "Promo",
                CreatedBy = 99,
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>()
            };

            _promotionRepositoryMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(program);
            _userCommonRepositoryMock.Setup(x => x.GetByIdAsync(99, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User)null!);

            var act = async () => await _handler.Handle(new ViewDetailPromotionProgramCommand(1), CancellationToken.None);

            await act.Should().ThrowAsync<Exception>().WithMessage(MessageConstants.MSG.MSG16);
        }

        [Fact(DisplayName = "UTCID03 - Return correct data when valid")]
        public async System.Threading.Tasks.Task UTCID03_ReturnSuccess_WhenValid()
        {
            SetupHttpContext();

            var procedure = new Procedure
            {
                ProcedureId = 10,
                ProcedureName = "Tẩy trắng răng"
            };

            var discountProgram = new DiscountProgram
            {
                DiscountProgramID = 1,
                DiscountProgramName = "Summer Sale",
                CreateDate = DateTime.Today.AddDays(-5),
                EndDate = DateTime.Today.AddDays(5),
                CreatedBy = 1,
                UpdatedBy = 2,
                CreateAt = DateTime.Today.AddDays(-5),
                UpdatedAt = DateTime.Today,
                IsDelete = false,
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
                {
                    new ProcedureDiscountProgram
                    {
                        ProcedureId = 10,
                        DiscountAmount = 15,
                        Procedure = procedure
                    }
                }
            };

            var createdByUser = new User { UserID = 1, Fullname = "Receptionist A" };
            var updatedByUser = new User { UserID = 2, Fullname = "Receptionist B" };

            _promotionRepositoryMock.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(discountProgram);
            _userCommonRepositoryMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(createdByUser);
            _userCommonRepositoryMock.Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(updatedByUser);

            var result = await _handler.Handle(new ViewDetailPromotionProgramCommand(1), CancellationToken.None);

            result.Should().NotBeNull();
            result.ProgramId.Should().Be(1);
            result.ProgramName.Should().Be("Summer Sale");
            result.CreateBy.Should().Be("Receptionist A");
            result.UpdateBy.Should().Be("Receptionist B");
            result.ListProcedure.Should().HaveCount(1);
            result.ListProcedure[0].ProcedureId.Should().Be(10);
            result.ListProcedure[0].ProcedureName.Should().Be("Tẩy trắng răng");
            result.ListProcedure[0].DiscountAmount.Should().Be(15);
        }
    }
}
