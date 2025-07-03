using System.IdentityModel.Tokens.Jwt;
using backend.Data;
using Microsoft.EntityFrameworkCore;

public class SessionValidationMiddleware
{
    private readonly RequestDelegate _next;

    public SessionValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var username = context.User.Identity.Name;
            var tokenId = context.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(tokenId))
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user != null && user.CurrentSessionId != tokenId)
                {
                    user.IsOnline = false;
                    await db.SaveChangesAsync();

                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Ogiltig session.");
                    return;
                }
            }
        }

        await _next(context);
    }
}
