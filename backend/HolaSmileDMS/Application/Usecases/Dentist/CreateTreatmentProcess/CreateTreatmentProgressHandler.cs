using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using HDMS_API.Application.Interfaces;

namespace Application.Usecases.Dentist.CreateTreatmentProcess;

public class CreateTreatmentProgressHandler : IRequestHandler<CreateTreatmentProgressCommand, string>
{
    private readonly ITreatmentProgressRepository _repository;
    private readonly IDentistRepository _dentistRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;

    public CreateTreatmentProgressHandler(
        ITreatmentProgressRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper, IDentistRepository dentistRepository)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _dentistRepository = dentistRepository;
    }

    public async Task<string> Handle(CreateTreatmentProgressCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

        var role = user.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        if (role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

        var dto = request.ProgressDto;
        
        if (dto.TreatmentRecordID <= 0 || dto.PatientID <= 0)
            throw new ArgumentException(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc

        if (string.IsNullOrWhiteSpace(dto.ProgressName))
            throw new ArgumentException(MessageConstants.MSG.MSG85);

        if (dto.EndTime.HasValue && dto.EndTime.Value < DateTime.UtcNow)
            throw new ArgumentException(MessageConstants.MSG.MSG84); // Không thể chọn ngày trong quá khứ

        if (dto.Duration.HasValue && dto.Duration <= 0)
            throw new ArgumentException(MessageConstants.MSG.MSG86);

        if (!string.IsNullOrWhiteSpace(dto.Status) && dto.Status.Length > 255)
            throw new ArgumentException(MessageConstants.MSG.MSG87);

        // ✅ Mapping và tạo dữ liệu
        var progress = _mapper.Map<TreatmentProgress>(dto);
        progress.DentistID = _dentistRepository.GetDentistByUserIdAsync(userId).Result.DentistId;
        progress.CreatedBy = userId;

        await _repository.CreateAsync(progress);
        return MessageConstants.MSG.MSG37; // Tạo kế hoạch điều trị thành công
    }

}