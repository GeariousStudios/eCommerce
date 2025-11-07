using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eCommerce.Migrations
{
    /// <inheritdoc />
    public partial class MasterPlanFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MasterPlanElementToPreparationBatches");

            migrationBuilder.DropTable(
                name: "MasterPlanElementToProductionOrders");

            migrationBuilder.DropTable(
                name: "MasterPlanToMasterPlanElements");

            migrationBuilder.DropTable(
                name: "PreparationBatches");

            migrationBuilder.DropTable(
                name: "ProductionOrders");

            migrationBuilder.DropColumn(
                name: "BatchNumber",
                table: "MasterPlanElements");

            migrationBuilder.DropColumn(
                name: "ScheduledStart",
                table: "MasterPlanElements");

            migrationBuilder.AddColumn<int>(
                name: "MasterPlanId",
                table: "MasterPlanElements",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "MasterPlanFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    MasterPlanId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterPlanFields_MasterPlans_MasterPlanId",
                        column: x => x.MasterPlanId,
                        principalTable: "MasterPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterPlanElementValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MasterPlanElementId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanElementValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterPlanElementValues_MasterPlanElements_MasterPlanElementId",
                        column: x => x.MasterPlanElementId,
                        principalTable: "MasterPlanElements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MasterPlanElementValues_MasterPlanFields_MasterPlanFieldId",
                        column: x => x.MasterPlanFieldId,
                        principalTable: "MasterPlanFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanElements_MasterPlanId",
                table: "MasterPlanElements",
                column: "MasterPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanElementValues_MasterPlanElementId",
                table: "MasterPlanElementValues",
                column: "MasterPlanElementId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanElementValues_MasterPlanFieldId",
                table: "MasterPlanElementValues",
                column: "MasterPlanFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanFields_MasterPlanId",
                table: "MasterPlanFields",
                column: "MasterPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_MasterPlanElements_MasterPlans_MasterPlanId",
                table: "MasterPlanElements",
                column: "MasterPlanId",
                principalTable: "MasterPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MasterPlanElements_MasterPlans_MasterPlanId",
                table: "MasterPlanElements");

            migrationBuilder.DropTable(
                name: "MasterPlanElementValues");

            migrationBuilder.DropTable(
                name: "MasterPlanFields");

            migrationBuilder.DropIndex(
                name: "IX_MasterPlanElements_MasterPlanId",
                table: "MasterPlanElements");

            migrationBuilder.DropColumn(
                name: "MasterPlanId",
                table: "MasterPlanElements");

            migrationBuilder.AddColumn<string>(
                name: "BatchNumber",
                table: "MasterPlanElements",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledStart",
                table: "MasterPlanElements",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MasterPlanToMasterPlanElements",
                columns: table => new
                {
                    MasterPlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanElementId = table.Column<int>(type: "INTEGER", nullable: false),
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanToMasterPlanElements", x => new { x.MasterPlanId, x.MasterPlanElementId });
                    table.ForeignKey(
                        name: "FK_MasterPlanToMasterPlanElements_MasterPlanElements_MasterPlanElementId",
                        column: x => x.MasterPlanElementId,
                        principalTable: "MasterPlanElements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MasterPlanToMasterPlanElements_MasterPlans_MasterPlanId",
                        column: x => x.MasterPlanId,
                        principalTable: "MasterPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreparationBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BatchNumber = table.Column<string>(type: "TEXT", nullable: true),
                    Comment = table.Column<string>(type: "TEXT", nullable: true),
                    Material = table.Column<string>(type: "TEXT", nullable: true),
                    MaterialDescription = table.Column<string>(type: "TEXT", nullable: true),
                    OUM = table.Column<string>(type: "TEXT", nullable: true),
                    OrderQuantity = table.Column<double>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreparationBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductionOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Comment = table.Column<string>(type: "TEXT", nullable: true),
                    DestinationCountry = table.Column<string>(type: "TEXT", nullable: true),
                    Material = table.Column<string>(type: "TEXT", nullable: true),
                    MaterialDescription = table.Column<string>(type: "TEXT", nullable: true),
                    MaterialPlanAsm = table.Column<string>(type: "TEXT", nullable: true),
                    OUM = table.Column<string>(type: "TEXT", nullable: true),
                    OrderNumber = table.Column<string>(type: "TEXT", nullable: true),
                    OrderQuantity = table.Column<double>(type: "REAL", nullable: true),
                    PM = table.Column<string>(type: "TEXT", nullable: true),
                    QuantityPlan = table.Column<double>(type: "REAL", nullable: true),
                    SequenceNumber = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MasterPlanElementToPreparationBatches",
                columns: table => new
                {
                    MasterPlanElementId = table.Column<int>(type: "INTEGER", nullable: false),
                    PreparationBatchId = table.Column<int>(type: "INTEGER", nullable: false),
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanElementToPreparationBatches", x => new { x.MasterPlanElementId, x.PreparationBatchId });
                    table.ForeignKey(
                        name: "FK_MasterPlanElementToPreparationBatches_MasterPlanElements_MasterPlanElementId",
                        column: x => x.MasterPlanElementId,
                        principalTable: "MasterPlanElements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MasterPlanElementToPreparationBatches_PreparationBatches_PreparationBatchId",
                        column: x => x.PreparationBatchId,
                        principalTable: "PreparationBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterPlanElementToProductionOrders",
                columns: table => new
                {
                    MasterPlanElementId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductionOrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanElementToProductionOrders", x => new { x.MasterPlanElementId, x.ProductionOrderId });
                    table.ForeignKey(
                        name: "FK_MasterPlanElementToProductionOrders_MasterPlanElements_MasterPlanElementId",
                        column: x => x.MasterPlanElementId,
                        principalTable: "MasterPlanElements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MasterPlanElementToProductionOrders_ProductionOrders_ProductionOrderId",
                        column: x => x.ProductionOrderId,
                        principalTable: "ProductionOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanElementToPreparationBatches_PreparationBatchId",
                table: "MasterPlanElementToPreparationBatches",
                column: "PreparationBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanElementToProductionOrders_ProductionOrderId",
                table: "MasterPlanElementToProductionOrders",
                column: "ProductionOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanToMasterPlanElements_MasterPlanElementId",
                table: "MasterPlanToMasterPlanElements",
                column: "MasterPlanElementId");
        }
    }
}
