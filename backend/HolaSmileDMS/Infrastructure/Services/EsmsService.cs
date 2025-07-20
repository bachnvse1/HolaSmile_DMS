using System.Text;
using System.Text.Json;
using Application.Services;
using Infrastructure.Models;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services
{
    public class SmsService : IEsmsService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public SmsService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<bool> SendOTPAsync(string phoneNumber, string otp)
        {
            string content = $"{otp} la ma xac minh dang ky Baotrixemay cua ban";
            return await SendSmsAsync(phoneNumber, content);
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            var apiKey = _configuration["ESMS:ApiKey"];
            var secretKey = _configuration["ESMS:SecretKey"];
            var brandname = _configuration["ESMS:Brandname"];
            var smsType = _configuration["ESMS:SmsType"];
            var url = "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";
            var requestId = Guid.NewGuid().ToString(); // Unique request ID

            var parameters = new Dictionary<string, string>
{
    { "ApiKey", "YOUR_API_KEY" },
    { "SecretKey", "YOUR_SECRET_KEY" },
    { "Phone", "PHONE_NUMBER" },
    { "Content", "Your SMS content" },
    { "Brandname", "BRANDNAME" },
    { "SmsType", "2" } // 2 = brandname; 1 = thông thường
};

            var json = JsonSerializer.Serialize(parameters);
            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, httpContent);
            var responseString = await response.Content.ReadAsStringAsync();

            // Parse resultCode = 100 nghĩa là thành công
            Console.WriteLine(responseString);
            var result = JsonSerializer.Deserialize<EsmsResponse>(responseString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.CodeResult == "100";
        }
    }

}
