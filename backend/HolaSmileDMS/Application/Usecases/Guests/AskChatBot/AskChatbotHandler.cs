using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Application.Usecases.Guests.AskChatBot
{
    public class AskChatbotHandler : IRequestHandler<AskChatbotCommand, string>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _apiKey;

        public AskChatbotHandler(
            IChatBotKnowledgeRepository chatBotRepo,
            IProcedureRepository procedureRepository,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor)
        {
            _chatbotRepo = chatBotRepo;
            _httpClientFactory = httpClientFactory;
            _httpContextAccessor = httpContextAccessor;
            _apiKey = configuration["Gemini:ApiKey"];
            Console.OutputEncoding = Encoding.UTF8;
        }

        public async Task<string> Handle(AskChatbotCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            // Kiểm tra câu hỏi của người dùng có trùng với câu hỏi đã có trong repo không
            var faqs = await _chatbotRepo.GetAllAsync();
            foreach (var faq in faqs)
            {
                if (IsSimilar(request.UserQuestion, faq.Question) && !faq.Answer.IsNullOrEmpty())
                    return faq.Answer;
            }

            var question = ReplaceVietnameseDatePhrases(request.UserQuestion);
            Console.WriteLine(question);

            // lấy dữ liệu phòng khám từ repo
            var guestData = await _chatbotRepo.GetClinicDataAsync(cancellationToken);
            var commonData = await _chatbotRepo.GetUserCommonDataAsync(cancellationToken);
            object? resultData = currentUserRole?.ToLower() switch
            {
                "receptionist" => new { ReceptionistData = await _chatbotRepo.GetReceptionistData(currentUserId, cancellationToken), CommonData = commonData },
                "assistant" => new { AssistantData = await _chatbotRepo.GetAssistanttData(currentUserId, cancellationToken), CommonData = commonData },
                "patient" => new { PatientData = await _chatbotRepo.GetPatientData(currentUserId, cancellationToken), CommonData = commonData },
                "dentist" => new { DentistData = await _chatbotRepo.GetDentistData(currentUserId, cancellationToken), CommonData = commonData },
                "owner" => new { OwnerData = await _chatbotRepo.GetOwnerData(cancellationToken), CommonData = commonData },
                _ => new { GuestData = guestData }
            };

            var clinicDataJson = JsonSerializer.Serialize(resultData, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var context = $@"
Bạn là chatbot nội bộ hỗ trợ cho hệ thống quản lý nha khoa HolaSmile Dental và sử dụng dữ liệu {clinicDataJson} để trả lời các câu hỏi.

1. Quyền truy cập dữ liệu:
   - Nếu người dùng **chưa đăng nhập**, bạn chỉ được phép dùng dữ liệu từ **GuestData** (bao gồm thông tin phòng khám, danh sách bác sĩ, danh sách dịch vụ, lịch làm việc có sẵn).
   - Nếu người dùng **đã đăng nhập**, bạn chỉ được phép dùng dữ liệu theo **role** của người đó:
     - Chủ phòng khám (Owner) → OwnerData
     - Nha sĩ (Dentist) → DentistData
     - Trợ lý (Assistant) → AssistantData
     - Lễ tân (Receptionist) → ReceptionistData
     - Bệnh nhân (Patient) → PatientData
     - Dữ liệu chung → UserCommonData

2. Cách trả lời:
   - Luôn ưu tiên trả lời dựa trên dữ liệu trong hệ thống.
   - Trình bày rõ ràng, chi tiết, dễ hiểu cho người đọc.
   - Nếu một trường dữ liệu có giá trị `null` hoặc rỗng thì bỏ qua, không nhắc đến trong câu trả lời.
   - Khi đưa danh sách (lịch hẹn, hóa đơn, lịch làm việc…) thì chỉ hiển thị thông tin dữ liệu có, cần thiết, tránh thừa.
   - 

3. Giới hạn:
   - Nếu câu hỏi **nằm ngoài hệ thống** (không có dữ liệu để trả lời), hãy từ chối lịch sự:  
     Ví dụ: *""""Xin lỗi, em không có thông tin về vấn đề bạn hỏi. Vui lòng liên hệ bộ phận liên quan để được hỗ trợ.""""*
   - Nếu người dùng hỏi về **kiến thức y khoa, chẩn đoán, điều trị bệnh** → bạn không được đưa ra quyết định thay thế.  
     Ví dụ: *""""Em chỉ cung cấp thông tin trong hệ thống. Các quyết định chuyên môn điều trị thuộc về bác sĩ, bạn hãy tự cân nhắc và đưa ra quyết định.""""*

4. Nguyên tắc giao tiếp:
   - Luôn xưng hô lịch sự, dùng từ ngữ phù hợp như em, dạ với người dùng.
   - Giữ thái độ lịch sự, chuyên nghiệp.
   - Không bịa đặt thông tin ngoài dữ liệu.
   - Không trả lời các câu hỏi ngoài phạm vi đã cho.
   - Format câu trả lời rõ ràng, dễ đọc.

5. Lưu ý
   - Với những câu hỏi về việc đăng ký lịch hẹn, hãy ưu tiên đề xuất lịch làm việc có sẵn của bác sĩ với trạng thái từ rảnh, bận.
   - Dịch dữ liệu từ tiếng Anh sang tiếng Việt nếu cần thiết, nhưng không cần dịch các tên riêng, tên thuốc, tên bệnh.
   - Không đưa nguồn lấy dữ liệu ra ngoài
   - nếu khách nhập vào **ngày mai, ngày kia ,... ** hãy quy ra ngày dạng dd-MM-yyyy 
   - Tên bác sĩ và các tên riêng thì in đậm lên
6. Lưu ý về dữ liệu
   - phần lịch làm việc bác sĩ(dentistSchedules) có các trạng thái lịch là free -> rảnh, busy -> khá bận, full -> không thể đặt. Ưu tiên demo lịch rảnh rồi đến khá bận. Phần này để trả lời các câu hỏi liên quan đến lịch bác sĩ
   
Hãy luôn nhớ: Bạn chỉ là trợ lý trả lời dựa trên dữ liệu trong hệ thống quản lý nha khoa HolaSmile.
";

            var body = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = context + "\n\n" + question } } }
                }
            };
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var endpoint = $"v1beta/models/gemini-1.5-flash-latest:generateContent?key={_apiKey}";

            var httpClient = _httpClientFactory.CreateClient("Gemini");
            var response = await httpClient.PostAsync(endpoint, content, cancellationToken);
            var result = await response.Content.ReadAsStringAsync(cancellationToken);

            // Xử lý kết quả trả về của Gemini
            using var doc = JsonDocument.Parse(result);
            if (doc.RootElement.TryGetProperty("candidates", out var cands) &&
                cands.GetArrayLength() > 0 &&
                cands[0].TryGetProperty("content", out var contentJson) &&
                contentJson.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0 &&
                parts[0].TryGetProperty("text", out var textProp))
            {
                return textProp.GetString();
            }
            else if (doc.RootElement.TryGetProperty("error", out var error))
            {
                var msg = error.TryGetProperty("message", out var msgElem) ? msgElem.GetString() : error.ToString();
                return $"Hệ thống chatbot của tôi đang bị quá tải, bạn có thể sử dụng chatbox để được tư vấn trực tiếp";
            }
            else
            {
                return "Gemini API trả về dữ liệu không hợp lệ!";
            }
        }

        // Cắt từ & so khớp gần đúng
        private bool IsSimilar(string input, string question)
        {
            var inputWords = input.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var dbWords = question.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            int match = inputWords.Count(w => dbWords.Contains(w));
            return dbWords.Length > 0 && ((double)match / dbWords.Length >= 0.7);
        }

        public static string ReplaceVietnameseDatePhrases(string input)
        {
            var today = DateTime.Now.Date;
            string todayStr = today.ToString("dd/MM/yyyy");
            string tomorrowStr = today.AddDays(1).ToString("dd/MM/yyyy");
            string dayAfterTomorrowStr = today.AddDays(2).ToString("dd/MM/yyyy");
            string nextWeekStr = today.AddDays(7).ToString("dd/MM/yyyy");

            string output = input;

            // Nếu không chứa từ khóa thì return nguyên văn
            if (!Regex.IsMatch(output, "(hôm nay|hom nay|ngày mai|ngay mai|ngày kia|ngay kia|tuần sau|tuan sau)", RegexOptions.IgnoreCase))
                return input;

            // Thay thế cụm từ tương đối bằng ngày tuyệt đối
            output = Regex.Replace(output, "ngày mai", tomorrowStr, RegexOptions.IgnoreCase);
            output = Regex.Replace(output, "ngay mai", tomorrowStr, RegexOptions.IgnoreCase);

            output = Regex.Replace(output, "ngày kia", dayAfterTomorrowStr, RegexOptions.IgnoreCase);
            output = Regex.Replace(output, "ngay kia", dayAfterTomorrowStr, RegexOptions.IgnoreCase);

            output = Regex.Replace(output, "hôm nay", todayStr, RegexOptions.IgnoreCase);
            output = Regex.Replace(output, "hom nay", todayStr, RegexOptions.IgnoreCase);

            output = Regex.Replace(output, "tuần sau", nextWeekStr, RegexOptions.IgnoreCase);
            output = Regex.Replace(output, "tuan sau", nextWeekStr, RegexOptions.IgnoreCase);

            return output;
        }
    }
}
