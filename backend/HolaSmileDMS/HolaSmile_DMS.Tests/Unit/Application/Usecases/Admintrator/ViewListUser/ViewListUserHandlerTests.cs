using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Admintrator.ViewListUser;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Admintrator.ViewListUser
{
    public class ViewListUserHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewListUserHandler _handler;

        public ViewListUserHandlerTests()
        {
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new ViewListUserHandler(_userCommonRepositoryMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "[Unit - Normal] Admin_Can_View_User_List")]
        public async System.Threading.Tasks.Task UTCID01_Admin_Can_View_User_List()
        {
            SetupHttpContext("admintrator", 1);
            _userCommonRepositoryMock.Setup(r => r.GetAllUserAsync()).ReturnsAsync(new List<ViewListUserDTO>
        {
            new ViewListUserDTO { Email = "t1@gmail.com", FullName = "test 1", PhoneNumber="0123456789",Role = "owner", CreatedAt = DateTime.Now, isActive = true}
        });

            var result = await _handler.Handle(new ViewListUserCommand(), default);

            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Unauthorized_Role_Throws")]
        public async System.Threading.Tasks.Task UTCID02_Unauthorized_Role_Throws()
        {
            SetupHttpContext("receptionist", 1);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewListUserCommand(), default));
        }

        [Fact(DisplayName = "[Unit - Abnormal] Empty_User_List_Throws")]
        public async System.Threading.Tasks.Task UTCID03_Empty_User_List_Throws()
        {
            SetupHttpContext("admintrator", 1);
            _userCommonRepositoryMock.Setup(r => r.GetAllUserAsync()).ReturnsAsync(new List<ViewListUserDTO>());

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewListUserCommand(), default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
