using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Container.DependencyInjection
{
    public static class AuthenticationRegistration
    {
        public static IServiceCollection AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // 1. Đăng ký AllowAnonymous handler
            services.AddAuthentication("SmartScheme")
                .AddScheme<AuthenticationSchemeOptions, AllowAnonymousHandler>("AllowAnonymous", options => { })

                // 2. JWT Bearer cho user thật
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = configuration["Jwt:Issuer"],
                        ValidAudience = configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var path = context.HttpContext.Request.Path;
                            if (path.StartsWithSegments("/chat") || path.StartsWithSegments("/notify"))
                            {
                                var token = context.Request.Query["access_token"];
                                if (!string.IsNullOrEmpty(token))
                                    context.Token = token;
                            }
                            return System.Threading.Tasks.Task.CompletedTask;
                        },

                        OnTokenValidated = context =>
                        {
                            var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                            if (claimsIdentity != null &&
                                claimsIdentity.FindFirst(ClaimTypes.NameIdentifier) == null)
                            {
                                var sub = claimsIdentity.FindFirst("sub")?.Value;
                                if (sub != null)
                                    claimsIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));
                            }
                            return System.Threading.Tasks.Task.CompletedTask;
                        }
                    };
                })

                // 3. Cookie + Google (nếu cần)
                .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
                {
                    options.ClientId = configuration["Authentication:Google:ClientId"];
                    options.ClientSecret = configuration["Authentication:Google:ClientSecret"];
                    options.CallbackPath = "/signin-google";
                    options.SaveTokens = true;
                })

                // 4. SmartScheme: chọn JWT hoặc AllowAnonymous theo đường dẫn
                .AddPolicyScheme("SmartScheme", "SmartScheme for SignalR", options =>
                {
                    options.ForwardDefaultSelector = context =>
                    {
                        var path = context.Request.Path;

                        if (path.StartsWithSegments("/guest-chat"))
                            return "AllowAnonymous";

                        return JwtBearerDefaults.AuthenticationScheme;
                    };
                });

            // Đặt scheme mặc định
            services.Configure<AuthenticationOptions>(opts =>
            {
                opts.DefaultScheme = "SmartScheme";
            });

            services.AddHttpContextAccessor();
            return services;
        }
    }

    // ⭐ Handler cho phép truy cập anonymous
    public class AllowAnonymousHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public AllowAnonymousHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock) { }

        protected override System.Threading.Tasks.Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Cho phép guest truy cập mà không cần auth
            var identity = new ClaimsIdentity();
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return System.Threading.Tasks.Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
