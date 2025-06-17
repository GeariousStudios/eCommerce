using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _context;

        public UserService(IHttpContextAccessor httpContextAccessor, AppDbContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        public async Task<(string User, int UserId)?> GetUserInfoAsync()
        {
            var username = _httpContextAccessor.HttpContext?.User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(username))
            {
                return null;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return null;
            }

            var userInfo = string.IsNullOrEmpty(user.FirstName + user.LastName)
                ? user.Username
                : user.FirstName + " " + user.LastName;
            return (userInfo, user.Id);
        }
    }
}
