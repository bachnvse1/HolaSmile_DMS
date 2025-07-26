using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class ColumnChartHandler : IRequestHandler<ColumnChartCommand, ColumnChartDto>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ColumnChartHandler(
            IInvoiceRepository invoiceRepository,
            IAppointmentRepository appointmentRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _invoiceRepository = invoiceRepository;
            _appointmentRepository = appointmentRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ColumnChartDto> Handle(ColumnChartCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            string filter = request.Filter?.ToLower() ?? "today";

            // Lấy toàn bộ dữ liệu gốc
            var invoices = await _invoiceRepository.GetTotalInvoice() ?? new List<Invoice>();
            var appointmentDtos = await _appointmentRepository.GetAllAppointmentAsync()
                       ?? new List<AppointmentDTO>();

            var appointments = appointmentDtos.Select(dto => new Appointment
            {
                AppointmentId = dto.AppointmentId,
                CreatedAt = dto.CreatedAt,
            }).ToList();

            // Xử lý group theo filter
            var result = new ColumnChartDto();

            switch (filter)
            {
                case "today":
                case "week":
                    result.Data = GroupByDay(invoices, appointments, filter);
                    break;

                case "month":
                case "year":
                    result.Data = GroupByMonth(invoices, appointments, filter);
                    break;

                default:
                    throw new ArgumentException("Invalid filter");
            }

            return result;
        }

        private List<ColumnChartItemDto> GroupByDay(
            IEnumerable<Invoice> invoices,
            IEnumerable<Appointment> appointments,
            string filter)
        {
            var now = DateTime.Now;
            var startDate = filter == "today" ? now.Date : now.Date.AddDays(-7);

            // Lấy các ngày từ startDate -> now
            var days = Enumerable.Range(0, (now.Date - startDate).Days + 1)
                                 .Select(offset => startDate.AddDays(offset))
                                 .ToList();

            var data = new List<ColumnChartItemDto>();

            foreach (var day in days)
            {
                var dayInvoices = invoices.Where(i => i.CreatedAt.Date == day.Date);
                var dayAppointments = appointments.Where(a => a.CreatedAt.Date == day.Date);

                data.Add(new ColumnChartItemDto
                {
                    Label = day.ToString("dd/MM"),
                    RevenueInMillions = (dayInvoices.Sum(i => i.PaidAmount ?? 0)),
                    TotalAppointments = dayAppointments.Count()
                });
            }

            return data;
        }

        private List<ColumnChartItemDto> GroupByMonth(
            IEnumerable<Invoice> invoices,
            IEnumerable<Appointment> appointments,
            string filter)
        {
            var now = DateTime.Now;
            var startMonth = filter == "month" ? new DateTime(now.Year, 1, 1) : new DateTime(now.Year, 1, 1);

            // Group theo tháng (T1, T2, ...)
            var months = Enumerable.Range(1, 12)
                                   .Select(m => new DateTime(now.Year, m, 1))
                                   .Where(m => filter == "month" ? m.Month <= now.Month : true)
                                   .ToList();

            var data = new List<ColumnChartItemDto>();

            foreach (var month in months)
            {
                var monthInvoices = invoices.Where(i => i.CreatedAt.Month == month.Month && i.CreatedAt.Year == now.Year);
                var monthAppointments = appointments.Where(a => a.CreatedAt.Month == month.Month && a.CreatedAt.Year == now.Year);

                data.Add(new ColumnChartItemDto
                {
                    Label = $"T{month.Month}",
                    RevenueInMillions = (monthInvoices.Sum(i => i.PaidAmount ?? 0)),
                    TotalAppointments = monthAppointments.Count()
                });
            }

            return data;
        }
    }
}
