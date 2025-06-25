/*using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using global::System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using HDMS_API;
using Microsoft.VisualStudio.Web.CodeGeneration.Design;

namespace HolaSmile_DMS.Tests.System.Controllers
{
    public class TreatmentProgressControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public TreatmentProgressControllerTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact(DisplayName = "[System] Guest_Get_Progress_Should_Fail")]
        public async global::System.Threading.Tasks.Task Guest_Cannot_Access_Progress()
        {
            var response = await _client.GetAsync("/api/TreatmentProgress/1");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact(DisplayName = "[System] Patient_Can_View_Progress")]
        public async global::System.Threading.Tasks.Task Patient_Can_View_Progress()
        {
            var token = "Bearer abc.def.ghi";

            var request = new HttpRequestMessage(HttpMethod.Get, "/api/TreatmentProgress/1");
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(token);

            var response = await _client.SendAsync(request);
            Assert.True(response.IsSuccessStatusCode);
        }
    }
}*/