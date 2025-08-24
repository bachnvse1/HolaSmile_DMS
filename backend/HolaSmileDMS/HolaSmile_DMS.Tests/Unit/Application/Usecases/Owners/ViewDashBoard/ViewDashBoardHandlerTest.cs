using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.Owner.ViewDashboard;
using Application.Usecases.UserCommon.ViewAppointment;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Owners
{
    public class ViewDashboardHandlerTest
    {
        private readonly Mock<IInvoiceRepository> _invoiceRepoMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepoMock;
        private readonly Mock<IOwnerRepository> _ownerRepoMock;
        private readonly Mock<ITransactionRepository> _transactionRepository;
        private readonly Mock<IMaintenanceRepository> _maintenanceRepository;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewDashboardHandler _handler;

        public ViewDashboardHandlerTest()
        {
            _invoiceRepoMock = new Mock<IInvoiceRepository>();
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _userCommonRepoMock = new Mock<IUserCommonRepository>();
            _ownerRepoMock = new Mock<IOwnerRepository>();
            _transactionRepository = new Mock<ITransactionRepository>();
            _maintenanceRepository = new Mock<IMaintenanceRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new ViewDashboardHandler(
                _invoiceRepoMock.Object,
                _appointmentRepoMock.Object,
                _userCommonRepoMock.Object,
                _ownerRepoMock.Object,
                _transactionRepository.Object,
                _maintenanceRepository.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role = null, string userId = "1")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        private void SetupTestData(string filter = "today")
        {
            var today = DateTime.Now.Date;

            // Invoices
            var invoices = new List<Invoice>
            {
                new() { CreatedAt = today, PaidAmount = 100 },
                new() { CreatedAt = today, PaidAmount = 200 }
            };
            _invoiceRepoMock.Setup(r => r.GetTotalInvoice())
                .ReturnsAsync(invoices);

            // Appointments
            var appointments = new List<AppointmentDTO>
                {
                    new() { CreatedAt = today },
                    new() { CreatedAt = today }
                };
            _appointmentRepoMock.Setup(r => r.GetAllAppointmentAsync())
                .ReturnsAsync(appointments);

            // Patients
            var patients = new List<Patient>
            {
                new() { CreatedAt = today, UserID = 1 },
                new() { CreatedAt = today, UserID = 2 }
            };
            _userCommonRepoMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(patients);

            // Users (ViewListUserDTO theo interface)
            var users = new List<ViewListUserDTO>
            {
                new() { CreatedAt = today, UserId = 1 },
                new() { CreatedAt = today, UserId = 2 },
                new() { CreatedAt = today, UserId = 4 } // employee
            };
            _userCommonRepoMock.Setup(r => r.GetAllUserAsync())
                .ReturnsAsync(users);

            // Owners
            var owners = new List<Owner>
            {
                new() { UserId = 3 }
            };
            _ownerRepoMock.Setup(r => r.GetAllOwnersAsync())
                .ReturnsAsync(owners);
        }

        [Fact(DisplayName = "UTCID01 - Owner views dashboard successfully")]
        public async System.Threading.Tasks.Task UTCID01_Owner_Views_Dashboard_Successfully()
        {
            // Arrange
            SetupHttpContext("Owner");
            SetupTestData();

            var command = new ViewDashboardCommand { Filter = "today" };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(300m, result.TotalRevenue); // 100 + 200
            Assert.Equal(2, result.TotalAppointments);
            Assert.Equal(2, result.TotalPatient);
            Assert.Equal(1, result.TotalEmployee); // 3 users - 2 patients - 1 owner
            Assert.Equal(2, result.TotalPatient);
        }

        [Theory(DisplayName = "UTCID02 - Dashboard filters work correctly")]
        [InlineData("today")]
        [InlineData("week")]
        [InlineData("month")]
        [InlineData("year")]
        public async System.Threading.Tasks.Task UTCID02_Dashboard_Filters_Work_Correctly(string filter)
        {
            // Arrange
            SetupHttpContext("Owner");
            SetupTestData(filter);

            var command = new ViewDashboardCommand { Filter = filter };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.TotalRevenue >= 0);
            Assert.True(result.TotalAppointments >= 0);
            Assert.True(result.TotalPatient >= 0);
            Assert.True(result.TotalEmployee >= 0);
            Assert.True(result.TotalPatient >= 0);
        }

        [Fact(DisplayName = "UTCID03 - Non-owner role should throw unauthorized")]
        public async System.Threading.Tasks.Task UTCID03_Non_Owner_Role_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Dentist");
            var command = new ViewDashboardCommand { Filter = "today" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - No data should return zeros except total employees")]
        public async System.Threading.Tasks.Task UTCID04_No_Data_Should_Return_Zeros_Except_Employees()
        {
            // Arrange
            SetupHttpContext("Owner");
            var today = DateTime.Now.Date;

            // Setup empty data for most repositories
            _invoiceRepoMock.Setup(r => r.GetTotalInvoice())
                .ReturnsAsync(new List<Invoice>());

            _appointmentRepoMock.Setup(r => r.GetAllAppointmentAsync())
                .ReturnsAsync(new List<AppointmentDTO>());

            // Setup minimal data for users and patients to avoid exceptions
            var patients = new List<Patient>
    {
        new() { CreatedAt = today, UserID = 1 }
    };
            _userCommonRepoMock.Setup(r => r.GetAllPatientsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(patients);

            var users = new List<ViewListUserDTO>
    {
        new() { CreatedAt = today, UserId = 1 }, // Patient
        new() { CreatedAt = today, UserId = 2 }  // Employee
    };
            _userCommonRepoMock.Setup(r => r.GetAllUserAsync())
                .ReturnsAsync(users);

            _ownerRepoMock.Setup(r => r.GetAllOwnersAsync())
                .ReturnsAsync(new List<Owner>());

            var command = new ViewDashboardCommand { Filter = "today" };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalRevenue);
            Assert.Equal(0, result.TotalAppointments);
            Assert.Equal(1, result.TotalPatient);     // 1 patient
            Assert.Equal(1, result.TotalEmployee);    // 1 employee (not patient or owner)
            Assert.Equal(1, result.TotalPatient);       // 1 new patient today
        }

        [Fact(DisplayName = "UTCID05 - Invalid filter defaults to all data")]
        public async System.Threading.Tasks.Task UTCID05_Invalid_Filter_Defaults_To_All()
        {
            // Arrange
            SetupHttpContext("Owner");
            SetupTestData();

            var command = new ViewDashboardCommand { Filter = "invalid_filter" };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            // No filter applied → All data returned
            Assert.Equal(300m, result.TotalRevenue);
            Assert.Equal(2, result.TotalAppointments);
            Assert.Equal(2, result.TotalPatient);
            Assert.Equal(1, result.TotalEmployee);
            Assert.Equal(2, result.TotalPatient);
        }
    }
}
