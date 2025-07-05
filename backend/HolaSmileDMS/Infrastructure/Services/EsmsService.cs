using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            var apiKey = _configuration["ESMS:ApiKey"];
            var secretKey = _configuration["ESMS:SecretKey"];
            var brandname = _configuration["ESMS:Brandname"];
            var url = "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

            var parameters = new Dictionary<string, string>
        {
            { "ApiKey", apiKey },
            { "SecretKey", secretKey },
            { "SmsType", "2" }, // 2: brandname, 4: notify
            { "Brandname", brandname },
            { "Phone", phoneNumber },
            { "Content", message },
            { "IsUnicode", "0" }
        };

            var content = new FormUrlEncodedContent(parameters);
            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            // Parse resultCode = 100 nghĩa là thành công
            return responseString.Contains("\"CodeResult\":100");
        }
    }

}
