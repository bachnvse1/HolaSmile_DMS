﻿using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IJwtService _jwtService;
    private readonly ApplicationDbContext _context;
    private readonly IUserCommonRepository _userCommonRepository;


    public GoogleAuthService(
        IHttpClientFactory httpClientFactory,
        IJwtService jwtService,
        ApplicationDbContext context, IUserCommonRepository userCommonRepository)
    {
        _httpClientFactory = httpClientFactory;
        _jwtService = jwtService;
        _context = context;
        _userCommonRepository = userCommonRepository;
    }

    public async Task<string?> HandleGoogleCallbackAsync(HttpContext httpContext, CancellationToken cancellation)
    {
        var authenticateResult = await httpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded)
            return null;

        var accessToken = authenticateResult.Properties.GetTokenValue("access_token");
        dynamic googleUser = await GetGoogleUserInfoAsync(accessToken);

        string email = googleUser?.email;
        string fullName = googleUser?.name;
        string imageUrl = googleUser?.picture;

        if (googleUser == null || string.IsNullOrEmpty(email))
            return null;

        var user = _context.Users.FirstOrDefault(x => x.Email == email);
        if (user == null || user.Status == false)
            return null;

        var userRole = await _userCommonRepository.GetUserRoleAsync(user.Username, cancellation);

        var jwt = _jwtService.GenerateJWTToken(user, userRole.Role, userRole.RoleTableId);
        var refreshToken = _jwtService.GenerateRefreshToken(user.UserID.ToString());

        return $"http://localhost:5173/auth/callback" +
               $"?token={jwt}" +
               $"&refreshToken={refreshToken}" +
               $"&username={user.Username}" +
               $"&fullName={user.Fullname}" +
               $"&role={userRole.Role}" +
               $"&userRole.RoleTableId={userRole.RoleTableId}" +
               $"&imageUrl={Uri.EscapeDataString(imageUrl)}";
    }

    private async Task<dynamic> GetGoogleUserInfoAsync(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject(json);
    }
}
