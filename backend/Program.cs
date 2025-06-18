using System.Globalization;
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
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

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<UserService>();

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
            Type = "Välkomna hit",
            Headline = "Testa, klicka runt och upptäck!",
            Content =
                "<div><p>Den här webbapplikationen är ett exempel på mina färdigheter inom frontend- och backendutveckling. Mycket funktionalitet och finess saknas, men kärnan finns på plats.</p><p><br></p><p>I dagsläget kan du göra följande:</p><p><br></p><p><strong style='color: rgb(102, 163, 224);'>ANVÄNDARE</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Logga in</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Ändra enkla inställningar kopplat till ditt konto</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Hantera användare</li></ol><p><br></p><p><strong style='color: rgb(102, 163, 224);'>RAPPORTERING</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Skapa enhetsgrupp (t.ex. Fyllning)</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Skapa enhet och knyta till enhetsgrupp (t.ex. Lina I)</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Skapa kategori + underkategori och knyta till enhet (t.ex. Innerpåstillverkning -&gt; Maskindel 1A)</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Gå in på din enhet (och i framtiden även kunn rapportera såklart)</li></ol><p><br></p><p><strong style='color: rgb(102, 163, 224);'>ÖVRIGT</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Administrera nyheter här på startsidan</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Mörkt/ljust tema</li></ol><p><br></p><p>!!!</p><p><strong><em>Notera</em></strong> att när servern har haft inaktivitet i över 15 minuter så raderas databasen, vilket betyder att om du återvänder hit så kommer du ha en ny databas. Detta eftersom jag använder en gratis databashantering med ett gratis serveralternativ.</p><p>!!!</p><p><br></p><p><strong style='color: rgb(194, 133, 255);'>MASKINERI</strong></p><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Frontend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Bibliotek/ramverk:</strong> React (Next.js)</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Språk:</strong> TypeScript, Tailwind, CSS</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Komponentsbibliotek:</strong> Inget, samtliga komponenter är skapade av mig</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Ikonbibliotek:</strong> heroicons.com</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Backend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Ramverk:</strong> ASP NET Core</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Språk:</strong> C#</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Databas:</strong> SQLite</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Server:</strong> Render</li></ol><p><br></p><p><strong style='color: rgb(194, 133, 255);'>KONTAKTUPPGIFTER</strong></p><p>liam0765@outlook.com</p><p>0765948648</p><p>https://www.linkedin.com/in/liam-fritzson-540206362/</p></div>",
            Author = "Liam Fritzson",
            AuthorId = 1996,
        };

        var masterUser = new User
        {
            Username = "master",
            FirstName = "Förnamn",
            LastName = "Efternamn",
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

        var unitGroupOne = new UnitGroup
        {
            Name = "Fyllning",
            Units = new List<Unit>(),
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        var unitOne = new Unit
        {
            Name = "Lina I",
            IsHidden = false,
            UnitGroup = unitGroupOne,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        var unitTwo = new Unit
        {
            Name = "Lina II",
            IsHidden = false,
            UnitGroup = unitGroupOne,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        var unitGroupTwo = new UnitGroup
        {
            Name = "Paketering",
            Units = new List<Unit>(),
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        var unitThree = new Unit
        {
            Name = "Lina IV",
            IsHidden = false,
            UnitGroup = unitGroupTwo,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        var categoryOne = new Category
        {
            Name = "Innerpåstillverkning",
            Units = new List<Unit> { unitOne, unitTwo },
            SubCategories = new List<SubCategory>
            {
                new SubCategory { Name = "Maskindel 1A" },
                new SubCategory { Name = "Maskindel 2B" },
            },
            CreationDate = DateTime.UtcNow,
            CreatedBy = "Liam Fritzson",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "Liam Fritzson",
        };

        unitGroupOne.Units.Add(unitOne);
        unitGroupOne.Units.Add(unitTwo);
        unitGroupTwo.Units.Add(unitThree);

        db.News.Add(newsItem);
        db.Users.Add(masterUser);
        db.Users.Add(testUserOne);
        db.Users.Add(testUserTwo);
        db.UnitGroups.Add(unitGroupOne);
        db.UnitGroups.Add(unitGroupTwo);
        db.Categories.Add(categoryOne);

        await db.SaveChangesAsync();
    }
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://0.0.0.0:{port}");

await app.RunAsync();
