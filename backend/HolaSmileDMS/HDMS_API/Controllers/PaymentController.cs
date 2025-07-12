using Application.Services;
using Application.Usecases.Patients.PaymentOnline;
using Newtonsoft.Json.Linq;
namespace HDMS_API.Controllers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/payment")]
public class PaymentController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var rawJson = await reader.ReadToEndAsync();

        await _mediator.Send(new UpdateInvoiceFromWebhookCommand(rawJson));

        return Ok();
    }
    
    
    [HttpPost("create-link")]
    public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentLinkCommand command)
    {
        var checkoutUrl = await _mediator.Send(command);
        return Ok(new { checkoutUrl });
    }
}