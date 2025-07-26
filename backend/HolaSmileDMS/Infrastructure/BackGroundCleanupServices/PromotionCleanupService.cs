using System.Threading;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Infrastructure.Repositories;
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
                // Tạo scope mới cho mỗi lần chạy
                using var scope = _scopeFactory.CreateScope();
                var promoRepo = scope.ServiceProvider.GetRequiredService<IPromotionrepository>();
                var ownerRepo = scope.ServiceProvider.GetRequiredService<IOwnerRepository>();
                var userRepo = scope.ServiceProvider.GetRequiredService<IUserCommonRepository>();

                var promotions = await promoRepo.GetAllPromotionProgramsAsync();
                foreach(var promotion in promotions)
                {
                    if (!promotion.IsDelete && DateTime.Now.Date < promotion.CreateDate.Date)
                    {
                        // Chưa tới ngày start → vẫn giữ nguyên
                        continue;
                    }
                    // đang unactive , đến ngày startdate và enddate >= hôm nay
                    if (promotion.IsDelete && promotion.CreateDate.Date == DateTime.Now.Date)
                    {
                        promotion.IsDelete = false; // Bật chương trình
                        promotion.UpdatedAt = DateTime.Now;
                        await promoRepo.UpdateDiscountProgramAsync(promotion);

                        try
                        {
                            var owners = await ownerRepo.GetAllOwnersAsync();
                            var receps = await userRepo.GetAllReceptionistAsync();

                            var notifyOwners = owners.Select(async o =>
                            await _mediator.Send(new SendNotificationCommand(
                                  o.User.UserID,
                                  "Taọ chương trình khuyến mãi",
                                  $"Chương trình khuyến mãi {promotion.DiscountProgramName} đã được áp dụng vào hôm nay",
                                  "promotion", null),
                            stoppingToken));
                            await System.Threading.Tasks.Task.WhenAll(notifyOwners);
                        }
                        catch { }
                    }
                    if (!promotion.IsDelete && promotion.EndDate.Date < DateTime.Now.Date)
                    {
                        promotion.IsDelete = true; // Tắt chương trình
                        promotion.UpdatedAt = DateTime.Now;
                        await promoRepo.UpdateDiscountProgramAsync(promotion);
                    }
                    }

                var now = DateTime.Now;
                var nextMidnight = now.Date.AddDays(1);
                var delay = nextMidnight - now;
                await System.Threading.Tasks.Task.Delay(delay, stoppingToken);
            }
        }
    }

}
