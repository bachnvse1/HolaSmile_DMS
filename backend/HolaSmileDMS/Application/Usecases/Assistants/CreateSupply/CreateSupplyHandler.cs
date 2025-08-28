using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class CreateSupplyHandler : IRequestHandler<CreateSupplyCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;
        public CreateSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository, IOwnerRepository ownerRepository, IUserCommonRepository userCommonRepository, IMediator mediator) 
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
            _userCommonRepository = userCommonRepository;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(CreateSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = user.FindFirstValue(ClaimTypes.Role);

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            if (string.IsNullOrWhiteSpace(request.SupplyName) || string.IsNullOrWhiteSpace(request.Unit))
                throw new ArgumentException(MessageConstants.MSG.MSG07);

            //if (request.QuantityInStock <= 0)
            //    throw new ArgumentException(MessageConstants.MSG.MSG94);

            if (request.Price <= 0)
                throw new ArgumentException(MessageConstants.MSG.MSG95);

            //if (request.ExpiryDate?.Date < DateTime.Today)
            //    throw new ArgumentException(MessageConstants.MSG.MSG96);

            ////var existSupply = await _supplyRepository.GetExistSupply(request.SupplyName, request.Price, request.ExpiryDate);
            //if (existSupply != null)
            //{
            //    existSupply.QuantityInStock += request.QuantityInStock;
            //    existSupply.UpdatedAt = DateTime.Now;
            //    existSupply.UpdatedBy = currentUserId;
            //    return await _supplyRepository.EditSupplyAsync(existSupply);
            //}

            var newSupply = new Supplies
            {
                Name = request.SupplyName.Trim(),
                Unit = request.Unit,
                //QuantityInStock = request.QuantityInStock,
                Price = Math.Round(request.Price, 2),
                //ExpiryDate = request.ExpiryDate,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };
            var isSupplyCreated = await _supplyRepository.CreateSupplyAsync(newSupply);

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var assistant = await _userCommonRepository.GetByIdAsync(currentUserId, cancellationToken);

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Nhập vật tư",
                      $"Trợ lý {assistant.Fullname} nhập vật tư mới {newSupply.Name} vào lúc {DateTime.Now.ToString("dd/MM/yyyy")}",
                      "supply", 0, $"inventory/{newSupply.SupplyId}"),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return isSupplyCreated;
        }
    }
}
