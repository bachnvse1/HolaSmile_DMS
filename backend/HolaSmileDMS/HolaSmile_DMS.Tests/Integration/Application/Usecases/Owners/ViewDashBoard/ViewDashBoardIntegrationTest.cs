using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Owner.ViewDashboard;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Domain.Entities;
using Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owners
{
    public class ViewDashboardIntegrationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // Repositories
        private readonly IInvoiceRepository _invoiceRepo;
        private readonly IAppointmentRepository _appointmentRepo;
        private readonly IUserCommonRepository _userCommonRepo;
        private readonly IOwnerRepository _ownerRepo;
        private readonly ITransactionRepository _transactionRepo;
        private readonly IMaintenanceRepository _maintenanceRepo;

        public ViewDashboardIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase($"ViewDashboardDb_{Guid.NewGuid():N}")
                .Options;

            _context = new ApplicationDbContext(options);
            _httpContextAccessor = new HttpContextAccessor();

            // Seed base data
            SeedTestData();

            // Concrete repositories (điều chỉnh namespace/constructor nếu dự án bạn khác)
            _invoiceRepo = new InvoiceRepository(_context);
            _appointmentRepo = new AppointmentRepository(_context);
            _userCommonRepo = new UserCommonRepository(_context);
            _ownerRepo = new OwnerRepository(_context);
            _transactionRepo = new TransactionRepository(_context);
            _maintenanceRepo = new MaintenanceRepository(_context);
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.HttpContext = new DefaultHttpContext { User = user };
        }

        private void SeedTestData()
        {
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            var today = DateTime.Now.Date;
            var threeDaysAgo = today.AddDays(-3);
            var lastMonthSameDay = today.AddMonths(-1);

            // ==== Users ====
            // 1 Owner, 2 Employees (1 dentist (U2), 1 assistant (U3)), 3 Patients (U4, U5, U7)
            _context.Users.AddRange(new[]
            {
                new User { UserID = 1, Fullname = "Owner",     Username = "owner1",    Phone = "000111222", CreatedAt = today,            Status = true, IsVerify = true },
                new User { UserID = 2, Fullname = "Dentist U2", Username = "dentist1",  Phone = "000111223", CreatedAt = today,            Status = true, IsVerify = true },
                new User { UserID = 3, Fullname = "Assistant U3", Username = "assist1", Phone = "000111224", CreatedAt = today,            Status = true, IsVerify = true },
                new User { UserID = 4, Fullname = "Patient U4", Username = "patient1",  Phone = "000111225", CreatedAt = today,            Status = true, IsVerify = true },
                new User { UserID = 5, Fullname = "Patient U5", Username = "patient2",  Phone = "000111226", CreatedAt = threeDaysAgo,     Status = true, IsVerify = true },
                new User { UserID = 6, Fullname = "Employee U6", Username = "emp2",     Phone = "000111227", CreatedAt = lastMonthSameDay, Status = true, IsVerify = true },
                new User { UserID = 7, Fullname = "Patient U7", Username = "patient3",  Phone = "000111228", CreatedAt = lastMonthSameDay, Status = true, IsVerify = true },
            });

            _context.Owners.Add(new Owner { OwnerId = 1, UserId = 1 });
            _context.Dentists.Add(new Dentist { DentistId = 1, UserId = 2 });
            _context.Assistants.Add(new Assistant { AssistantId = 1, UserId = 3 });

            // ==== Patients ====
            _context.Patients.AddRange(new[]
            {
                new Patient { PatientID = 1, UserID = 4, CreatedAt = today     },  // New today
                new Patient { PatientID = 2, UserID = 5, CreatedAt = threeDaysAgo }, // Week
                new Patient { PatientID = 3, UserID = 7, CreatedAt = lastMonthSameDay }, // Last month
            });

            // ==== Invoices ====
            // status: "paid" | "pending"
            _context.Invoices.AddRange(new[]
            {
                new Invoice { InvoiceId = 1, PatientId = 1, PaidAmount = 1000m, CreatedAt = today,            PaymentDate = today,            Status = "paid"    },
                new Invoice { InvoiceId = 2, PatientId = 2, PaidAmount =  500m, CreatedAt = threeDaysAgo,     PaymentDate = threeDaysAgo,     Status = "paid"    },
                new Invoice { InvoiceId = 3, PatientId = 3, PaidAmount =  200m, CreatedAt = lastMonthSameDay, PaymentDate = lastMonthSameDay, Status = "paid"    },
                new Invoice { InvoiceId = 4, PatientId = 1, PaidAmount =  300m, CreatedAt = today,            PaymentDate = null,             Status = "pending" }, // Unpaid
            });

            // ==== Appointments ====
            _context.Appointments.AddRange(new[]
            {
                new Appointment {
                    AppointmentId   = 1,
                    PatientId       = 1,
                    DentistId       = 1,
                    Status          = "Confirmed",
                    IsNewPatient    = true,
                    AppointmentType = "Checkup",
                    AppointmentDate = today,
                    AppointmentTime = new TimeSpan(9,0,0),
                    Content         = "Check-up A1",
                    CreatedAt       = today,
                    IsDeleted       = false
                },
                new Appointment {
                    AppointmentId   = 2,
                    PatientId       = 2,
                    DentistId       = 1,
                    Status          = "Confirmed",
                    IsNewPatient    = false,
                    AppointmentType = "Filling",
                    AppointmentDate = today,
                    AppointmentTime = new TimeSpan(10,0,0),
                    Content         = "Filling A2",
                    CreatedAt       = today,
                    IsDeleted       = false
                },
                new Appointment {
                    AppointmentId   = 3,
                    PatientId       = 3,
                    DentistId       = 1,
                    Status          = "Confirmed",
                    IsNewPatient    = true,
                    AppointmentType = "Cleaning",
                    AppointmentDate = lastMonthSameDay,
                    AppointmentTime = new TimeSpan(11,0,0),
                    Content         = "Cleaning A3",
                    CreatedAt       = lastMonthSameDay,
                    IsDeleted       = false
                },
            });

            // ==== Financial Transactions ====
            // Giả định entity có trường Status (pending/approved) khớp với repo GetPendingTransactionsAsync
            _context.FinancialTransactions.AddRange(new[]
            {
                new FinancialTransaction {
                    TransactionID = 1,
                    TransactionDate = today,
                    Description = "Pending expense 1",
                    TransactionType = false, // chi
                    Category = "Maintenance",
                    PaymentMethod = true,
                    Amount = 100m,
                    EvidenceImage = null,
                    status = "pending"
                },
                new FinancialTransaction {
                    TransactionID = 2,
                    TransactionDate = threeDaysAgo,
                    Description = "Pending expense 2",
                    TransactionType = false,
                    Category = "Supplies",
                    PaymentMethod = false,
                    Amount = 200m,
                    EvidenceImage = null,
                    status = "pending"
                },
                new FinancialTransaction {
                    TransactionID = 3,
                    TransactionDate = today,
                    Description = "Approved income",
                    TransactionType = true,  // thu
                    Category = "Service",
                    PaymentMethod = true,
                    Amount = 500m,
                    EvidenceImage = null,
                    status = "approved"
                },
            });

            // ==== Equipment Maintenance ====
            _context.EquipmentMaintenances.AddRange(new[]
            {
                new EquipmentMaintenance {
                    MaintenanceId= 1,
                    Status = "pending",
                    CreatedAt = today
                },
                new EquipmentMaintenance {
                    MaintenanceId = 2,
                    Status = "completed",
                    CreatedAt = threeDaysAgo
                },
            });

            _context.SaveChanges();
        }

        private ViewDashboardHandler BuildHandler() =>
            new ViewDashboardHandler(
                _invoiceRepo,
                _appointmentRepo,
                _userCommonRepo,
                _ownerRepo,
                _transactionRepo,
                _maintenanceRepo,
                _httpContextAccessor
            );

        // ------------------ TESTS ------------------

        [Fact(DisplayName = "ITCID01 - Owner role gets dashboard (today filter)")]
        public async System.Threading.Tasks.Task ITCID01_Owner_GetsDashboard_Today()
        {
            // Arrange
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // Act
            var result = await handler.Handle(new ViewDashboardCommand { Filter = "today" }, default);

            // Assert - revenue today: only invoice created today (paid 1000 + pending 300 still counts in TotalRevenue? -> handler sums all invoices in range regardless of Status)
            Assert.Equal(1300m, result.TotalRevenue); // 1000 + 300 (CreatedAt today)

            // Appointments created today: 2 (Id=1,2)
            Assert.Equal(2, result.TotalAppointments);

            // Patients created today: 1 (PatientID=1 -> UserID=4)
            Assert.Equal(1, result.TotalPatient);

            // Employees today: users created today = {U1 Owner, U2 Dentist, U3 Assistant, U4 Patient}
            // Exclude owners & patients => employees = {U2, U3} => 2
            Assert.Equal(2, result.TotalEmployee);

            // New patients today: 1
            Assert.Equal(1, result.TotalPatient);

            // Notifications:
            // UnpaidInvoice: Status == pending => currently 1
            Assert.Contains("1 hóa đơn chưa thanh toán", result.UnpaidInvoice.data);

            // UnapprovedTransaction: 2 pending
            Assert.Contains("2 giao dịch chưa duyệt", result.UnapprovedTransaction.data);

            // UnderMaintenance: 1 pending
            Assert.Contains("1 vật tư đang bảo trì", result.UnderMaintenance.data);

            // NewInvoice data should show latest invoice by PaymentDate/CreatedAt (repo implementation usually OrderByDescending(PaymentDate) then FirstOrDefault())
            // We seeded latest 'paid' invoice today with Patient U4 and amount 1000
            Assert.Contains("VNĐ", result.NewInvoice.data);
            Assert.NotNull(result.NewInvoice.time);
        }

        [Fact(DisplayName = "ITCID02 - Non-owner is unauthorized")]
        public async System.Threading.Tasks.Task ITCID02_NonOwner_Unauthorized()
        {
            // Arrange
            SetupHttpContext("Assistant", "3");
            var handler = BuildHandler();
            var cmd = new ViewDashboardCommand { Filter = "today" };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Revenue correct when filter=month")]
        public async System.Threading.Tasks.Task ITCID03_Revenue_Month()
        {
            // Arrange
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // From beginning of this month: includes today(1000 + 300 pending) and 3 days ago (500) => 1800
            var revenue = await handler.CalculateTotalRevenue("month");
            Assert.Equal(1800m, revenue);
        }

        [Fact(DisplayName = "ITCID04 - Revenue correct when filter=week")]
        public async System.Threading.Tasks.Task ITCID04_Revenue_Week()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // Week: today(1000 + 300) + threeDaysAgo(500) => 1800
            var revenue = await handler.CalculateTotalRevenue("week");
            Assert.Equal(1800m, revenue);
        }

        [Fact(DisplayName = "ITCID05 - Revenue correct when filter=year")]
        public async System.Threading.Tasks.Task ITCID05_Revenue_Year()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // Year: all 4 invoices => 1000 + 500 + 200 + 300 = 2000
            var revenue = await handler.CalculateTotalRevenue("year");
            Assert.Equal(2000m, revenue);
        }

        [Fact(DisplayName = "ITCID06 - Revenue default (falls back to today)")]
        public async System.Threading.Tasks.Task ITCID06_Revenue_Default_Today()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // default case in handler => filter others -> falls to "today"
            var revenue = await handler.CalculateTotalRevenue(null);
            Assert.Equal(1300m, revenue);
        }

        [Fact(DisplayName = "ITCID07 - TotalAppointments by filter")]
        public async System.Threading.Tasks.Task ITCID07_Appointments_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var today = await handler.CalculateTotalAppointments("today");
            Assert.Equal(2, today);

            var week = await handler.CalculateTotalAppointments("week"); // includes today (2) + lastMonth not included
            Assert.Equal(2, week);

            var month = await handler.CalculateTotalAppointments("month"); // includes today (2) + last month entry excluded
            Assert.Equal(2, month);

            var year = await handler.CalculateTotalAppointments("year"); // includes all 3
            Assert.Equal(3, year);

            var @default = await handler.CalculateTotalAppointments(null); // default -> last 7 days => 2
            Assert.Equal(2, @default);
        }

        [Fact(DisplayName = "ITCID08 - TotalPatients by filter")]
        public async System.Threading.Tasks.Task ITCID08_Patients_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var today = await handler.CalculateTotalPatients("today"); // only PatientID=1
            Assert.Equal(1, today);

            var week = await handler.CalculateTotalPatients("week"); // Patient 1 & 2
            Assert.Equal(2, week);

            var month = await handler.CalculateTotalPatients("month"); // Patient 1 & 2 (lastMonth excluded)
            Assert.Equal(2, month);

            var year = await handler.CalculateTotalPatients("year"); // all 3
            Assert.Equal(3, year);

            var @default = await handler.CalculateTotalPatients(null); // default-> today
            Assert.Equal(1, @default);
        }

        [Fact(DisplayName = "ITCID09 - TotalEmployees by filter (exclude owners & patients)")]
        public async System.Threading.Tasks.Task ITCID09_Employees_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // Today: users created today = U1(owner), U2(dentist), U3(assistant), U4(patient)
            // Exclude owner & patient => 2
            var today = await handler.CalculateTotalEmployees("today");
            Assert.Equal(2, today);

            // Week: includes U1,U2,U3,U4,U5(3 days ago) => patients include U4,U5; employees => still U2,U3 => 2
            var week = await handler.CalculateTotalEmployees("week");
            Assert.Equal(2, week);

            // Month: like week (since U6 is last month)
            var month = await handler.CalculateTotalEmployees("month");
            Assert.Equal(2, month);

            // Year: includes U6(last month) -> employee too => U2,U3,U6 => 3
            var year = await handler.CalculateTotalEmployees("year");
            Assert.Equal(3, year);

            // Default -> today
            var @default = await handler.CalculateTotalEmployees(null);
            Assert.Equal(2, @default);
        }

        [Fact(DisplayName = "ITCID10 - NewPatients by filter")]
        public async System.Threading.Tasks.Task ITCID10_NewPatients_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var today = await handler.CalculateNewPatients("today"); // 1
            Assert.Equal(1, today);

            var week = await handler.CalculateNewPatients("week"); // 2
            Assert.Equal(2, week);

            var month = await handler.CalculateNewPatients("month"); // 2
            Assert.Equal(2, month);

            var year = await handler.CalculateNewPatients("year"); // 3
            Assert.Equal(3, year);

            // default -> return total count (3)
            var @default = await handler.CalculateNewPatients(null);
            Assert.Equal(3, @default);
        }

        [Fact(DisplayName = "ITCID11 - Dashboard aggregates: unpaid invoices, pending transactions, under maintenance")]
        public async System.Threading.Tasks.Task ITCID11_Dashboard_Aggregates_PendingCounts()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var result = await handler.Handle(new ViewDashboardCommand { Filter = "today" }, default);

            Assert.Contains("1 hóa đơn chưa thanh toán", result.UnpaidInvoice.data);
            Assert.Contains("2 giao dịch chưa duyệt", result.UnapprovedTransaction.data);
            Assert.Contains("1 vật tư đang bảo trì", result.UnderMaintenance.data);
        }

        [Fact(DisplayName = "ITCID12 - Dashboard notifications format are safe and dated")]
        public async System.Threading.Tasks.Task ITCID12_Dashboard_Notification_Format()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var result = await handler.Handle(new ViewDashboardCommand { Filter = "today" }, default);

            // NewInvoice text looks like: "bệnh nhân <fullname> - <amount> VNĐ"
            Assert.True(string.IsNullOrWhiteSpace(result.NewInvoice.data) == false || result.NewInvoice.data == "Không có hóa đơn mới");
            Assert.False(string.IsNullOrEmpty(result.NewInvoice.time)); // qq: either invoice date or empty handled in code

            // NewPatient (data/time based on lastest new patient today)
            // Our seed: AppointmentId=1 has IsNewPatient=true today
            // Handler uses AppointmentDTO for lastest new patient -> ensure string not explode
            Assert.NotNull(result.NewPatientAppointment);
            // Not asserting exact content to avoid coupling with mapping Content/PatientName, only non-null safety:
            Assert.NotNull(result.NewPatientAppointment.time);
        }

        [Fact(DisplayName = "ITCID13 - Empty dataset does not throw and returns zeros")]
        public async System.Threading.Tasks.Task ITCID13_EmptyDataset_Safe()
        {
            // New empty DB
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase($"EmptyDb_{Guid.NewGuid():N}")
                .Options;

            using var emptyContext = new ApplicationDbContext(options);

            // still need an owner user to pass auth
            emptyContext.Users.Add(new User { UserID = 99, Fullname = "Owner Empty", Username = "ownerx", CreatedAt = DateTime.Now.Date, Status = true, IsVerify = true });
            emptyContext.Owners.Add(new Owner { OwnerId = 99, UserId = 99 });
            emptyContext.SaveChanges();

            var http = new HttpContextAccessor();
            var claims = new List<Claim> { new Claim(ClaimTypes.Role, "Owner"), new Claim(ClaimTypes.NameIdentifier, "99") };
            http.HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")) };

            var handler = new ViewDashboardHandler(
                new InvoiceRepository(emptyContext),
                new AppointmentRepository(emptyContext),
                new UserCommonRepository(emptyContext),
                new OwnerRepository(emptyContext),
                new TransactionRepository(emptyContext),
                new MaintenanceRepository(emptyContext),
                http
            );

            var dto = await handler.Handle(new ViewDashboardCommand { Filter = "today" }, default);

            Assert.Equal(0m, dto.TotalRevenue);
            Assert.Equal(0, dto.TotalAppointments);
            Assert.Equal(0, dto.TotalPatient);
            Assert.Equal(0, dto.TotalEmployee); // users exist (owner), but excluded => 0
            Assert.Equal(0, dto.TotalPatient);

            Assert.True(dto.UnpaidInvoice.data.Contains("Không có") || dto.UnpaidInvoice.data.Contains("0"));
            Assert.True(dto.UnapprovedTransaction.data.Contains("Không có") || dto.UnapprovedTransaction.data.Contains("0"));
            Assert.True(dto.UnderMaintenance.data.Contains("Không có") || dto.UnderMaintenance.data.Contains("0"));
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
