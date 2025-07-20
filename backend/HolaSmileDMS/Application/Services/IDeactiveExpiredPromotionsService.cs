
namespace Application.Services
{
    public interface IDeactiveExpiredPromotionsService
    {
        Task<bool> DeactiveExpiredPromotionsAsync();
    }
}
