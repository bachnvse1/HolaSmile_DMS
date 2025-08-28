using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Assistant.EditSupply
{
    public class EditSupplyCommand : IRequest<bool>
    {
        public int SupplyId { get; set; }
        public string? SupplyName { get; set; }
        
        //public int QuantityInStock { get; set; }
        public string? Unit { get; set; }
        public decimal Price { get; set; }
        //public DateTime? ExpiryDate { get; set; }
    }
}
