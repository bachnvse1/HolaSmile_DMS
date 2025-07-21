using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace HDMS_API.Container.DependencyInjection
{
    public static class AuthenticationRegistration
    {
        public static IServiceCollection AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
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
                        // Cho phép truyền token qua query string khi kết nối SignalR
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path        = context.HttpContext.Request.Path;

                            // Chỉ áp dụng với endpoint Hub /notify
                            if (!string.IsNullOrEmpty(accessToken) &&
                                (path.StartsWithSegments("/notify") || path.StartsWithSegments("/chat")))
                            {
                                context.Token = accessToken;
                            }
                            return System.Threading.Tasks.Task.CompletedTask;
                        },

                        // (Tuỳ chọn) Đảm bảo UserIdentifier = NameIdentifier
                        OnTokenValidated = context =>
                        {
                            var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                            if (claimsIdentity != null &&
                                claimsIdentity.FindFirst(ClaimTypes.NameIdentifier) == null)
                            {
                                // Giả sử sub = userId
                                var sub = claimsIdentity.FindFirst("sub")?.Value;
                                if (sub != null)
                                    claimsIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));
                            }
                            return System.Threading.Tasks.Task.CompletedTask;
                        }
                    };
                }).AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
                {
                    options.ClientId = configuration["Authentication:Google:ClientId"];
                    options.ClientSecret = configuration["Authentication:Google:ClientSecret"];
                    options.CallbackPath = "/signin-google";
                    options.SaveTokens = true;
                });
            services.AddHttpContextAccessor();
            return services;
        }
    }
}
