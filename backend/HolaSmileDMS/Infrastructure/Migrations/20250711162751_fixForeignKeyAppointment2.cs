using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HDMS_API.Migrations
{
    /// <inheritdoc />
    public partial class fixForeignKeyAppointment2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 🔴 XÓA FOREIGN KEY TREATMENT RECORD nếu còn
            migrationBuilder.DropForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecordID",
                table: "Instructions");

            // 🔴 XÓA CỘT TreatmentRecord_Id
            migrationBuilder.DropColumn(
                name: "TreatmentRecordID",
                table: "Instructions");

            // ✅ THÊM CỘT AppointmentId
            migrationBuilder.AddColumn<int>(
                name: "AppointmentId",
                table: "Instructions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Instructions_AppointmentId",
                table: "Instructions",
                column: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Instructions_Appointments_AppointmentId",
                table: "Instructions",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "AppointmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 🔄 XÓA FOREIGN KEY mới (Appointment)
            migrationBuilder.DropForeignKey(
                name: "FK_Instructions_Appointments_AppointmentId",
                table: "Instructions");

            migrationBuilder.DropIndex(
                name: "IX_Instructions_AppointmentId",
                table: "Instructions");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "Instructions");

            // 🔄 THÊM LẠI CỘT TreatmentRecord_Id
            migrationBuilder.AddColumn<int>(
                name: "TreatmentRecord_Id",
                table: "Instructions",
                type: "int",
                nullable: true);

            // 🔄 THÊM LẠI FOREIGN KEY TreatmentRecord
            migrationBuilder.AddForeignKey(
                name: "FK_Instructions_TreatmentRecords_TreatmentRecordID",
                table: "Instructions",
                column: "TreatmentRecord_Id",
                principalTable: "TreatmentRecord",
                principalColumn: "TreatmentRecordID");
        }
    }
}
