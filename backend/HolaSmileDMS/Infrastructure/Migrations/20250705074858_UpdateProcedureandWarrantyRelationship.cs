using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HDMS_API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProcedureandWarrantyRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Procedures_TreatmentRecords_TreatmentRecordID",
                table: "Procedures");

            migrationBuilder.DropForeignKey(
                name: "FK_WarrantyCards_Procedures_ProcedureID",
                table: "WarrantyCards");

            migrationBuilder.DropForeignKey(
                name: "FK_WarrantyCards_TreatmentRecords_TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.DropIndex(
                name: "IX_WarrantyCards_ProcedureID",
                table: "WarrantyCards");

            migrationBuilder.DropIndex(
                name: "IX_WarrantyCards_TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.DropColumn(
                name: "ProcedureID",
                table: "WarrantyCards");

            migrationBuilder.DropColumn(
                name: "TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.RenameColumn(
                name: "TreatmentRecordID",
                table: "Procedures",
                newName: "WarrantyCardId");

            migrationBuilder.RenameIndex(
                name: "IX_Procedures_TreatmentRecordID",
                table: "Procedures",
                newName: "IX_Procedures_WarrantyCardId");

            migrationBuilder.AddColumn<int>(
                name: "RoleTableId",
                table: "UserRoleResult",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_Procedures_WarrantyCards_WarrantyCardId",
                table: "Procedures",
                column: "WarrantyCardId",
                principalTable: "WarrantyCards",
                principalColumn: "WarrantyCardID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Procedures_WarrantyCards_WarrantyCardId",
                table: "Procedures");

            migrationBuilder.DropColumn(
                name: "RoleTableId",
                table: "UserRoleResult");

            migrationBuilder.RenameColumn(
                name: "WarrantyCardId",
                table: "Procedures",
                newName: "TreatmentRecordID");

            migrationBuilder.RenameIndex(
                name: "IX_Procedures_WarrantyCardId",
                table: "Procedures",
                newName: "IX_Procedures_TreatmentRecordID");

            migrationBuilder.AddColumn<int>(
                name: "ProcedureID",
                table: "WarrantyCards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TreatmentRecordID",
                table: "WarrantyCards",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarrantyCards_ProcedureID",
                table: "WarrantyCards",
                column: "ProcedureID");

            migrationBuilder.CreateIndex(
                name: "IX_WarrantyCards_TreatmentRecordID",
                table: "WarrantyCards",
                column: "TreatmentRecordID");

            migrationBuilder.AddForeignKey(
                name: "FK_Procedures_TreatmentRecords_TreatmentRecordID",
                table: "Procedures",
                column: "TreatmentRecordID",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");

            migrationBuilder.AddForeignKey(
                name: "FK_WarrantyCards_Procedures_ProcedureID",
                table: "WarrantyCards",
                column: "ProcedureID",
                principalTable: "Procedures",
                principalColumn: "ProcedureId");

            migrationBuilder.AddForeignKey(
                name: "FK_WarrantyCards_TreatmentRecords_TreatmentRecordID",
                table: "WarrantyCards",
                column: "TreatmentRecordID",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");
        }
    }
}
