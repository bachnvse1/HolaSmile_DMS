using System.Text;
using System.Text.Json;
using Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace Application.Usecases.Guests.AskChatBot
{
    public class AskChatbotHandler : IRequestHandler<AskChatbotCommand, string>
    {
        private readonly IChatBotKnowledgeRepository _chatbotrepo;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _apiKey;

        public AskChatbotHandler(
            IChatBotKnowledgeRepository chatBotRepo,
            IProcedureRepository procedureRepository,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _chatbotrepo = chatBotRepo;
            _procedureRepository = procedureRepository;
            _httpClientFactory = httpClientFactory;
            _apiKey = configuration["Gemini:ApiKey"];
            Console.OutputEncoding = Encoding.UTF8;
        }

        public async Task<string> Handle(AskChatbotCommand request, CancellationToken cancellationToken)
        {
            // --- B1: Kiểm tra nếu user hỏi về thủ thuật ---
            string normalized = request.UserQuestion.ToLower();
            if (normalized.Contains("thủ thuật nào") ||
                normalized.Contains("các thủ thuật") ||
                normalized.Contains("những thủ thuật") ||
                normalized.Contains("liệt kê thủ thuật"))
            {
                var procedures = await _procedureRepository.GetAll();
                if (procedures == null || procedures.Count == 0)
                    return "Hiện hệ thống chưa có thủ thuật nào.";

                var listThuThuat = procedures
                    .Select((x, i) => $"{i + 1}. {x.ProcedureName}")
                    .ToList();

                string reply = "Các thủ thuật hiện có tại phòng khám:\n"
                    + string.Join("\n", listThuThuat)
                    + "\n\nBạn muốn tìm hiểu chi tiết về thủ thuật nào? Hãy nhập tên/thủ thuật để được giải thích thêm.";

                return reply;
            }

            // --- B2: Kiểm tra trong database FAQ ---
            var faqs = await _chatbotrepo.GetAllAsync();
            foreach (var faq in faqs)
            {
                if (IsSimilar(request.UserQuestion, faq.Question))
                    return faq.Answer;
            }

            // --- B3: Nếu không có trong DB, gọi Gemini API ---
            var context = "Bạn là chatbot tư vấn hệ thống phòng khám răng hàm mặt. Chỉ trả lời về sản phẩm/dịch vụ của phòng khám răng hàm mặt.";
            var body = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = context + "\n" + request.UserQuestion } } }
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
            return dbWords.Length > 0 && ((double)match / dbWords.Length >= 0.5);
        }
    }
}
