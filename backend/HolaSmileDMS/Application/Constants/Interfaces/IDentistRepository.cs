using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Usecases.Dentist.ManageSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;

namespace Application.Constants.Interfaces
{
    public interface IDentistRepository
    {
        Task<List<Dentist>> GetAllDentistsAsync();
        Task<Dentist> GetDentistByUserIdAsync(int userId);


    }
}
