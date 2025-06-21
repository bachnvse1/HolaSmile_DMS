namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class RawPatientDto
    {
        public int UserId { get; set; }
        public int PatientId { get; set; }
        public string Fullname { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public string? Phone { get; set; }
        public string? DOB { get; set; }
        public string? Email { get; set; }
    }
}

