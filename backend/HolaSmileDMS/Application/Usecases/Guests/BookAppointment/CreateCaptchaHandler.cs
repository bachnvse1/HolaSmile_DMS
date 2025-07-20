using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace Application.Usecases.Guests.BookAppointment
{
    public class CreateCaptchaHandler : IRequestHandler<CreateCaptchaCommand, string>
    {
        private readonly IMemoryCache _cache;
        public CreateCaptchaHandler(IMemoryCache cache)
        {
            _cache = cache;
        }
        public async Task<string> Handle(CreateCaptchaCommand request, CancellationToken cancellationToken)
        {
            Random random = new Random();
            var captcha = random.Next(100000, 999999).ToString();
            return captcha;
        }
    }
}

