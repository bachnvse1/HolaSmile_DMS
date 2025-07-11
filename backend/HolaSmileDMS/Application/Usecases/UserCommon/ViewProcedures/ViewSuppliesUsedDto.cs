using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.UserCommon.ViewProcedures
{
    public class ViewSuppliesUsedDto
    {
        public int SupplyId { get; set; }
        public string SupplyName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
