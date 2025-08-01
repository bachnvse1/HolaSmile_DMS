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
            services.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();
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

            services.AddHttpClient<IEsmsService, SmsService>();

            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
            services.AddCors(options =>
            {

                options.AddPolicy(name: MyAllowSpecificOrigins,
                        policy =>
                        {
                            policy.WithOrigins(
                                    "https://dd4b55c264ef.ngrok-free.app",
                                    "http://localhost:5173"
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

            //background services
            services.AddHostedService<PromotionCleanupService>();
            services.AddHostedService<AppointmentCleanupService>();
            services.AddHostedService<EmailCleanupService>();



            // Caching
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
