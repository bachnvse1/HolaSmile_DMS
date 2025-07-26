using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;

public class EditOrthodonticTreatmentPlanHandler : IRequestHandler<EditOrthodonticTreatmentPlanCommand, string>
{
    private readonly IOrthodonticTreatmentPlanRepository _repo;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly IMediator _mediator;

    public EditOrthodonticTreatmentPlanHandler(
        IOrthodonticTreatmentPlanRepository repo,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper, IMediator mediator)
    {
        _repo = repo;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _mediator = mediator;
    }

    public async Task<string> Handle(EditOrthodonticTreatmentPlanCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        // ✅ Lấy thông tin người dùng hiện tại
        var user = _httpContextAccessor.HttpContext?.User;
        var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;

        if (user == null || string.IsNullOrEmpty(currentUserRole) || string.IsNullOrEmpty(currentUserIdStr))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện thao tác này"

        if (currentUserRole != "Dentist" && currentUserRole != "Assistant")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

        var currentUserId = int.Parse(currentUserIdStr);

        // ✅ Validate dữ liệu đầu vào
        if (string.IsNullOrWhiteSpace(dto.PlanTitle))
            throw new Exception(MessageConstants.MSG.MSG07); // "Vui lòng nhập thông tin bắt buộc"

        if (dto.TotalCost < 0)
            throw new Exception(MessageConstants.MSG.MSG95); // "Giá không thể nhỏ hơn 0"

        if (!string.IsNullOrEmpty(dto.PaymentMethod) && dto.PaymentMethod.Length > 255)
            throw new Exception(MessageConstants.MSG.MSG87); // "Trạng thái không được vượt quá 255 ký tự"

        // ✅ Lấy kế hoạch điều trị cần cập nhật
        var plan = await _repo.GetPlanByPlanIdAsync(dto.PlanId, cancellationToken);
        if (plan == null)
            throw new Exception("Không tìm thấy kế hoạch điều trị");

        // ✅ Dùng AutoMapper để cập nhật dữ liệu
        _mapper.Map(dto, plan);
        plan.UpdatedAt = DateTime.Now;
        plan.UpdatedBy = currentUserId;

        // ✅ Lưu thay đổi
        await _repo.UpdateAsync(plan);

        int userIdNotification = plan.PatientId;
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
                    0, ""
                ), cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        return MessageConstants.MSG.MSG107; // "Cập nhật dữ liệu thành công"
    }
}