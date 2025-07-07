using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistant
{
    public class CreateWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyRepository> _warrantyRepoMock = new();
        private readonly Mock<IProcedureRepository> _procedureRepoMock = new();
        private readonly Mock<ITreatmentRecordRepository> _treatmentRecordRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<INotificationsRepository> _notificationRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();

        private readonly CreateWarrantyCardHandler _handler;

        public CreateWarrantyCardHandlerTests()
        {
            _handler = new CreateWarrantyCardHandler(
                _warrantyRepoMock.Object,
                _procedureRepoMock.Object,
                _treatmentRecordRepoMock.Object,
                _httpContextAccessorMock.Object,
                _notificationRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "1")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant creates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Create_Warranty_Card_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "10");

            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Tẩy trắng",
                WarrantyCardId = null
            };

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentStatus = "Completed",
                Appointment = new Appointment { PatientId = 20 }
            };

            var patient = new Patient { UserID = 99 };

            var createdCard = new WarrantyCard
            {
                WarrantyCardID = 100,
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddMonths(6),
                Term = "6 tháng",
                Status = true
            };

            _procedureRepoMock.Setup(r => r.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(procedure);

            _treatmentRecordRepoMock.Setup(r => r.GetByProcedureIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(treatmentRecord);

            _treatmentRecordRepoMock.Setup(r => r.GetPatientByPatientIdAsync(20))
                .ReturnsAsync(patient);

            _warrantyRepoMock.Setup(r => r.CreateWarrantyCardAsync(It.IsAny<WarrantyCard>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(createdCard);

            // Act
            var result = await _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.WarrantyCardId);
            Assert.Equal("6 tháng", result.Term);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - HttpContext null throws MSG53")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            SetupHttpContext(null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not Assistant throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Not_Assistant_Throws()
        {
            SetupHttpContext("Receptionist");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Procedure not found throws MSG99")]
        public async System.Threading.Tasks.Task UTCID04_Procedure_Not_Found()
        {
            SetupHttpContext("Assistant");

            _procedureRepoMock.Setup(r => r.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Procedure?)null);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default));

            Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Procedure already has warranty throws MSG100")]
        public async System.Threading.Tasks.Task UTCID05_Procedure_Already_Has_Warranty()
        {
            SetupHttpContext("Assistant");

            _procedureRepoMock.Setup(r => r.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1, WarrantyCardId = 999 });

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default));

            Assert.Equal(MessageConstants.MSG.MSG100, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - TreatmentRecord not completed throws MSG101")]
        public async System.Threading.Tasks.Task UTCID06_Treatment_Not_Completed()
        {
            SetupHttpContext("Assistant");

            _procedureRepoMock.Setup(r => r.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1 });

            _treatmentRecordRepoMock.Setup(r => r.GetByProcedureIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentRecord { TreatmentStatus = "InProgress" });

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "6 tháng" }, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID07 - Term format invalid throws MSG97")]
        public async System.Threading.Tasks.Task UTCID07_Term_Format_Invalid()
        {
            SetupHttpContext("Assistant");

            _procedureRepoMock.Setup(r => r.GetProcedureByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Procedure { ProcedureId = 1 });

            _treatmentRecordRepoMock.Setup(r => r.GetByProcedureIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentRecord
                {
                    TreatmentStatus = "Completed",
                    Appointment = new Appointment { PatientId = 10 }
                });

            // ✅ Term không hợp lệ, ParseEndDateFromTerm sẽ throw thật
            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { ProcedureId = 1, Term = "abc" }, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }

    }
}
