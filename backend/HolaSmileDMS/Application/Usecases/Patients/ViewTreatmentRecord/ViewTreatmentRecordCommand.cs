using MediatR;
namespace Application.Usecases.Patients.ViewTreatmentRecord;
public record ViewTreatmentRecordsCommand(int UserId) : IRequest<List<ViewTreatmentRecordDto>>;