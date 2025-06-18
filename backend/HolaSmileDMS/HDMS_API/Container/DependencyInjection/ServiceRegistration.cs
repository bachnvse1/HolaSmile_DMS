using Application.Interfaces;
using HDMS_API.Application.Common.Mappings;
using HDMS_API.Application.Common.Services;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using HDMS_API.Infrastructure.Services;
using Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;


namespace HDMS_API.DependencyInjection
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
            //services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IUserCommonRepository, UserCommonRepository>();
            services.AddScoped<IUserRoleChecker, UserRoleChecker>();
            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
            services.AddCors(options =>
            {
                
                options.AddPolicy(name: MyAllowSpecificOrigins,
                        policy =>
                        {
                            policy.WithOrigins(
                                    "https://6f8f-14-232-61-47.ngrok-free.app",  // Production (ngrok)
                                    "http://localhost:5173"                       // Localhost FE
                                )
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                        });
            });

            // MediatR
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssemblyContaining<CreatePatientCommand>());
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssemblyContaining<LoginCommand>());

            // AutoMapper
            services.AddAutoMapper(typeof(MappingCreatePatient));

            // Caching
            services.AddMemoryCache();
            services.AddHttpClient();

            return services;
        }
    }
}
