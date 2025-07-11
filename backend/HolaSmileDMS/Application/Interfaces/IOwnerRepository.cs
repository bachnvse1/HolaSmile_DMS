using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IOwnerRepository
    {
        Task<List<Owner>> GetAllOwnersAsync();
        Task<Owner> GetOwnerByUserIdAsync(int? userId);
    }
}
