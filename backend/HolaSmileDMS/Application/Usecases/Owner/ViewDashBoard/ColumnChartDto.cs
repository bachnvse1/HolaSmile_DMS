namespace Application.Usecases.Owner.ViewDashBoard
{
    public class ColumnChartItemDto
    {
        public string Label { get; set; } // ví dụ: "25/7" hoặc "T1"
        public decimal RevenueInMillions { get; set; }
        public int TotalAppointments { get; set; }
    }

    public class ColumnChartDto
    {
        public List<ColumnChartItemDto> Data { get; set; } = new List<ColumnChartItemDto>();
    }
}
