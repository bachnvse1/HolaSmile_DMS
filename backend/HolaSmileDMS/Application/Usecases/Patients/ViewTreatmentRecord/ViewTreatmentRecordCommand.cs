// Application/Usecases/Patients/ViewTreatmentRecord/ViewTreatmentRecordsCommand.cs
using MediatR;

namespace Application.Usecases.Patients.ViewTreatmentRecord;

/// <summary>
/// Lấy danh sách hồ sơ điều trị của một bệnh nhân.
/// Chỉ truyền patientId, quyền được kiểm tra ở Handler.
/// </summary>
public class ViewTreatmentRecordCommand : IRequest<List<ViewTreatmentRecordDto>>
{
    public int PatientId { get; set; }

    public ViewTreatmentRecordCommand(int patientId)
    {
        PatientId = patientId;
    }
}