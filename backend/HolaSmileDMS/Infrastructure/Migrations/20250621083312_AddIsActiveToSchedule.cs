using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HDMS_API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Schedules",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "UserRoleResult",
                columns: table => new
                {
                    Role = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                })
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoleResult");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Schedules");
        }
    }
}
