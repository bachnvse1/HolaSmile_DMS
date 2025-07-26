using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using NuGet.Protocol.Core.Types;

namespace Application.Usecases.Receptionist.CreateFinancialTransaction
{
    public class CreateFinancialTransactionHandler : IRequestHandler<CreateFinancialTransactionCommand, bool>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IImageRepository _imageRepository;
        private readonly ICloudinaryService _cloudService;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public CreateFinancialTransactionHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor, IImageRepository imageRepository, ICloudinaryService cloudinaryService, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
            _imageRepository = imageRepository;
            _cloudService = cloudinaryService;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CreateFinancialTransactionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (request.Description.Trim().IsNullOrEmpty()) throw new Exception(MessageConstants.MSG.MSG07);
            if (request.Amount <= 0) throw new Exception(MessageConstants.MSG.MSG95);

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/tiff", "image/heic" };

            if (!allowedTypes.Contains(request.EvidentImage.ContentType))
                throw new ArgumentException("Vui lòng chọn ảnh có định dạng jpeg/png/bmp/gif/webp/tiff/heic");

            var imageUrl = await _cloudService.UploadEvidentImageAsync(request.EvidentImage);

            var newTransaction = new FinancialTransaction
            {
                TransactionType = request.TransactionType,
                IsConfirmed = request.TransactionType, // Assuming IsConfirmed is true for thu and false for chi
                Description = request.Description,
                Amount = request.Amount,
                Category = request.Category,
                PaymentMethod = request.PaymentMethod,
                TransactionDate = request.TransactionDate,
                EvidenceImage = imageUrl,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.Now,
                IsDelete = false
            };
            var iscreated = await _transactionRepository.CreateTransactionAsync(newTransaction);

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(
                 new SendNotificationCommand(
                o.User.UserID,
                "Tạo phiếu thu/chi",
                $"Lễ tân {o.User.Fullname} đã tạo phiếu {(newTransaction.TransactionType ? "thu" : "chi")} vào lúc {DateTime.Now}",
                "transaction",0, $"financial-transactions/{newTransaction.TransactionID}"),cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return iscreated;

        }
    }
}
