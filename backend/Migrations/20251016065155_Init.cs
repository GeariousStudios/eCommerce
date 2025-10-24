using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "News",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    TypeName = table.Column<string>(type: "TEXT", nullable: false),
                    Headline = table.Column<string>(type: "TEXT", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_News", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NewsTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false),
                    SystemKey = table.Column<int>(type: "INTEGER", nullable: true),
                    CycleLengthWeeks = table.Column<int>(type: "INTEGER", nullable: false),
                    AnchorWeekStart = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shifts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftTeams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false),
                    LightColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    DarkColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftTeams", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UnitColumns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    DataType = table.Column<int>(type: "INTEGER", nullable: false),
                    HasData = table.Column<bool>(type: "INTEGER", nullable: false),
                    Compare = table.Column<bool>(type: "INTEGER", nullable: false),
                    ComparisonText = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitColumns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UnitGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UnitShiftChanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    OldShiftId = table.Column<int>(type: "INTEGER", nullable: false),
                    NewShiftId = table.Column<int>(type: "INTEGER", nullable: false),
                    EffectiveFromUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitShiftChanges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    LastName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Roles = table.Column<int>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    CurrentSessionId = table.Column<string>(type: "TEXT", nullable: true),
                    IsOnline = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsLocked = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLogin = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftToShiftTeams",
                columns: table => new
                {
                    ShiftId = table.Column<int>(type: "INTEGER", nullable: false),
                    ShiftTeamId = table.Column<int>(type: "INTEGER", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftToShiftTeams", x => new { x.ShiftId, x.ShiftTeamId });
                    table.ForeignKey(
                        name: "FK_ShiftToShiftTeams_ShiftTeams_ShiftTeamId",
                        column: x => x.ShiftTeamId,
                        principalTable: "ShiftTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftToShiftTeams_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    table.PrimaryKey("PK_ShiftToShiftTeamSchedules", x => new { x.ShiftId, x.ShiftTeamId, x.WeekIndex, x.DayOfWeek, x.StartTime, x.EndTime });
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

            migrationBuilder.CreateTable(
                name: "CategoryToSubCategories",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    SubCategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryToSubCategories", x => new { x.CategoryId, x.SubCategoryId });
                    table.ForeignKey(
                        name: "FK_CategoryToSubCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryToSubCategories_SubCategories_SubCategoryId",
                        column: x => x.SubCategoryId,
                        principalTable: "SubCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false),
                    UnitGroupId = table.Column<int>(type: "INTEGER", nullable: false),
                    LightColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    DarkColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Units_UnitGroups_UnitGroupId",
                        column: x => x.UnitGroupId,
                        principalTable: "UnitGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrendingPanels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: true),
                    Period = table.Column<int>(type: "INTEGER", nullable: true),
                    ViewMode = table.Column<int>(type: "INTEGER", nullable: true),
                    UnitColumnId = table.Column<int>(type: "INTEGER", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    CustomStartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CustomEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ColSpan = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    ShowInfo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrendingPanels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrendingPanels_UnitColumns_UnitColumnId",
                        column: x => x.UnitColumnId,
                        principalTable: "UnitColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TrendingPanels_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserFavourites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Href = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Icon = table.Column<string>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavourites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFavourites_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Theme = table.Column<string>(type: "TEXT", nullable: false),
                    Language = table.Column<string>(type: "TEXT", nullable: false),
                    IsGridView = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Hour = table.Column<int>(type: "INTEGER", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: true),
                    SubCategoryId = table.Column<int>(type: "INTEGER", nullable: true),
                    CategoryName = table.Column<string>(type: "TEXT", nullable: true),
                    SubCategoryName = table.Column<string>(type: "TEXT", nullable: true),
                    Content = table.Column<string>(type: "TEXT", nullable: true),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    StopTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitCells",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    ColumnId = table.Column<int>(type: "INTEGER", nullable: false),
                    Hour = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true),
                    IntValue = table.Column<int>(type: "INTEGER", nullable: true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitCells", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitCells_UnitColumns_ColumnId",
                        column: x => x.ColumnId,
                        principalTable: "UnitColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitCells_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitToCategories",
                columns: table => new
                {
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitToCategories", x => new { x.UnitId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_UnitToCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitToCategories_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitToShifts",
                columns: table => new
                {
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    ShiftId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitToShifts", x => new { x.UnitId, x.ShiftId });
                    table.ForeignKey(
                        name: "FK_UnitToShifts_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitToShifts_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnitToUnitColumns",
                columns: table => new
                {
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitColumnId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitToUnitColumns", x => new { x.UnitId, x.UnitColumnId });
                    table.ForeignKey(
                        name: "FK_UnitToUnitColumns_UnitColumns_UnitColumnId",
                        column: x => x.UnitColumnId,
                        principalTable: "UnitColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UnitToUnitColumns_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrendingPanelToUnits",
                columns: table => new
                {
                    TrendingPanelId = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrendingPanelToUnits", x => new { x.TrendingPanelId, x.UnitId });
                    table.ForeignKey(
                        name: "FK_TrendingPanelToUnits_TrendingPanels_TrendingPanelId",
                        column: x => x.TrendingPanelId,
                        principalTable: "TrendingPanels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrendingPanelToUnits_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Shifts",
                columns: new[] { "Id", "AnchorWeekStart", "CreatedBy", "CreationDate", "CycleLengthWeeks", "IsHidden", "Name", "SystemKey", "UpdateDate", "UpdatedBy" },
                values: new object[] { 1, new DateOnly(1, 1, 1), "system", new DateTime(2025, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), 1, false, "Unmanned", 0, new DateTime(2025, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), "system" });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryToSubCategories_SubCategoryId",
                table: "CategoryToSubCategories",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UnitId",
                table: "Reports",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftToShiftTeams_ShiftTeamId",
                table: "ShiftToShiftTeams",
                column: "ShiftTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftToShiftTeamSchedules_ShiftTeamId",
                table: "ShiftToShiftTeamSchedules",
                column: "ShiftTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_TrendingPanels_UnitColumnId",
                table: "TrendingPanels",
                column: "UnitColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_TrendingPanels_UserId",
                table: "TrendingPanels",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrendingPanelToUnits_UnitId",
                table: "TrendingPanelToUnits",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitCells_ColumnId",
                table: "UnitCells",
                column: "ColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitCells_UnitId",
                table: "UnitCells",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_UnitGroupId",
                table: "Units",
                column: "UnitGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitToCategories_CategoryId",
                table: "UnitToCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitToShifts_ShiftId",
                table: "UnitToShifts",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitToUnitColumns_UnitColumnId",
                table: "UnitToUnitColumns",
                column: "UnitColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavourites_UserId_Href",
                table: "UserFavourites",
                columns: new[] { "UserId", "Href" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferences_UserId",
                table: "UserPreferences",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryToSubCategories");

            migrationBuilder.DropTable(
                name: "News");

            migrationBuilder.DropTable(
                name: "NewsTypes");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "ShiftToShiftTeams");

            migrationBuilder.DropTable(
                name: "ShiftToShiftTeamSchedules");

            migrationBuilder.DropTable(
                name: "TrendingPanelToUnits");

            migrationBuilder.DropTable(
                name: "UnitCells");

            migrationBuilder.DropTable(
                name: "UnitShiftChanges");

            migrationBuilder.DropTable(
                name: "UnitToCategories");

            migrationBuilder.DropTable(
                name: "UnitToShifts");

            migrationBuilder.DropTable(
                name: "UnitToUnitColumns");

            migrationBuilder.DropTable(
                name: "UserFavourites");

            migrationBuilder.DropTable(
                name: "UserPreferences");

            migrationBuilder.DropTable(
                name: "SubCategories");

            migrationBuilder.DropTable(
                name: "ShiftTeams");

            migrationBuilder.DropTable(
                name: "TrendingPanels");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Shifts");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "UnitColumns");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "UnitGroups");
        }
    }
}
