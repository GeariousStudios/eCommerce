using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class _5Shift : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "ShiftToShiftTeams");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "ShiftToShiftTeams");

            migrationBuilder.AddColumn<DateOnly>(
                name: "AnchorWeekStart",
                table: "Shifts",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<int>(
                name: "CycleLengthWeeks",
                table: "Shifts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ShiftToShiftTeamSchedules",
                columns: table => new
                {
                    ShiftId = table.Column<int>(type: "INTEGER", nullable: false),
                    ShiftTeamId = table.Column<int>(type: "INTEGER", nullable: false),
                    WeekIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    DayOfWeek = table.Column<int>(type: "INTEGER", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftToShiftTeamSchedules", x => new { x.ShiftId, x.ShiftTeamId, x.WeekIndex, x.DayOfWeek });
                    table.ForeignKey(
                        name: "FK_ShiftToShiftTeamSchedules_ShiftTeams_ShiftTeamId",
                        column: x => x.ShiftTeamId,
                        principalTable: "ShiftTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftToShiftTeamSchedules_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AnchorWeekStart", "CycleLengthWeeks", "Name" },
                values: new object[] { new DateOnly(1, 1, 1), 1, "Unmanned" });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftToShiftTeamSchedules_ShiftTeamId",
                table: "ShiftToShiftTeamSchedules",
                column: "ShiftTeamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftToShiftTeamSchedules");

            migrationBuilder.DropColumn(
                name: "AnchorWeekStart",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "CycleLengthWeeks",
                table: "Shifts");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "EndTime",
                table: "ShiftToShiftTeams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "StartTime",
                table: "ShiftToShiftTeams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "None");

            migrationBuilder.InsertData(
                table: "Shifts",
                columns: new[] { "Id", "CreatedBy", "CreationDate", "IsHidden", "Name", "SystemKey", "UpdateDate", "UpdatedBy" },
                values: new object[] { 2, "system", new DateTime(2025, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), false, "Unmanned", 1, new DateTime(2025, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), "system" });
        }
    }
}
