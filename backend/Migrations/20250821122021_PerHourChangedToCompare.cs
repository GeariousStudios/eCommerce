using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class PerHourChangedToCompare : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PerHourName",
                table: "UnitColumns");

            migrationBuilder.RenameColumn(
                name: "PerHour",
                table: "UnitColumns",
                newName: "Compare");

            migrationBuilder.AddColumn<string>(
                name: "ComparisonText",
                table: "UnitColumns",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ComparisonText",
                table: "UnitColumns");

            migrationBuilder.RenameColumn(
                name: "Compare",
                table: "UnitColumns",
                newName: "PerHour");

            migrationBuilder.AddColumn<string>(
                name: "PerHourName",
                table: "UnitColumns",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
