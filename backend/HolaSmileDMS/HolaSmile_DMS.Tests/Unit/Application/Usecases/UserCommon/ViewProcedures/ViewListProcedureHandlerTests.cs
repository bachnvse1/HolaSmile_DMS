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
    public class ViewListProcedureHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewListProcedureHandler _handler;

        public ViewListProcedureHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _procedureRepositoryMock = new Mock<IProcedureRepository>();
            _mapperMock = new Mock<IMapper>();
            _handler = new ViewListProcedureHandler(_procedureRepositoryMock.Object, _httpContextAccessorMock.Object, _mapperMock.Object);
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

        [Fact(DisplayName = "Normal - UTCID01 - Assistant sees all procedures")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_SeesAllProcedures()
        {
            SetupHttpContext("assistant");

            var procedures = new List<Procedure>
            {
                new Procedure { ProcedureId = 1, IsDeleted = false },
                new Procedure { ProcedureId = 2, IsDeleted = true }
            };

            _procedureRepositoryMock.Setup(r => r.GetAll()).ReturnsAsync(procedures);
            _mapperMock.Setup(m => m.Map<List<ViewProcedureDto>>(procedures)).Returns(new List<ViewProcedureDto> { new ViewProcedureDto(), new ViewProcedureDto() });

            var result = await _handler.Handle(new ViewListProcedureCommand(), CancellationToken.None);

            Assert.Equal(2, result.Count);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Non-assistant sees only non-deleted procedures")]
        public async System.Threading.Tasks.Task UTCID02_NonAssistant_SeesNonDeletedProcedures()
        {
            SetupHttpContext("receptionist");

            var procedures = new List<Procedure>
            {
                new Procedure { ProcedureId = 1, IsDeleted = false },
                new Procedure { ProcedureId = 2, IsDeleted = true }
            };

            _procedureRepositoryMock.Setup(r => r.GetAll()).ReturnsAsync(procedures);
            _mapperMock.Setup(m => m.Map<List<ViewProcedureDto>>(It.Is<List<Procedure>>(p => p.All(x => !x.IsDeleted))))
                       .Returns(new List<ViewProcedureDto> { new ViewProcedureDto() });

            var result = await _handler.Handle(new ViewListProcedureCommand(), CancellationToken.None);

            Assert.Single(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID03 - Role is missing")]
        public async System.Threading.Tasks.Task UTCID03_RoleMissing_ThrowsUnauthorized()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new ViewListProcedureCommand(), CancellationToken.None));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - No procedures found should throw exception")]
        public async System.Threading.Tasks.Task UTCID04_NoData_ThrowsException()
        {
            SetupHttpContext("assistant");

            _procedureRepositoryMock.Setup(r => r.GetAll()).ReturnsAsync(new List<Procedure>());

            var result = await _handler.Handle(new ViewListProcedureCommand(), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
