export interface Invoice {
  invoiceId: number
  patientId: number
  treatmentRecordId: number
  totalAmount: number
  paymentMethod: string
  transactionType: string
  paymentDate: string | null
  description: string
  status: string
  paidAmount: number
  remainingAmount: number | null
  orderCode: string | null
  transactionId: string | null
  createdAt: string
  patientName: string
}

export interface NewInvoice {
  patientId: number
  treatmentRecordId: number
  paymentMethod: string
  transactionType: string
  description: string
  paidAmount: number
}