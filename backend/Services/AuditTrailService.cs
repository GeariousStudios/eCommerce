using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class AuditTrailService
    {
        private readonly AppDbContext _context;

        public AuditTrailService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            string action,
            string entityName,
            int entityId,
            string fullName,
            int userId,
            object? details = null
        )
        {
            var username =
                await _context
                    .Users.Where(u => u.Id == userId)
                    .Select(u => u.Username)
                    .FirstOrDefaultAsync() ?? string.Empty;

            var audit = new AuditTrail
            {
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                User = fullName,
                Username = username,
                UserId = userId,
                Timestamp = DateTime.UtcNow,
                Details =
                    details != null
                        ? JsonSerializer.Serialize(
                            details,
                            new JsonSerializerOptions
                            {
                                ReferenceHandler = System
                                    .Text
                                    .Json
                                    .Serialization
                                    .ReferenceHandler
                                    .IgnoreCycles,
                                WriteIndented = false,
                            }
                        )
                        : null,
            };

            _context.AuditTrails.Add(audit);
            await _context.SaveChangesAsync();
        }
    }
}
