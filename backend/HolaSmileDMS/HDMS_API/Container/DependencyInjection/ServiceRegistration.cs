using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using Application.Common.Mappings;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.SendNotification;
using DinkToPdf;
using DinkToPdf.Contracts;
using HDMS_API.Application.Common.Mappings;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using HDMS_API.Infrastructure.Services;
using Infrastructure.BackGroundCleanupServices;
using Infrastructure.BackGroundServices;
using Infrastructure.Configurations;
using Infrastructure.Hubs;
using Infrastructure.Repositories;
using Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Container.DependencyInjection
{
    // Handler bơm sẵn Proxy-Authorization: Basic <base64(user:pass)>
    internal sealed class ProxyAuthHandler : DelegatingHandler
    {
        private readonly string? _basic;

        public ProxyAuthHandler(IConfiguration cfg)
        {
            var proxyUrl = cfg["Gemini:Proxy:Url"]; // ví dụ: http://user:pass@ip:port
            if (string.IsNullOrWhiteSpace(proxyUrl)) return;

            var uri = new Uri(proxyUrl);
            if (!string.IsNullOrEmpty(uri.UserInfo) && uri.UserInfo.Contains(":"))
            {
                var parts = uri.UserInfo.Split(':', 2);
                var user = Uri.UnescapeDataString(parts[0]);
                var pass = Uri.UnescapeDataString(parts[1]);
                _basic = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{user}:{pass}"));
            }
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            if (!string.IsNullOrEmpty(_basic))
            {
                // Không phải runtime nào cũng có property mạnh; dùng TryAddWithoutValidation cho chắc
                request.Headers.TryAddWithoutValidation("Proxy-Authorization", $"Basic {_basic}");
            }
            return base.SendAsync(request, ct);
        }
    }

    public static class ServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // DB Context
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<ApplicationDbContext>(
                options => options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)),
                ServiceLifetime.Scoped
            );

            // ===== Gemini HttpClient qua proxy (có Credentials + pre-auth header) =====
            services.AddTransient<ProxyAuthHandler>();

            services.AddHttpClient("Gemini", client =>
                {
                    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
                    // có thể thêm Accept nếu muốn:
                    // client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                })
                .AddHttpMessageHandler<ProxyAuthHandler>() // bơm Proxy-Authorization sớm (trị 407)
                .ConfigurePrimaryHttpMessageHandler(sp =>
                {
                    var cfg = sp.GetRequiredService<IConfiguration>();
                    var useProxy = cfg.GetValue<bool>("Gemini:Proxy:Enabled");

                    var handler = new HttpClientHandler
                    {
                        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
                        UseProxy = useProxy
                    };

                    if (useProxy)
                    {
                        var proxyUrl = cfg["Gemini:Proxy:Url"]; // "http://user:pass@ip:port"
                        if (!string.IsNullOrWhiteSpace(proxyUrl))
                        {
                            var uri = new Uri(proxyUrl);

                            // Lấy user/pass từ uri.UserInfo (user:pass)
                            NetworkCredential? creds = null;
                            if (!string.IsNullOrEmpty(uri.UserInfo) && uri.UserInfo.Contains(":"))
                            {
                                var parts = uri.UserInfo.Split(':', 2);
                                var user = Uri.UnescapeDataString(parts[0]);
                                var pass = Uri.UnescapeDataString(parts[1]);
                                creds = new NetworkCredential(user, pass);
                            }

                            var webProxy = new WebProxy
                            {
                                Address = new Uri($"{uri.Scheme}://{uri.Host}:{uri.Port}"),
                                BypassProxyOnLocal = false,
                                UseDefaultCredentials = false,
                                Credentials = creds // <-- QUAN TRỌNG: gán credentials cho proxy
                            };

                            handler.Proxy = webProxy;
                            handler.PreAuthenticate = true; // không hại, vài proxy vẫn cần
                        }
                    }

                    return handler;
                });
            // ==========================================================================

            // Repository & Services
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IGoogleAuthService, GoogleAuthService>();
            services.AddScoped<IGuestRepository, GuestRepository>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<IPatientRepository, PatientRepository>();
            services.AddScoped<IDentistRepository, DentistRepository>();
            services.AddScoped<ISupplyRepository, SupplyRepository>();
            services.AddScoped<IUserCommonRepository, UserCommonRepository>();
            services.AddScoped<ITreatmentRecordRepository, TreatmentRecordRepository>();
            services.AddScoped<IScheduleRepository, ScheduleRepository>();
            services.AddSingleton<IHashIdService, HashIdService>();

            // LƯU Ý: bạn đang đăng ký ITreatmentProgressRepository 2 lần — mình giữ 1 dòng thôi cho sạch
            services.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();

            services.AddScoped<INotificationsRepository, NotificationsRepository>();
            services.AddScoped<IAssistantRepository, AssistantRepository>();
            services.AddScoped<IProcedureRepository, ProcedureRepository>();
            services.AddScoped<IReceptionistRepository, ReceptionistRepository>();
            services.AddScoped<IFileStorageService, FileStorageService>();
            services.AddScoped<IOrthodonticTreatmentPlanRepository, OrthodonticTreatmentPlanRepository>();
            services.AddScoped<ITaskRepository, TaskRepository>();
            services.AddScoped<IWarrantyCardRepository, WarrantyCardRepository>();
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();
            services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
            services.AddScoped<IInstructionRepository, InstructionRepository>();
            services.AddScoped<IOwnerRepository, OwnerRepository>();
            services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
            services.AddScoped<IPdfGenerator, PdfGenerator>();
            services.AddScoped<IPrinter, Printer>();
            services.AddScoped<IPrescriptionTemplateRepository, PrescriptionTemplateRepository>();
            services.AddScoped<IInstructionTemplateRepository, InstructionTemplateRepository>();
            services.AddScoped<IPayOSService, PayOSService>();
            services.Configure<PayOSOptions>(configuration.GetSection("PayOS"));
            services.AddScoped<IPayOSConfiguration, PayOSConfiguration>();
            services.AddScoped<ICloudinaryService, CloudinaryService>();
            services.AddScoped<IImageRepository, ImageRepository>();
            services.AddScoped<ITransactionRepository, TransactionRepository>();
            services.AddScoped<IPromotionRepository, PromotionRepository>();
            services.AddScoped<IMaintenanceRepository, MaintenanceRepository>();
            services.AddScoped<IChatBotKnowledgeRepository, ChatBotKnowledgeRepository>();

            services.AddHttpClient<IEsmsService, SmsService>();

            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
            services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                    policy =>
                    {
                        policy.WithOrigins(
                                "https://holasmile.id.vn",
                                "http://localhost:5173",
                                "http://localhost:3000",
                                "http://localhost"
                            )
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    });
            });

            // MediatR
            services.AddMediatR(typeof(CreatePatientCommand).Assembly);
            services.AddMediatR(typeof(LoginCommand).Assembly);
            services.AddMediatR(typeof(SendNotificationHandler).Assembly);

            // AutoMapper
            services.AddAutoMapper(typeof(MappingViewTreatmentRecord));
            services.AddAutoMapper(typeof(MappingCreatePatient));
            services.AddAutoMapper(typeof(MappingAppointment));
            services.AddAutoMapper(typeof(MappingTreatmentProgress).Assembly);
            services.AddAutoMapper(typeof(OrthodonticTreatmentPlanProfile).Assembly);

            services.AddHostedService<PromotionCleanupService>();
            services.AddHostedService<AppointmentCleanupService>();
            services.AddHostedService<EmailCleanupService>();

            // Caching + SignalR
            services.AddMemoryCache();
            services.AddHttpClient();
            services.AddSignalR()
                .AddHubOptions<NotifyHub>(options =>
                {
                    options.EnableDetailedErrors = true;
                });

            return services;
        }
    }
}