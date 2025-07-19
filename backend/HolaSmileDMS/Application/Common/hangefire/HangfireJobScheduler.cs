using Application.Services;
using Hangfire;

namespace Application.Common.hangefire
{
    public class HangfireJobScheduler
    {
        public static void ScheduleJobs()
        {
            RecurringJob.AddOrUpdate<IDeactiveExpiredPromotionsService>(
                "deactive-expired-promotions",
                service => service.DeactiveExpiredPromotionsAsync(),
                Cron.Daily
            );
        }
    }
}
