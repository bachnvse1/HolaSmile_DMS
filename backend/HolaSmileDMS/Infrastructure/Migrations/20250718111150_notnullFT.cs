using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class notnullFT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions");

            migrationBuilder.AlterColumn<int>(
                name: "InvoiceId",
                table: "FinancialTransactions",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "InvoiceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions");

            migrationBuilder.AlterColumn<int>(
                name: "InvoiceId",
                table: "FinancialTransactions",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_FinancialTransactions_Invoices_InvoiceId",
                table: "FinancialTransactions",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "InvoiceId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
