using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Patients.ViewDentalRecord;
public sealed class ViewDentalExamSheetHandler :
    IRequestHandler<ViewDentalExamSheetCommand, DentalExamSheetDto>
{
    private readonly IHttpContextAccessor _http;
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly ITreatmentRecordRepository _recordRepo;
    private readonly IPatientRepository _patientRepo;
    private readonly IUserCommonRepository _userRepo;
    private readonly IDentistRepository _dentistRepo;
    private readonly IProcedureRepository _procedureRepo;
    private readonly IWarrantyCardRepository _warrantyRepo;
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IPrescriptionRepository _prescriptionRepo;
    private readonly IInstructionRepository _instructionRepo;
    private readonly IAppointmentRepository _followupRepo;

    public ViewDentalExamSheetHandler(IHttpContextAccessor http, IAppointmentRepository appointmentRepo, ITreatmentRecordRepository recordRepo, IPatientRepository patientRepo, IUserCommonRepository userRepo, IDentistRepository dentistRepo, IProcedureRepository procedureRepo, IWarrantyCardRepository warrantyRepo, IInvoiceRepository invoiceRepo, IPrescriptionRepository prescriptionRepo, IInstructionRepository instructionRepo, IAppointmentRepository followupRepo)
    {
        _http = http;
        _appointmentRepo = appointmentRepo;
        _recordRepo = recordRepo;
        _patientRepo = patientRepo;
        _userRepo = userRepo;
        _dentistRepo = dentistRepo;
        _procedureRepo = procedureRepo;
        _warrantyRepo = warrantyRepo;
        _invoiceRepo = invoiceRepo;
        _prescriptionRepo = prescriptionRepo;
        _instructionRepo = instructionRepo;
        _followupRepo = followupRepo;
    }

    /* ctor bỏ qua để ngắn */

    public async Task<DentalExamSheetDto> Handle(ViewDentalExamSheetCommand request, CancellationToken ct)
    {
        // 1. Auth
        var user = _http.HttpContext?.User
                   ?? throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);
        var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role   = user.FindFirst(ClaimTypes.Role)?.Value;

        // 2. Lấy appointment & patient
        var appt   = await _appointmentRepo.GetAppointmentByIdAsync(request.AppointmentId)
                     ?? throw new KeyNotFoundException(MessageConstants.MSG.MSG28);
        var patient = await _patientRepo.GetPatientByPatientIdAsync(appt.PatientId!.Value)
                      ?? throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

        if (role == "Patient" && patient.UserID != userId)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var patientUser = await _userRepo.GetByIdAsync(patient.UserID!.Value, ct);

        // 3. Lấy records 1-n
        var records = await _recordRepo.GetTreatmentRecordsByAppointmentIdAsync(appt.AppointmentId, ct);
        if (records.Count == 0) throw new Exception(MessageConstants.MSG.MSG16);

        // 4. Phiếu kết quả
        var sheet = new DentalExamSheetDto
        {
            AppointmentId = appt.AppointmentId,
            PatientName   = patientUser.Fullname,
            BirthYear     = patientUser.DOB,
            Phone         = patientUser.Phone,
            Address       = patientUser.Address ?? "-",
            PrintedAt     = DateTime.Now
        };

        // 5. Gộp prescriptions & instructions một lần
        var prescriptionSet = new HashSet<string>();
        var instructionSet  = new HashSet<string>();

        // 6. Iterate records → build TreatmentRowDto
        foreach (var rec in records)
        {
            var dentist  = await _dentistRepo.GetDentistByDentistIdAsync(rec.DentistID);
            var dentUser = dentist != null ? await _userRepo.GetByIdAsync(dentist.UserId, ct) : null;
            var proc = await _procedureRepo.GetByIdAsync(rec.ProcedureID, ct);
            var warranty = await _warrantyRepo.GetByIdAsync(proc.WarrantyCardId ?? 0, ct);

            sheet.Treatments.Add(new TreatmentRowDto
            {
                TreatmentDate = rec.TreatmentDate,
                ProcedureName = proc?.ProcedureName ?? "-",
                Symptoms      = rec.Symptoms ?? "-",
                Diagnosis     = rec.Diagnosis ?? "-",
                DentistName   = dentUser?.Fullname ?? "-",
                Quantity      = rec.Quantity,
                UnitPrice     = rec.UnitPrice,
                Discount      = rec.DiscountAmount ?? 0,
                TotalAmount   = rec.TotalAmount,
                WarrantyTerm  = warranty?.Duration
            });

            // prescriptions
            var pres = await _prescriptionRepo.GetByTreatmentRecordIdAsync(appt.AppointmentId, ct) ?? new List<Prescription>();
            foreach (var p in pres.Where(x => !string.IsNullOrWhiteSpace(x.Content)))
                prescriptionSet.Add(p.Content);

            var instr = await _instructionRepo.GetByTreatmentRecordIdAsync(appt.AppointmentId, ct) ?? new List<Instruction>();
            foreach (var i in instr.Where(x => !string.IsNullOrWhiteSpace(x.Content)))
                instructionSet.Add(i.Content);

            // payments
            var invs = await _invoiceRepo.GetByTreatmentRecordIdAsync(rec.TreatmentRecordID, ct);
            sheet.Payments.AddRange(invs.Select((x, idx) => new PaymentHistoryDto
            {
                Date   = x.PaymentDate,
                Amount = (decimal)(x.PaidAmount ?? 0),
                Note   = x.Description ?? $"Hoá đơn {idx + 1}"
            }));
        }

        sheet.PrescriptionItems = prescriptionSet.ToList();
        sheet.Instructions      = instructionSet.ToList();

        // 7. Follow-up (lấy gần nhất > TreatmentDate MAX)
        var follow = await _followupRepo.GetAppointmentByIdAsync(appt.AppointmentId);
        if (follow != null)
        {
            sheet.NextAppointmentTime =
                $"{follow.AppointmentTime.ToString(@"hh\:mm")} {follow.AppointmentDate:dd/MM/yyyy}";
            sheet.NextAppointmentNote = follow.Content;
        }

        return sheet;
    }
}
