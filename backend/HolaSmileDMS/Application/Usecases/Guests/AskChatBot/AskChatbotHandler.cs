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
                          Bạn là lễ tân của một phòng khám nha khoa tư nhân tên HolaSmile Dental.
                         Nhiệm vụ của bạn:
                         - Trả lời các câu hỏi của khách hàng về phòng khám, dịch vụ, lịch làm việc, bác sĩ, khuyến mãi.
                         - Luôn trả lời đầy đủ chi tiết (>= 100 và <=500 ký tự), thân thiện, chuyên nghiệp, xưng 'em' và gọi khách 'anh/chị'.
                         - Chỉ sử dụng thông tin từ dữ liệu sau để trả lời:
                          {clinicDataJson}
                          Nếu câu hỏi không liên quan, hãy lịch sự từ chối.
                         có thể thêm vào cuối câu: 'Để hiểu rõ hơn anh/chị có thể liên hệ lễ tân qua số 0111111111.' nếu cảm thấy cần thiết";

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
