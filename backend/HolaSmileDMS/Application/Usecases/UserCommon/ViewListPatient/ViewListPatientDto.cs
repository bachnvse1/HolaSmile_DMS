namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewListPatientDto
    {
        public string UserId { get; set; } = string.Empty;
        public string PatientId { get; set; } = string.Empty;
        public string Fullname { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public string? Phone { get; set; }
        public string? DOB { get; set; }
        public string? Email { get; set; }
    }
}

