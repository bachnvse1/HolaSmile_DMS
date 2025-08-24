using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class ColumnChartHandler : IRequestHandler<ColumnChartCommand, ColumnChartDto>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ColumnChartHandler(
            ITransactionRepository transactionRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ColumnChartDto> Handle(ColumnChartCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var allTransactions = await _transactionRepository.GetAllFinancialTransactionsAsync();

            // Phân loại thu/chi
            var totalReceipt = allTransactions.Where(t => t.TransactionType).ToList();
            var totalPayment = allTransactions.Where(t => !t.TransactionType).ToList();

            var now = DateTime.Now;
            var filter = string.IsNullOrEmpty(request.Filter) ? "week" : request.Filter.ToLower();

            // Lọc coarse theo filter (để giảm data trước khi group)
            switch (filter)
            {
                case "week":
                    {
                        var start = now.Date.AddDays(-6);
                        totalReceipt = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start).ToList();
                        totalPayment = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start).ToList();
                        break;
                    }
                case "month":
                    {
                        var start = new DateTime(now.Year, now.Month, 1);
                        var end = now.Date.AddDays(1); // chỉ đến hôm nay (nửa mở)
                        totalReceipt = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start &&
                                                               t.TransactionDate.Value < end).ToList();
                        totalPayment = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start &&
                                                               t.TransactionDate.Value < end).ToList();
                        break;
                    }
                case "year":
                    {
                        var start = new DateTime(now.Year, 1, 1);
                        var end = new DateTime(now.Year, now.Month, 1).AddMonths(1); // hết tháng hiện tại
                        totalReceipt = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start &&
                                                               t.TransactionDate.Value < end).ToList();
                        totalPayment = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start &&
                                                               t.TransactionDate.Value < end).ToList();
                        break;
                    }
                default:
                    {
                        var start = now.Date.AddDays(-6);
                        totalReceipt = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start).ToList();
                        totalPayment = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                               t.TransactionDate.Value >= start).ToList();
                        filter = "week";
                        break;
                    }
            }

            var result = new ColumnChartDto { Data = new List<ColumnChartItemDto>() };

            if (filter == "year")
            {
                // Chỉ đến tháng hiện tại
                for (int m = 1; m <= now.Month; m++)
                {
                    var start = new DateTime(now.Year, m, 1);
                    var end = start.AddMonths(1);

                    var totalR = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= start &&
                                                         t.TransactionDate.Value < end)
                                             .Sum(t => (int)t.Amount);
                    var totalP = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= start &&
                                                         t.TransactionDate.Value < end)
                                             .Sum(t => (int)t.Amount);

                    result.Data.Add(new ColumnChartItemDto
                    {
                        Label = $"T{m}",
                        TotalReceipt = totalR,
                        TotalPayment = totalP
                    });
                }
            }
            else if (filter == "month")
            {
                // ====== Gộp 6 ngày/nhóm, chỉ đến hôm nay ======
                var monthStart = new DateTime(now.Year, now.Month, 1);
                var end = now.Date.AddDays(1); // nửa mở
                var bucketStart = monthStart;

                while (bucketStart < end)
                {
                    var bucketEnd = bucketStart.AddDays(6); // [start, start+6)
                    if (bucketEnd > end) bucketEnd = end;

                    var totalR = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= bucketStart &&
                                                         t.TransactionDate.Value < bucketEnd)
                                             .Sum(t => (int)t.Amount);
                    var totalP = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= bucketStart &&
                                                         t.TransactionDate.Value < bucketEnd)
                                             .Sum(t => (int)t.Amount);

                    var fromDay = bucketStart.Day;
                    var toDay = bucketEnd.AddDays(-1).Day; // vì nửa mở

                    result.Data.Add(new ColumnChartItemDto
                    {
                        Label = $"{fromDay:00}–{toDay:00}", // ví dụ "01–06", "07–12", ...
                        TotalReceipt = totalR,
                        TotalPayment = totalP
                    });

                    bucketStart = bucketStart.AddDays(6);
                }
            }
            else
            {
                // ====== week: gom theo từng ngày trong 7 ngày gần nhất ======
                var startDate = now.Date.AddDays(-6);
                var days = Enumerable.Range(0, (now.Date - startDate.Date).Days + 1)
                                     .Select(offset => startDate.Date.AddDays(offset));

                foreach (var day in days)
                {
                    var dayStart = day.Date;
                    var dayEnd = dayStart.AddDays(1);

                    var totalR = totalReceipt.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= dayStart &&
                                                         t.TransactionDate.Value < dayEnd)
                                             .Sum(t => (int)t.Amount);
                    var totalP = totalPayment.Where(t => t.TransactionDate.HasValue &&
                                                         t.TransactionDate.Value >= dayStart &&
                                                         t.TransactionDate.Value < dayEnd)
                                             .Sum(t => (int)t.Amount);

                    result.Data.Add(new ColumnChartItemDto
                    {
                        Label = day.ToString("dd/MM"),
                        TotalReceipt = totalR,
                        TotalPayment = totalP
                    });
                }
            }

            return result;
        }
    }
}
