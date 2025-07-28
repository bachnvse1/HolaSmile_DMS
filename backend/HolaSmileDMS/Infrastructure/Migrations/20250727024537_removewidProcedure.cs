using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class removewidProcedure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Procedures_WarrantyCards_WarrantyCardId",
                table: "Procedures");

            migrationBuilder.DropIndex(
                name: "IX_Procedures_WarrantyCardId",
                table: "Procedures");

            migrationBuilder.DropColumn(
                name: "WarrantyCardId",
                table: "Procedures");

            migrationBuilder.DropColumn(
                name: "WarrantyPeriod",
                table: "Procedures");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WarrantyCardId",
                table: "Procedures",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WarrantyPeriod",
                table: "Procedures",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Procedures_WarrantyCardId",
                table: "Procedures",
                column: "WarrantyCardId");

            migrationBuilder.AddForeignKey(
                name: "FK_Procedures_WarrantyCards_WarrantyCardId",
                table: "Procedures",
                column: "WarrantyCardId",
                principalTable: "WarrantyCards",
                principalColumn: "WarrantyCardID");
        }
    }
}
