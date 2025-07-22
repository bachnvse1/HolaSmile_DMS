using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;

namespace Application.Usecases.Receptionist.UpdateInvoice
{
    public class UpdateOrderCodeHandler : IRequestHandler<UpdateOrderCodeCommand, string>
    {
        private readonly IInvoiceRepository _invoiceRepository;

        public UpdateOrderCodeHandler(IInvoiceRepository invoiceRepository)
        {
            _invoiceRepository = invoiceRepository;
        }

        public async Task<string> Handle(UpdateOrderCodeCommand request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByOrderCodeAsync(request.OrderCode, cancellationToken);
            if (invoice == null)
                throw new KeyNotFoundException("Invoice not found.");
            var orderCode = $"{DateTime.Now:yyMMddHHmm}{new Random().Next(10, 99)}";
            invoice.OrderCode = orderCode;
            invoice.PaymentUrl = "";
            await _invoiceRepository.UpdateAsync(invoice, cancellationToken);

            return "success";
        }
    }
}