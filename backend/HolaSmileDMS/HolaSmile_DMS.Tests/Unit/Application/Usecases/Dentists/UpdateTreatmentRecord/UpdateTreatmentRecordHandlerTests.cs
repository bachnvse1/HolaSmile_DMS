using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.UpdateTreatmentRecord;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class UpdateTreatmentRecordHandlerTests
    {
        private UpdateTreatmentRecordCommand GetValidCommand() => new()
        {
            TreatmentRecordId = 1,
            ToothPosition = "R1",
            Quantity = 2,
            UnitPrice = 500000,
            DiscountAmount = 50000,
            DiscountPercentage = 0,
            TotalAmount = 950000,
            TreatmentStatus = "Completed",
            Symptoms = "Pain",
            Diagnosis = "Cavity",
            TreatmentDate = DateTime.Today
        };

        private (UpdateTreatmentRecordHandler Handler, Mock<ITreatmentRecordRepository> RepoMock, Mock<IMediator> MediatorMock)
            SetupHandler(string role, int userId, string fullName = "Test Dentist")
        {
            var repoMock = new Mock<ITreatmentRecordRepository>();
            var httpMock = new Mock<IHttpContextAccessor>();
            var mediatorMock = new Mock<IMediator>();

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.GivenName, fullName)
            };

            var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            httpMock.Setup(h => h.HttpContext!.User).Returns(user);

            mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var handler = new UpdateTreatmentRecordHandler(
                repoMock.Object,
                httpMock.Object,
                mediatorMock.Object
            );

            return (handler, repoMock, mediatorMock);
        }

        [Fact(DisplayName = "Abnormal - UTCID01 - Role không phải nha sĩ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID01_RoleIsNotDentist_ShouldThrow()
        {
            // Arrange
            var cmd = GetValidCommand();
            var (handler, _, mediatorMock) = SetupHandler("Patient", 1);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                handler.Handle(cmd, default));

            mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Hồ sơ không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_RecordNotFound_ShouldThrow()
        {
            // Arrange
            var cmd = GetValidCommand();
            var (handler, repoMock, mediatorMock) = SetupHandler("Dentist", 1);

            repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((TreatmentRecord?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                handler.Handle(cmd, default));

            mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_HttpContextNull_ShouldThrow()
        {
            // Arrange
            var cmd = GetValidCommand();
            var repoMock = new Mock<ITreatmentRecordRepository>();
            var httpMock = new Mock<IHttpContextAccessor>();
            var mediatorMock = new Mock<IMediator>();

            httpMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);

            var handler = new UpdateTreatmentRecordHandler(
                repoMock.Object,
                httpMock.Object,
                mediatorMock.Object
            );

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                handler.Handle(cmd, default));

            mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Nha sĩ cập nhật hồ sơ điều trị thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID04_ValidInput_ShouldReturnTrue()
        {
            // Arrange
            var cmd = GetValidCommand();
            var (handler, repoMock, mediatorMock) = SetupHandler("Dentist", 2, "Bác sĩ A");

            var patient = new Patient
            {
                PatientID = 1,
                UserID = 10,
                User = new User { UserID = 10, Fullname = "Bệnh nhân A" }
            };

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 1,
                Patient = patient
            };

            var record = new TreatmentRecord
            {
                TreatmentRecordID = cmd.TreatmentRecordId,
                AppointmentID = 1,
                Appointment = appointment
            };

            repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(record);

            // Setup thêm mock cho GetTreatmentRecordById
            repoMock.Setup(r => r.GetTreatmentRecordById(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(record);

            // Setup mock cho GetPatientByPatientIdAsync với chính xác PatientId
            repoMock.Setup(r => r.GetPatientByPatientIdAsync(patient.PatientID))
                .ReturnsAsync(patient);

            repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await handler.Handle(cmd, default);

            // Assert
            Assert.True(result);

            mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 10 &&
                    n.Title == "Cập nhật hồ sơ điều trị" &&
                    n.Message == "Hồ sơ điều trị của bạn vừa được cập nhật." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == record.TreatmentRecordID &&
                    n.MappingUrl == "/patient/treatment-records"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Boundary - UTCID05 - Cho phép cập nhật khi DiscountAmount > TotalAmount")]
        public async System.Threading.Tasks.Task Boundary_UTCID05_DiscountExceedsTotal_ShouldStillUpdate()
        {
            // Arrange
            var cmd = GetValidCommand();
            cmd.DiscountAmount = 9999999; // không validate tại đây
            var (handler, repoMock, mediatorMock) = SetupHandler("Dentist", 3, "Bác sĩ B");

            var patient = new Patient
            {
                PatientID = 1,
                UserID = 20,
                User = new User { UserID = 20, Fullname = "Bệnh nhân B" }
            };

            var record = new TreatmentRecord
            {
                TreatmentRecordID = cmd.TreatmentRecordId,
                Appointment = new Appointment
                {
                    AppointmentId = 2,
                    PatientId = 1,
                    Patient = patient
                }
            };

            repoMock.Setup(r => r.GetTreatmentRecordById(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(record);

            repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            repoMock.Setup(r => r.GetPatientByPatientIdAsync(patient.PatientID))
                 .ReturnsAsync(patient);
            // Act
            var result = await handler.Handle(cmd, default);

            // Assert
            Assert.True(result);

            mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 20 &&
                    n.Title == "Cập nhật hồ sơ điều trị" &&
                    n.Message == "Hồ sơ điều trị của bạn vừa được cập nhật." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == record.TreatmentRecordID &&
                    n.MappingUrl == "/patient/treatment-records"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Normal - UTCID06 - Cho phép cập nhật khi các trường nullable là null")]
        public async System.Threading.Tasks.Task Normal_UTCID06_NullableFieldsLeftBlank_ShouldUpdate()
        {
            // Arrange
            var cmd = new UpdateTreatmentRecordCommand
            {
                TreatmentRecordId = 10
                // tất cả các field còn lại null
            };

            var (handler, repoMock, mediatorMock) = SetupHandler("Dentist", 4, "Bác sĩ C");

            var patient = new Patient
            {
                PatientID = 1,
                UserID = 30,
                User = new User { UserID = 30, Fullname = "Bệnh nhân C" }
            };

            var record = new TreatmentRecord
            {
                TreatmentRecordID = cmd.TreatmentRecordId,
                Appointment = new Appointment
                {
                    AppointmentId = 3,
                    PatientId = 1,
                    Patient = patient
                }
            };

            repoMock.Setup(r => r.GetTreatmentRecordById(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(record);

            repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            repoMock.Setup(r => r.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            // Act
            var result = await handler.Handle(cmd, default);

            // Assert
            Assert.True(result);

            mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 30 &&
                    n.Title == "Cập nhật hồ sơ điều trị" &&
                    n.Message == "Hồ sơ điều trị của bạn vừa được cập nhật." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == record.TreatmentRecordID &&
                    n.MappingUrl == "/patient/treatment-records"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }
    }
}