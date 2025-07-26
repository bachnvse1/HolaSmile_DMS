using Application.Constants;
using Application.Usecases.Assistants.ExcelSupply;
using Application.Usecases.Owner.ApproveFinancialTransaction;
using Application.Usecases.Receptionist.CreateFinancialTransaction;
using Application.Usecases.Receptionist.DeactiveFinancialTransaction;
using Application.Usecases.Receptionist.EditFinancialTransaction;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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

        [Authorize]
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

        [Authorize]
        [HttpGet("financial-transactions/{TransactionID}")]
        public async Task<IActionResult> GetTransactionById([FromRoute]int TransactionID)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailFinancialTransactionsCommand(TransactionID));
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

        [Authorize]
        [HttpGet("expense-transaction")]
        public async Task<IActionResult> GetExpenseTransactions()
        {
            try
            {
                var result = await _mediator.Send(new ViewListExpenseCommand());
                return Ok(result);
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

        [Authorize]
        [HttpPost("financial-transactions")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateFinancialTransactionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return result ? Ok(MessageConstants.MSG.MSG122) : BadRequest(MessageConstants.MSG.MSG58);
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

        //[Authorize]
        [HttpPost("export-excel")]
        public async Task<IActionResult> ExportSupply()
        {
            try
            {
                var bytes = await _mediator.Send(new ExportTransactionToExcelCommand());
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "danh sách thu chi.xlsx");
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = false,
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("approve-financial-transactions/{transactionId}")]
        public async Task<IActionResult> ApproveTransaction([FromRoute] int transactionId)
        {
            try
            {
                var result = await _mediator.Send(new ApproveTransactionCommand(transactionId));
                return result ? Ok(MessageConstants.MSG.MSG130) : BadRequest(MessageConstants.MSG.MSG58);
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

        [Authorize]
        [HttpPut("edit-financial-transactions/{transactionId}")]
        public async Task<IActionResult> EditTransaction([FromRoute] int transactionId, [FromBody] EditFinancialTransactionCommand command)
        {
            if (transactionId != command.TransactionId)
            {
                return BadRequest(MessageConstants.MSG.MSG58);
            }
            try
            {
                var result = await _mediator.Send(command);
                return result ? Ok(MessageConstants.MSG.MSG122) : BadRequest(MessageConstants.MSG.MSG58);
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

        [Authorize]
        [HttpPut("Deactive-financial-transactions/{transactionId}")]
        public async Task<IActionResult> DeactiveTransaction([FromRoute] int transactionId)
        {
            try
            {
                var result = await _mediator.Send(new DeactiveFinancialTransactionCommand(transactionId));
                return result ? Ok(MessageConstants.MSG.MSG123) : BadRequest(MessageConstants.MSG.MSG58);
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
