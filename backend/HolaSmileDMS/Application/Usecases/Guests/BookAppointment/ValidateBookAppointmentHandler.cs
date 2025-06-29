using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.IdentityModel.Tokens;

namespace Application.Usecases.Guests.BookAppointment
{
    public class ValidateBookAppointmentHandler : IRequestHandler<ValidateBookAppointmentCommand, ValidateBookAppointmentCommand>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMapper _mapper;
        public ValidateBookAppointmentHandler(IAppointmentRepository appointmentRepository, IPatientRepository patientRepository, IUserCommonRepository userCommonRepository, IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _userCommonRepository = userCommonRepository;
            _mapper = mapper;
        }

        public async Task<ValidateBookAppointmentCommand> Handle(ValidateBookAppointmentCommand request, CancellationToken cancellationToken)
        {
            if (request.FullName.Trim().IsNullOrEmpty())
            {
                throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception(MessageConstants.MSG.MSG08); // "Định dạng email không hợp lệ"
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception(MessageConstants.MSG.MSG56); // "Số điện thoại không đúng định dạng"
            }
            var existUser = await _userCommonRepository.GetUserByPhoneAsync(request.PhoneNumber);

            // Check if the patient already exists in the system
            if (existUser != null)
            {
                throw new Exception(MessageConstants.MSG.MSG90); // "Số điện thoại đã được sử dụng"
            }
            return request;
        }
    }
    }
