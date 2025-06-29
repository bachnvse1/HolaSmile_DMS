using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Usecases.Dentist.UpdateTreatmentProgress;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class UpdateTreatmentProgressHandlerTests
    {
        /* ---------- helper ---------- */
        private UpdateTreatmentProgressCommand GetValidCmd() => new()
        {
            TreatmentProgressID = 1,
            ProgressName = "Chỉnh sửa tiến trình",
            Status = "in-progress",
            Duration = 20,
            Description = "Cập nhật",
            EndTime = DateTime.Now.AddHours(1),
            Note = "OK"
        };

        private (UpdateTreatmentProgressHandler Handler,
                 Mock<ITreatmentProgressRepository> RepoMock,
                 Mock<IUserCommonRepository> UserRepoMock,
                 Mock<IMediator> MediatorMock)
        Setup(string role, string currentStatus = "pending")
        {
            var repoMock     = new Mock<ITreatmentProgressRepository>();
            var userRepoMock = new Mock<IUserCommonRepository>();
            var mediatorMock = new Mock<IMediator>();

            repoMock.Setup(r => r.GetByIdAsync(1, default))
                    .ReturnsAsync(new TreatmentProgress
                    {
                        TreatmentProgressID = 1,
                        PatientID = 5,
                        DentistID = 10,
                        Status = currentStatus,
                        CreatedAt = DateTime.Now.AddDays(-1)
                    });

            repoMock.Setup(r => r.UpdateAsync(It.IsAny<TreatmentProgress>(), default))
                    .ReturnsAsync(true);

            var httpMock = new Mock<IHttpContextAccessor>();
            httpMock.Setup(h => h.HttpContext!.User)
                    .Returns(new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "99"),
                        new Claim(ClaimTypes.Role, role)
                    })));

            var handler = new UpdateTreatmentProgressHandler(
                repoMock.Object,
                httpMock.Object,
                userRepoMock.Object,
                mediatorMock.Object);

            return (handler, repoMock, userRepoMock, mediatorMock);
        }

        /* ---------- tests ---------- */

        [Fact(DisplayName = "Normal - ITCID01 - Dentist cập nhật hợp lệ trả về true")]
        public async System.Threading.Tasks.Task ITCID01_DentistValid_ShouldSuccess()
        {
            var (handler, _, _, _) = Setup("Dentist");
            var ok = await handler.Handle(GetValidCmd(), default);
            Assert.True(ok);
        }

        [Fact(DisplayName = "Normal - ITCID02 - Receptionist cập nhật trạng thái pending trả về true")]
        public async System.Threading.Tasks.Task ITCID02_ReceptionistPending_ShouldSuccess()
        {
            var (handler, _, _, _) = Setup("Receptionist", "pending");
            var ok = await handler.Handle(GetValidCmd(), default);
            Assert.True(ok);
        }

        [Fact(DisplayName = "Abnormal - ITCID03 - Receptionist cập nhật status!=pending bị cấm")]
        public async System.Threading.Tasks.Task ITCID03_ReceptionistNotPending_ShouldThrow()
        {
            var (handler, _, _, _) = Setup("Receptionist", "in-progress");
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(GetValidCmd(), default));
        }

        [Fact(DisplayName = "Abnormal - ITCID04  - Role không hợp lệ bị cấm")]
        public async System.Threading.Tasks.Task UTCID04_InvalidRole_ShouldThrow()
        {
            var (handler, _, _, _) = Setup("Patient");
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(GetValidCmd(), default));
        }

        [Fact(DisplayName = "Abnormal - ITCID05  - Status sai giá trị báo lỗi")]
        public async System.Threading.Tasks.Task UTCID05_InvalidStatus_ShouldThrow()
        {
            var cmd = GetValidCmd();
            cmd.Status = "unknown";
            var (handler, _, _, _) = Setup("Dentist");
            await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "Abnormal - ITCID06 - Duration âm báo lỗi")]
        public async System.Threading.Tasks.Task UTCID06_NegativeDuration_ShouldThrow()
        {
            var cmd = GetValidCmd();
            cmd.Duration = -5;
            var (handler, _, _, _) = Setup("Dentist");
            await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "Abnormal - ITCID07 - EndTime < CreatedAt báo lỗi")]
        public async System.Threading.Tasks.Task UTCID07_EndTimeBeforeCreated_ShouldThrow()
        {
            var cmd = GetValidCmd();
            cmd.EndTime = DateTime.Now.AddDays(-10);
            var (handler, _, _, _) = Setup("Dentist");
            await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "Abnormal - ITCID08 - ProgressName trắng báo lỗi")]
        public async System.Threading.Tasks.Task UTCID08_BlankProgressName_ShouldThrow()
        {
            var cmd = GetValidCmd();
            cmd.ProgressName = "   ";
            var (handler, _, _, _) = Setup("Dentist");
            await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        }
    }
}
