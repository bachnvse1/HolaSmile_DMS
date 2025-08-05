using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Receptionist.EditPatientInformation
{
    public class EditPatientInformationCommand :IRequest<bool>
    {
        public int PatientID { get; set; }
        public string FullName { get; set; }
        public string Dob { get; set; }
        public bool Gender { get; set; }
        public string Email { get; set; }
        public string Address { get; set; }
        public string? UnderlyingConditions { get; set; }
    }
}
