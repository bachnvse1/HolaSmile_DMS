using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface ISupplyRepository
    {
        Task<bool> CreateSupplyAsync(Supplies supply);
        Task<Supplies> GetSupplyBySupplyIdAsync(int supplyId);
        Task<Supplies> GetExistSupply(string? supplyName, decimal price, DateTime? experydate);
        Task<bool> EditSupplyAsync(Supplies supply);
        Task<List<Supplies>> GetAllSuppliesAsync();
    }
}
