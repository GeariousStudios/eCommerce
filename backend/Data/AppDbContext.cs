using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // public DbSet<Product> Products => Set<Product>();
        public DbSet<User> Users { get; set; }
        public DbSet<UserPreferences> UserPreferences { get; set; }
        public DbSet<News> News { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // UserPreferences <-> User is 1-to-1 relationship.
            modelBuilder
                .Entity<User>()
                .HasOne(u => u.UserPreferences)
                .WithOne(up => up.User)
                .HasForeignKey<UserPreferences>(up => up.UserId);

            // UserRoles stored as string (None, User, Manager, Admin) in DB instead of bit (0, 1, 2, 4).
            // This is to allow refactoring of enum values.
            modelBuilder.Entity<User>().Property(u => u.Roles).HasConversion<int>();
        }

        public override int SaveChanges()
        {
            HashPlaintextPasswords();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default
        )
        {
            HashPlaintextPasswords();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void HashPlaintextPasswords()
        {
            foreach (var entry in ChangeTracker.Entries<User>())
            {
                if ((entry.State == EntityState.Added || entry.State == EntityState.Modified))
                {
                    var user = entry.Entity;

                    if (
                        !string.IsNullOrEmpty(user.PasswordHash)
                        && !user.PasswordHash.StartsWith("$2")
                    )
                    {
                        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
                    }
                }
            }
        }
    }
}
