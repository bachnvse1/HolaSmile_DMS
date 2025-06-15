namespace HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount
{
    public class CreatePatientDto
    {
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string PhoneNumber { get; set; } = default!;
        public string? Dob { get; set; }
        public bool Gender { get; set; }
        public string? Address { get; set; }
        public string? PatientGroup { get; set; }
        public string? UnderlyingConditions { get; set; }
        public int? CreatedBy { get; set; }

    }
}
