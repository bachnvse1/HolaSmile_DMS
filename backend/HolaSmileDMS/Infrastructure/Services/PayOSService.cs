using System.Security.Cryptography;
using System.Text;
using Application.Services;
using Infrastructure.Configurations;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace Infrastructure.Services;

public class PayOSService : IPayOSService
{
    private readonly PayOSOptions _options;

    public PayOSService(IOptions<PayOSOptions> options)
    {
        _options = options.Value;
    }

    public bool VerifyChecksum(string rawJson, string secretKey)
    {
        var json = JObject.Parse(rawJson);
        var signatureFromPayOS = json["signature"]?.ToString();
        var signatureFromServer = CalculateSignature(json, secretKey);

        return string.Equals(signatureFromPayOS, signatureFromServer, StringComparison.OrdinalIgnoreCase);
    }

    public string CalculateSignature(JObject payload, string secretKey)
    {
        var data = payload["data"] as JObject;
        if (data == null) return string.Empty;

        // 1. Sắp xếp key alphabet & build query string
        var keyValuePairs = data.Properties()
            .OrderBy(p => p.Name, StringComparer.Ordinal)
            .Select(p => $"{p.Name}={NormalizeValue(p.Value)}");

        var contentToSign = string.Join("&", keyValuePairs);

        // 2. Hash HMAC-SHA256
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(contentToSign));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    private static string NormalizeValue(JToken token) =>
        token.Type is JTokenType.Null or JTokenType.Undefined ? string.Empty : token.ToString();
}