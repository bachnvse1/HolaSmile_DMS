using Application.Usecases.UserCommon.ViewListProcedure;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[Route("api/procedures")]
[ApiController]
public class ProceduresController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProceduresController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetProcedures()
    {
        var result = await _mediator.Send(new ViewListProcedureCommand());
        return Ok(result);
    }
}