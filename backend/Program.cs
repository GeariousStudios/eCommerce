using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;
using backend;
using backend.Data;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var key = configuration["Jwt:Key"];

builder.Services.AddSingleton<ITranslationService, TranslationService>();
builder.Services.AddSingleton<IStringLocalizerFactory, JsonStringLocalizerFactory>();

builder
    .Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .AddDataAnnotationsLocalization();

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

// builder
//     .Services.AddControllers()
//     .AddJsonOptions(options =>
//     {
//         options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
//     });

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
                    "https://geariousstudios.github.io",
                    "https://ecommerce-1-eng1.onrender.com"
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
        var newsTypeOne = new NewsType
        {
            Name = "Information",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        var newsTypeTwo = new NewsType
        {
            Name = "Meddelande",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        db.NewsTypes.AddRange(newsTypeOne, newsTypeTwo);
        await db.SaveChangesAsync();

        var newsItemOne = new News
        {
            Date = new DateTime(2000, 1, 1),
            TypeId = newsTypeOne.Id,
            TypeName = newsTypeOne.Name,
            Headline = "Maskineri",
            Content =
                "<div><ol><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Frontend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Bibliotek/ramverk:</strong> React (Next.js)</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Språk:</strong> TypeScript, Tailwind, CSS</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Komponentsbibliotek:</strong> Inget, samtliga komponenter är skapade av mig</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Ikonbibliotek:</strong> heroicons.com</li><li data-list='bullet'><span class='ql-ui' contenteditable='false'></span>Backend:</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Ramverk:</strong> ASP NET Core</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Språk:</strong> C#</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Databas:</strong> SQLite</li><li data-list='bullet' class='ql-indent-1'><span class='ql-ui' contenteditable='false'></span><strong>Server:</strong> Render</li></ol></div>",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        var newsItemTwo = new News
        {
            Date = new DateTime(2000, 1, 2),
            TypeId = newsTypeOne.Id,
            TypeName = newsTypeOne.Name,
            Headline = "Kontaktuppgifter",
            Content =
                "<div><p>liam0765@outlook.com</p><p>0765948648</p><p>https://www.linkedin.com/in/liam-fritzson-540206362/</p></div>",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        var newsItemThree = new News
        {
            Date = new DateTime(2000, 1, 3),
            TypeId = newsTypeTwo.Id,
            TypeName = newsTypeTwo.Name,
            Headline = "Välkommen hit!",
            Content =
                "<div><p>Den här webbapplikationen är ett exempel på mina färdigheter inom frontend- och backendutveckling.</p><p>Klicka runt och upptäck!</p><p><br></p><p><strong>I dagsläget kan du göra följande:</strong></p><ol><li data-list=bullet><span class=ql-ui contenteditable=false></span>Logga in/ut</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Ändra inställningar kopplat till ditt konto</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Ändra tema</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Ändra språk</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Administrera nyheter här på startsidan</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Markera favoriter i navbaren</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Hantera användare</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa grupper (t.ex. Fyllning)</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa kategorier + underkategorier (t.ex. Innerpåstillverkning -&gt; Maskindel 1A)</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa kolumner (t.ex. Antal producerade)</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa lag (t.ex. Skift 1)</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa skift (t.ex. 3-skift) och knyta lag till skiftet</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Skapa enheter (t.ex. Lina I) och knyta grupp, kategorier, kolumner och skift till enheten</li><li data-list=bullet><span class=ql-ui contenteditable=false></span>Gå in på din enhet och rapportera</li></ol><p><br></p><p><strong>Detta är lite av vad som finns i loopen:</strong></p><ol><li data-list=ordered><span class=ql-ui contenteditable=false></span>Fortsätta jobba på rapporteringsvyn!</li><li data-list=ordered><span class=ql-ui contenteditable=false></span>Klickbara breadcrumbs (fler navigeringsvyer)</li><li data-list=ordered><span class=ql-ui contenteditable=false></span>Påbörja pulsvyn</li></ol></div>",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        var masterUser = new User
        {
            Username = "master",
            FirstName = "John",
            LastName = "Smith",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("master"),
            Roles = UserRoles.Developer | UserRoles.Admin | UserRoles.Reporter | UserRoles.Master,
            UserPreferences = new UserPreferences { Theme = "dark" },
            CreationDate = DateTime.UtcNow,
        };

        var testUserOne = new User
        {
            Username = "tester1",
            FirstName = "Test",
            LastName = "Testström",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("tester1"),
            Roles = UserRoles.Admin | UserRoles.Reporter,
            UserPreferences = new UserPreferences { },
            CreationDate = DateTime.UtcNow,
        };

        var testUserTwo = new User
        {
            Username = "tester2",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("tester2"),
            Roles = UserRoles.Reporter,
            IsLocked = true,
            UserPreferences = new UserPreferences { },
            CreationDate = DateTime.UtcNow,
        };

        var columnOne = new UnitColumn
        {
            Name = "Antal producerade",
            DataType = UnitColumnDataType.Number,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        var columnTwo = new UnitColumn
        {
            Name = "Kommentar",
            DataType = UnitColumnDataType.Text,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };

        db.UnitColumns.AddRange(columnOne, columnTwo);
        await db.SaveChangesAsync();

        var subCategory1 = new SubCategory { Name = "Maskindel 1A" };
        var subCategory2 = new SubCategory { Name = "Maskindel 2B" };
        db.SubCategories.AddRange(subCategory1, subCategory2);
        await db.SaveChangesAsync();

        var category = new Category
        {
            Name = "Innerpåstillverkning",
            CategoryToSubCategories = new List<CategoryToSubCategory>
            {
                new CategoryToSubCategory { SubCategoryId = subCategory1.Id, Order = 0 },
                new CategoryToSubCategory { SubCategoryId = subCategory2.Id, Order = 1 },
            },
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var shiftTeam = new ShiftTeam
        {
            Name = "Dag",
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };
        db.ShiftTeams.Add(shiftTeam);
        await db.SaveChangesAsync();

        var today = DateTime.UtcNow.Date;
        var monday = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);

        var unmannedShift = await db.Shifts.FirstOrDefaultAsync(s =>
            s.SystemKey == ShiftSystemKey.Unmanned
        );

        if (unmannedShift == null)
        {
            unmannedShift = new Shift
            {
                Name = "Unmanned",
                SystemKey = ShiftSystemKey.Unmanned,
                CycleLengthWeeks = 1,
                AnchorWeekStart = DateOnly.FromDateTime(monday),
                CreationDate = DateTime.UtcNow,
                CreatedBy = "System",
                UpdateDate = DateTime.UtcNow,
                UpdatedBy = "System",
            };
            db.Shifts.Add(unmannedShift);
            await db.SaveChangesAsync();
        }
        else
        {
            unmannedShift = await db.Shifts.FirstAsync(s => s.Id == unmannedShift.Id);
        }

        var shift = await db
            .Shifts.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Name == "Dagskift" && s.SystemKey == null);

        if (shift == null)
        {
            shift = new Shift
            {
                Name = "Dagskift",
                CycleLengthWeeks = 1,
                AnchorWeekStart = DateOnly.FromDateTime(monday),
                CreationDate = DateTime.UtcNow,
                CreatedBy = "System",
                UpdateDate = DateTime.UtcNow,
                UpdatedBy = "System",
            };
            db.Shifts.Add(shift);
            await db.SaveChangesAsync();
        }
        else
        {
            shift = await db.Shifts.FirstAsync(s => s.Id == shift.Id);
        }

        db.ShiftToShiftTeams.Add(
            new ShiftToShiftTeam
            {
                ShiftId = shift.Id,
                ShiftTeamId = shiftTeam.Id,
                DisplayName = "D",
                Order = 0,
            }
        );

        var start = new TimeSpan(8, 30, 0);
        var end = new TimeSpan(16, 0, 0);

        db.ShiftToShiftTeamSchedules.AddRange(
            new[]
            {
                new ShiftToShiftTeamSchedule
                {
                    ShiftId = shift.Id,
                    ShiftTeamId = shiftTeam.Id,
                    WeekIndex = 0,
                    DayOfWeek = DayOfWeek.Monday,
                    StartTime = start,
                    EndTime = end,
                    Order = 0,
                },
                new ShiftToShiftTeamSchedule
                {
                    ShiftId = shift.Id,
                    ShiftTeamId = shiftTeam.Id,
                    WeekIndex = 0,
                    DayOfWeek = DayOfWeek.Tuesday,
                    StartTime = start,
                    EndTime = end,
                    Order = 1,
                },
                new ShiftToShiftTeamSchedule
                {
                    ShiftId = shift.Id,
                    ShiftTeamId = shiftTeam.Id,
                    WeekIndex = 0,
                    DayOfWeek = DayOfWeek.Wednesday,
                    StartTime = start,
                    EndTime = end,
                    Order = 2,
                },
                new ShiftToShiftTeamSchedule
                {
                    ShiftId = shift.Id,
                    ShiftTeamId = shiftTeam.Id,
                    WeekIndex = 0,
                    DayOfWeek = DayOfWeek.Thursday,
                    StartTime = start,
                    EndTime = end,
                    Order = 3,
                },
                new ShiftToShiftTeamSchedule
                {
                    ShiftId = shift.Id,
                    ShiftTeamId = shiftTeam.Id,
                    WeekIndex = 0,
                    DayOfWeek = DayOfWeek.Friday,
                    StartTime = start,
                    EndTime = end,
                    Order = 4,
                },
            }
        );

        await db.SaveChangesAsync();

        var unitGroup = new UnitGroup
        {
            Name = "Fyllning",
            Units = new List<Unit>(),
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };
        db.UnitGroups.Add(unitGroup);
        await db.SaveChangesAsync();

        var unit = new Unit
        {
            Name = "Lina I",
            IsHidden = false,
            UnitGroupId = unitGroup.Id,
            UnitGroup = unitGroup,
            CreationDate = DateTime.UtcNow,
            CreatedBy = "System",
            UpdateDate = DateTime.UtcNow,
            UpdatedBy = "System",
        };
        db.Units.Add(unit);
        await db.SaveChangesAsync();

        db.UnitToCategories.Add(new UnitToCategory { UnitId = unit.Id, CategoryId = category.Id });

        db.UnitToUnitColumns.AddRange(
            new UnitToUnitColumn
            {
                UnitId = unit.Id,
                UnitColumnId = columnOne.Id,
                Order = 0,
            },
            new UnitToUnitColumn
            {
                UnitId = unit.Id,
                UnitColumnId = columnTwo.Id,
                Order = 1,
            }
        );

        db.UnitToShifts.AddRange(
            new UnitToShift
            {
                UnitId = unit.Id,
                ShiftId = unmannedShift.Id,
                IsActive = true,
                Order = 0,
            },
            new UnitToShift
            {
                UnitId = unit.Id,
                ShiftId = shift.Id,
                IsActive = false,
                Order = 1,
            }
        );

        db.News.AddRange(newsItemOne, newsItemTwo, newsItemThree);
        db.Users.AddRange(masterUser, testUserOne, testUserTwo);

        await db.SaveChangesAsync();
    }
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://0.0.0.0:{port}");

await app.RunAsync();
