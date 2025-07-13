import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { Invoice } from "@/types/invoice"
import { Eye, FileText, CreditCard, Calendar, DollarSign, User, Loader2 } from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"
import { invoiceService } from "@/services/invoiceService"
import { useUserInfo } from "@/hooks/useUserInfo"

interface InvoiceTableProps {
  displayData: Invoice[]
  formatCurrency: (amount: number | null) => string
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
  isLoading?: boolean
}

// Loading skeleton component
const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-4 w-20 ml-auto" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-4 w-20 ml-auto" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-4 w-20 ml-auto" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-6 w-20" />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Skeleton className="h-8 w-20 mx-auto" />
        </TableCell>
      </TableRow>
    ))}
  </>
)

// Empty state component
const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={8} className="text-center py-12">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-gray-100 p-6">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            Không tìm thấy hóa đơn
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Không có hóa đơn nào phù hợp với bộ lọc hiện tại.
            Hãy thử điều chỉnh bộ lọc hoặc tạo hóa đơn mới.
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
)

// Enhanced invoice row component
const InvoiceRow = ({
  invoice,
  formatCurrency,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail
}: {
  invoice: Invoice
  formatCurrency: (amount: number | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
}) => {
  const { role } = useUserInfo()
  const [paymentLoading, setPaymentLoading] = useState(false)

  const remainingAmount = (invoice.totalAmount || 0) - (invoice.paidAmount || 0)
  const paymentProgress = invoice.totalAmount ?
    Math.round(((invoice.paidAmount || 0) / invoice.totalAmount) * 100) : 0

  const handlePayment = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!invoice.orderCode) {
      console.error('Order code is required for payment')
      return
    }

    setPaymentLoading(true)
    try {
      const response = await invoiceService.createPaymentLink(invoice.orderCode)

      if (response.checkoutUrl) {
        // Redirect to payment URL
        window.location.href = response.checkoutUrl
      } else {
        console.error('Payment link not found in response')
      }
    } catch (error) {
      console.error('Error creating payment link:', error)
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <TableRow
      className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
      onClick={() => openInvoiceDetail(invoice)}
    >
      <TableCell className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {invoice.patientName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              ID: {invoice.patientId}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-6 py-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-green-700">
            {formatCurrency(invoice.totalAmount)}
          </div>
          <div className="text-xs text-gray-500">
            <DollarSign className="inline h-3 w-3 mr-1" />
            Tổng tiền
          </div>
        </div>
      </TableCell>

      <TableCell className="px-6 py-4">
        <div className="text-right">
          <div className="text-sm text-gray-700">
            {formatCurrency(invoice.paidAmount)}
          </div>
          <div className="text-xs text-gray-500">
            {paymentProgress}% hoàn thành
          </div>
        </div>
      </TableCell>

      <TableCell className="px-6 py-4">
        <div className="text-right">
          <div className={`text-sm ${remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
            {formatCurrency(remainingAmount)}
          </div>
          {remainingAmount > 0 && (
            <div className="text-xs text-red-500">
              Chưa thanh toán
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="px-6 py-4">
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-300 text-xs"
        >
          {invoice.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
        </Badge>
      </TableCell>

      <TableCell className="px-6 py-4">
        {getTransactionTypeBadge(invoice.transactionType)}
      </TableCell>

      <TableCell className="px-6 py-4">
        {getStatusBadge(invoice.status)}
      </TableCell>

      <TableCell className="px-6 py-4">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openInvoiceDetail(invoice)
            }}
            className="text-blue-600 hover:bg-blue-50 transition-colors duration-200 group-hover:bg-blue-100"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {role === "Patient" && remainingAmount > 0 && invoice.orderCode && invoice.paymentMethod !== "cash" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePayment}
              disabled={paymentLoading}
              className="text-green-600 border-green-600 hover:bg-green-50 transition-colors duration-200"
            >
              {paymentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function InvoiceTable({
  displayData,
  formatCurrency,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail,
  isLoading = false,
}: InvoiceTableProps) {
  return (
    <div className="relative overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Đang tải...</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Bệnh nhân</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-end space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Tổng tiền</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-end space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Thanh toán</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-end space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Còn lại</span>
                </div>
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phương thức
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại giao dịch
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <TableSkeleton />
            ) : displayData.length === 0 ? (
              <EmptyState />
            ) : (
              displayData.map((invoice) => (
                <InvoiceRow
                  key={invoice.invoiceId}
                  invoice={invoice}
                  formatCurrency={formatCurrency}
                  getStatusBadge={getStatusBadge}
                  getTransactionTypeBadge={getTransactionTypeBadge}
                  openInvoiceDetail={openInvoiceDetail}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table footer with summary */}
      {!isLoading && displayData.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Tổng cộng: {displayData.length} hóa đơn</span>
            <div className="flex space-x-6">
              <span>
                Tổng giá trị: {formatCurrency(
                  displayData.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
                )}
              </span>
              <span>
                Đã thu: {formatCurrency(
                  displayData
                    .filter(inv => inv.status === "paid" || inv.status === "completed")
                    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}