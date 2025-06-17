using System.Security.Claims;
using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount
{
    public class CreatePatientHandler :IRequestHandler<CreatePatientCommand, int>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreatePatientHandler(IUserCommonRepository userCommonRepository, IPatientRepository patientRepository,IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _userCommonRepository = userCommonRepository;
            _patientRepository = patientRepository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<int> Handle(CreatePatientCommand request, CancellationToken cancellationToken)
        {
            //var user = _httpContextAccessor.HttpContext?.User;
            //var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            //if (currentUserRole != "Receptionist")
            //{
            //    throw new UnauthorizedAccessException("Bạn không có quyền thực hiện hành động này.");
            //}
            var guest = _mapper.Map<CreatePatientDto>(request);
            var newUser = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
            if(newUser == null)
            {
                throw new Exception("Tạo tài khoản thất bại.");
            }
            if (!await _userCommonRepository.SendPasswordForGuestAsync(newUser.Email))
            {
                throw new Exception("Gửi mật khẩu thất bại.");
            }
            var patient = await _patientRepository.CreatePatientAsync(guest, newUser.UserID);
            if (patient == null)
            {
                throw new Exception("Tạo bệnh nhân thất bại.");
            }
            return patient.PatientID;
        }
    }
}
