using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Owner.ViewDashboard
{
    public class ViewDashboardDTO
    {
        public double TotalRevenue { get; set; }
        public int TotalAppoinemtn { get; set; }
        public int TotalPatient { get; set; }
        public int TotalEmployee { get; set; }
        public int NewPatient { get; set; }

    }
}
