using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFinancialTransaction;
using Domain.Entities;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists;
public class CreateFinancialTransactionHandlerTests
{
    private readonly Mock<ITransactionRepository> _transactionRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly Mock<IImageRepository> _imageRepoMock = new();
    private readonly Mock<ICloudinaryService> _cloudServiceMock = new();
    private readonly Mock<IOwnerRepository> _ownerRepoMock = new();
    private readonly Mock<IMediator> _mediatorMock = new();

    private readonly CreateFinancialTransactionHandler _handler;

    public CreateFinancialTransactionHandlerTests()
    {
        _handler = new CreateFinancialTransactionHandler(
            _transactionRepoMock.Object,
            _httpContextAccessorMock.Object,
            _imageRepoMock.Object,
            _cloudServiceMock.Object,
            _ownerRepoMock.Object,
            _mediatorMock.Object
        );
    }

    // ===== Helper =====
    private void SetupHttpContext(string role = "receptionist", string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(principal);
    }

    private IFormFile CreateMockFormFile(string fileName = "test.jpg", string contentType = "image/jpeg")
    {
        var fileContent = new byte[] { 0x1, 0x2, 0x3 };
        var stream = new MemoryStream(fileContent);
        return new FormFile(stream, 0, fileContent.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    // ===== TEST CASES =====

    [Fact(DisplayName = "UTCID01 - Throw when user role is not receptionist or owner")]
    public async System.Threading.Tasks.Task UTCID01_Throw_WhenInvalidRole()
    {
        SetupHttpContext("assistant");

        var command = new CreateFinancialTransactionCommand
        {
            TransactionType = true,
            Description = "Test",
            Amount = 1000,
            Category = "Test",
            PaymentMethod = true,
            TransactionDate = DateTime.Now,
            EvidentImage = CreateMockFormFile()
        };

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage(MessageConstants.MSG.MSG26);
    }

    [Fact(DisplayName = "UTCID02 - Throw when description is empty")]
    public async System.Threading.Tasks.Task UTCID02_Throw_WhenDescriptionEmpty()
    {
        SetupHttpContext("receptionist");

        var command = new CreateFinancialTransactionCommand
        {
            TransactionType = true,
            Description = "   ",
            Amount = 1000,
            Category = "Test",
            PaymentMethod = true,
            TransactionDate = DateTime.Now,
            EvidentImage = CreateMockFormFile()
        };

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<Exception>()
            .WithMessage(MessageConstants.MSG.MSG07);
    }

    [Fact(DisplayName = "UTCID03 - Throw when amount <= 0")]
    public async System.Threading.Tasks.Task UTCID03_Throw_WhenAmountInvalid()
    {
        SetupHttpContext("receptionist");

        var command = new CreateFinancialTransactionCommand
        {
            TransactionType = true,
            Description = "Test",
            Amount = 0,
            Category = "Test",
            PaymentMethod = true,
            TransactionDate = DateTime.Now,
            EvidentImage = CreateMockFormFile()
        };

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<Exception>()
            .WithMessage(MessageConstants.MSG.MSG95);
    }

    [Fact(DisplayName = "UTCID04 - Throw when file content type is invalid")]
    public async System.Threading.Tasks.Task UTCID04_Throw_WhenInvalidFileType()
    {
        SetupHttpContext("receptionist");

        var command = new CreateFinancialTransactionCommand
        {
            TransactionType = true,
            Description = "Test",
            Amount = 1000,
            Category = "Test",
            PaymentMethod = true,
            TransactionDate = DateTime.Now,
            EvidentImage = CreateMockFormFile(contentType: "application/pdf")
        };

        var act = async () => await _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Vui lòng chọn ảnh có định dạng jpeg/png/bmp/gif/webp/tiff/heic");
    }

    [Fact(DisplayName = "UTCID05 - Return true when create transaction successfully")]
    public async System.Threading.Tasks.Task UTCID05_ReturnTrue_WhenSuccess()
    {
        SetupHttpContext("receptionist");

        var command = new CreateFinancialTransactionCommand
        {
            TransactionType = true,
            Description = "Thu tiền dịch vụ",
            Amount = 500000,
            Category = "Khám chữa răng",
            PaymentMethod = true,
            TransactionDate = DateTime.Now,
            EvidentImage = CreateMockFormFile()
        };
        // Fix for CS0854: Remove the optional argument from the method call and explicitly pass the default value.
        _cloudServiceMock
            .Setup(c => c.UploadImageAsync(It.IsAny<IFormFile>(), "evident-images"))
            .Returns((IFormFile _, string _) => System.Threading.Tasks.Task.FromResult("https://fakeurl.com/test.jpg"));

        // Mock repo create transaction
        _transactionRepoMock.Setup(r => r.CreateTransactionAsync(It.IsAny<FinancialTransaction>()))
            .ReturnsAsync(true);

        // Mock owners (để tránh lỗi notification)
        _ownerRepoMock.Setup(r => r.GetAllOwnersAsync())
            .ReturnsAsync(new List<Owner> { new Owner { User = new User { UserID = 1, Fullname = "Owner" } } });

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
    }
}
