using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addNewEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiscountPrograms",
                columns: table => new
                {
                    DiscountProgramID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    InvoiceId = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DiscountProgramName = table.Column<string>(type: "nvarchar(255)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    IsDelete = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscountPrograms", x => x.DiscountProgramID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FinancialTransactions",
                columns: table => new
                {
                    TransactionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    InvoiceId = table.Column<int>(type: "int", nullable: false),
                    TransactionDate = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    TransactionType = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(255)", nullable: false),
                    PaymentMethod = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    IsDelete = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialTransactions", x => x.TransactionID);
                    table.ForeignKey(
                        name: "FK_FinancialTransactions_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ProcedureDiscountPrograms",
                columns: table => new
                {
                    ProcedureId = table.Column<int>(type: "int", nullable: false),
                    DiscountProgramId = table.Column<int>(type: "int", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcedureDiscountPrograms", x => new { x.ProcedureId, x.DiscountProgramId });
                    table.ForeignKey(
                        name: "FK_ProcedureDiscountPrograms_DiscountPrograms_DiscountProgramId",
                        column: x => x.DiscountProgramId,
                        principalTable: "DiscountPrograms",
                        principalColumn: "DiscountProgramID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcedureDiscountPrograms_Procedures_ProcedureId",
                        column: x => x.ProcedureId,
                        principalTable: "Procedures",
                        principalColumn: "ProcedureId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SuppliesTransactions",
                columns: table => new
                {
                    SupplyId = table.Column<int>(type: "int", nullable: false),
                    FinancialTransactionsID = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuppliesTransactions", x => new { x.SupplyId, x.FinancialTransactionsID });
                    table.ForeignKey(
                        name: "FK_SuppliesTransactions_FinancialTransactions_FinancialTransact~",
                        column: x => x.FinancialTransactionsID,
                        principalTable: "FinancialTransactions",
                        principalColumn: "TransactionID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SuppliesTransactions_Supplies_SupplyId",
                        column: x => x.SupplyId,
                        principalTable: "Supplies",
                        principalColumn: "SupplyId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FinancialTransactions_InvoiceId",
                table: "FinancialTransactions",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcedureDiscountPrograms_DiscountProgramId",
                table: "ProcedureDiscountPrograms",
                column: "DiscountProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_SuppliesTransactions_FinancialTransactionsID",
                table: "SuppliesTransactions",
                column: "FinancialTransactionsID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcedureDiscountPrograms");

            migrationBuilder.DropTable(
                name: "SuppliesTransactions");

            migrationBuilder.DropTable(
                name: "DiscountPrograms");

            migrationBuilder.DropTable(
                name: "FinancialTransactions");
        }
    }
}
