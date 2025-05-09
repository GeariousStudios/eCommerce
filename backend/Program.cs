using System.Text;
using backend.Data;
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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        "Server=localhost\\SQLEXPRESS;Database=eCommerce;Trusted_Connection=True;TrustServerCertificate=True;"
    )
);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
            policy
                .WithOrigins("http://localhost:3000") // Change to live url after dev.
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

app.MapControllers();

// Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("admin123"));

app.Run();
