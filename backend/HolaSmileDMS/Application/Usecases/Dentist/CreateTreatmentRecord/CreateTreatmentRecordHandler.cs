using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Dentist.CreateTreatmentRecord
{
    public class CreateTreatmentRecordHandler : IRequestHandler<CreateTreatmentRecordCommand, string>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateTreatmentRecordHandler(
            ITreatmentRecordRepository repository,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(CreateTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var role = user.FindFirstValue(ClaimTypes.Role);

            if (role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập

            // Validate IDs
            if (request.AppointmentId <= 0)
                throw new Exception(MessageConstants.MSG.MSG28); // Không tìm thấy lịch hẹn
            
            if (request.TreatmentDate == null || request.TreatmentDate == default)
                throw new Exception(MessageConstants.MSG.MSG83);
            
            if (request.TreatmentDate < DateTime.Today)
                throw new Exception(MessageConstants.MSG.MSG84); 
            
            if (request.DentistId <= 0)
                throw new Exception(MessageConstants.MSG.MSG42); // Vui lòng chọn bác sĩ trước khi đặt lịch

            if (request.ProcedureId <= 0)
                throw new Exception(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

            // Validate Quantity and UnitPrice
            if (request.Quantity <= 0)
                throw new Exception(MessageConstants.MSG.MSG88); // Số lượng không hợp lệ

            if (request.UnitPrice < 0)
                throw new Exception(MessageConstants.MSG.MSG82); // Đơn giá không hợp lệ

            var record = _mapper.Map<TreatmentRecord>(request);
            record.CreatedAt = DateTime.UtcNow;
            record.CreatedBy = currentUserId;
            
            var subtotal = record.UnitPrice * record.Quantity;

            if (record.DiscountAmount.HasValue && record.DiscountAmount.Value > subtotal)
                throw new Exception(MessageConstants.MSG.MSG20); // Số tiền chiết khấu vượt quá tổng tiền

            if (record.DiscountPercentage.HasValue && record.DiscountPercentage.Value > 100)
                throw new Exception(MessageConstants.MSG.MSG20); // Chiết khấu vượt quá 100%

            record.TotalAmount = CalculateTotal(record);

            await _repository.AddAsync(record, cancellationToken);

            return MessageConstants.MSG.MSG31; // Lưu dữ liệu thành công
        }

        private decimal CalculateTotal(TreatmentRecord record)
        {
            var subtotal = record.UnitPrice * record.Quantity;

            if (record.DiscountAmount.HasValue)
                return subtotal - record.DiscountAmount.Value;

            if (record.DiscountPercentage.HasValue)
                return subtotal * (1 - (decimal)record.DiscountPercentage.Value / 100);

            return subtotal;
        }
    }
}
