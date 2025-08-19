using Application.Usecases.Dentist.ViewDentistSchedule;

namespace Application.Usecases.UserCommon.ChatbotUserData
{
    public sealed class OwnerData
    {
        public string Scope { get; set; } = "Dữ liệu chung của toàn bộ lịch làm việc của bác sĩ, thông tin nhân viên, danh sách thu chi";
        public List<DentistScheduleDTO> DentistSchedules { get; set; } = new List<DentistScheduleDTO>();
        public List<EmployeeData> EmployeeDatas { get; set; } = new List<EmployeeData>();
        public List<FinancialTransactionData> FinancialTransactions { get; set; } = new List<FinancialTransactionData>();
    }

    public sealed class EmployeeData
    {
        public int UserId { get; set; }
        public string Fullname { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "receptionist", "dentist", "admin"
        public string Status { get; set; } = string.Empty; // "active", "inactive", "on_leave"
    }

    public sealed class FinancialTransactionData
    {
        public int TransactionID { get; set; }
        public string? TransactionDate { get; set; } = default;
        public string Description { get; set; } = string.Empty;
        public string TransactionType { get; set; } // True: Thu, False: Chi
        public string Category { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } // True: tiền mặt, False: chuyển khoản
        public decimal Amount { get; set; }
        public string? EvidenceImage { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
