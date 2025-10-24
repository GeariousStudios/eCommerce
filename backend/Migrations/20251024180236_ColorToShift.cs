using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class ColorToShift : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DarkColorHex",
                table: "Shifts",
                type: "TEXT",
                maxLength: 7,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LightColorHex",
                table: "Shifts",
                type: "TEXT",
                maxLength: 7,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DarkColorHex", "LightColorHex" },
                values: new object[] { "#e0e0e0", "#212121" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DarkColorHex",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "LightColorHex",
                table: "Shifts");
        }
    }
}
