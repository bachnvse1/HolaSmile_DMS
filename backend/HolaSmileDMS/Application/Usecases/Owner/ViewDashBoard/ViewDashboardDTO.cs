using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Owner.ViewDashboard
{
    public class ViewDashboardDTO
    {
        public decimal TotalRevenue { get; set; }
        public int TotalAppointments { get; set; }
        public int TotalPatient { get; set; }
        public int TotalEmployee { get; set; }
        public int NewPatient { get; set; }
        public DashboardNotiData NewInvoice { get; set; } = new DashboardNotiData();
        public DashboardNotiData NewPatientAppointment { get; set; } = new DashboardNotiData();
        public DashboardNotiData NewAppointment { get; set; } = new DashboardNotiData();
        public DashboardNotiData UnpaidInvoice { get; set; } = new DashboardNotiData();
        public DashboardNotiData UnapprovedTransaction { get; set; } = new DashboardNotiData();
        public DashboardNotiData UnderMaintenance { get; set; } = new DashboardNotiData();
    }

    public class DashboardNotiData
    {
        public string? data { get; set; }
        public string? time { get; set; }
    }
}
