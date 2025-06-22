using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Owner
{
    public class ApproveDentistScheduleCommand : IRequest<string>
    {
        public List<int> ScheduleIds { get; set; } = new();
        public string Action { get; set; } = "approve";
    }
}
