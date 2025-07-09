using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.ViewListTreatmentRecord
{
    public class ViewListTreatmentRecordHandler : IRequestHandler<ViewListTreatmentRecordCommand, List<ViewListTreatmentRecordDto>>
    {
        private readonly ITreatmentRecordRepository _treatmentRecordRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewListTreatmentRecordHandler(
            ITreatmentRecordRepository treatmentRecordRepo,
            IHttpContextAccessor httpContextAccessor)
        {
            _treatmentRecordRepo = treatmentRecordRepo;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ViewListTreatmentRecordDto>> Handle(ViewListTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || role == "Patient")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            var treatmentRecords = _treatmentRecordRepo.Query()
                .Where(x => !x.IsDeleted)
                .Select(t => new ViewListTreatmentRecordDto
                {
                    TreatmentRecordID = t.TreatmentRecordID,
                    AppointmentID = t.AppointmentID,
                    AppointmentDate = t.Appointment!.AppointmentDate,
                    AppointmentTime = t.Appointment.AppointmentTime,
                    DentistID = t.DentistID,
                    DentistName = t.Dentist != null ? t.Dentist.User.Fullname : "",
                    ProcedureID = t.ProcedureID,
                    ProcedureName = t.Procedure != null ? t.Procedure.ProcedureName : "",
                    ToothPosition = t.ToothPosition,
                    Quantity = t.Quantity,
                    UnitPrice = t.UnitPrice,
                    DiscountAmount = t.DiscountAmount,
                    DiscountPercentage = t.DiscountPercentage,
                    TotalAmount = t.TotalAmount,
                    ConsultantEmployeeID = t.ConsultantEmployeeID,
                    TreatmentStatus = t.TreatmentStatus,
                    Symptoms = t.Symptoms,
                    Diagnosis = t.Diagnosis,
                    TreatmentDate = t.TreatmentDate,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    CreatedBy = t.CreatedBy != null ? t.CreatedBy.ToString() : null,
                    UpdatedBy = t.UpdatedBy != null ? t.UpdatedBy.ToString() : null,
                    IsDeleted = t.IsDeleted
                })
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            return await System.Threading.Tasks.Task.FromResult(treatmentRecords);
        }
    }
}
