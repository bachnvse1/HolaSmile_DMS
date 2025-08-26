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
            _apiKey = configuration["Gemini:ApiKey"] ?? "";
            Console.OutputEncoding = Encoding.UTF8;
        }

        public async Task<string> Handle(AskChatbotCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            // So khớp gần đúng với FAQ
            var faqs = await _chatbotRepo.GetAllAsync();
            foreach (var faq in faqs)
            {
                if (IsSimilar(request.UserQuestion, faq.Question) && !faq.Answer.IsNullOrEmpty())
                    return faq.Answer!;
            }

            var question = ReplaceVietnameseDatePhrases(request.UserQuestion);

            // Lấy dữ liệu hệ thống theo role
            var guestData = await _chatbotRepo.GetClinicDataAsync(cancellationToken);
            var commonData = await _chatbotRepo.GetUserCommonDataAsync(cancellationToken);
            object? resultData = currentUserRole?.ToLower() switch
            {
                "receptionist" => new { ReceptionistData = await _chatbotRepo.GetReceptionistData(currentUserId, cancellationToken), CommonData = commonData },
                "assistant"    => new { AssistantData    = await _chatbotRepo.GetAssistanttData(currentUserId, cancellationToken),   CommonData = commonData },
                "patient"      => new { PatientData      = await _chatbotRepo.GetPatientData(currentUserId, cancellationToken),      CommonData = commonData },
                "dentist"      => new { DentistData      = await _chatbotRepo.GetDentistData(currentUserId, cancellationToken),      CommonData = commonData },
                "owner"        => new { OwnerData        = await _chatbotRepo.GetOwnerData(cancellationToken),                       CommonData = commonData },
                _              => new { GuestData        = guestData }
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

3. Giới hạn:
   - Nếu câu hỏi **nằm ngoài hệ thống** (không có dữ liệu để trả lời), hãy từ chối lịch sự:
     ""Xin lỗi, em không có thông tin về vấn đề bạn hỏi. Vui lòng liên hệ bộ phận liên quan để được hỗ trợ.""
   - Nếu người dùng hỏi về **kiến thức y khoa, chẩn đoán, điều trị bệnh** → bạn không được đưa ra quyết định thay thế.

4. Nguyên tắc giao tiếp:
   - Lịch sự, chuyên nghiệp; không bịa đặt thông tin ngoài dữ liệu; format rõ ràng, dễ đọc.

5. Lưu ý
   - Với câu hỏi về đăng ký lịch hẹn, ưu tiên đề xuất lịch rảnh/khá bận của bác sĩ.
   - Dịch dữ liệu sang tiếng Việt nếu cần; không dịch tên riêng.
   - Nếu người dùng nhập **ngày mai, ngày kia, tuần sau…** thì quy về dd/MM/yyyy.
   - Tên bác sĩ và tên riêng in **đậm**.

6. Lưu ý về dữ liệu
   - dentistSchedules có trạng thái: free → rảnh, busy → khá bận, full → không thể đặt. Ưu tiên hiển thị rảnh rồi đến khá bận.

Hãy luôn nhớ: Bạn chỉ là trợ lý trả lời dựa trên dữ liệu trong hệ thống HolaSmile.
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

            try
            {
                Console.Error.WriteLine($"[Gemini] HTTP {(int)response.StatusCode} {response.StatusCode}");
                var bodyToLog = result?.Length > 5000 ? result[..5000] + "...(truncated)" : result;
                Console.Error.WriteLine($"[Gemini] Body: {bodyToLog}");
            }
            catch { /* ignore */ }

            if (!response.IsSuccessStatusCode)
            {
                try
                {
                    using var errDoc = JsonDocument.Parse(result);
                    if (errDoc.RootElement.TryGetProperty("error", out var error))
                    {
                        var msg = error.TryGetProperty("message", out var msgElem) ? msgElem.GetString() : error.ToString();
                        return $"Lỗi gọi Gemini API (HTTP {(int)response.StatusCode}): {msg}";
                    }
                }
                catch { /* ignore */ }

                return $"Lỗi gọi Gemini API (HTTP {(int)response.StatusCode}). Kiểm tra logs để biết chi tiết.";
            }

            using var doc = JsonDocument.Parse(result);
            if (doc.RootElement.TryGetProperty("candidates", out var cands) &&
                cands.GetArrayLength() > 0 &&
                cands[0].TryGetProperty("content", out var contentJson) &&
                contentJson.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0 &&
                parts[0].TryGetProperty("text", out var textProp))
            {
                return textProp.GetString() ?? "";
            }
            else if (doc.RootElement.TryGetProperty("error", out var error2))
            {
                var msg = error2.TryGetProperty("message", out var msgElem2) ? msgElem2.GetString() : error2.ToString();
                return $"Hệ thống chatbot đang quá tải hoặc Gemini trả lỗi: {msg}";
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

            if (!Regex.IsMatch(output, "(hôm nay|hom nay|ngày mai|ngay mai|ngày kia|ngay kia|tuần sau|tuan sau)", RegexOptions.IgnoreCase))
                return input;

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
