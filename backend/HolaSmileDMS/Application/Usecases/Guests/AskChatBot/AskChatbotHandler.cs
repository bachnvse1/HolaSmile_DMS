using System.Text;
using System.Text.Json;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using static Application.Usecases.Guests.AskChatBot.ClinicDataDto;

namespace Application.Usecases.Guests.AskChatBot
{
    public class AskChatbotHandler : IRequestHandler<AskChatbotCommand, string>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _apiKey;

        public AskChatbotHandler(
            IChatBotKnowledgeRepository chatBotRepo,
            IProcedureRepository procedureRepository,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _chatbotRepo = chatBotRepo;
            _procedureRepository = procedureRepository;
            _httpClientFactory = httpClientFactory;
            _apiKey = configuration["Gemini:ApiKey"];
            Console.OutputEncoding = Encoding.UTF8;
        }

        public async Task<string> Handle(AskChatbotCommand request, CancellationToken cancellationToken)
        {
            var faqs = await _chatbotRepo.GetAllAsync();
            foreach (var faq in faqs)
            {
                if (IsSimilar(request.UserQuestion, faq.Question) && !faq.Answer.IsNullOrEmpty())
                    return faq.Answer;
            }
            // lấy dữ liệu phòng khám từ repo
            var clinicData = await _chatbotRepo.GetClinicDataAsync(cancellationToken);

            var clinicDataJson = JsonSerializer.Serialize(clinicData, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var context = $@"
Bạn là lễ tân của phòng khám nha khoa tư nhân HolaSmile Dental.
Bạn có quyền truy cập dữ liệu hệ thống qua {clinicDataJson} và sử dụng để trả lời khách:

**Dữ liệu bạn có:**
- Thông tin phòng khám (clinic_Info: tên, địa chỉ, giờ mở cửa, số điện thoại, email, zalo).
- Danh sách thủ thuật/dịch vụ (procedures).
- Các chương trình khuyến mãi (promotions).
- Danh sách bác sĩ và lịch làm việc (dentistSchedules), mỗi ca có trạng thái:
  + 'rảnh' = 0-2 lịch hẹn (ưu tiên gợi ý).
  + 'khá bận' = 3-4 lịch hẹn (vẫn có thể đặt, báo trước có thể chờ lâu hơn).
  + 'bận' = full, không thể đặt.

**Nhiệm vụ:**
1. Trả lời tự nhiên, thân thiện, ngắn gọn nhưng đủ thông tin như lễ tân thật.
2. Nếu khách hỏi dịch vụ → trích từ procedures, giới thiệu kèm gợi ý dịch vụ liên quan.
3. Nếu khách hỏi khuyến mãi → lấy từ promotions.
4. Nếu khách hỏi giờ mở cửa hoặc địa chỉ → lấy từ clinic_Info.
5. Nếu khách hỏi đặt lịch khám:
   - Nếu khách chưa nói rõ ngày hoặc ca → hỏi thêm.
   - Tìm lịch bác sĩ có trạng thái 'rảnh' hoặc 'khá bận'.
   - Gợi ý ít nhất 2 lựa chọn gồm: **tên bác sĩ, ngày, ca, trạng thái**.
   - Nếu ca khách chọn là 'bận' → đề xuất ca khác hoặc bác sĩ khác.
   - Nếu khách để 'bất kỳ ngày/ca' → chọn ca 'rảnh' sớm nhất trong tuần.
6. Nếu khách mô tả vấn đề hoặc nhu cầu thủ thuật → lọc và gợi ý bác sĩ, dịch vụ phù hợp.
7. Nếu không rõ câu hỏi → hỏi lại khách.

**Nguyên tắc:**
- Luôn xưng hô 'Dạ', 'Em', 'Quý khách'.
- Khi gợi ý lịch khám, luôn kèm tên bác sĩ, ngày, ca, trạng thái slot.
- Có thể kèm lời mời chào hoặc hướng dẫn liên hệ lễ tân: 'Để hỗ trợ nhanh hơn, quý khách có thể gọi số 0111111111 hoặc chatbox'.
- Ưu tiên trả lời cụ thể và gợi ý thực tế từ dữ liệu thật thay vì trả lời chung chung.
";

            var body = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = context + "\n\n" + request.UserQuestion } } }
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
                var newKnowledge = new ChatBotKnowledge
                {
                    Question = request.UserQuestion,
                    Answer = textProp.GetString() ?? string.Empty,
                    Category = "new"
                };
                var isCreated = await _chatbotRepo.CreateNewKnownledgeAsync(newKnowledge);
                if (!isCreated) throw new Exception("hệ thống có lỗi xảy ra");
                return textProp.GetString();
            }
            else if (doc.RootElement.TryGetProperty("error", out var error))
            {
                var msg = error.TryGetProperty("message", out var msgElem) ? msgElem.GetString() : error.ToString();
                return $"Gemini API ERROR: {msg}";
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
    }
}
