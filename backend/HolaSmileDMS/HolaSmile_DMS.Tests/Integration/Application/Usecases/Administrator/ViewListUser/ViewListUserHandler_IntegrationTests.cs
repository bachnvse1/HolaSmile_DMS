//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Security.Claims;
//using Microsoft.Extensions.Caching.Memory;
//using Application.Services;
//using Application.Usecases.Admintrator;
//using HDMS_API.Application.Interfaces;
//using HDMS_API.Infrastructure.Persistence;
//using HDMS_API.Infrastructure.Repositories;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.DependencyInjection;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Admintrator.ViewListUser
//{
//    public class ViewListUserHandler_IntegrationTests
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly IHttpContextAccessor _httpContextAccessor;
//        private readonly ViewListUserHandler _handler;

//        public ViewListUserHandler_IntegrationTests()
//        {
//            var services = new ServiceCollection();
//            services.AddDbContext<ApplicationDbContext>(opt => opt.UseInMemoryDatabase("TestDB_Users"));
//            services.AddHttpContextAccessor();
//            services.AddMemoryCache();
//            services.AddScoped<IEmailService, FakeEmailService>();

//            var provider = services.BuildServiceProvider();
//            _context = provider.GetRequiredService<ApplicationDbContext>();
//            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

//            var emailService = provider.GetRequiredService<IEmailService>();
//            var memoryCache = provider.GetRequiredService<IMemoryCache>();

//            SeedDb(_context);
//            _handler = new ViewListUserHandler(new UserCommonRepository(_context), _httpContextAccessor);
//        }

//        private void SetupHttpContext(string role, int userId)
//        {
//            var claims = new[]
//            {
//            new Claim(ClaimTypes.Role, role),
//            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
//        };
//            var identity = new ClaimsIdentity(claims, "Test");
//            var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
//            _httpContextAccessor.HttpContext = context;
//        }

//        private void SeedDb(ApplicationDbContext context)
//        {
//            context.Users.RemoveRange(context.Users);
//            context.SaveChanges();

//            context.Users.Add(new User
//            {
//                UserID = 1,
//                Username = "admin",
//                Email = "admin@example.com",
//                CreatedAt = DateTime.UtcNow
//            });
//            context.Owners.Add(new Owner
//            {
//                UserID = 1,
//            });

//            context.SaveChanges();
//        }

//        [Fact(DisplayName = "[Integration-Normal] Admin_View_List_User_Success")]
//        public async Task Admin_View_List_User_Success()
//        {
//            SetupHttpContext("admintrator", 1);
//            var result = await _handler.Handle(new ViewListUserCommand(), default);

//            Assert.NotNull(result);
//            Assert.Single(result);
//        }
//    }
//}
