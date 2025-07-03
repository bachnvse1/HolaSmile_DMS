namespace Application.Usecases.Patients.ViewListPatient
{
    public class ViewListPatientDto
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

