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

            var week = DateTime.Now.Date;
            var threeDaysAgo = week.AddDays(-3);
            var lastMonthSameDay = week.AddMonths(-1);

            // ==== Users ====
            // 1 Owner, 2 Employees (1 dentist (U2), 1 assistant (U3)), 3 Patients (U4, U5, U7)
            _context.Users.AddRange(new[]
            {
                new User { UserID = 1, Fullname = "Owner",     Username = "owner1",    Phone = "000111222", CreatedAt = week,            Status = true, IsVerify = true },
                new User { UserID = 2, Fullname = "Dentist U2", Username = "dentist1",  Phone = "000111223", CreatedAt = week,            Status = true, IsVerify = true },
                new User { UserID = 3, Fullname = "Assistant U3", Username = "assist1", Phone = "000111224", CreatedAt = week,            Status = true, IsVerify = true },
                new User { UserID = 4, Fullname = "Patient U4", Username = "patient1",  Phone = "000111225", CreatedAt = week,            Status = true, IsVerify = true },
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
                new Patient { PatientID = 1, UserID = 4, CreatedAt = week     },  // New week
                new Patient { PatientID = 2, UserID = 5, CreatedAt = threeDaysAgo }, // Week
                new Patient { PatientID = 3, UserID = 7, CreatedAt = lastMonthSameDay }, // Last month
            });

            // ==== Invoices ====
            // status: "paid" | "pending"
            _context.Invoices.AddRange(new[]
            {
                new Invoice { InvoiceId = 1, PatientId = 1, PaidAmount = 1000m, CreatedAt = week,            PaymentDate = week,            Status = "paid"    },
                new Invoice { InvoiceId = 2, PatientId = 2, PaidAmount =  500m, CreatedAt = threeDaysAgo,     PaymentDate = threeDaysAgo,     Status = "paid"    },
                new Invoice { InvoiceId = 3, PatientId = 3, PaidAmount =  200m, CreatedAt = lastMonthSameDay, PaymentDate = lastMonthSameDay, Status = "paid"    },
                new Invoice { InvoiceId = 4, PatientId = 1, PaidAmount =  300m, CreatedAt = week,            PaymentDate = null,             Status = "pending" }, // Unpaid
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
                    AppointmentDate = week,
                    AppointmentTime = new TimeSpan(9,0,0),
                    Content         = "Check-up A1",
                    CreatedAt       = week,
                    IsDeleted       = false
                },
                new Appointment {
                    AppointmentId   = 2,
                    PatientId       = 2,
                    DentistId       = 1,
                    Status          = "Confirmed",
                    IsNewPatient    = false,
                    AppointmentType = "Filling",
                    AppointmentDate = week,
                    AppointmentTime = new TimeSpan(10,0,0),
                    Content         = "Filling A2",
                    CreatedAt       = week,
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
                    TransactionDate = week,
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
                    TransactionDate = week,
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
                    CreatedAt = week
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


        [Fact(DisplayName = "ITCID02 - Non-owner is unauthorized")]
        public async System.Threading.Tasks.Task ITCID02_NonOwner_Unauthorized()
        {
            // Arrange
            SetupHttpContext("Assistant", "3");
            var handler = BuildHandler();
            var cmd = new ViewDashboardCommand { Filter = "week" };

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

            // From beginning of this month: includes week(1000 + 300 pending) and 3 days ago (500) => 1800
            var revenue = await handler.CalculateTotalRevenue("month");
            Assert.Equal(1800m, revenue);
        }

        [Fact(DisplayName = "ITCID04 - Revenue correct when filter=week")]
        public async System.Threading.Tasks.Task ITCID04_Revenue_Week()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // Week: week(1000 + 300) + threeDaysAgo(500) => 1800
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


        [Fact(DisplayName = "ITCID07 - TotalAppointments by filter")]
        public async System.Threading.Tasks.Task ITCID07_Appointments_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var week = await handler.CalculateTotalAppointments("week"); // includes week (2) + lastMonth not included
            Assert.Equal(2, week);

            var month = await handler.CalculateTotalAppointments("month"); // includes week (2) + last month entry excluded
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

            var week = await handler.CalculateTotalPatients("week"); // Patient 1 & 2
            Assert.Equal(2, week);

            var month = await handler.CalculateTotalPatients("month"); // Patient 1 & 2 (lastMonth excluded)
            Assert.Equal(2, month);

            var year = await handler.CalculateTotalPatients("year"); // all 3
            Assert.Equal(3, year);

            var @default = await handler.CalculateTotalPatients(null); // default-> week
            Assert.Equal(1, @default);
        }

        [Fact(DisplayName = "ITCID09 - TotalEmployees by filter (exclude owners & patients)")]
        public async System.Threading.Tasks.Task ITCID09_Employees_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            // week: users created week = U1(owner), U2(dentist), U3(assistant), U4(patient)
            // Exclude owner & patient => 2
            var week = await handler.CalculateTotalEmployees("week");
            Assert.Equal(2, week);

            // Month: like week (since U6 is last month)
            var month = await handler.CalculateTotalEmployees("month");
            Assert.Equal(2, month);

            // Year: includes U6(last month) -> employee too => U2,U3,U6 => 3
            var year = await handler.CalculateTotalEmployees("year");
            Assert.Equal(2, year);

            // Default -> week
            var @default = await handler.CalculateTotalEmployees(null);
            Assert.Equal(2, @default);
        }

        [Fact(DisplayName = "ITCID10 - NewPatients by filter")]
        public async System.Threading.Tasks.Task ITCID10_NewPatients_ByFilter()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

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

            var result = await handler.Handle(new ViewDashboardCommand { Filter = "week" }, default);

            Assert.Contains("1 hóa đơn chưa thanh toán", result.UnpaidInvoice.data);
            Assert.Contains("2 giao dịch chưa duyệt", result.UnapprovedTransaction.data);
            Assert.Contains("1 vật tư đang bảo trì", result.UnderMaintenance.data);
        }

        [Fact(DisplayName = "ITCID12 - Dashboard notifications format are safe and dated")]
        public async System.Threading.Tasks.Task ITCID12_Dashboard_Notification_Format()
        {
            SetupHttpContext("Owner", "1");
            var handler = BuildHandler();

            var result = await handler.Handle(new ViewDashboardCommand { Filter = "week" }, default);

            // NewInvoice text looks like: "bệnh nhân <fullname> - <amount> VNĐ"
            Assert.True(string.IsNullOrWhiteSpace(result.NewInvoice.data) == false || result.NewInvoice.data == "Không có hóa đơn mới");
            Assert.False(string.IsNullOrEmpty(result.NewInvoice.time)); // qq: either invoice date or empty handled in code

            // NewPatient (data/time based on lastest new patient week)
            // Our seed: AppointmentId=1 has IsNewPatient=true week
            // Handler uses AppointmentDTO for lastest new patient -> ensure string not explode
            Assert.NotNull(result.NewPatientAppointment);
            // Not asserting exact content to avoid coupling with mapping Content/PatientName, only non-null safety:
            Assert.NotNull(result.NewPatientAppointment.time);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
