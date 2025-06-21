using Application.Usecases.Dentist.ViewDentistSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/Dentist")]
    [ApiController]
    public class DentistController : ControllerBase
    {
        private readonly IMediator _mediator;
        public DentistController(IMediator mediator)
        {
            _mediator = mediator;
        }

        
    }
}
