using Application.Services;
using Infrastructure.Configurations;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public class PayOSConfiguration : IPayOSConfiguration
{
    private readonly PayOSOptions _options;

    public PayOSConfiguration(IOptions<PayOSOptions> options)
    {
        _options = options.Value;
    }

    public string ClientId => _options.ClientId;
    public string ApiKey => _options.ApiKey;
    public string ChecksumKey => _options.ChecksumKey;
}
