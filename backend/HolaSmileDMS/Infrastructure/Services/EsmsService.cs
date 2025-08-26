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

        public async Task<bool> SendPasswordAsync(string phoneNumber, string newPassword)
        {
            string content = $"{newPassword} la ma xac minh dang ky Baotrixemay cua ban";
            return await SendSmsAsync(phoneNumber, content);
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            var apiKey = _configuration["ESMS:ApiKey"];
            var secretKey = _configuration["ESMS:SecretKey"];
            var brandname = _configuration["ESMS:Brandname"];
            var smsType = _configuration["ESMS:SmsType"] ?? "2"; // 2 = brandname
            var isUnicode = message.Any(c => c > 127) ? "1" : "0"; // có dấu -> Unicode
            var url = "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";
            var requestId = Guid.NewGuid().ToString();

            var parameters = new Dictionary<string, string>
    {
        { "ApiKey", apiKey },
        { "SecretKey", secretKey },
        { "Brandname", brandname },
        { "SmsType", smsType },
        { "Phone", phoneNumber },
        { "Content", message },              // <-- chỉ 1 lần
        { "IsUnicode", isUnicode },
        { "campaignid", "CamOnSauMuaHang-07" },
        { "RequestId", requestId },
        { "CallbackUrl", "https://esms.vn/webhook/" }
    };

            var json = JsonSerializer.Serialize(parameters);
            using var httpContent = new StringContent(json, Encoding.UTF8, "application/json");
            using var response = await _httpClient.PostAsync(url, httpContent);
            var responseString = await response.Content.ReadAsStringAsync();

            var result = JsonSerializer.Deserialize<EsmsResponse>(responseString,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return response.IsSuccessStatusCode && result?.CodeResult == "100";
        }
    }
}
