using Application.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using NuGet.Protocol.Plugins;
using System.Net.Http;

namespace HDMS_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IGoogleAuthService _googleAuthService;

        public AuthController(IGoogleAuthService googleAuthService)
        {
            _googleAuthService = googleAuthService;
        }

        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var redirectUrl = Url.Action("GoogleCallback", "Auth");
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

[HttpGet("google-callback")]
public async Task<IActionResult> GoogleCallback(CancellationToken cancellationToken)
{
    var redirectUrl = await _googleAuthService.HandleGoogleCallbackAsync(HttpContext, cancellationToken);

    if (redirectUrl == null)
    {
        var message = "Không thể xác thực bằng Google. Vui lòng thử lại hoặc liên hệ quản trị viên.";

        var html = $@"<!doctype html>
<html lang=""vi"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1"">
<title>Authentication failed</title>
<style>
  :root {{
    --bg: #0f172a;        /* slate-900 */
    --card: #ffffff;      /* white */
    --text: #0f172a;      /* slate-900 */
    --muted: #64748b;     /* slate-500 */
    --danger: #ef4444;    /* red-500 */
    --danger-bg: #fee2e2; /* red-100 */
    --border: #e5e7eb;    /* gray-200 */
    --btn: #111827;       /* gray-900 */
    --btn-text: #ffffff;  /* white */
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{
      --bg: #0b1020;
      --card: #0b1220;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --danger-bg: #3b0b0b;
      --border: #1f2937;
      --btn: #e5e7eb;
      --btn-text: #0b1020;
    }}
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji;
    background: radial-gradient(1000px 600px at 50% -10%, rgba(255,255,255,0.15), transparent),
                var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }}
  .card {{
    width: 100%;
    max-width: 560px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,.15);
    overflow: hidden;
  }}
  .header {{
    padding: 28px 28px 0 28px;
    text-align: center;
  }}
  .icon {{
    margin: 0 auto 12px;
    height: 56px; width: 56px;
    border-radius: 50%;
    display: grid; place-items: center;
    background: var(--danger-bg);
    color: var(--danger);
  }}
  h1 {{ font-size: 22px; margin: 6px 0 4px; }}
  .desc {{ color: var(--muted); font-size: 14px; margin: 0 0 18px; }}
  .detail {{
    margin: 0 28px 0;
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 14px;
    color: var(--muted);
    background: rgba(0,0,0,0.02);
  }}
  .actions {{
    display: flex; flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    padding: 20px 28px 28px;
  }}
  .btn {{
    appearance: none; border: 0; cursor: pointer;
    border-radius: 12px; padding: 10px 16px;
    font-weight: 600; font-size: 14px;
    transition: transform .06s ease, opacity .2s ease, background .2s ease;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
  }}
  .btn:active {{ transform: translateY(1px); }}
  .btn-primary {{ background: var(--btn); color: var(--btn-text); }}
  .btn-secondary {{
    background: transparent; color: var(--text);
    border: 1px solid var(--border);
  }}
  .hint {{
    text-align: center; padding: 0 28px 24px;
    color: var(--muted); font-size: 12px;
  }}
  .hint a {{ color: inherit; }}
</style>
</head>
<body>
  <main class=""card"" role=""alert"" aria-live=""assertive"">
    <div class=""header"">
      <div class=""icon"">
        <!-- alert-triangle -->
        <svg xmlns=""http://www.w3.org/2000/svg"" width=""28"" height=""28"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round"">
          <path d=""M12 9v4""/><path d=""M12 17h.01""/>
          <path d=""m10.29 3.86-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.71-3.14l-8-14a2 2 0 0 0-3.42 0Z""/>
        </svg>
      </div>
      <h1>Authentication failed</h1>
      <p class=""desc"">{message}</p>
    </div>

    <div class=""detail"">
      <strong>Mã lỗi:</strong> 401 — Unauthorized
      <br />
      <strong>Gợi ý:</strong> Hãy thử đăng nhập lại với đúng tài khoản Google đã đăng ký, hoặc dùng trình duyệt khác/xoá cache.
    </div>

    <div class=""actions"">
      <a class=""btn btn-secondary"" href=""/"" rel=""nofollow"">Về trang chủ</a>
      <a class=""btn btn-secondary"" href=""mailto:support@holasmile.example"">Liên hệ hỗ trợ</a>
    </div>

    <p class=""hint"">Nếu sự cố tiếp diễn, vui lòng gửi ảnh màn hình kèm thời gian xảy ra lỗi cho quản trị viên.</p>
  </main>
</body>
</html>";

        return new ContentResult
        {
            Content = html,
            ContentType = "text/html; charset=utf-8",
            StatusCode = StatusCodes.Status401Unauthorized
        };
    }

    return Redirect(redirectUrl);
}
    }
}
