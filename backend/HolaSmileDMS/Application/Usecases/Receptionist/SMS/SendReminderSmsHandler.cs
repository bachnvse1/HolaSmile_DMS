using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Usecases.Receptionist.SMS
{
    public class SendReminderSmsHandler : IRequestHandler<SendReminderSmsCommand, bool>
    {
        private readonly IEsmsService _smsService;
        private readonly ILogger<SendReminderSmsHandler> _logger;

        public SendReminderSmsHandler(IEsmsService smsService, ILogger<SendReminderSmsHandler> logger)
        {
            _smsService = smsService;
            _logger = logger;
        }

        public async Task<bool> Handle(SendReminderSmsCommand request, CancellationToken cancellationToken)
        {
            //var date = request.AppointmentDate.ToString("dd/MM/yyyy");
            //var time = request.AppointmentTime;

            //var message = $"[Hola Smile] Xin chào {request.PatientName}! Quý khách có lịch hẹn vào lúc {time} ngày {date}. Vui lòng đến đúng giờ.";

            try
            {
                return await _smsService.SendSmsAsync(request.PhoneNumber, request.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gửi SMS nhắc lịch khám thất bại");
                return false;
            }
        }
    }

}
