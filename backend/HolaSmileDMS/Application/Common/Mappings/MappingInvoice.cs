using Application.Usecases.Patients.ViewInvoices;
using AutoMapper;

namespace Application.Common.Mappings;

public class MappingInvoice : Profile
{
    public MappingInvoice()
    {
        CreateMap<Invoice, ViewInvoiceDto>()
            .ForMember(dest => dest.TreatmentRecordId,
                opt => opt.MapFrom(src => src.TreatmentRecord_Id))
            .ForMember(dest => dest.PatientName,
                opt => opt.MapFrom(src => src.Patient.User.Fullname))
            .ForMember(dest => dest.PatientAddress,
            opt => opt.MapFrom(src => src.Patient.User.Address));
    }
}