using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Patients.ViewListPatient;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients;

public class ViewListPatientHandlerTests
{
    private readonly Mock<IPatientRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IHashIdService> _hashIdServiceMock;
    private readonly ViewListPatientHandler _handler;

    public ViewListPatientHandlerTests()
    {
        _repositoryMock = new Mock<IPatientRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _hashIdServiceMock = new Mock<IHashIdService>();

        _handler = new ViewListPatientHandler(
            _repositoryMock.Object,
            _httpContextAccessorMock.Object,
            _hashIdServiceMock.Object
        );
    }

    private void SetupHttpContext(string role, int userId = 1)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "Normal - UTCID01 - Owner can view patient list successfully")]
    public async System.Threading.Tasks.Task UTCID01_Owner_View_Patient_List_Success()
    {
        SetupHttpContext("owner");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>
            {
                new ViewListPatientDto { PatientId = 1, Fullname = "John Doe" }
            });

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.Single(result);
        Assert.Equal("John Doe", result[0].Fullname);
    }

    [Fact(DisplayName = "Normal - UTCID02 - Receptionist can view patient list successfully")]
    public async System.Threading.Tasks.Task UTCID02_Receptionist_View_Patient_List_Success()
    {
        SetupHttpContext("receptionist");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>
            {
                new ViewListPatientDto { PatientId = 2, Fullname = "Jane Smith" }
            });

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.Single(result);
        Assert.Equal("Jane Smith", result[0].Fullname);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Patient role is not allowed to view list")]
    public async System.Threading.Tasks.Task UTCID03_Patient_View_List_Throws_Unauthorized()
    {
        SetupHttpContext("patient");

        // Mock để tránh null khi repo bị gọi dù không mong muốn
        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>()); // hoặc có thể Verify Never bên dưới

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListPatientCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

        // Có thể assert repo không bị gọi nếu muốn chắc chắn
        _repositoryMock.Verify(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()), Times.Never);
    }



    [Fact(DisplayName = "Abnormal - UTCID04 - No role or ID in context should throw unauthorized")]
    public async System.Threading.Tasks.Task UTCID04_Missing_Claims_Throws_Unauthorized()
    {
        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(new DefaultHttpContext());

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListPatientCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "Normal - UTCID05 - Dentist can view patient list successfully")]
    public async System.Threading.Tasks.Task UTCID05_Dentist_View_Patient_List_Success()
    {
        SetupHttpContext("dentist");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>
            {
                new ViewListPatientDto { PatientId = 3, Fullname = "Dentist Patient" }
            });

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.Single(result);
        Assert.Equal("Dentist Patient", result[0].Fullname);
    }

    [Fact(DisplayName = "Normal - UTCID06 - Assistant can view patient list successfully")]
    public async System.Threading.Tasks.Task UTCID06_Assistant_View_Patient_List_Success()
    {
        SetupHttpContext("assistant");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>
            {
                new ViewListPatientDto { PatientId = 4, Fullname = "Assistant Patient" }
            });

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.Single(result);
        Assert.Equal("Assistant Patient", result[0].Fullname);
    }

    [Fact(DisplayName = "Normal - UTCID07 - Administrator can view patient list successfully")]
    public async System.Threading.Tasks.Task UTCID07_Administrator_View_Patient_List_Success()
    {
        SetupHttpContext("administrator");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>
            {
                new ViewListPatientDto { PatientId = 5, Fullname = "Admin Patient" }
            });

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.Single(result);
        Assert.Equal("Admin Patient", result[0].Fullname);
    }

    [Fact(DisplayName = "Normal - UTCID08 - Return empty patient list when no patients")]
    public async System.Threading.Tasks.Task UTCID08_Empty_Patient_List_Returns_Empty()
    {
        SetupHttpContext("owner");

        _repositoryMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewListPatientDto>()); // empty

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
