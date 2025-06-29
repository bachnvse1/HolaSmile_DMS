export interface Procedure {
  procedureId: number;
  procedureName: string;
  price: number;
  description: string;
  discount: number;
  warrantyPeriod: string;
  originalPrice: number;
  consumableCost: number;
  referralCommissionRate: number;
  doctorCommissionRate: number;
  assistantCommissionRate: number;
  technicianCommissionRate: number;
}
