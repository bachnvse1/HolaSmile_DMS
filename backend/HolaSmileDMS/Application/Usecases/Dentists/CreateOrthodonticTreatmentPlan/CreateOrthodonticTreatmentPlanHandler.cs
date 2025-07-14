using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Dentists.CreateOrthodonticTreatmentPlan;

public class CreateOrthodonticTreatmentPlanHandler : IRequestHandler<CreateOrthodonticTreatmentPlanCommand, string>
{
    private readonly IOrthodonticTreatmentPlanRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly IMediator _mediator;

    public CreateOrthodonticTreatmentPlanHandler(
        IOrthodonticTreatmentPlanRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper, IMediator mediator)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _mediator = mediator;
    }

    public async Task<string> Handle(CreateOrthodonticTreatmentPlanCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

        var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var role = user.FindFirstValue(ClaimTypes.Role);
        var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;
        if (role != "Dentist" && role != "Assistant")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này

        // Validate bắt buộc
        if (request.PatientId <= 0)
            throw new Exception(MessageConstants.MSG.MSG27); // Không tìm thấy hồ sơ bệnh nhân

        if (request.DentistId <= 0)
            throw new Exception(MessageConstants.MSG.MSG42); // Vui lòng chọn bác sĩ trước khi đặt lịch

        if (string.IsNullOrWhiteSpace(request.PlanTitle))
            throw new Exception(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc

        if (string.IsNullOrWhiteSpace(request.TreatmentPlanContent))
            throw new Exception(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc

        if (request.TotalCost < 0)
            throw new Exception(MessageConstants.MSG.MSG82); // Đơn giá không hợp lệ

        if (!string.IsNullOrWhiteSpace(request.PaymentMethod) && request.PaymentMethod.Length > 255)
            throw new Exception(MessageConstants.MSG.MSG29); // Trường này chứa ký tự không hợp lệ

        // Mapping
        var plan = _mapper.Map<OrthodonticTreatmentPlan>(request);
        plan.CreatedAt = DateTime.Now;
        plan.CreatedBy = currentUserId;
        plan.IsDeleted = false;

        await _repository.AddAsync(plan, cancellationToken);
        
        int userIdNotification = request.PatientId;
        if (userIdNotification > 0)
        {
            try
            {
                var message =
                    $"Kế hoạch điều trị chỉnh nha #{plan.PlanId} của bạn đã được nha sĩ {fullName} thiết lập và bắt đầu thực hiện trong hôm nay. Vui lòng kiểm tra chi tiết trong hồ sơ điều trị.";

                await _mediator.Send(new SendNotificationCommand(
                    userIdNotification,
                    "Kế hoạch điều trị mới",
                    message,
                    "Xem chi tiết",
                    0
                ), cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        return MessageConstants.MSG.MSG37; // Tạo kế hoạch điều trị thành công
    }
}
