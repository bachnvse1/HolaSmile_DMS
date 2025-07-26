using Application.Constants;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Dentist.CreateTreatmentProgress;

public class CreateTreatmentProgressHandler : IRequestHandler<CreateTreatmentProgressCommand, string>
{
    private readonly ITreatmentProgressRepository _repository;
    private readonly IDentistRepository _dentistRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly IPatientRepository _patientRepository;
    private readonly IMediator _mediator;

    public CreateTreatmentProgressHandler(
        ITreatmentProgressRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper, IDentistRepository dentistRepository, IPatientRepository patientRepository, IMediator mediator)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _dentistRepository = dentistRepository;
        _patientRepository = patientRepository;
        _mediator = mediator;
    }

    public async Task<string> Handle(CreateTreatmentProgressCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

        var role = user.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;
        
        if (role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var dto = request.ProgressDto;
        
        if (dto.TreatmentRecordID <= 0 || dto.PatientID <= 0)
            throw new ArgumentException(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc

        if (string.IsNullOrWhiteSpace(dto.ProgressName))
            throw new ArgumentException(MessageConstants.MSG.MSG85);

        if (dto.EndTime.HasValue && dto.EndTime.Value < DateTime.Now)
            throw new ArgumentException(MessageConstants.MSG.MSG84); // Không thể chọn ngày trong quá khứ

        if (dto.Duration.HasValue && dto.Duration <= 0)
            throw new ArgumentException(MessageConstants.MSG.MSG86);

        if (!string.IsNullOrWhiteSpace(dto.Status) && dto.Status.Length > 255)
            throw new ArgumentException(MessageConstants.MSG.MSG87);

        // ✅ Mapping và tạo dữ liệu
        var progress = _mapper.Map<TreatmentProgress>(dto);
        progress.DentistID = request.ProgressDto.DentistID;
        progress.CreatedBy = userId;
        progress.CreatedAt = DateTime.Now;
    
        await _repository.CreateAsync(progress);
        
            var patient = await _patientRepository.GetPatientByPatientIdAsync(request.ProgressDto.PatientID);
            if (patient != null)
            {
                int userIdNotification = patient.UserID ?? 0;
                if (userIdNotification > 0)
                {
                    await _mediator.Send(new SendNotificationCommand(
                        userIdNotification,
                        "Tạo tiến trình điều trị",
                        $"Tiến trình mới của thủ thuật #{request.ProgressDto.TreatmentRecordID}  của bạn đã được nha sĩ {fullName} tạo.",
                        "Xem hồ sơ",
                        0
                    ), cancellationToken);
                }
            }
        return MessageConstants.MSG.MSG37; // Tạo kế hoạch điều trị thành công
    }

}