import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  CreditCard, 
  Calendar, 
  FileText, 
  Clock, 
  Receipt,
  CheckCircle,
  AlertCircle,
  XCircle,
  Copy
} from "lucide-react"
import { toast } from "react-toastify"
import type { Invoice } from "@/types/invoice"
import { formatCurrency } from "@/utils/currencyUtils"

interface InvoiceDetailModalProps {
  isDetailOpen: boolean
  setIsDetailOpen: (open: boolean) => void
  selectedInvoice: Invoice | null
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => React.ReactNode 
  getTransactionTypeBadge: (type: string) => React.ReactNode 
}

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  paid: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
}

// Copy to clipboard function
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} đã được sao chép!`)
  } catch (error) {
    toast.error("Không thể sao chép")
  }
}

// Enhanced info card component
const InfoCard = ({ 
  title, 
  icon, 
  children, 
  className = "",
  bgColor = "bg-gray-50",
  borderColor = "border-gray-200",
  titleColor = "text-gray-800"
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  bgColor?: string
  borderColor?: string
  titleColor?: string
}) => (
  <div className={`p-4 ${bgColor} rounded-lg border ${borderColor} shadow-sm ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className={`font-semibold text-base ${titleColor}`}>{title}</h3>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
)

// Enhanced info row component
const InfoRow = ({ 
  label, 
  value, 
  copyable = false,
  className = "" 
}: {
  label: string
  value: string | React.ReactNode
  copyable?: boolean
  className?: string
}) => (
  <div className={`flex justify-between items-center text-sm ${className}`}>
    <span className="text-gray-700 font-medium">{label}:</span>
    <div className="flex items-center gap-2">
      {typeof value === 'string' ? (
        <span className="text-gray-900 font-semibold text-right max-w-[60%] break-words">
          {value}
        </span>
      ) : (
        value
      )}
      {copyable && typeof value === 'string' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-200"
          onClick={() => copyToClipboard(value, label)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
)

export function InvoiceDetailModal({
  isDetailOpen,
  setIsDetailOpen,
  selectedInvoice,
  formatDate,
  getStatusBadge,
  getTransactionTypeBadge,
}: InvoiceDetailModalProps) {
  
  if (!selectedInvoice) {
    return null
  }

  const paymentProgress = selectedInvoice.totalAmount ? 
    Math.round(((selectedInvoice.paidAmount || 0) / selectedInvoice.totalAmount) * 100) : 0
  
  const remainingAmount = (selectedInvoice.totalAmount || 0) - (selectedInvoice.paidAmount || 0)
  const isFullyPaid = remainingAmount <= 0
  const isPending = selectedInvoice.status === 'pending'
  const isOverdue = selectedInvoice.status === 'overdue'

  return (
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Chi tiết hóa đơn
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Thông tin đầy đủ về hóa đơn thanh toán
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusIcons[selectedInvoice.status as keyof typeof statusIcons]}
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Payment Progress */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-800">Tiến độ thanh toán</h3>
              <Badge variant={isFullyPaid ? "default" : "secondary"} className="text-sm">
                {paymentProgress}% hoàn thành
              </Badge>
            </div>
            <Progress value={paymentProgress} className="h-3 mb-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Đã thanh toán: {formatCurrency(selectedInvoice.paidAmount)}</span>
              <span>Còn lại: {formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          {/* Alert for overdue or pending */}
          {(isPending || isOverdue) && (
            <div className={`mb-6 p-4 rounded-lg border ${
              isOverdue 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {isOverdue ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <span className={`font-medium ${
                  isOverdue ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {isOverdue ? 'Hóa đơn đã quá hạn thanh toán' : 'Hóa đơn chờ thanh toán'}
                </span>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Patient Information */}
            <InfoCard
              title="Thông tin bệnh nhân"
              icon={<User className="h-5 w-5 text-blue-600" />}
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              titleColor="text-blue-800"
            >
              <InfoRow 
                label="Tên bệnh nhân" 
                value={selectedInvoice.patientName}
                copyable
              />
              <InfoRow 
                label="Mô tả điều trị" 
                value={selectedInvoice.description}
              />
            </InfoCard>

            {/* Payment Information */}
            <InfoCard
              title="Thông tin thanh toán"
              icon={<CreditCard className="h-5 w-5 text-green-600" />}
              bgColor="bg-green-50"
              borderColor="border-green-200"
              titleColor="text-green-800"
            >
              <InfoRow 
                label="Tổng tiền"
                value={
                  <span className="font-bold text-green-700 text-lg">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                }
              />
              <InfoRow 
                label="Đã thanh toán"
                value={
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(selectedInvoice.paidAmount)}
                  </span>
                }
              />
              <InfoRow 
                label="Còn lại"
                value={
                  <span className={`font-semibold ${
                    remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                }
              />
              <InfoRow 
                label="Phương thức thanh toán"
                value={
                  <Badge variant="outline" className="bg-white">
                    {selectedInvoice.paymentMethod==="cash" ? "Tiền mặt" : "Chuyển khoản"}
                  </Badge>
                }
              />
              <InfoRow 
                label="Loại giao dịch"
                value={getTransactionTypeBadge(selectedInvoice.transactionType)}
              />
            </InfoCard>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <InfoCard
              title="Thông tin đơn hàng"
              icon={<FileText className="h-5 w-5 text-purple-600" />}
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
              titleColor="text-purple-800"
            >
              <InfoRow 
                label="Mã đơn hàng"
                value={selectedInvoice.orderCode || "N/A"}
                copyable={!!selectedInvoice.orderCode}
              />
            </InfoCard>

            {/* Date Information */}
            <InfoCard
              title="Thông tin thời gian"
              icon={<Calendar className="h-5 w-5 text-orange-600" />}
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              titleColor="text-orange-800"
            >
              <InfoRow 
                label="Ngày tạo"
                value={formatDate(selectedInvoice.createdAt)}
              />
              <InfoRow 
                label="Ngày thanh toán"
                value={formatDate(selectedInvoice.paymentDate)}
              />
              <InfoRow 
                label="Trạng thái hiện tại"
                value={getStatusBadge(selectedInvoice.status)}
              />
            </InfoCard>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button 
              variant="default" 
              onClick={() => setIsDetailOpen(false)}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}