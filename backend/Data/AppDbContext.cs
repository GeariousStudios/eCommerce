using backend.Models;
using backend.Models.ManyToMany;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<UserPreferences> UserPreferences { get; set; }
        public DbSet<UserFavourite> UserFavourites { get; set; }
        public DbSet<News> News { get; set; }
        public DbSet<NewsType> NewsTypes { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<UnitGroup> UnitGroups { get; set; }
        public DbSet<UnitColumn> UnitColumns { get; set; }
        public DbSet<UnitCell> UnitCells { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<SubCategory> SubCategories { get; set; }
        public DbSet<Report> Reports { get; set; }

        // Many-to-many.
        public DbSet<UnitToUnitColumn> UnitToUnitColumns { get; set; }
        public DbSet<UnitToCategory> UnitToCategories { get; set; }
        public DbSet<CategoryToSubCategory> CategoryToSubCategories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // UserPreferences <-> User 1-to-1 relationship.
            modelBuilder
                .Entity<User>()
                .HasOne(u => u.UserPreferences)
                .WithOne(up => up.User)
                .HasForeignKey<UserPreferences>(up => up.UserId);

            // Ensure each user can only have one favourite entry per specific key (href).
            modelBuilder
                .Entity<UserFavourite>()
                .HasIndex(x => new { x.UserId, x.Href })
                .IsUnique();

            // Unit <-> UnitColumn many-to-many relationship.
            modelBuilder
                .Entity<UnitToUnitColumn>()
                .HasKey(uuc => new { uuc.UnitId, uuc.UnitColumnId });

            modelBuilder
                .Entity<UnitToUnitColumn>()
                .HasOne(uuc => uuc.Unit)
                .WithMany(u => u.UnitToUnitColumns)
                .HasForeignKey(uuc => uuc.UnitId);

            modelBuilder
                .Entity<UnitToUnitColumn>()
                .HasOne(uuc => uuc.UnitColumn)
                .WithMany(uc => uc.UnitToUnitColumns)
                .HasForeignKey(uuc => uuc.UnitColumnId);

            // Unit <-> Category many-to-many relationship.
            modelBuilder.Entity<UnitToCategory>().HasKey(uc => new { uc.UnitId, uc.CategoryId });

            modelBuilder
                .Entity<UnitToCategory>()
                .HasOne(uc => uc.Unit)
                .WithMany(u => u.UnitToCategories)
                .HasForeignKey(uc => uc.UnitId);

            modelBuilder
                .Entity<UnitToCategory>()
                .HasOne(uc => uc.Category)
                .WithMany(c => c.UnitToCategories)
                .HasForeignKey(uc => uc.CategoryId);

            // Category <-> SubCategory many-to-many relationship.
            modelBuilder
                .Entity<CategoryToSubCategory>()
                .HasKey(cs => new { cs.CategoryId, cs.SubCategoryId });

            modelBuilder
                .Entity<CategoryToSubCategory>()
                .HasOne(cs => cs.Category)
                .WithMany(s => s.CategoryToSubCategories)
                .HasForeignKey(cs => cs.CategoryId);

            modelBuilder
                .Entity<CategoryToSubCategory>()
                .HasOne(cs => cs.SubCategory)
                .WithMany(c => c.CategoryToSubCategories)
                .HasForeignKey(cs => cs.SubCategoryId);

            // Unit -> UnitCells 1-to-many relationship.
            modelBuilder
                .Entity<Unit>()
                .HasMany(u => u.UnitCells)
                .WithOne(uc => uc.Unit)
                .HasForeignKey(uc => uc.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unit -> Reports 1-to-many relationship.
            modelBuilder
                .Entity<Unit>()
                .HasMany(u => u.Reports)
                .WithOne(r => r.Unit)
                .HasForeignKey(r => r.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

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
