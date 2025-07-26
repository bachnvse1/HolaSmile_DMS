namespace Application.Usecases.Owner.ViewDashBoard
{
    public class LineChartItemDto
    {
        public string Label { get; set; } 
        public int TotalAppointments { get; set; }
    }

    public class LineChartDto
    {
        public List<LineChartItemDto> Data { get; set; } = new List<LineChartItemDto>();
    }
}
