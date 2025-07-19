using Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/test-job")]
    [ApiController]
    public class TestJobController : ControllerBase
    {
        private readonly IDeactiveExpiredPromotionsService _service;

        public TestJobController(IDeactiveExpiredPromotionsService service)
        {
            _service = service;
        }

        [HttpPost("run")]
        public async Task<IActionResult> RunJobNow()
        {
            var result = await _service.DeactiveExpiredPromotionsAsync();
            return Ok(new { Success = result });
        }
    }
}
