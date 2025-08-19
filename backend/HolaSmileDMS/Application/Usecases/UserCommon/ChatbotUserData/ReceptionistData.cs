namespace Application.Usecases.UserCommon.ChatbotUserData
{
    public class ReceptionistData
    {
        public string Scope { get; set; } = "Dữ liệu chung của toàn bộ hóa đơn, chương trình khuyến mãi, phiếu thu chi";
        public List<InvoiceData> InvoicesDatas { get; set; } = new List<InvoiceData>(); // lấy ra tất cả danh sách hóa đơn
        public List<PromotionData> promotionDatas { get; set; } = new List<PromotionData>(); // lấy ra tất cả danh sách promotions
        public List<FinancialTransactionData> financialTransactionDatas { get; set; } = new List<FinancialTransactionData>(); // lấy ra tất cả danh sách giao dịch tài chính
    }
    public sealed class PromotionData
    {
        public int PromotionId { get; set; }
        public string PromotionName { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
