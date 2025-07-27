using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeStatusToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsConfirmed",
                table: "FinancialTransactions");

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "FinancialTransactions",
                type: "nvarchar(255)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "status",
                table: "FinancialTransactions");

            migrationBuilder.AddColumn<bool>(
                name: "IsConfirmed",
                table: "FinancialTransactions",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }
    }
}
