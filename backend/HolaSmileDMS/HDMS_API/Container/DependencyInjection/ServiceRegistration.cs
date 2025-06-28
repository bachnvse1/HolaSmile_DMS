using Application.Common.Mappings;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.SendNotification;
using HDMS_API.Application.Common.Mappings;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using HDMS_API.Infrastructure.Services;
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
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            // Repository & Services
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IGoogleAuthService, GoogleAuthService>();
            services.AddScoped<IGuestRepository, GuestRepository>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<IPatientRepository, PatientRepository>();
            services.AddScoped<IDentistRepository, DentistRepository>();
            services.AddScoped<IUserCommonRepository, UserCommonRepository>();
            services.AddScoped<ITreatmentRecordRepository, TreatmentRecordRepository>();
            services.AddScoped<IScheduleRepository, ScheduleRepository>();
            services.AddSingleton<IHashIdService, HashIdService>();
            services.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();
            services.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();
            services.AddScoped<INotificationsRepository, NotificationsRepository>();
            
            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
            services.AddCors(options =>
            {
                
                options.AddPolicy(name: MyAllowSpecificOrigins,
                        policy =>
                        {
                            policy.WithOrigins(
                                    "https://6f8f-14-232-61-47.ngrok-free.app",
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
