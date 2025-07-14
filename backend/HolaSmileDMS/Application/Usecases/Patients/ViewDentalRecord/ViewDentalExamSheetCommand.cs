using MediatR;

namespace Application.Usecases.Patients.ViewDentalRecord;
public sealed record ViewDentalExamSheetCommand(int AppointmentId) : IRequest<DentalExamSheetDto>;

