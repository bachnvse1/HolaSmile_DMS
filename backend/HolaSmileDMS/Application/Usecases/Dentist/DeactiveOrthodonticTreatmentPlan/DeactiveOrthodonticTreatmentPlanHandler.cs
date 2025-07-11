using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.DeactiveOrthodonticTreatmentPlan;

public class DeactiveOrthodonticTreatmentPlanHandler : IRequestHandler<DeactiveOrthodonticTreatmentPlanCommand, string>
{
    private readonly IOrthodonticTreatmentPlanRepository _repo;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeactiveOrthodonticTreatmentPlanHandler(
        IOrthodonticTreatmentPlanRepository repo,
        IHttpContextAccessor httpContextAccessor)
    {
        _repo = repo;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> Handle(DeactiveOrthodonticTreatmentPlanCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;
        var userIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var dentistIdClaim = user?.FindFirst("role_table_id")?.Value;
        if (user == null || string.IsNullOrEmpty(role) || string.IsNullOrEmpty(userIdStr))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện thao tác này"

        if (role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

        var plan = await _repo.GetPlanByPlanIdAsync(request.PlanId, cancellationToken);
        if (plan == null)
            throw new KeyNotFoundException("Không tìm thấy kế hoạch điều trị");
        
        if (plan.DentistId != int.Parse(dentistIdClaim))
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
        
        plan.IsDeleted = true;
        plan.UpdatedAt = DateTime.Now;
        plan.UpdatedBy = int.Parse(userIdStr);

        await _repo.UpdateAsync(plan);

        return MessageConstants.MSG.MSG57; // "Cập nhật dữ liệu thành công"
    }
}