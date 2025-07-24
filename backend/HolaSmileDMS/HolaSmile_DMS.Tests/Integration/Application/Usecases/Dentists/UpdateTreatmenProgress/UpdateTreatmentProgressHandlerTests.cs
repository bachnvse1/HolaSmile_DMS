using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.UpdateTreatmentProgress;
using Application.Usecases.SendNotification;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists
{
    public class UpdateTreatmentProgressIntegrationTests
    {
        private readonly ApplicationDbContext _ctx;
        private readonly UpdateTreatmentProgressHandler _handler;
        private readonly IHttpContextAccessor _http;
        private readonly IMediator _mediator;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly ITreatmentRecordRepository _treatmentRecordRepository;

        public UpdateTreatmentProgressIntegrationTests()
        {
            var svc = new ServiceCollection();
            var mediatorMock = new Mock<IMediator>();

            mediatorMock
                .Setup(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            // Đăng ký services
            svc.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase("UpdateTPDb"));
            svc.AddHttpContextAccessor();
            svc.AddMediatR(typeof(UpdateTreatmentProgressHandler).Assembly);
            svc.AddSingleton<IMediator>(mediatorMock.Object);
            svc.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();

// Mock IUserCommonRepository
            var userRepoMock = new Mock<IUserCommonRepository>();
            svc.AddSingleton<IUserCommonRepository>(userRepoMock.Object);
            var treatmentRecordRepoMock = new Mock<ITreatmentRecordRepository>();
            svc.AddSingleton<ITreatmentRecordRepository>(treatmentRecordRepoMock.Object);

            var provider = svc.BuildServiceProvider();
            _ctx      = provider.GetRequiredService<ApplicationDbContext>();
            _http     = provider.GetRequiredService<IHttpContextAccessor>();
            _mediator = provider.GetRequiredService<IMediator>();

            _handler = new UpdateTreatmentProgressHandler(
                provider.GetRequiredService<ITreatmentProgressRepository>(),
                _http,
                userRepoMock.Object,
                _mediator,
                treatmentRecordRepoMock.Object
            );

        }

        void Seed()
        {
            _ctx.TreatmentProgresses.RemoveRange(_ctx.TreatmentProgresses);
            _ctx.SaveChanges();

            _ctx.TreatmentProgresses.Add(new TreatmentProgress
            {
                TreatmentProgressID = 1,
                PatientID = 20,
                DentistID = 10,
                Status = "pending",
                ProgressName = "TP1",
                CreatedAt = DateTime.Now.AddDays(-1)
            });
            _ctx.SaveChanges();
        }

        void SetUser(string role, int uid)
        {
            var hc = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Role, role),
                    new Claim(ClaimTypes.NameIdentifier, uid.ToString())
                }))
            };
            _http.HttpContext = hc;
            Seed();
        }

        /* --------------- TESTS --------------- */

        // 1. Normal: Dentist cập nhật thành công
        [Fact(DisplayName = "[Integration - Normal] Dentist_Update_Should_Succeed")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_DentistUpdate_ShouldSuccess()
        {
            SetUser("Dentist", 99);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1, Status = "in-progress" };
            var ok = await _handler.Handle(cmd, default);
            Assert.True(ok);
        }

        // 2. Normal: Receptionist + pending cập nhật thành công
        [Fact(DisplayName = "[Integration - Normal] Receptionist_Pending_Should_Fail")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_ReceptionistPending_ShouldSuccess()
        {
            SetUser("Receptionist", 50);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1, Description = "Update" };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        // 3. Abnormal: Receptionist + status!=pending bị cấm
        [Fact(DisplayName = "[Integration - Abnormal] Receptionist_NotPending_ShouldThrow")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_ReceptionistNotPending_ShouldThrow()
        {
            // đổi trạng thái thành completed
            SetUser("Receptionist", 51);
            _ctx.TreatmentProgresses.First().Status = "completed";
            _ctx.SaveChanges();
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1 };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        // 4. Abnormal: Role không hợp lệ
        [Fact(DisplayName = "[Integration - Abnormal] InvalidRole_ShouldThrow")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_InvalidRole_ShouldThrow()
        {
            SetUser("Patient", 60);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1 };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
            Assert.Contains(MessageConstants.MSG.MSG26, ex.Message);
        }

        // 5. Abnormal: Status không hợp lệ
        [Fact(DisplayName = "[Integration - Abnormal] InvalidStatus_ShouldThrow")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_InvalidStatus_ShouldThrow()
        {
            SetUser("Dentist", 99);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1, Status = "unknown" };
            await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        }

        // 6. Abnormal: Duration âm
        [Fact(DisplayName = "[Integration - Abnormal] NegativeDuration_ShouldThrow")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NegativeDuration_ShouldThrow()
        {
            SetUser("Dentist", 99);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 1, Duration = -10 };
            await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] EndTimeBeforeCreated_ShouldThrow")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_EndTimeBeforeCreated_ShouldThrow()
        {
            // Arrange
            SetUser("Dentist", 99);

            // Tạo bản ghi TreatmentProgress có CreatedAt mới (tương lai)
            _ctx.TreatmentProgresses.RemoveRange(_ctx.TreatmentProgresses);
            _ctx.SaveChanges();

            _ctx.TreatmentProgresses.Add(new TreatmentProgress
            {
                TreatmentProgressID = 1,
                PatientID = 20,
                DentistID = 10,
                Status = "pending",
                ProgressName = "Test",
                CreatedAt = DateTime.Now.AddDays(-1) // CreatedAt hôm qua
            });
            _ctx.SaveChanges();

            var cmd = new UpdateTreatmentProgressCommand
            {
                TreatmentProgressID = 1,
                EndTime = DateTime.Now.AddDays(-5) // EndTime cách đây 5 ngày
            };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
            Assert.Contains("EndTime không thể nhỏ hơn CreatedAt", ex.Message); // đảm bảo đúng lỗi
        }

        // 8. Boundary: Không tìm thấy progress
        [Fact(DisplayName = "[Integration - Boundary] Progress_NotFound_ShouldThrow")]
        [Trait("TestType", "Boundary")]
        public async System.Threading.Tasks.Task B_NotFound_ShouldThrow()
        {
            SetUser("Dentist", 99);
            var cmd = new UpdateTreatmentProgressCommand { TreatmentProgressID = 999 };
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(cmd, default));
        }
    }
}
