using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using MediatR;

namespace Application.Usecases.Owner.ViewDashboard
{
    public class ViewDashboardHandler : IRequestHandler<ViewDashboardCommand, ViewDashboardDTO>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUserCommonRepository _userCommonRepository;

        public ViewDashboardHandler(IInvoiceRepository invoiceRepository, IAppointmentRepository appointmentRepository, IUserCommonRepository userCommonRepository)
        {
            _invoiceRepository = invoiceRepository;
            _appointmentRepository = appointmentRepository;
            _userCommonRepository = userCommonRepository;
        }
        public async Task<ViewDashboardDTO> Handle(ViewDashboardCommand request, CancellationToken cancellationToken)
        {
            string filter = request.Filter?.ToLower() ?? "today";

            var totalRevenue = await CalculateTotalRevenue(filter);
            var totalAppointments = await CalculateTotalAppointments(filter);
            var totalPatients = await CalculateTotalPatients(filter);
            var totalEmployees = await CalculateTotalEmployees(filter);
            var newPatients = await CalculateNewPatients(filter);

            var dashboardData = new ViewDashboardDTO
            {
                TotalRevenue = totalRevenue,
                TotalAppointments = totalAppointments,
                TotalPatient = totalPatients,
                TotalEmployee = totalEmployees,
                NewPatient = newPatients
            };

            return dashboardData;
        }


        public async Task<decimal> CalculateTotalRevenue(string filter)
        {
            var invoices = await _invoiceRepository.GetTotalInvoice();
            if (invoices == null || !invoices.Any())
                return 0;

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                case "today":
                    fromDate = now.Date;
                    invoices = invoices.Where(i => i.CreatedAt.Date == fromDate).ToList();
                    break;

                case "week":
                    fromDate = now.Date.AddDays(-7);
                    invoices = invoices.Where(i => i.CreatedAt.Date >= fromDate).ToList();
                    break;

                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1); // đầu tháng
                    invoices = invoices.Where(i => i.CreatedAt >= fromDate).ToList();
                    break;

                case "year":
                    fromDate = new DateTime(now.Year, 1, 1); // đầu năm
                    invoices = invoices.Where(i => i.CreatedAt >= fromDate).ToList();
                    break;

                default:
                    // không lọc gì cả
                    break;
            }

            var totalRevenue = invoices.Sum(i => i.PaidAmount ?? 0);
            return totalRevenue;
        }

        public async Task<int> CalculateTotalAppointments(string filter)
        {
            var appointments = await _appointmentRepository.GetAllAppointmentAsync();
            if (appointments == null || !appointments.Any())
                return 0;

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                case "today":
                    fromDate = now.Date;
                    appointments = appointments.Where(a => a.CreatedAt.Date == fromDate).ToList();
                    break;

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
                    break;
            }

            return appointments.Count();
        }

        public async Task<int> CalculateTotalPatients(string filter)
        {
            var patients = await _userCommonRepository.GetAllPatientsAsync(CancellationToken.None);
            if (patients == null || !patients.Any())
                return 0;

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                case "today":
                    fromDate = now.Date;
                    patients = patients.Where(p => p.CreatedAt.Date == fromDate).ToList();
                    break;

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
                    break;
            }

            return patients.Count();
        }

        public async Task<int> CalculateTotalEmployees(string filter)
        {
            var users = await _userCommonRepository.GetAllUserAsync();
            if (users == null || !users.Any())
                throw new Exception(MessageConstants.MSG.MSG16);

            var now = DateTime.Now;
            DateTime fromDate;

            // Apply time filter
            switch (filter?.ToLower())
            {
                case "today":
                    fromDate = now.Date;
                    users = users.Where(u => u.CreatedAt.Date == fromDate).ToList();
                    break;

                case "week":
                    fromDate = now.Date.AddDays(-7);
                    users = users.Where(u => u.CreatedAt.Date >= fromDate).ToList();
                    break;

                case "month":
                    fromDate = new DateTime(now.Year, now.Month, 1);
                    users = users.Where(u => u.CreatedAt >= fromDate).ToList();
                    break;

                case "year":
                    fromDate = new DateTime(now.Year, 1, 1);
                    users = users.Where(u => u.CreatedAt >= fromDate).ToList();
                    break;

                default:
                    break; // No filter
            }

            // Lọc patients và owners theo danh sách users đã lọc
            var patients = await _userCommonRepository.GetAllPatientsAsync(CancellationToken.None);
            var owners = await _userCommonRepository.GetAllOwnerAsync();

            var patientIds = patients.Select(p => p.UserID).ToHashSet();
            var ownerIds = owners.Select(o => o.UserId).ToHashSet();

            var employees = users.Count(u =>
                !patientIds.Contains(u.UserId) &&
                !ownerIds.Contains(u.UserId)
            );

            return employees < 0 ? 0 : employees;
        }
        public async Task<int> CalculateNewPatients(string filter)
        {
            var patients = await _userCommonRepository.GetAllPatientsAsync(CancellationToken.None);
            if (patients == null || !patients.Any())
                throw new Exception(MessageConstants.MSG.MSG16);

            var now = DateTime.Now;
            DateTime fromDate;

            switch (filter?.ToLower())
            {
                case "today":
                    fromDate = now.Date;
                    break;

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
                    // Không lọc gì cả
                    return patients.Count();
            }
            var newPatients = patients.Where(p => p.CreatedAt >= fromDate).ToList();
            return newPatients.Count;
        }
    }
}

