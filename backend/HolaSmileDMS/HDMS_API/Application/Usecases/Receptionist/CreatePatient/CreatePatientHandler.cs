using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount
{
    public class CreatePatientHandler :IRequestHandler<CreatePatientCommand, int>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPatientRepository _patientRepository;

        public CreatePatientHandler(IUserCommonRepository userCommonRepository, IPatientRepository patientRepository)
        {
            _userCommonRepository = userCommonRepository;
            _patientRepository = patientRepository;
        }
        public async Task<int> Handle(CreatePatientCommand request, CancellationToken cancellationToken)
        { 
            var user = await _userCommonRepository.CreatePatientAccountAsync(request, "123456");
            if(user == null)
            {
                throw new Exception("Tạo tài khoản thất bại.");
            }
            if (!await _userCommonRepository.SendPasswordForGuestAsync(user.Email))
            {
                throw new Exception("Gửi mật khẩu thất bại.");
            }
            var patient = await _patientRepository.CreatePatientAsync(request, user.UserID);
            if (patient == null)
            {
                throw new Exception("Tạo bệnh nhân thất bại.");
            }
            return patient.PatientID;
        }
    }
}
