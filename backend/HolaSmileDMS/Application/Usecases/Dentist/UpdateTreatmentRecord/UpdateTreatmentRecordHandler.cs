using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Dentist.UpdateTreatmentRecord
{
    public class UpdateTreatmentRecordHandler : IRequestHandler<UpdateTreatmentRecordCommand, bool>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateTreatmentRecordHandler(ITreatmentRecordRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(UpdateTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var record = await _repository.GetTreatmentRecordByIdAsync(request.TreatmentRecordId, cancellationToken);
            if (record == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

            if (request.ToothPosition != null)
                record.ToothPosition = request.ToothPosition;

            if (request.Quantity.HasValue)
                record.Quantity = request.Quantity.Value;

            if (request.UnitPrice.HasValue)
                record.UnitPrice = request.UnitPrice.Value;

            if (request.DiscountAmount.HasValue)
                record.DiscountAmount = request.DiscountAmount.Value;

            if (request.DiscountPercentage.HasValue)
                record.DiscountPercentage = request.DiscountPercentage.Value;

            if (request.TotalAmount.HasValue)
                record.TotalAmount = request.TotalAmount.Value;

            if (request.TreatmentStatus != null)
                record.TreatmentStatus = request.TreatmentStatus;

            if (request.Symptoms != null)
                record.Symptoms = request.Symptoms;

            if (request.Diagnosis != null)
                record.Diagnosis = request.Diagnosis;

            if (request.TreatmentDate.HasValue)
                record.TreatmentDate = request.TreatmentDate.Value;

            record.UpdatedAt = DateTime.UtcNow;
            record.UpdatedBy = userId;

            return await _repository.UpdatedTreatmentRecordAsync(record, cancellationToken);
        }


    }
}
