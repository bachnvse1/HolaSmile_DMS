using Application.Interfaces;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Application.Constants;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Receptionist.EditFinancialTransaction
{
    public class EditFinancialTransactionHandler : IRequestHandler<EditFinancialTransactionCommand, bool>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICloudinaryService _cloudService;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMediator _mediator;

        public EditFinancialTransactionHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor, ICloudinaryService cloudinaryService, IOwnerRepository ownerRepository, IUserCommonRepository userCommonRepository, IMediator mediator)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
            _cloudService = cloudinaryService;
            _ownerRepository = ownerRepository;
            _userCommonRepository = userCommonRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(EditFinancialTransactionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (string.IsNullOrWhiteSpace(request.Description)) throw new Exception(MessageConstants.MSG.MSG07);
            if (request.Amount <= 0) throw new Exception(MessageConstants.MSG.MSG95);

            var existingTransaction = await _transactionRepository.GetTransactionByIdAsync(request.TransactionId);
            if (existingTransaction == null)
            {
                throw new Exception(MessageConstants.MSG.MSG127);
            }
            var imageUrl = "";

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/tiff", "image/heic" };


            if (!request.TransactionType && request.EvidenceImage == null)
            {
                throw new Exception("Vui lòng tải lên ảnh chứng từ cho phiếu chi");
            }

            if (request.EvidenceImage != null)
            {
                if (!allowedTypes.Contains(request.EvidenceImage.ContentType))
                    throw new ArgumentException("Vui lòng chọn ảnh có định dạng jpeg/png/bmp/gif/webp/tiff/heic");
                imageUrl = await _cloudService.UploadEvidenceImageAsync(request.EvidenceImage);
            }

            if (existingTransaction.status != "pending")
            {
                throw new Exception(MessageConstants.MSG.MSG129 + ", không thể chỉnh sửa"); // "Không thể chỉnh sửa giao dịch đã được xác nhận"
            }

            // Additional validation: Only allow edit if current user is the creator
            if (existingTransaction.CreatedBy != currentUserId)
            {
                throw new Exception("Bạn chỉ có thể chỉnh sửa giao dịch do chính bạn tạo");
            }
            existingTransaction.Description = request.Description;
            existingTransaction.TransactionType = request.TransactionType;
            existingTransaction.Amount = request.Amount;
            existingTransaction.Category = request.Category;
            existingTransaction.PaymentMethod = request.PaymentMethod;
            existingTransaction.TransactionDate = request.TransactionDate;
            existingTransaction.UpdatedBy = currentUserId;
            existingTransaction.UpdatedAt = DateTime.Now;
            existingTransaction.EvidenceImage = imageUrl;

            var isUpdated = await _transactionRepository.UpdateTransactionAsync(existingTransaction);

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var recep = await _userCommonRepository.GetByIdAsync(currentUserId, cancellationToken);

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(
                 new SendNotificationCommand(
                o.User.UserID,
                "Chỉnh sửa phiếu thu/chi",
                $"Lễ tân {recep.Fullname} đã chỉnh sửa phiếu {(existingTransaction.TransactionType ? "thu" : "chi")} vào lúc {DateTime.Now}",
                "transaction", 0, $"financial-transactions/{existingTransaction.TransactionID}"), cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }
            return isUpdated;
        }
    }
}
