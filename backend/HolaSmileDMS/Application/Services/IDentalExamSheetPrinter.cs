using Application.Usecases.Patients.ViewDentalRecord;

namespace Application.Services;

public interface IDentalExamSheetPrinter
{
    string RenderDentalExamSheetToHtml(DentalExamSheetDto sheet);
}