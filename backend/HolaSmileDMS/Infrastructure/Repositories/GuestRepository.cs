using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Infrastructure.Repositories
{
    public class GuestRepository : IGuestRepository
    {
        public async Task<string> BookAppointmentAsync(BookAppointmentCommand request)
        {
            var message = "";
            if (request.FullName.Trim().IsNullOrEmpty())
            {
                message = "Họ tên không thể để trống.";
            }
            if(!FormatHelper.IsValidEmail(request.Email))
            {
                message = "Email không hợp lệ.";
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                message = "Số điện thoại không hợp lệ.";
            }
            if (request.AppointmentDate.Date < DateTime.Now.Date)
            {
                message = "Ngày hẹn không thể là ngày trong quá khứ.";
            }
            return message;

        }

        public async Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId)
        {
            throw new NotImplementedException();
        }
    }
}
