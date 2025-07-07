namespace Application.Usecases.UserCommon.ViewSupplies
{
    public class SuppliesDTO
    {

        public int SupplyID { get; set; }
        public string? Name { get; set; }
        public string? Unit { get; set; }
        public int QuantityInStock { get; set; }
        public decimal Price { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string UpdateBy { get; set; }
        public bool IsDeleted { get; set; }


    }
}
