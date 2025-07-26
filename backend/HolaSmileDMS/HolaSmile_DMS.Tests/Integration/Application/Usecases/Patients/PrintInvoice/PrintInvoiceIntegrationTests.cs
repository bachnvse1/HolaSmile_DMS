using System.Security.Claims;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Patients.ViewInvoices;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients.PrintInvoice;

public class PrintInvoiceIntegrationTests
    {
        private static (ServiceProvider sp, ApplicationDbContext db, Mock<IHttpContextAccessor> httpMock) BuildServices()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase(Guid.NewGuid().ToString()), ServiceLifetime.Singleton);

            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();

            // Mock IPrinter and IPdfGenerator
            var printerMock = new Mock<IPrinter>();
            printerMock.Setup(p => p.RenderInvoiceToHtml(It.IsAny<ViewInvoiceDto>()))
                       .Returns("<html>invoice</html>");
            services.AddSingleton<IPrinter>(printerMock.Object);

            var pdfMock = new Mock<IPdfGenerator>();
            pdfMock.Setup(p => p.GeneratePdf(It.IsAny<string>())).Returns(new byte[] { 1, 2, 3 });
            services.AddSingleton<IPdfGenerator>(pdfMock.Object);

            services.AddScoped<ViewDetailInvoiceHandler>();

            var httpMock = new Mock<IHttpContextAccessor>();
            services.AddSingleton<IHttpContextAccessor>(_ => httpMock.Object);

            var sp = services.BuildServiceProvider();
            var db = sp.GetRequiredService<ApplicationDbContext>();
            return (sp, db, httpMock);
        }

        private static async System.Threading.Tasks.Task SeedData(ApplicationDbContext db)
        {
            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();

            db.Users.Add(new User { UserID = 1, Username = "patient1", Fullname = "Patient 1", Phone = "0123" });
            db.Patients.Add(new Patient { PatientID = 1, UserID = 1 });

            db.Invoices.Add(new Invoice { InvoiceId = 1, PatientId = 1, TotalAmount = 500000, PaidAmount = 200000 });
            await db.SaveChangesAsync();
        }

        private static void SetupHttpContext(Mock<IHttpContextAccessor> mock, string role, int userId)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Role, role),
                new Claim("role_table_id", userId.ToString())
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            mock.Setup(x => x.HttpContext!.User).Returns(principal);
        }

        [Fact(DisplayName = "ITCID01 - Receptionist prints invoice successfully")]
        public async System.Threading.Tasks.Task ITCID01_PrintInvoice_Success()
        {
            var (sp, db, httpMock) = BuildServices();
            await SeedData(db);
            SetupHttpContext(httpMock, "Receptionist", 999);

            var handler = sp.GetRequiredService<ViewDetailInvoiceHandler>();
            var dto = await handler.Handle(new ViewDetailInvoiceCommand(1), CancellationToken.None);

            var printer = sp.GetRequiredService<IPrinter>();
            var pdf = sp.GetRequiredService<IPdfGenerator>();
            var html = printer.RenderInvoiceToHtml(dto);
            var pdfBytes = pdf.GeneratePdf(html);

            Assert.NotNull(pdfBytes);
            Assert.True(pdfBytes.Length > 0);
        }

        [Fact(DisplayName = "ITCID02 - Print fails when invoice not found")]
        public async System.Threading.Tasks.Task ITCID02_PrintInvoice_InvoiceNotFound()
        {
            var (sp, db, httpMock) = BuildServices();
            await SeedData(db);
            SetupHttpContext(httpMock, "Receptionist", 999);

            var handler = sp.GetRequiredService<ViewDetailInvoiceHandler>();

            await Assert.ThrowsAsync<Exception>(() =>
                handler.Handle(new ViewDetailInvoiceCommand(999), CancellationToken.None));
        }
    }