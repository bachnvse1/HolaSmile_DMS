using Application.Usecases.Dentist.ViewDentistSchedule;

namespace Application.Usecases.Guests.AskChatBot
{
    public sealed class UserCommonDataDto
    {
        public string Scope { get; set; } = "Dữ liệu chung của toàn bộ lịch hẹn, vật tư, thủ thuật lịch làm việc của bác sĩ";
        public List<AppointmentData> Appointments { get; set; } = new List<AppointmentData>(); //lấy ra cả tên bệnh nhân, đơn thuốc, lời dặn, bác sĩ, lịch hẹn, trạng thái hẹn, ngày giờ hẹn
        public List<Supplies> Supplies { get; set; } = new List<Supplies>(); // lấy ra tất cả danh sách supplies
        public List<ProcedureData> Procedures { get; set; } = new List<ProcedureData>(); // lấy ra tất cả danh sách procedures với các thông tin như tên, mô tả, giá tiền, chi phí khấu hao, thời gian thực hiện, hình ảnh
        public List<DentistScheduleDTO> DentistSchedules { get; set; } = new List<DentistScheduleDTO>();

    }

    public sealed class AppointmentData
    {
        public int AppointmentId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DentistName { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public string appointmentTime { get; set; } = string.Empty;
        public string AppointmentType { get; set; } = string.Empty; // Loại hẹn (khám, điều trị, tư vấn, v.v.)
        public bool IsNewPatient { get; set; } = false; // Kiểm tra xem có phải là bệnh nhân mới hay không
        public string Status { get; set; } = string.Empty; // Trạng thái hẹn (đã xác nhận, đang chờ, đã hủy, v.v.)
        public bool isExistPrescription { get; set; } = false; // Kiểm tra xem có đơn thuốc hay không
        public string PrescriptionDetails { get; set; } = string.Empty; // Chi tiết đơn thuốc nếu có
        public bool isExistInstructions { get; set; } = false; // Kiểm tra xem có lời dặn hay không
        public string InstructionsDetails { get; set; } = string.Empty; // Chi tiết lời dặn nếu có
    }

    public sealed class ProcedureData
    {
        public int ProcedureId { get; set; }
        public string? ProcedureName { get; set; }
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public decimal? OriginalPrice { get; set; }
        public decimal? ConsumableCost { get; set; }
    }




}
