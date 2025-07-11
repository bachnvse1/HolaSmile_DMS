
namespace Application.Usecases.UserCommon.ViewPatientPrescription
{
    public class ViewPrescriptionDTO
    {
        public int PrescriptionId { get; set; }
        public int AppointmentId { get; set; }
        public string content { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
    }
}
