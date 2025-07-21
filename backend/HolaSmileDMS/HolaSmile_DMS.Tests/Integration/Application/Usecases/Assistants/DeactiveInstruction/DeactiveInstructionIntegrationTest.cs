using Application.Constants;
using Application.Usecases.Assistants.DeactiveInstruction;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;
using Application.Interfaces;
using Moq;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class DeactiveInstructionIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly DeactiveInstructionHandler _handler;

        public DeactiveInstructionIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("DeactiveInstructionDb"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var instructionRepo = new InstructionRepository(_context);

            _handler = new DeactiveInstructionHandler(instructionRepo, _httpContextAccessor);

            SeedData();
        }

        private void SetupHttpContext(string role, int userId = 1)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));
            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Instructions.RemoveRange(_context.Instructions);
            _context.SaveChanges();

            _context.Instructions.AddRange(
                new Instruction
                {
                    InstructionID = 100,
                    Content = "Test instruction",
                    IsDeleted = false,
                    CreatedAt = DateTime.Now
                },
                new Instruction
                {
                    InstructionID = 101,
                    Content = "Already deleted",
                    IsDeleted = true,
                    CreatedAt = DateTime.Now
                }
            );
            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant deactivates instruction successfully")]
        public async System.Threading.Tasks.Task UTCID01_DeactiveInstruction_Success()
        {
            SetupHttpContext("Assistant", 1);

            var command = new DeactiveInstructionCommand(100);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG112, result);
            var instruction = await _context.Instructions.FindAsync(100);
            Assert.True(instruction.IsDeleted);
            Assert.Equal(1, instruction.UpdatedBy);
            Assert.NotNull(instruction.UpdatedAt);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in throws MSG26")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new DeactiveInstructionCommand(100);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Invalid role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist", 2);

            var command = new DeactiveInstructionCommand(100);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Instruction not found throws MSG115")]
        public async System.Threading.Tasks.Task UTCID04_InstructionNotFound_Throws()
        {
            SetupHttpContext("Assistant", 1);

            var command = new DeactiveInstructionCommand(999);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Instruction already deleted throws MSG115")]
        public async System.Threading.Tasks.Task UTCID05_InstructionAlreadyDeleted_Throws()
        {
            SetupHttpContext("Dentist", 3);

            var command = new DeactiveInstructionCommand(101);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Update fails throws MSG58")]
        public async System.Threading.Tasks.Task UTCID06_UpdateFails_Throws()
        {
            // Arrange: Use a mock repo to simulate update failure
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("DeactiveInstructionDb2"));
            services.AddHttpContextAccessor();
            var provider = services.BuildServiceProvider();
            var context = provider.GetRequiredService<ApplicationDbContext>();
            var httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            context.Instructions.Add(new Instruction
            {
                InstructionID = 200,
                Content = "Should fail update",
                IsDeleted = false,
                CreatedAt = DateTime.Now
            });
            context.SaveChanges();

            // Replace this line:
            // var mockRepo = new Moq.Mock<Application.Interfaces.IInstructionRepository>();
            // With this line:
            var mockRepo = new Moq.Mock<IInstructionRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(200, default)).ReturnsAsync(context.Instructions.Find(200));
            mockRepo.Setup(r => r.UpdateAsync(Moq.It.IsAny<Instruction>(), default)).ReturnsAsync(false);

            var handler = new DeactiveInstructionHandler(mockRepo.Object, httpContextAccessor);

            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Assistant")
            }, "TestAuth"));
            httpContextAccessor.HttpContext = httpContext;

            var command = new DeactiveInstructionCommand(200);

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }
    }
}