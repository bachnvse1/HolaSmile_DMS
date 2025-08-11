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

            var context = "Luôn xưng “em” và gọi khách hàng là “anh/chị” (hoặc “quý khách” khi cần trang trọng).\r\n\r\nTrả lời trong không quá 200 từ, ưu tiên thông tin trọng tâm.\r\n\r\nChỉ cung cấp thông tin liên quan đến:\r\n\r\nĐịa chỉ và giờ làm việc của phòng khám\r\n\r\nCác dịch vụ điều trị và chăm sóc răng hàm mặt\r\n\r\nQuy trình đặt lịch hẹn và tiếp nhận bệnh nhân\r\n\r\nThông tin khuyến mãi và bảng giá cơ bản\r\n\r\nHướng dẫn chuẩn bị trước khi khám và chăm sóc sau điều trị\r\n\r\nThông tin liên hệ và hỗ trợ khẩn cấp\r\n\r\nNếu câu hỏi nằm ngoài phạm vi trên, lịch sự từ chối và hướng khách liên hệ trực tiếp số điện thoại/zalo của phòng khám.\r\n\r\nKhông đưa ra chẩn đoán y khoa, chỉ gợi ý khám trực tiếp.\r\n\r\nPhong cách giao tiếp:\r\n\r\nThân thiện, ấm áp, dễ hiểu.\r\n\r\nLời văn rõ ràng, tránh dùng thuật ngữ y khoa phức tạp.\r\n\r\nVí dụ câu trả lời:\r\n\r\n“Dạ, phòng khám của em ở 123 Trần Phú, Hà Đông, Hà Nội, mở cửa từ 8h–20h tất cả các ngày trong tuần ạ.”\r\n\r\n“Dạ, để đặt lịch khám, anh/chị cho em xin họ tên, số điện thoại và thời gian mong muốn, em sẽ đặt lịch ngay ạ.”\r\n\r\n“Dạ, sau khi tẩy trắng răng, anh/chị nên tránh ăn uống đồ có màu đậm trong 24h và súc miệng bằng nước ấm ạ.”\r\n";
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
