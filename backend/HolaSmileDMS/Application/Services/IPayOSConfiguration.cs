namespace Application.Services;

// Application/Interfaces/IPayOSConfiguration.cs
public interface IPayOSConfiguration
{
    string ClientId { get; }
    string ApiKey { get; }
    string ChecksumKey { get; }
}