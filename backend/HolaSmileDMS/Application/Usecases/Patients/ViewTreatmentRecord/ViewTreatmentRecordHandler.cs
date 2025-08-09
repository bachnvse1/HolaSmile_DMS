using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.ViewTreatmentRecord;

public sealed class ViewPatientTreatmentRecordHandler
    : IRequestHandler<ViewTreatmentRecordCommand, List<ViewTreatmentRecordDto>>
{
    private readonly ITreatmentRecordRepository _treatmentRecordRepo;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IPatientRepository _patientRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewPatientTreatmentRecordHandler(
        ITreatmentRecordRepository treatmentRecordRepo,
        IPatientRepository patientRepo,
        IHttpContextAccessor httpContextAccessor,
        IInvoiceRepository invoiceRepository)
    {
        _treatmentRecordRepo = treatmentRecordRepo;
        _patientRepo = patientRepo;
        _httpContextAccessor = httpContextAccessor;
        _invoiceRepository = invoiceRepository;
    }

    public async Task<List<ViewTreatmentRecordDto>> Handle(
        ViewTreatmentRecordCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy thông tin người đang đăng nhập
        var user = _httpContextAccessor.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc hết hạn

        var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentRole = user.FindFirst(ClaimTypes.Role)?.Value;

        var isDentist = currentRole == "Dentist";
        var isReceptionist = currentRole == "Receptionist";
        var isAssistant = currentRole == "Assistant";
        var isPatient = currentRole == "Patient";

        // 2. Kiểm tra quyền truy cập
        if (!isDentist && !isReceptionist && !isAssistant)
        {
            // Nếu là Patient thì chỉ được xem hồ sơ của chính mình
            if (!isPatient)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var patient = await _patientRepo.GetPatientByPatientIdAsync(request.PatientId)
                          ?? throw new KeyNotFoundException(MessageConstants.MSG.MSG16);

            if (patient.UserID != currentUserId)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        }

        // 3. Lấy dữ liệu hồ sơ điều trị
        var records = await _treatmentRecordRepo
            .GetPatientTreatmentRecordsAsync(request.PatientId, cancellationToken);
        try
        {
            foreach (var record in records) 
            {
                // Lấy tất cả hoá đơn liên quan đến hồ sơ điều trị
                var invoices = await _invoiceRepository.GetByTreatmentRecordIdAsync(record.TreatmentRecordID);
                var latestInvoice = invoices?.OrderByDescending(i => i.CreatedAt).FirstOrDefault();
                if (latestInvoice != null)
                {
                    record.RemainingAmount = latestInvoice.RemainingAmount;
                } else
                {
                    record.RemainingAmount = record.TotalAmount;
                }
            }
        }
        catch (Exception e)
        {
        }
       
        if (records == null || records.Count == 0)
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16);
        return records;
    }
}
