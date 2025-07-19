using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class updateDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions");

            migrationBuilder.DropTable(
                name: "SuppliesTransactions");

            migrationBuilder.DropIndex(
                name: "IX_FinancialTransactions_InvoiceId",
                table: "FinancialTransactions");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "FinancialTransactions");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "DiscountPrograms");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TransactionDate",
                table: "FinancialTransactions",
                type: "datetime(6)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FinancialTransactions",
                keyColumn: "TransactionDate",
                keyValue: null,
                column: "TransactionDate",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "TransactionDate",
                table: "FinancialTransactions",
                type: "nvarchar(200)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InvoiceId",
                table: "FinancialTransactions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "InvoiceId",
                table: "DiscountPrograms",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

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
                name: "IX_SuppliesTransactions_FinancialTransactionsID",
                table: "SuppliesTransactions",
                column: "FinancialTransactionsID");

            migrationBuilder.AddForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "InvoiceId");
        }
    }
}
