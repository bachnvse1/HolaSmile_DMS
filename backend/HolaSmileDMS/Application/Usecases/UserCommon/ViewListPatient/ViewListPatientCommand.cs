using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewListPatientCommand : IRequest<List<ViewListPatientDto>>
    {
        public int UserId { get; set; }
    }
}
