using HDMS_API.Container.DependencyInjection;
using Infrastructure.Hubs;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("https://localhost:5001");
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddAuthenticationServices(builder.Configuration); 
var dllPath = Path.Combine(Directory.GetCurrentDirectory(), "wkhtmltopdf", "libwkhtmltox.dll");

var context = new CustomAssemblyLoadContext();
context.LoadUnmanagedLibrary(dllPath);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "HDMS_API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer" 
                }
            },
            new string[]{}
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// CORS
app.UseCors("_myAllowSpecificOrigins");

app.UseRouting();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<NotifyHub>("/notify");
app.MapHub<ChatHub>("/chat");

app.Use(async (ctx, next) =>
{
    Console.WriteLine($"[DEBUG] Request: {ctx.Request.Path} - Authenticated: {ctx.User.Identity?.IsAuthenticated}");
    await next();
});

app.Run();
public partial class Program { }