using Application.Services;
using HashidsNet;

namespace Infrastructure.Services;

public class HashIdService : IHashIdService
{
    private readonly Hashids _hashids;

    public HashIdService()
    {
        const string salt = "hola-smile-2025-secure-key";
        const int minLength = 12;
        _hashids = new Hashids(salt, minLength);
    }

    public string Encode(int id)
    {
        var raw = _hashids.Encode(id); // ví dụ: "xYz123AbCdEf"
        return FormatPretty(raw);
    }

    public int Decode(string publicId)
    {
        try
        {
            var raw = publicId.Replace("-", "");
            return _hashids.Decode(raw).FirstOrDefault();
        }
        catch
        {
            return -1;
        }
    }

    private string FormatPretty(string raw)
    {
        // Chia chuỗi thành từng phần 4 ký tự: "xYz1-23Ab-CdEf"
        return string.Join("-", SplitEvery(raw, 4));
    }

    private IEnumerable<string> SplitEvery(string str, int chunkSize)
    {
        for (int i = 0; i < str.Length; i += chunkSize)
            yield return str.Substring(i, Math.Min(chunkSize, str.Length - i));
    }
}