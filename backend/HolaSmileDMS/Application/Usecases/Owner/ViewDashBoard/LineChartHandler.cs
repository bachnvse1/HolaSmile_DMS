using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class LineChartHandler : IRequestHandler<LineChartCommand, LineChartDto>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LineChartHandler(
            IAppointmentRepository appointmentRepository,
            IInvoiceRepository invoiceRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _appointmentRepository = appointmentRepository;
            _invoiceRepository = invoiceRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<LineChartDto> Handle(LineChartCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra quyền Owner
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            //if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
            //    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var invoices = await _invoiceRepository.GetTotalInvoice() ?? new List<Invoice>();
            
            var appointmentDtos = await _appointmentRepository.GetAllAppointmentAsync() ?? new List<AppointmentDTO>();
            var appointments = appointmentDtos.Select(dto => new Appointment
            {
                AppointmentId = dto.AppointmentId,
                AppointmentDate = dto.AppointmentDate,
            }).ToList();

            // Xử lý group theo filter
            var now = DateTime.Now;
            var filter = string.IsNullOrEmpty(request.Filter) ? "week" : request.Filter.ToLower();
            var result = new LineChartDto();
            switch (filter)
            {
                case "week":
                    {
                        var start = now.Date.AddDays(-6);
                        var end = now.Date.AddDays(1); // đến hôm nay
                        result.Data = GroupByDays(invoices, appointments, start, end);
                        break;
                    }
                case "month":
                    {
                        result.Data = GroupBySixDayBucketsInCurrentMonth(invoices, appointments, DateTime.Now);
                        break;
                    }
                case "year":
                    {
                        result.Data = GroupByMonths(invoices, appointments, now.Year, now.Month); // đã giới hạn đến tháng hiện tại
                        break;
                    }
                default:
                    {
                        var start = now.Date.AddDays(-6);
                        var end = now.Date.AddDays(1);
                        result.Data = GroupByDays(invoices, appointments, start, end);
                        break;
                    }
            }
            return result;
        }

        private static List<LineChartItemDto> GroupByDays(
             IEnumerable<Invoice> invoices,
             IEnumerable<Appointment> appointments,
             DateTime startDate,
             DateTime endDate)
        {
            var data = new List<LineChartItemDto>();
            var totalDays = (endDate.Date - startDate.Date).Days;

            for (int i = 0; i < totalDays; i++)
            {
                var dayStart = startDate.Date.AddDays(i);
                var dayEnd = dayStart.AddDays(1);

                var dayInvoices = invoices.Where(x => x.PaymentDate >= dayStart && x.PaymentDate < dayEnd);
                var dayAppts = appointments.Where(x => x.AppointmentDate.Date >= dayStart && x.AppointmentDate.Date < dayEnd);


                data.Add(new LineChartItemDto
                {
                    Label = dayStart.ToString("dd/MM"),
                    RevenueInMillions = (int)dayInvoices.Sum(x => x.PaidAmount ?? 0),
                    TotalAppointments = dayAppts.Count()
                });
            }

            return data;
        }

        // Gom theo 12 tháng của 1 năm
        private static List<LineChartItemDto> GroupByMonths(
            IEnumerable<Invoice> invoices,
            IEnumerable<Appointment> appointments,
            int year, int month)
        {
            var data = new List<LineChartItemDto>();

            for (int m = 1; m <= 12; m++)
            {
                var monthStart = new DateTime(year, m, 1);
                var monthEnd = monthStart.AddMonths(1);

                var monthInvoices = invoices.Where(x => x.PaymentDate >= monthStart && x.PaymentDate < monthEnd);
                var monthAppts = appointments.Where(x => x.AppointmentDate >= monthStart && x.AppointmentDate < monthEnd);

                data.Add(new LineChartItemDto
                {
                    Label = $"T{m}",
                    RevenueInMillions = (int)monthInvoices.Sum(x => x.PaidAmount ?? 0),
                    TotalAppointments = monthAppts.Count()
                });
            }

            return data;
        }

        private static List<LineChartItemDto> GroupBySixDayBucketsInCurrentMonth(
        IEnumerable<Invoice> invoices,
        IEnumerable<Appointment> appointments,
        DateTime now)
        {
            var data = new List<LineChartItemDto>();

            var monthStart = new DateTime(now.Year, now.Month, 1);   // đầu tháng hiện tại
            var end = now.Date.AddDays(1);                    // chỉ đến hôm nay (nửa mở)

            // Duyệt các cụm [start, start+6) cho đến khi vượt 'end'
            var bucketStart = monthStart;
            while (bucketStart < end)
            {
                var bucketEnd = bucketStart.AddDays(6); // nửa mở => chứa đúng 6 ngày: d, d+1, ..., d+5
                if (bucketEnd > end) bucketEnd = end;   // cắt ở hôm nay

                // Tính tổng thu/chi và số lịch hẹn trong khoảng [bucketStart, bucketEnd)
                var invInBucket = invoices.Where(x => x.PaymentDate >= bucketStart && x.PaymentDate < bucketEnd);
                var apptInBucket = appointments.Where(x => x.AppointmentDate >= bucketStart && x.AppointmentDate < bucketEnd);

                var fromDay = bucketStart.Day;
                var toDay = bucketEnd.AddDays(-1).Day; // vì bucketEnd là nửa mở

                data.Add(new LineChartItemDto
                {
                    Label = $"{fromDay:00}–{toDay:00}",             // ví dụ "01–06", "07–12", ...
                    RevenueInMillions = (int)invInBucket.Sum(x => x.PaidAmount ?? 0),
                    TotalAppointments = apptInBucket.Count()
                });

                bucketStart = bucketStart.AddDays(6); // sang cụm kế tiếp
            }

            return data;
        }
    }
}
