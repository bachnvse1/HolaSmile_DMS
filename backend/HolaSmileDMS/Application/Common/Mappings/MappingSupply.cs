using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Usecases.Assistants.ViewSupplies;
using AutoMapper;

namespace Application.Common.Mappings
{
    public class MappingSupply :Profile
    {
        public MappingSupply() 
        {
            CreateMap<Supplies, SuppliesDTO>();
        }
    }
}
