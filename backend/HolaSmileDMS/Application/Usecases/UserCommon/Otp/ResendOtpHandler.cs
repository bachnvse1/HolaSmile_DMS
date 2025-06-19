using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using MediatR;

namespace Application.Usecases.UserCommon.Otp
{
    internal class ResendOtpHandler : IRequestHandler<ResendOtpCommand, bool>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        public ResendOtpHandler(IUserCommonRepository userCommonRepository) 
        {
             _userCommonRepository = userCommonRepository;
        }
        public async Task<bool> Handle(ResendOtpCommand request, CancellationToken cancellationToken)
        {
            
            return await _userCommonRepository.ResendOtpAsync(request.email);
        }
    }
}
