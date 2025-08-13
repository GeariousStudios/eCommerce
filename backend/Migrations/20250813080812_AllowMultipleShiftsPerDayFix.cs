using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleShiftsPerDayFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ShiftToShiftTeamSchedules",
                table: "ShiftToShiftTeamSchedules");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShiftToShiftTeamSchedules",
                table: "ShiftToShiftTeamSchedules",
                columns: new[] { "ShiftId", "ShiftTeamId", "WeekIndex", "DayOfWeek", "StartTime", "EndTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ShiftToShiftTeamSchedules",
                table: "ShiftToShiftTeamSchedules");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShiftToShiftTeamSchedules",
                table: "ShiftToShiftTeamSchedules",
                columns: new[] { "ShiftId", "ShiftTeamId", "WeekIndex", "DayOfWeek" });
        }
    }
}
