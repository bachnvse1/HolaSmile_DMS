using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;


namespace Application.Usecases.Owner.ViewDashboard
{
    public class ViewDashboardHandler : IRequestHandler<ViewDashboardCommand, ViewDashboardDTO>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IOwnerRepository _ownerCommonRepository;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IMaintenanceRepository _maintenanceRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDashboardHandler(IInvoiceRepository invoiceRepository, IAppointmentRepository appointmentRepository,
            IUserCommonRepository userCommonRepository, IOwnerRepository ownerCommonRepository, ITransactionRepository transactionRepository, IMaintenanceRepository maintenanceRepository, IHttpContextAccessor httpContextAccessor)
        {
            _invoiceRepository = invoiceRepository;
            _appointmentRepository = appointmentRepository;
            _userCommonRepository = userCommonRepository;
            _ownerCommonRepository = ownerCommonRepository;
            _transactionRepository = transactionRepository;
            _maintenanceRepository = maintenanceRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ViewDashboardDTO> Handle(ViewDashboardCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            //if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
            //{
            //    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            //}

            var invoices = await _invoiceRepository.GetTotalInvoice() ?? new List<Invoice>();
            var totalInvoices = invoices.Where(i => i.Status == "pending").Count();
            var latestInvoice = await _invoiceRepository.GetLastestInvoice()?? new Invoice();

            var appointmentDtos = await _appointmentRepository.GetAllAppointmentAsync() ?? new List<AppointmentDTO>();
            var lastestNewPatient = appointmentDtos
                .Where(a => a.IsNewPatient)
                .OrderByDescending(a => a.AppointmentId)
                .ThenByDescending(a => a.AppointmentTime)
                .FirstOrDefault();

            var lastestapp = appointmentDtos
                .OrderByDescending(a => a.AppointmentId)
                .ThenByDescending(a => a.AppointmentTime)
                .FirstOrDefault();

            var transactions = await _transactionRepository.GetPendingTransactionsAsync() ?? new List<FinancialTransaction>();

            var maintainances = await _maintenanceRepository.GetAllMaintenancesWithSuppliesAsync() ?? new List<EquipmentMaintenance>();

            var maintainanceCount = maintainances.Where(m => m.Status == "pending").Count();

            var now = DateTime.Now;
            var filter = string.IsNullOrEmpty(request.Filter) ? "week" : request.Filter.ToLower();

            var totalRevenue = await CalculateTotalRevenue(request.Filter);
            var totalAppointments = await CalculateTotalAppointments(request.Filter);
            var totalPatients = await CalculateTotalPatients(request.Filter);
            var newPatients = await CalculateNewPatients(request.Filter);

            var dashboardData = new ViewDashboardDTO
            {
                TotalRevenue = totalRevenue,
                TotalAppointments = totalAppointments,
                TotalPatient = totalPatients,
                NewPatient = newPatients,
                NewInvoice = new DashboardNotiData
                {
                    data = latestInvoice.PaidAmount.HasValue ? $"bệnh nhân {latestInvoice.Patient.User.Fullname} - {(int)latestInvoice.PaidAmount.Value} VNĐ" : "Không có hóa đơn mới",
                    time = latestInvoice.PaymentDate?.ToString("dd/MM/yyyy") ?? ""
                },
                NewPatientAppointment = new DashboardNotiData
                {
                    data = lastestNewPatient != null ? $"{lastestNewPatient.PatientName} - {lastestNewPatient.Content}" : "",
                    time = lastestNewPatient?.AppointmentDate.ToString("dd/MM/yyyy") ?? ""
                },
                NewAppointment = new DashboardNotiData
                {
                    data = lastestapp != null ? $"{lastestapp.PatientName} - {lastestapp.Content}" : "",
                    time = lastestapp?.AppointmentDate.ToString("dd/MM/yyyy") ?? ""
                },
                UnpaidInvoice = new DashboardNotiData
                {
                    data = totalInvoices > 0 ? $"{totalInvoices} hóa đơn chưa thanh toán" : "Không có hóa đơn chưa thanh toán",
                    time = now.ToString("dd/MM/yyyy")
                },
                UnapprovedTransaction = new DashboardNotiData
                {
                    data = transactions.Count > 0 ? $"{transactions.Count} giao dịch chưa duyệt" : "Không có giao dịch chưa duyệt",
                    time = now.ToString("dd/MM/yyyy")
                },
                UnderMaintenance = new DashboardNotiData
                {
                    data = maintainanceCount > 0 ? $"{maintainanceCount} vật tư đang bảo trì" : "Không có vật tư đang bảo trì",
                    time = now.ToString("dd/MM/yyyy")
                }
            };


            return dashboardData;
        }

        public async Task<decimal> CalculateTotalRevenue(string? filter)
        {
            var invoices = await _invoiceRepository.GetTotalInvoice();
            if (invoices == null || !invoices.Any())
                return 0;

            var fromDate = DateTime.Now;

            switch (filter?.ToLower())
            {
                //case "today":
                //    invoices = invoices.Where(i => i.CreatedAt.Date == fromDate).ToList();
                //    break;

                case "week":
                    fromDate = fromDate.AddDays(-7);
                    invoices = invoices.Where(i => i.CreatedAt.Date >= fromDate).ToList();
                    break;

                case "month":
                    fromDate = new DateTime(fromDate.Year, fromDate.Month, 1); // đầu tháng
                    invoices = invoices.Where(i => i.CreatedAt >= fromDate).ToList();
                    break;

                case "year":
                    fromDate = new DateTime(fromDate.Year, 1, 1); // đầu năm
                    invoices = invoices.Where(i => i.CreatedAt >= fromDate).ToList();
                    break;

                default:
                    // không lọc gì cả
                    invoices = invoices.Where(i => i.CreatedAt.Date == fromDate).ToList();
                    break;
            }

            var totalRevenue = invoices.Sum(i => i.PaidAmount ?? 0);
            return totalRevenue;
        }
        public async Task<int> CalculateTotalAppointments(string? filter)
        {
            var appointments = await _appointmentRepository.GetAllAppointmentAsync();
            if (appointments == null || !appointments.Any())
                return 0;

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                //case "today":
                //    fromDate = now.Date;
                //    appointments = appointments.Where(a => a.CreatedAt.Date == fromDate).ToList();
                //    break;

                case "week":
                    fromDate = now.Date.AddDays(-7);
                    appointments = appointments.Where(a => a.CreatedAt.Date >= fromDate).ToList();
                    break;

                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1);
                    appointments = appointments.Where(a => a.CreatedAt >= fromDate).ToList();
                    break;

                case "year":
                    fromDate = new DateTime(now.Year, 1, 1);
                    appointments = appointments.Where(a => a.CreatedAt >= fromDate).ToList();
                    break;

                default:
                    // Không filter
                    fromDate = now.Date.AddDays(-7);
                    appointments = appointments.Where(a => a.CreatedAt.Date >= fromDate).ToList();
                    break;
            }

