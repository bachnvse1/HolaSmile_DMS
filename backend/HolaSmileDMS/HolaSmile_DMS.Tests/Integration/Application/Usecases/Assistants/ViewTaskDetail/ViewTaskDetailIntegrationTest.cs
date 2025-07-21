using Application.Constants;
using Application.Usecases.Assistant.ViewTaskDetails;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class ViewTaskDetailIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewTaskDetailsHandler _handler;

        public ViewTaskDetailIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase(Guid.NewGuid().ToString()));

            var httpContextAccessor = new HttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();

            var repo = new TaskRepository(_context);
            _handler = new ViewTaskDetailsHandler(repo, httpContextAccessor);

            SeedData();
            SetupHttpContext(role: "Assistant", roleId: "10");
        }

        private void SetupHttpContext(string role, string roleId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim("role_table_id", roleId)
            };

            var identity = new ClaimsIdentity(claims, "Test");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            var httpContextAccessor = _handler.GetType()
                .GetField("_httpContextAccessor", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
                .GetValue(_handler) as IHttpContextAccessor;

            httpContextAccessor!.HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            };
        }

        private void SeedData()
        {
            _context.Tasks.RemoveRange(_context.Tasks);
            _context.TreatmentProgresses.RemoveRange(_context.TreatmentProgresses);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.Users.RemoveRange(_context.Users);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.SaveChanges();

            _context.Users.Add(new User
            {
                UserID = 1,
                Fullname = "Dr. House",
                Username = "dentist1",
                Phone = "0111111111"
            });

            _context.Dentists.Add(new Dentist
            {
                DentistId = 1,
                UserId = 1
            });

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Nhổ răng"
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 100,
                ProcedureID = 1,
                AppointmentID = 200,
                DentistID = 1,
                TreatmentDate = DateTime.Today,
                Symptoms = "Đau răng",
                Diagnosis = "Sâu răng"
            });

            _context.TreatmentProgresses.Add(new TreatmentProgress
            {
                TreatmentProgressID = 500,
                TreatmentRecordID = 100,
                DentistID = 1,
                PatientID = 2,
                ProgressName = "Bước 1"
            });

            _context.Tasks.Add(new Task
            {
                TaskID = 300,
                AssistantID = 10,
                TreatmentProgressID = 500,
                Description = "Chuẩn bị dụng cụ",
                ProgressName = "Giao việc",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(9, 0, 0),
                Status = true
            });

            _context.SaveChanges();

        }

        [Fact(DisplayName = "UTCID01 - Get task detail successfully")]
        public async System.Threading.Tasks.Task UTCID01_ReturnTaskDetails_Success()
        {
            var command = new ViewTaskDetailsCommand(300);
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.Equal(300, result.TaskId);
            Assert.Equal("Giao việc", result.ProgressName);
            Assert.Equal("Completed", result.Status);
            Assert.Equal("Nhổ răng", result.ProcedureName);
            Assert.Equal("Dr. House", result.DentistName);
            Assert.Equal("Đau răng", result.Symptoms);
        }

        [Fact(DisplayName = "UTCID02 - Task not found throws exception")]
        public async System.Threading.Tasks.Task UTCID02_TaskNotFound_ThrowsKeyNotFound()
        {
            var command = new ViewTaskDetailsCommand(999);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Unauthorized if not owner")]
        public async System.Threading.Tasks.Task UTCID03_NotOwner_ThrowsUnauthorized()
        {
            SetupHttpContext("Assistant", "11"); // khác AssistantID

            var command = new ViewTaskDetailsCommand(300);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Missing claims throws unauthorized")]
        public async System.Threading.Tasks.Task UTCID04_MissingClaims_ThrowsUnauthorized()
        {
            var httpContextAccessor = _handler.GetType()
                .GetField("_httpContextAccessor", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
                .GetValue(_handler) as IHttpContextAccessor;

            httpContextAccessor!.HttpContext = new DefaultHttpContext(); // no claims

            var command = new ViewTaskDetailsCommand(300);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, CancellationToken.None));
        }
    }
}
