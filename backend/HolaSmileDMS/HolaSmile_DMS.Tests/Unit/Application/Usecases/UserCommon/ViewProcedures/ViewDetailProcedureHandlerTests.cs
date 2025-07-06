using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewProcedures;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewDetailProcedureHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewDetailProcedureHandler _handler;

        public ViewDetailProcedureHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();
            _procedureRepositoryMock = new Mock<IProcedureRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new ViewDetailProcedureHandler(
                _procedureRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
                _httpContextAccessorMock.Object,
                _mapperMock.Object);
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant can view deleted procedure")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_ViewDeletedProcedure_Success()
        {
            SetupHttpContext("assistant");

            var procedure = new Procedure { ProcedureId = 1, IsDeleted = true, CreatedBy = 10, UpdatedBy = 20 };
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(procedure);

            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Creator" });
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Updater" });

            _mapperMock.Setup(m => m.Map<ViewProcedureDto>(procedure)).Returns(new ViewProcedureDto());

            var result = await _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 1 }, default);

            Assert.Equal("Creator", result.CreatedBy);
            Assert.Equal("Updater", result.UpdateBy);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Non-assistant can view active procedure")]
        public async System.Threading.Tasks.Task UTCID02_NonAssistant_ViewActiveProcedure_Success()
        {
            SetupHttpContext("receptionist");

            var procedure = new Procedure { ProcedureId = 2, IsDeleted = false, CreatedBy = 10, UpdatedBy = 20 };
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(2)).ReturnsAsync(procedure);

            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Creator" });
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Updater" });

            _mapperMock.Setup(m => m.Map<ViewProcedureDto>(procedure)).Returns(new ViewProcedureDto());

            var result = await _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 2 }, default);

            Assert.Equal("Creator", result.CreatedBy);
            Assert.Equal("Updater", result.UpdateBy);
        }

        [Fact(DisplayName = "Invalid - UTCID03 - Non-assistant cannot view deleted procedure")]
        public async System.Threading.Tasks.Task UTCID03_NonAssistant_ViewDeletedProcedure_ThrowsException()
        {
            SetupHttpContext("dentist");

            var procedure = new Procedure { ProcedureId = 3, IsDeleted = true };
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(3)).ReturnsAsync(procedure);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 3 }, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Procedure not found")]
        public async System.Threading.Tasks.Task UTCID04_ProcedureNotFound_ThrowsException()
        {
            SetupHttpContext("assistant");

            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(999)).ReturnsAsync((Procedure)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 999 }, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID05 - Role missing")]
        public async System.Threading.Tasks.Task UTCID05_RoleMissing_ThrowsUnauthorized()
        {
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 5 }, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Edge - UTCID06 - Unknown CreatedBy/UpdatedBy fallback")]
        public async System.Threading.Tasks.Task UTCID06_UnknownUserFallbackToUnknown()
        {
            SetupHttpContext("assistant");

            var procedure = new Procedure { ProcedureId = 6, IsDeleted = false, CreatedBy = 100, UpdatedBy = 200 };
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(6)).ReturnsAsync(procedure);
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((User)null);
            _mapperMock.Setup(m => m.Map<ViewProcedureDto>(procedure)).Returns(new ViewProcedureDto());

            var result = await _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 6 }, default);

            Assert.Equal("Unknown", result.CreatedBy);
            Assert.Equal("Unknown", result.UpdateBy);
        }
    }
}
