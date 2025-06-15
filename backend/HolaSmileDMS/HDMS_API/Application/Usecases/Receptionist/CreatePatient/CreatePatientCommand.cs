using MediatR;

namespace HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount
{
    public class CreatePatientCommand : IRequest<int>
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Dob { get; set; }
        public bool Gender { get; set; }
        public string Email { get; set; }
        public string Adress { get; set; }
        public string UnderlyingConditions { get; set; }
        public string PatientGroup { get; set; }
        public string Note { get; set; }
        public int Createdby { get; set; }
    }
}
