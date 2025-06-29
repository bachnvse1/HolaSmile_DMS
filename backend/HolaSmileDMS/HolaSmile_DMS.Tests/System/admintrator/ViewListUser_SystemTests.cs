//using System.Net;
//using System.Net.Http.Json;
//using Application.Usecases.Admintrator;
//using Org.BouncyCastle.Asn1.X509;
//using Xunit;

//public class ViewListUser_SystemTests : IClassFixture<CustomWebAppFactory<Program>>
//{
//    private readonly HttpClient _client;

//    public ViewListUser_SystemTests(CustomWebAppFactory<Program> factory)
//    {
//        _client = factory.CreateClient();
//    }

//    [Fact(DisplayName = "[System-Normal] Admin_Can_Get_User_List")]
//    public async Task Admin_Can_Get_User_List()
//    {
//        var token = await Helper.GenerateJwtTokenAsync("admintrator", 1);
//        _client.DefaultRequestHeaders.Authorization = new("Bearer", token);

//        var response = await _client.GetAsync("/api/users");

//        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
//        var users = await response.Content.ReadFromJsonAsync<List<ViewListUserDTO>>();
//        Assert.NotNull(users);
//    }

//    [Fact(DisplayName = "[System-Abnormal] Unauthorized_User_Throws_Forbidden")]
//    public async Task Unauthorized_User_Throws_Forbidden()
//    {
//        var token = await Helper.GenerateJwtTokenAsync("receptionist", 5);
//        _client.DefaultRequestHeaders.Authorization = new("Bearer", token);

//        var response = await _client.GetAsync("/api/users");

//        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
//    }
//}
