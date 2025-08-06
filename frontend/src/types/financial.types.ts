export interface FinancialTransaction {
  transactionID: number;
  transactionDate: string;
  description: string;
  transactionType: string | boolean;
  category: string;
  paymentMethod: string | boolean; 
  evidenceImage?: string;
  amount: number;
  createBy: string;
  updateBy: string;
  createAt: string;
  updateAt: string | null;
  isConfirmed?: boolean;
  status?: string;
  createdBy?: number;
  updatedBy?: number | null;
  createById?: number; 
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateTransactionRequest {
  transactionType: boolean;
  description: string;
  amount: number;
  category: string;
  paymentMethod: boolean; 
  transactionDate: string;
  evidentImage?: File;
}

export interface UpdateTransactionRequest {
  TransactionId: number;
  TransactionDate: string;
  Description: string;
  TransactionType: boolean; 
  Category: string;
  PaymentMethod: boolean; 
  Amount: number;
  EvidenceImage?: File; 
}

export interface ApiResponse {
  message?: string;
  status?: boolean;
}