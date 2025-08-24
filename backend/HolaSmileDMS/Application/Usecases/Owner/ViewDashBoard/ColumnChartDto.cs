namespace Application.Usecases.Owner.ViewDashBoard
{
    public class ColumnChartItemDto
    {
        public string Label { get; set; } // ví dụ: "25/7" hoặc "T1"
        public int TotalReceipt { get; set; }
        public int TotalPayment { get; set; }
    }

    public class ColumnChartDto
    {
        public List<ColumnChartItemDto> Data { get; set; } = new List<ColumnChartItemDto>();
    }
}
