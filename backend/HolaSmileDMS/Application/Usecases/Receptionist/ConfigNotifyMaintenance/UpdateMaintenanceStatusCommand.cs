using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class UpdateMaintenanceStatusCommand : IRequest<bool>
    {   
        public int MaintenanceId { get; set; }

    }
}
