using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class StatesToElement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CurrentElement",
                table: "MasterPlanElements",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "MasterPlanElements",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NextElement",
                table: "MasterPlanElements",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "StruckElement",
                table: "MasterPlanElements",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentElement",
                table: "MasterPlanElements");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "MasterPlanElements");

            migrationBuilder.DropColumn(
                name: "NextElement",
                table: "MasterPlanElements");

            migrationBuilder.DropColumn(
                name: "StruckElement",
                table: "MasterPlanElements");
        }
    }
}
