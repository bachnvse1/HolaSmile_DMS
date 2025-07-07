namespace Application.Services;

public interface IPdfGenerator
{
    byte[] GeneratePdf(string htmlContent);
}
