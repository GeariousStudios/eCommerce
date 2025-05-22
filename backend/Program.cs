using System.Globalization;
using System.Text;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var key = configuration["Jwt:Key"];

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Remove after dev.
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!)),
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

/* --- Home --- */
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlServer(
//         "Server=localhost\\SQLEXPRESS;Database=eCommerce;Trusted_Connection=True;TrustServerCertificate=True;"
//     )
// );

/* --- Work --- */
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=eCommerce.db")
);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://192.168.1.75:3000",
                    "http://10.160.14.124:3000",
                    "https://geariousstudios.github.io"
                ) // Change to live url after dev.
                .AllowAnyHeader()
                .AllowAnyMethod()
    );
});

var app = builder.Build();

app.UseRouting();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    // app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.UseMiddleware<SessionValidationMiddleware>();

app.MapControllers();

/* --- Create user --- */
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Users.Any())
    {
        var newsItem = new News
        {
            Date = DateTime.Today,
            Type = "Information",
            Headline = "Välkommen",
            Content =
                "<div><p>Webb-ie är ett work-in-progress som kanske eller kanske inte blir något. I dagsläget kan du lägga till och redigera nyheter i denna vy och under <strong style='color: rgb(102, 185, 102);'>Användare</strong> kan du filtrera, skapa och redigera användare. Och så klart så kan du växla mellan mörkt eller ljust tema. </p><p><br></p><p>All data som läggs in i databasen vid en session försvinner efter 15 minuters inaktivitet på hemsidan. Hoppas vi hörs! 😊</p><p><br></p><p><strong>Kontaktuppgifter</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>liam0765@outlook.com</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>0765948648</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>https://www.linkedin.com/in/liam-fritzson-540206362/</li></ol><p><br></p><p><strong>Maskineri</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Frontend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>Bibliotek/ramverk: React (Next.js), TypeScript</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>CSS: Tailwind 🧡</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>Komponenter: Inget komponentsbibliotek använt</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>Ikoner: HeroIcons</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Backend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>ASP NET Core, C#</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>Databas: SQLite</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span>Server: Render</li></ol></div>",
            Author = "Liam Fritzson",
            AuthorId = 1996,
        };

        var masterUser = new User
        {
            Username = "master",
            FirstName = "Mästare",
            LastName = "Mästersson",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("master"),
            Roles = UserRoles.Developer | UserRoles.Admin | UserRoles.Master,
            UserPreferences = new UserPreferences { Theme = "dark" },
            CreationDate = DateTime.UtcNow,
        };

        var testUserOne = new User
        {
            Username = "tester1",
            FirstName = "Test",
            LastName = "Testström",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("tester1"),
            Roles = UserRoles.Developer,
            UserPreferences = new UserPreferences { },
            CreationDate = DateTime.UtcNow,
        };

        var testUserTwo = new User
        {
            Username = "tester2",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("tester2"),
            Roles = UserRoles.Admin,
            IsLocked = true,
            UserPreferences = new UserPreferences { },
            CreationDate = DateTime.UtcNow,
        };

        db.News.Add(newsItem);
        db.Users.Add(masterUser);
        db.Users.Add(testUserOne);
        db.Users.Add(testUserTwo);
        await db.SaveChangesAsync();
    }
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://0.0.0.0:{port}");

await app.RunAsync();
