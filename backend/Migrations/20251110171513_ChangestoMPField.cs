using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class ChangestoMPField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DataType",
                table: "MasterPlanFields",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "MasterPlanFields",
                type: "INTEGER",
                nullable: false,
                defaultValue: false
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DataType", table: "MasterPlanFields");

            migrationBuilder.DropColumn(name: "IsHidden", table: "MasterPlanFields");
        }
    }
}
