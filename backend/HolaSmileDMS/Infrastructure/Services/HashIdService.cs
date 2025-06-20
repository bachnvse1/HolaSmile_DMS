using Application.Services;

namespace Infrastructure.Services;

public class HashIdService : IHashIdService
{
    private static readonly Random _random = new();

    public string Encode(int id)
    {
        string part1 = RandomString(6);
        string part2 = (id * 17).ToString();
        string part3 = RandomString(6);
        string part4 = RandomString(4);
        string part5 = _random.Next(100, 999).ToString();

        return $"{part1}-{part2}-{part3}-{part4}-{part5}";
    }

    public int Decode(string publicId)
    {
        try
        {
            var parts = publicId.Split('-');
            int encoded = int.Parse(parts[1]);
            return encoded / 17;
        }
        catch
        {
            return -1;
        }
    }

    private string RandomString(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[_random.Next(s.Length)]).ToArray());
    }
}