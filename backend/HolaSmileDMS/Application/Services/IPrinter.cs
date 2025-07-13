using Application.Usecases.Patients.ViewDentalRecord;
using Application.Usecases.Patients.ViewInvoices;

namespace Application.Services;

public interface IPrinter
{
    string RenderDentalExamSheetToHtml(DentalExamSheetDto sheet);
    string RenderInvoiceToHtml(ViewInvoiceDto invoice);
}