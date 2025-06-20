namespace Application.Services;

public interface IHashIdService
{
    string Encode(int id);
    int Decode(string hash);
}
