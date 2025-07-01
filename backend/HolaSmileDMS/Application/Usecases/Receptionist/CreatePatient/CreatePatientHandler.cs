using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Http;

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
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole,"receptionist",StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (string.IsNullOrEmpty(request.FullName.Trim()))
            {
                throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception(MessageConstants.MSG.MSG56); // "Số điện thoại không đúng định dạng"
            }
            if (await _userCommonRepository.GetUserByPhoneAsync(request.PhoneNumber) != null)
            {
                throw new Exception(MessageConstants.MSG.MSG23); // "Số điện thoại đã được sử dụng"
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception(MessageConstants.MSG.MSG08); // "Định dạng email không hợp lệ"
            }
            if (await _userCommonRepository.GetUserByPhoneAsync(request.Email) != null)
            {
                throw new Exception(MessageConstants.MSG.MSG22); // "Email đã tồn tại"
            }

            var guest = _mapper.Map<CreatePatientDto>(request);
            var newUser = await _userCommonRepository.CreatePatientAccountAsync(guest, "123456");
            if(newUser == null)
            {
                throw new Exception(MessageConstants.MSG.MSG76); // => Gợi ý định nghĩa: "Tạo tài khoản thất bại."
            }

            // Send password to guest email asynchronously
            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                try
                {
                    await _userCommonRepository.SendPasswordForGuestAsync(newUser.Email);
                }
                catch (Exception ex)
                {
                    throw new Exception(MessageConstants.MSG.MSG78); // => Gợi ý định nghĩa: "Gửi mật khẩu cho khách không thành công."
                }
            });

            var patient = await _patientRepository.CreatePatientAsync(guest, newUser.UserID);
            if (patient == null)
            {
                throw new Exception(MessageConstants.MSG.MSG77); // "Tạo hồ sơ bệnh nhân thất bại."
            }
            return patient.PatientID;
        }
    }
}
