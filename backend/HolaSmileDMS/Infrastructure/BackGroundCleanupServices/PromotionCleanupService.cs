using System.Threading;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundCleanupServices
{
    public class PromotionCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IMediator _mediator;

        public PromotionCleanupService(IServiceScopeFactory scopeFactory, IMediator mediator)
        {
            _scopeFactory = scopeFactory;
            _mediator = mediator;
        }
        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var promoRepo = scope.ServiceProvider.GetRequiredService<IPromotionRepository>();
                var ownerRepo = scope.ServiceProvider.GetRequiredService<IOwnerRepository>();
                var userRepo = scope.ServiceProvider.GetRequiredService<IUserCommonRepository>();

                var promotions = await promoRepo.GetAllPromotionProgramsAsync();

                foreach (var promotion in promotions)
                {
                    bool statusChange = false;
                    // Bật promotion khi StartDate = hôm nay
                    if (promotion.IsDelete && promotion.CreateDate.Date == DateTime.Now.Date)
                    {
                        promotion.IsDelete = false;
                        promotion.UpdatedAt = DateTime.Now;
                        await promoRepo.UpdateDiscountProgramAsync(promotion);
                        statusChange = true;
                    }

                    // Tắt promotion khi EndDate < hôm nay
                    if (!promotion.IsDelete && promotion.EndDate.Date < DateTime.Now.Date)
                    {
                        promotion.IsDelete = true;
                        promotion.UpdatedAt = DateTime.Now;
                        await promoRepo.UpdateDiscountProgramAsync(promotion);
                        statusChange = true;
                    }
                    if (!statusChange)
                        continue;

                    // Gửi notification cho owner và receptionist
                    try
                    {
                        var owners = await ownerRepo.GetAllOwnersAsync();
                        var receps = await userRepo.GetAllReceptionistAsync();

                        var notifyOwners = owners.Select(o =>
                            _mediator.Send(new SendNotificationCommand(
                                o.User.UserID,
                                "Kết thúc chương trình khuyến mãi",
                                $"Chương trình khuyến mãi {promotion.DiscountProgramName} đã {(promotion.IsDelete ? "kết thúc" : "áp dụng")} vào lúc {DateTime.Now}",
                                "promotion", null, $"promotions/{promotion.DiscountProgramID}"),
                            stoppingToken)).ToList();

                        await System.Threading.Tasks.Task.WhenAll(notifyOwners);

                        var notifyReceps = receps.Select(r =>
                            _mediator.Send(new SendNotificationCommand(
                                r.User.UserID,
                                "Kết thúc chương trình khuyến mãi",
                                $"Chương trình khuyến mãi {promotion.DiscountProgramName} đã {(promotion.IsDelete ? "kết thúc" : "áp dụng")} vào lúc {DateTime.Now}",
                                "promotion", null, $"promotions/{promotion.DiscountProgramID}"), stoppingToken)).ToList();

                        await System.Threading.Tasks.Task.WhenAll(notifyReceps);
                    }
                    catch { }
                }

                // Delay tới 0h hôm sau
                var now = DateTime.Now;
                var nextMidnight = now.Date.AddDays(1);
                var delay = nextMidnight - now;
                await System.Threading.Tasks.Task.Delay(delay, stoppingToken);
            }
        }

    }
}
