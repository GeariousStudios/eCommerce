using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class KeyToHref : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserFavourites_UserId_Key",
                table: "UserFavourites");

            migrationBuilder.DropColumn(
                name: "Key",
                table: "UserFavourites");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavourites_UserId_Href",
                table: "UserFavourites",
                columns: new[] { "UserId", "Href" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserFavourites_UserId_Href",
                table: "UserFavourites");

            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "UserFavourites",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavourites_UserId_Key",
                table: "UserFavourites",
                columns: new[] { "UserId", "Key" },
                unique: true);
        }
    }
}
