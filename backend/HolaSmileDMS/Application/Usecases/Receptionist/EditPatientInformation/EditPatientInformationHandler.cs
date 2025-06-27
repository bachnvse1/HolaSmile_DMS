using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.EditPatientInformation
{
    public class EditPatientInformationHandler : IRequestHandler<EditPatientInformationCommand, Patient>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;


        public EditPatientInformationHandler(IUserCommonRepository userCommonRepository, IPatientRepository patientRepository, IMapper mapper, IHttpContextAccessor httpContextAccessor,IMediator mediator)
        {
            _userCommonRepository = userCommonRepository;
            _patientRepository = patientRepository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;

        }

        public async Task<Patient> Handle(EditPatientInformationCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var patient = await _patientRepository.GetPatientByIdAsync(request.PatientID);
            if (patient == null)
            {
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27); // "Không tìm thấy hồ sơ bệnh nhân"
            }

            if (string.IsNullOrEmpty(request.FullName)){
                throw new ArgumentException(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }


            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new ArgumentException(MessageConstants.MSG.MSG08); // "Vui lòng nhập thông tin bắt buộc"
            }

            if (await _patientRepository.CheckEmailPatientAsync(request.Email) != null)
            {
                throw new ArgumentException(MessageConstants.MSG.MSG22); // "Vui lòng nhập thông tin bắt buộc"
            }

            if(string.IsNullOrEmpty(request.Address))
            {
                throw new ArgumentException(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }
            patient.User.Fullname = request.FullName;
            patient.User.Email = request.Email;
            patient.User.DOB = FormatHelper.TryParseDob(request.Dob);
            patient.User.Gender = request.Gender;
            patient.User.Address = request.Address;
            patient.UnderlyingConditions = request.UnderlyingConditions;
            patient.User.UpdatedBy = userId;
            patient.User.UpdatedAt = DateTime.Now;
            var IsUpdated = await _patientRepository.UpdatePatientInforAsync(patient);

            if(!IsUpdated)
            {
                throw new Exception(MessageConstants.MSG.MSG31); // "Lưu dữ liệu không thành công"
            }

            await _mediator.Send(new SendNotificationCommand(
                patient.User.UserID,
                    "Cập nhật hồ sơ bệnh nhân",
                    $"Lễ Tân đã thay đổi hồ sơ bệnh án của bạn vào lúc {DateTime.Now}",
                    "Cập nhật hồ sơ bệnh nhân",
                    request.PatientID),
                cancellationToken);

            return patient;
        }
    }
}
