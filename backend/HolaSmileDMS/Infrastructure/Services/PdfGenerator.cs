using Application.Services;
using DinkToPdf;
using DinkToPdf.Contracts;

public class PdfGenerator : IPdfGenerator
{
    private readonly IConverter _converter;

    public PdfGenerator(IConverter converter)
    {
        _converter = converter;
    }

    public byte[] GeneratePdf(string htmlContent)
    {
        var doc = new HtmlToPdfDocument
        {
            GlobalSettings = new DinkToPdf.GlobalSettings
            {
                PaperSize = PaperKind.A4,
                Orientation = Orientation.Portrait,
                Margins = new MarginSettings
                {
                    Top = 10,
                    Bottom = 10
                }
            },
            Objects =
            {
                new ObjectSettings
                {
                    HtmlContent = htmlContent,
                    WebSettings = { DefaultEncoding = "utf-8" }
                }
            }
        };

        return _converter.Convert(doc);
    }
}