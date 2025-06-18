using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class CategoryChange1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Units",
                table: "Categories");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Categories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreationDate",
                table: "Categories",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdateDate",
                table: "Categories",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Categories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CategoryUnit",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitsId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryUnit", x => new { x.CategoryId, x.UnitsId });
                    table.ForeignKey(
                        name: "FK_CategoryUnit_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryUnit_Units_UnitsId",
                        column: x => x.UnitsId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryUnit_UnitsId",
                table: "CategoryUnit",
                column: "UnitsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryUnit");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "CreationDate",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "UpdateDate",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Categories");

            migrationBuilder.AddColumn<string>(
                name: "Units",
                table: "Categories",
                type: "TEXT",
                nullable: true);
        }
    }
}
