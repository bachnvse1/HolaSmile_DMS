using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.Owner.ViewDashboard;
using Application.Usecases.UserCommon.ViewAppointment;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Owners
{
    public class ViewDashboardHandlerUnitTests
    {
        // Mocks
        private readonly Mock<IInvoiceRepository> _invoiceRepo = new();
        private readonly Mock<IAppointmentRepository> _apptRepo = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepo = new();
        private readonly Mock<IOwnerRepository> _ownerRepo = new();
        private readonly Mock<ITransactionRepository> _txnRepo = new();
        private readonly Mock<IMaintenanceRepository> _maintRepo = new();
        private readonly Mock<IHttpContextAccessor> _http = new();

        private ViewDashboardHandler BuildHandler() => new(
            _invoiceRepo.Object,
            _apptRepo.Object,
            _userCommonRepo.Object,
            _ownerRepo.Object,
            _txnRepo.Object,
            _maintRepo.Object,
            _http.Object
        );

        private static AppointmentDTO MakeApptDto(
            int id, DateTime date, TimeSpan time, bool isNew, string name, string content, DateTime? createdAt = null)
            => new()
            {
                AppointmentId = id,
                AppointmentDate = date,
                AppointmentTime = time,
                IsNewPatient = isNew,
                PatientName = name,
                Content = content,
                CreatedAt = createdAt ?? date
            };

        private static Invoice MakeInvoice(
            int id, decimal? amount, DateTime createdAt, string status, DateTime? payDate, string patientName)
            => new()
            {
                InvoiceId = id,
                PaidAmount = amount,
                CreatedAt = createdAt,
                Status = status,
                PaymentDate = payDate,
                Patient = new Patient
                {
                    User = new User { Fullname = patientName }
                }
            };

        private static Patient MakePatient(int id, int userId, DateTime createdAt)
            => new() { PatientID = id, UserID = userId, CreatedAt = createdAt };

        private static User MakeUser(int id, DateTime createdAt)
            => new() { UserID = id, CreatedAt = createdAt, Status = true, IsVerify = true };

        private static Owner MakeOwner(int ownerId, int userId)
            => new() { OwnerId = ownerId, UserId = userId };

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Role, role),
                new(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            _http.Setup(h => h.HttpContext).Returns(new DefaultHttpContext { User = principal });
        }

        /// <summary>
        /// Seed dữ liệu mặc định phù hợp với logic handler
        /// </summary>
        private (DateTime today, DateTime threeDaysAgo, DateTime lastMonth) SeedDefaultData()
        {
            var today = DateTime.Now.Date;
            var threeDaysAgo = today.AddDays(-3);
            var lastMonth = today.AddMonths(-1);

            // Invoices:
            // today: paid 1000 (latest), pending 300; threeDaysAgo: paid 500; lastMonth: paid 200
            var inv1 = MakeInvoice(1, 1000m, today, "paid", today, "Patient A");
            var inv2 = MakeInvoice(2, 500m, threeDaysAgo, "paid", threeDaysAgo, "Patient B");
            var inv3 = MakeInvoice(3, 200m, lastMonth, "paid", lastMonth, "Patient C");
            var inv4 = MakeInvoice(4, 300m, today, "pending", null, "Patient B");

            _invoiceRepo.Setup(r => r.GetTotalInvoice())
                .ReturnsAsync(new List<Invoice> { inv1, inv2, inv3, inv4 });
            _invoiceRepo.Setup(r => r.GetLastestInvoice())
                .ReturnsAsync(inv1);

            // Appointments (DTO)
            var appt1 = MakeApptDto(1, today, new TimeSpan(9, 0, 0), true, "Patient A", "Checkup");
            var appt2 = MakeApptDto(2, today, new TimeSpan(10, 0, 0), false, "Patient B", "Filling");
            var appt3 = MakeApptDto(3, lastMonth, new TimeSpan(11, 0, 0), true, "Patient C", "Cleaning");

            _apptRepo.Setup(r => r.GetAllAppointmentAsync())
                .ReturnsAsync(new List<AppointmentDTO> { appt1, appt2, appt3 });

            // Users (owner, employees, patients)
            var users = new List<User>
            {
                MakeUser(1, today),        // owner
                MakeUser(2, today),        // dentist (employee)
                MakeUser(3, today),        // assistant (employee)
                MakeUser(4, today),        // patient1
                MakeUser(5, threeDaysAgo), // patient2
                MakeUser(6, lastMonth),    // another employee
                MakeUser(7, lastMonth)     // patient3
            };
            _userCommonRepo.Setup(r => r.GetAllUserAsync())
               .ReturnsAsync(new List<ViewListUserDTO>());
            // Patients
            var patients = new List<Patient>
            {
                MakePatient(1, 4, today),
                MakePatient(2, 5, threeDaysAgo),
                MakePatient(3, 7, lastMonth)
            };
            _userCommonRepo.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(patients);

            // Owners
            _ownerRepo.Setup(r => r.GetAllOwnersAsync())
                .ReturnsAsync(new List<Owner> { MakeOwner(1, 1) });

            // Transactions (pending 2, approved 1)
            _txnRepo.Setup(r => r.GetPendingTransactionsAsync())
                .ReturnsAsync(new List<FinancialTransaction>
                {
                    new() { TransactionID = 1, status = "pending" },
                    new() { TransactionID = 2, status = "pending" }
                });

            // Maintenance (1 pending, 1 completed)
            _maintRepo.Setup(r => r.GetAllMaintenancesWithSuppliesAsync())
                .ReturnsAsync(new List<EquipmentMaintenance>
                {
                    new() { MaintenanceId = 1, Status = "pending", CreatedAt = today },
                    new() { MaintenanceId = 2, Status = "completed", CreatedAt = threeDaysAgo }
                });

            return (today, threeDaysAgo, lastMonth);
        }

        // ---------------- Tests ----------------

        [Fact(DisplayName = "[Abnormal] Non-owner -> Unauthorized")]
        public async System.Threading.Tasks.Task NonOwner_Unauthorized()
        {
            SetupHttpContext("Assistant", 2);
            SeedDefaultData();

            var handler = BuildHandler();
            var cmd = new ViewDashboardCommand { Filter = "today" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                handler.Handle(cmd, CancellationToken.None));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "[Normal] Handle(today) aggregates & notifications")]
        public async System.Threading.Tasks.Task Handle_Today_Aggregates()
        {
            SetupHttpContext("Owner", 1);
            var (today, _, _) = SeedDefaultData();

            var handler = BuildHandler();
            var dto = await handler.Handle(new ViewDashboardCommand { Filter = "today" }, CancellationToken.None);

            // Revenue: handler dùng CreatedAt, cộng cả pending -> 1000 + 300 = 1300
            Assert.Equal(1300m, dto.TotalRevenue);

            // Appointments (CreatedAt hôm nay): 2
            Assert.Equal(2, dto.TotalAppointments);

            // Patients (CreatedAt hôm nay): 1
            Assert.Equal(1, dto.TotalPatient);

            // Employees (users today: owner(1), emp(2,3), patient(4)) -> exclude owners & patients => 2
            Assert.Equal(2, dto.TotalEmployee);

            // NewPatients(today) = 1 -> NewPatient.data dùng latestInvoice (theo code)
            Assert.False(string.IsNullOrWhiteSpace(dto.NewPatient.data));
            Assert.Contains("VNĐ", dto.NewPatient.data);
            Assert.Equal(today.ToString("dd/MM/yyyy"), dto.NewPatient.time);

            // NewInvoice: thông tin từ latestInvoice
            Assert.Contains("VNĐ", dto.NewInvoice.data);
            Assert.False(string.IsNullOrWhiteSpace(dto.NewInvoice.time));

            // Unpaid invoices: 1
            Assert.Contains("1 hóa đơn chưa thanh toán", dto.UnpaidInvoice.data);

            // Pending txns: 2
            Assert.Contains("2 giao dịch chưa duyệt", dto.UnapprovedTransaction.data);

            // Maintenance pending: 1
            Assert.Contains("1 vật tư đang bảo trì", dto.UnderMaintenance.data);
        }

        [Fact(DisplayName = "[Normal] CalculateTotalRevenue - week/month/year/default")]
        public async System.Threading.Tasks.Task CalculateTotalRevenue_ByFilter()
        {
            SetupHttpContext("Owner", 1);
            SeedDefaultData();
            var handler = BuildHandler();

            var week = await handler.CalculateTotalRevenue("week");   // today(1000+300) + 3daysAgo(500) = 1800
            var month = await handler.CalculateTotalRevenue("month"); // same as week (lastMonth out)
            var year = await handler.CalculateTotalRevenue("year");   // 1000+300+500+200 = 2000
            var @default = await handler.CalculateTotalRevenue(null); // default -> today = 1300

            Assert.Equal(1800m, week);
            Assert.Equal(1800m, month);
            Assert.Equal(2000m, year);
            Assert.Equal(1300m, @default);
        }

        [Fact(DisplayName = "[Normal] CalculateTotalAppointments - today/week/month/year/default")]
        public async System.Threading.Tasks.Task CalculateTotalAppointments_ByFilter()
        {
            SetupHttpContext("Owner", 1);
            SeedDefaultData();
            var handler = BuildHandler();

            var today = await handler.CalculateTotalAppointments("today"); // 2
            var week = await handler.CalculateTotalAppointments("week");   // 2
            var month = await handler.CalculateTotalAppointments("month"); // 2
            var year = await handler.CalculateTotalAppointments("year");   // 3
            var @default = await handler.CalculateTotalAppointments(null); // last 7 days => 2

            Assert.Equal(2, today);
            Assert.Equal(2, week);
            Assert.Equal(2, month);
            Assert.Equal(3, year);
            Assert.Equal(2, @default);
        }

        [Fact(DisplayName = "[Normal] CalculateTotalPatients - today/week/month/year/default")]
        public async System.Threading.Tasks.Task CalculateTotalPatients_ByFilter()
        {
            SetupHttpContext("Owner", 1);
            SeedDefaultData();
            var handler = BuildHandler();

            var today = await handler.CalculateTotalPatients("today"); // 1
            var week = await handler.CalculateTotalPatients("week");   // 2
            var month = await handler.CalculateTotalPatients("month"); // 2
            var year = await handler.CalculateTotalPatients("year");   // 3
            var @default = await handler.CalculateTotalPatients(null); // today => 1

            Assert.Equal(1, today);
            Assert.Equal(2, week);
            Assert.Equal(2, month);
            Assert.Equal(3, year);
            Assert.Equal(1, @default);
        }

        [Fact(DisplayName = "[Normal] CalculateTotalEmployees - today/week/month/year/default")]
        public async System.Threading.Tasks.Task CalculateTotalEmployees_ByFilter()
        {
            SetupHttpContext("Owner", 1);
            SeedDefaultData();
            var handler = BuildHandler();

            var today = await handler.CalculateTotalEmployees("today"); // 2
            var week = await handler.CalculateTotalEmployees("week");   // 2
            var month = await handler.CalculateTotalEmployees("month"); // 2
            var year = await handler.CalculateTotalEmployees("year");   // 3 (thêm U6 lastMonth)
            var @default = await handler.CalculateTotalEmployees(null); // today => 2

            Assert.Equal(2, today);
            Assert.Equal(2, week);
            Assert.Equal(2, month);
            Assert.Equal(3, year);
            Assert.Equal(2, @default);
        }

        [Fact(DisplayName = "[Normal] CalculateNewPatients - today/week/month/year/default")]
        public async System.Threading.Tasks.Task CalculateNewPatients_ByFilter()
        {
            SetupHttpContext("Owner", 1);
            SeedDefaultData();
            var handler = BuildHandler();

            var today = await handler.CalculateNewPatients("today"); // 1
            var week = await handler.CalculateNewPatients("week");   // 2
            var month = await handler.CalculateNewPatients("month"); // 2
            var year = await handler.CalculateNewPatients("year");   // 3
            var @default = await handler.CalculateNewPatients(null); // total => 3

            Assert.Equal(1, today);
            Assert.Equal(2, week);
            Assert.Equal(2, month);
            Assert.Equal(3, year);
            Assert.Equal(3, @default);
        }

        [Fact(DisplayName = "[Abnormal] CalculateTotalEmployees throws MSG16 when users empty")]
        public async System.Threading.Tasks.Task CalculateTotalEmployees_UsersEmpty_Throws()
        {
            SetupHttpContext("Owner", 1);
            // Users empty
            _userCommonRepo.Setup(r => r.GetAllUserAsync())
               .ReturnsAsync(new List<ViewListUserDTO>());
            // Những repo khác không dùng trong test này
            var handler = BuildHandler();

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                handler.CalculateTotalEmployees("today"));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
