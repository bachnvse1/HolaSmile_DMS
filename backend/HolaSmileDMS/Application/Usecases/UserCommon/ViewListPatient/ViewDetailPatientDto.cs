using System;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewDetailPatientDto
    {
        public int PatientId { get; set; }
        public string? Fullname { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? DOB { get; set; }
        public bool? Gender { get; set; }
        public string? PatientGroup { get; set; }
        public string? UnderlyingConditions { get; set; }
        public string? Avatar { get; set; }
    }
}
