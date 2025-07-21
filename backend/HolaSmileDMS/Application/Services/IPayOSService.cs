using Newtonsoft.Json.Linq;

namespace Application.Services;

public interface IPayOSService
{
    bool VerifyChecksum(string rawJson, string checksum);
    string CalculateSignature(JObject payload, string secretKey);
}