using Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundCleanupServices
{
    public class PromotionCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _interval;

        public PromotionCleanupService(
            IServiceScopeFactory scopeFactory,
            TimeSpan? interval = null)
        {
            _scopeFactory = scopeFactory;
            // Cho test dễ override interval; production sẽ dùng 24h
            _interval = interval ?? TimeSpan.FromHours(24);
        }

        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                // Tạo scope mới cho mỗi lần chạy
                using var scope = _scopeFactory.CreateScope();
                var promoRepo = scope.ServiceProvider
                                     .GetRequiredService<IPromotionrepository>();

                var promotion = await promoRepo.GetProgramActiveAsync();
                if (promotion != null && promotion.EndDate < DateTime.Now)
                {
                    promotion.IsDelete = true;
                    promotion.UpdatedAt = DateTime.Now;
                    await promoRepo.UpdateDiscountProgramAsync(promotion);
                }

                await System.Threading.Tasks.Task.Delay(_interval, stoppingToken);
            }
        }
    }

}
