using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HDMS_API.Migrations
{
    /// <inheritdoc />
    public partial class updateWarrantyAndPrescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecord_Id",
                table: "Instructions");

            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_TreatmentRecords_TreatmentRecord_Id",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "Term",
                table: "WarrantyCards");

            migrationBuilder.RenameColumn(
                name: "TreatmentRecord_Id",
                table: "Prescriptions",
                newName: "TreatmentRecordID");

            migrationBuilder.RenameIndex(
                name: "IX_Prescriptions_TreatmentRecord_Id",
                table: "Prescriptions",
                newName: "IX_Prescriptions_TreatmentRecordID");

            migrationBuilder.RenameColumn(
                name: "TreatmentRecord_Id",
                table: "Instructions",
                newName: "TreatmentRecordID");

            migrationBuilder.RenameIndex(
                name: "IX_Instructions_TreatmentRecord_Id",
                table: "Instructions",
                newName: "IX_Instructions_TreatmentRecordID");

            migrationBuilder.AddColumn<int>(
                name: "Duration",
                table: "WarrantyCards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TreatmentRecordID",
                table: "WarrantyCards",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "SuppliesUseds",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "Prescriptions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "Instructions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrthodonticTreatmentPlanId",
                table: "Images",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarrantyCards_TreatmentRecordID",
                table: "WarrantyCards",
                column: "TreatmentRecordID");

            migrationBuilder.CreateIndex(
                name: "IX_Prescriptions_AppointmentId",
                table: "Prescriptions",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Instructions_AppointmentId",
                table: "Instructions",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Images_OrthodonticTreatmentPlanId",
                table: "Images",
                column: "OrthodonticTreatmentPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Images_OrthodonticTreatmentPlans_OrthodonticTreatmentPlanId",
                table: "Images",
                column: "OrthodonticTreatmentPlanId",
                principalTable: "OrthodonticTreatmentPlans",
                principalColumn: "PlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Instructions_Appointments_AppointmentId",
                table: "Instructions",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecordID",
                table: "Instructions",
                column: "TreatmentRecordID",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_Appointments_AppointmentId",
                table: "Prescriptions",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_TreatmentRecords_TreatmentRecordID",
                table: "Prescriptions",
                column: "TreatmentRecordID",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");

            migrationBuilder.AddForeignKey(
                name: "FK_WarrantyCards_TreatmentRecords_TreatmentRecordID",
                table: "WarrantyCards",
                column: "TreatmentRecordID",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Images_OrthodonticTreatmentPlans_OrthodonticTreatmentPlanId",
                table: "Images");

            migrationBuilder.DropForeignKey(
                name: "FK_Instructions_Appointments_AppointmentId",
                table: "Instructions");

            migrationBuilder.DropForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecordID",
                table: "Instructions");

            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_Appointments_AppointmentId",
                table: "Prescriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Prescriptions_TreatmentRecords_TreatmentRecordID",
                table: "Prescriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_WarrantyCards_TreatmentRecords_TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.DropIndex(
                name: "IX_WarrantyCards_TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.DropIndex(
                name: "IX_Prescriptions_AppointmentId",
                table: "Prescriptions");

            migrationBuilder.DropIndex(
                name: "IX_Instructions_AppointmentId",
                table: "Instructions");

            migrationBuilder.DropIndex(
                name: "IX_Images_OrthodonticTreatmentPlanId",
                table: "Images");

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "WarrantyCards");

            migrationBuilder.DropColumn(
                name: "TreatmentRecordID",
                table: "WarrantyCards");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "SuppliesUseds");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "Instructions");

            migrationBuilder.DropColumn(
                name: "OrthodonticTreatmentPlanId",
                table: "Images");

            migrationBuilder.RenameColumn(
                name: "TreatmentRecordID",
                table: "Prescriptions",
                newName: "TreatmentRecord_Id");

            migrationBuilder.RenameIndex(
                name: "IX_Prescriptions_TreatmentRecordID",
                table: "Prescriptions",
                newName: "IX_Prescriptions_TreatmentRecord_Id");

            migrationBuilder.RenameColumn(
                name: "TreatmentRecordID",
                table: "Instructions",
                newName: "TreatmentRecord_Id");

            migrationBuilder.RenameIndex(
                name: "IX_Instructions_TreatmentRecordID",
                table: "Instructions",
                newName: "IX_Instructions_TreatmentRecord_Id");

            migrationBuilder.AddColumn<string>(
                name: "Term",
                table: "WarrantyCards",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecord_Id",
                table: "Instructions",
                column: "TreatmentRecord_Id",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");

            migrationBuilder.AddForeignKey(
                name: "FK_Prescriptions_TreatmentRecords_TreatmentRecord_Id",
                table: "Prescriptions",
                column: "TreatmentRecord_Id",
                principalTable: "TreatmentRecords",
                principalColumn: "TreatmentRecordID");
        }
    }
}