            return appointments.Count();
        }
        public async Task<int> CalculateTotalPatients(string? filter)
        {
            var patients = await _userCommonRepository.GetAllPatientsAsync(CancellationToken.None);
            if (patients == null || !patients.Any())
                return 0;

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                //case "today":
                //    fromDate = now.Date;
                //    patients = patients.Where(p => p.CreatedAt.Date == fromDate).ToList();
                //    break;

                case "week":
                    fromDate = now.Date.AddDays(-7);
                    patients = patients.Where(p => p.CreatedAt.Date >= fromDate).ToList();
                    break;

                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1);
                    patients = patients.Where(p => p.CreatedAt >= fromDate).ToList();
                    break;

                case "year":
                    fromDate = new DateTime(now.Year, 1, 1);
                    patients = patients.Where(p => p.CreatedAt >= fromDate).ToList();
                    break;

                default:
                    fromDate = now.Date.AddDays(-7);
                    patients = patients.Where(p => p.CreatedAt.Date >= fromDate).ToList();
                    break;
            }

            return patients.Count();
        }
 
        public async Task<int> CalculateNewPatients(string? filter)
        {
            var patients = await _userCommonRepository.GetAllPatientsAsync(CancellationToken.None);
            if (patients == null || !patients.Any())
                throw new Exception(MessageConstants.MSG.MSG16);

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                //case "today":
                //    fromDate = now.Date;
                //    break;

                case "week":
                    fromDate = now.Date.AddDays(-7);
                    break;

                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1);
                    break;

                case "year":
                    fromDate = new DateTime(now.Year, 1, 1);
                    break;

                case "default10days": // nếu vẫn muốn giữ logic mặc định là 10 ngày gần nhất
                    fromDate = now.Date.AddDays(-10);
                    break;

                default:
                    fromDate = now.Date.AddDays(-7);
                    break;
            }
            var newPatients = patients.Where(p => p.CreatedAt >= fromDate).ToList();
            return newPatients.Count;
        }
    }
}
