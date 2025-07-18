using Application.Constants;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/transaction")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TransactionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        //[Authorize]
        [HttpGet("financial-transactions")]
        public async Task<IActionResult> GetListTransactions()
        {
            try
            {
                var result = await _mediator.Send(new ViewFinancialTransactionsCommand());
                return result == null ? NotFound(MessageConstants.MSG.MSG16) : Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }
    }
}
