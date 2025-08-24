﻿using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancelAppointmentHandle : IRequestHandler<CancelAppointmentCommand, string>

    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IDentistRepository _dentistRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMediator _mediator;
        public CancelAppointmentHandle(IAppointmentRepository appointmentRepository, IHttpContextAccessor httpContextAccessor, IDentistRepository dentistRepository, IUserCommonRepository userCommonRepository, IMediator mediator)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _dentistRepository = dentistRepository;
            _userCommonRepository = userCommonRepository;
            _mediator = mediator;
        }
        public async Task<string> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if(user == null || currentUserId <= 0)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            
            var existAppointment = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if(existAppointment == null)
            {
                throw new Exception(MessageConstants.MSG.MSG28); // "Không tìm thấy lịch hẹn"
            }
            if(existAppointment.Status.ToLower() != "confirmed")
            {
                throw new Exception("Bạn chỉ có thể hủy lịch ở trạng thái xác nhận");
            }

            var cancleApp = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            cancleApp.Status = "canceled";
            cancleApp.CancelReason = request.Reason;
            cancleApp.UpdatedAt = DateTime.Now;
            cancleApp.UpdatedBy = currentUserId;
            var isCancel = await _appointmentRepository.UpdateAppointmentAsync(cancleApp);

            //var cancleApp = await _appointmentRepository.CancelAppointmentAsync(request.AppointmentId, currentUserId);


            //GỬI THÔNG BÁO CHO DENTIST
            try
            {
                var dentist = await _dentistRepository.GetDentistByDentistIdAsync(existAppointment.DentistId);
                await _mediator.Send(new SendNotificationCommand(
                      dentist.User.UserID,
                     "Hủy lịch khám",
                     $"Bệnh nhân đã hủy lịch khám vào giờ {existAppointment.AppointmentTime} ngày {existAppointment.AppointmentDate.ToString("dd/MM/yyyy")}.",
                     "appointment",
                     0, $"appointments/{existAppointment.AppointmentId}"),
                cancellationToken);
            }
            catch { }

            // GỬI THÔNG BÁO CHO TẤT CẢ RECEPTIONIST
            try
            {
                var receptionists = await _userCommonRepository.GetAllReceptionistAsync();
                var notifyReceptionists = receptionists.Select(r =>
                _mediator.Send(new SendNotificationCommand(
                          r.UserId,
                          "Hủy lịch khám",
                           $"Bệnh nhân đã hủy lịch của lịch hẹn #{existAppointment.AppointmentId} khám vào giờ {existAppointment.AppointmentTime} ngày {existAppointment.AppointmentDate.ToString("dd/MM/yyyy")}.",
                           "appointment", 0, $"appointments/{existAppointment.AppointmentId}"),
                           cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyReceptionists);
            }
            catch { }

            return isCancel ? MessageConstants.MSG.MSG06 : MessageConstants.MSG.MSG58;
        }
    }
    }
