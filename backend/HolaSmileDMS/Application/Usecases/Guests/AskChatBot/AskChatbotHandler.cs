using System.Text;
using System.Text.Json;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

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
            var faqs = await _chatbotrepo.GetAllAsync();
            foreach (var faq in faqs)
            {
                if (IsSimilar(request.UserQuestion, faq.Question) && !faq.Answer.IsNullOrEmpty())
                    return faq.Answer;
            }

            // --- B3: Nếu không có trong DB, gọi Gemini API ---
            var context = "Bạn là chatbot tư vấn hệ thống phòng khám răng hàm mặt.Với vai trò là 1 lễ tân hãy trả lời ngắn gọn 2 đến 3 câu liên quan đến sản phẩm/dịch vụ của phòng khám răng hàm mặt." +
                         "hãy đặt cho tôi câu \"Để hiểu rõ hơn bạn có thể liên hệ trực tiếp với lễ tân của bọn tôi qua chatbox hoặc số điện thoại 0111111111\" vào cuối câu";
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
                var newKnowledge = new ChatBotKnowledge
                {
                    Question = request.UserQuestion,
                    Answer = textProp.GetString() ?? string.Empty,
                    Category = "new"
                };
                var isCreated = await _chatbotrepo.CreateNewKnownledgeAsync(newKnowledge);
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
