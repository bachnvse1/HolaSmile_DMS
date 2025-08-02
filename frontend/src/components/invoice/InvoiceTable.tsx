import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Invoice } from "@/types/invoice"
import {
  Eye,
  FileText,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Printer,
  ChevronDown,
  ChevronRight,
  Users,
  Edit
} from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"
import { invoiceService } from "@/services/invoiceService"
import { useUserInfo } from "@/hooks/useUserInfo"
import { toast } from "react-toastify"
import { formatCurrency } from "@/utils/currencyUtils"

interface InvoiceTableProps {
  displayData: Invoice[]
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
  onUpdateInvoice?: (invoice: Invoice) => void
  isLoading?: boolean
}

interface GroupedInvoice {
  treatmentRecordId: string
  patientName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentProgress: number
  invoices: Invoice[]
}

interface PatientGroup {
  patientName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentProgress: number
  treatmentRecords: GroupedInvoice[]
}

const TableSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="border-b border-gray-200">
        <div className="bg-blue-100 p-3 sm:p-4 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-24 sm:w-32" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-8">
              <Skeleton className="h-4 w-16 sm:w-20" />
              <Skeleton className="h-4 w-12 sm:w-16" />
              <Skeleton className="h-4 w-16 sm:w-20" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 sm:p-4 animate-pulse ml-2 sm:ml-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-24 sm:w-32" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-8">
              <Skeleton className="h-4 w-16 sm:w-20" />
              <Skeleton className="h-4 w-12 sm:w-16" />
              <Skeleton className="h-4 w-16 sm:w-20" />
            </div>
          </div>
        </div>

        {Array.from({ length: 2 }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-3 sm:p-4 animate-pulse ml-4 sm:ml-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20 sm:w-24" />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-8">
                <Skeleton className="h-4 w-12 sm:w-16" />
                <Skeleton className="h-4 w-12 sm:w-16" />
                <Skeleton className="h-4 w-12 sm:w-16" />
                <Skeleton className="h-6 w-12 sm:w-16" />
                <Skeleton className="h-6 w-12 sm:w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </>
)

const EmptyState = () => (
  <div className="text-center py-8 sm:py-12">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="rounded-full bg-gray-100 p-4 sm:p-6">
        <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
      </div>
      <div className="space-y-2 px-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">
          Không tìm thấy hóa đơn
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
          Không có hóa đơn nào phù hợp với bộ lọc hiện tại.
          Hãy thử điều chỉnh bộ lọc hoặc tạo hóa đơn mới.
        </p>
      </div>
    </div>
  </div>
)

const ActionsDropdown = ({
  invoice,
  openInvoiceDetail,
  onUpdateInvoice,
  onPayment,
  onPrint,
  paymentLoading,
  printLoading
}: {
  invoice: Invoice
  openInvoiceDetail: (invoice: Invoice) => void
  onUpdateInvoice?: (invoice: Invoice) => void
  onPayment: () => void
  onPrint: () => void
  paymentLoading: boolean
  printLoading: boolean
}) => {
  const { role } = useUserInfo()

  const remainingAmount = (invoice.totalAmount || 0) - (invoice.paidAmount || 0)

  const canMakePayment = (role === "Patient" || role === "Receptionist") && 
                        remainingAmount > 0 && 
                        invoice.status !== "paid" && 
                        invoice.paymentMethod !== "cash" &&
                        (invoice.paymentUrl || invoice.orderCode) 

  const canUpdateInvoice = (role === "Admin" || role === "Receptionist") && 
                          invoice.status !== "paid"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            openInvoiceDetail(invoice)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </DropdownMenuItem>

        {canUpdateInvoice && onUpdateInvoice && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onUpdateInvoice(invoice)
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Cập nhật hóa đơn
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onPrint()
          }}
          disabled={printLoading}
        >
          <Printer className="mr-2 h-4 w-4" />
          {printLoading ? 'Đang in...' : 'In hóa đơn'}
        </DropdownMenuItem>

        {canMakePayment && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onPayment()
            }}
            disabled={paymentLoading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {paymentLoading ? 'Đang xử lý...' : 'Thanh toán'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const InvoiceRow = ({
  invoice,
  formatDate,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail,
  onUpdateInvoice
}: {
  invoice: Invoice
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
  onUpdateInvoice?: (invoice: Invoice) => void
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)

  const remainingAmount = (invoice.totalAmount || 0) - (invoice.paidAmount || 0)

  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const paymentUrl = await invoiceService.handlePayment(invoice)

      if (paymentUrl) {
        localStorage.setItem('orderCode', invoice.orderCode || '')
        window.location.href = paymentUrl
      } else {
        toast.error('Không thể tạo link thanh toán')
      }
    } catch (error: any) {
      console.error('Error handling payment:', error)
      toast.error(error.message || 'Không thể xử lý thanh toán')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePrint = async () => {
    setPrintLoading(true)
    try {
      const pdfBlob = await invoiceService.printInvoice(invoice.invoiceId)

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');

      if (printWindow) {
        const handleLoad = () => {
          printWindow.print();
        };

        const handleAfterPrint = () => {
          URL.revokeObjectURL(pdfUrl);
          printWindow.close();
        };

        printWindow.addEventListener('load', handleLoad);
        printWindow.addEventListener('afterprint', handleAfterPrint);

        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            URL.revokeObjectURL(pdfUrl);
          }
        }, 1000);

        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
          }
        }, 1500);
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `invoice_${invoice.invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);

        toast.info("Không thể mở cửa sổ in. File PDF đã được tải xuống.");
      }

      toast.success("Đã tạo hóa đơn để in");
    } catch (error: any) {
      toast.error(error.message || "Không thể in hóa đơn");
    } finally {
      setPrintLoading(false)
    }
  }

  return (
    <div className="hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ml-4 sm:ml-8">
      <div className="block sm:hidden p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-600">
            {formatDate(invoice.createdAt)}
          </div>
          <ActionsDropdown
            invoice={invoice}
            openInvoiceDetail={openInvoiceDetail}
            onUpdateInvoice={onUpdateInvoice}
            onPayment={handlePayment}
            onPrint={handlePrint}
            paymentLoading={paymentLoading}
            printLoading={printLoading}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <span className="text-gray-500">Mã đơn hàng:</span>
            <div className="font-medium text-blue-600">{invoice.orderCode || 'N/A'}</div>
          </div>
          <div>
            <span className="text-gray-500">Tổng tiền:</span>
            <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
          </div>
          <div>
            <span className="text-gray-500">Đã thanh toán:</span>
            <div className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</div>
          </div>
          <div>
            <span className="text-gray-500">Còn lại:</span>
            <div className="font-medium text-red-600">{formatCurrency(remainingAmount)}</div>
          </div>
          <div>
            <span className="text-gray-500">Phương thức:</span>
            <div className="mt-1">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-300 text-xs"
              >
                {invoice.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div>{getTransactionTypeBadge(invoice.transactionType)}</div>
          <div>{getStatusBadge(invoice.status)}</div>
        </div>
      </div>

      <div className="hidden sm:block min-w-[900px]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4"></div>
            <div className="text-sm text-gray-600 min-w-0">
              {formatDate(invoice.createdAt)}
            </div>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="text-sm text-blue-600 w-20 lg:w-24 text-right font-medium">
              {invoice.orderCode || 'N/A'}
            </div>

            <div className="text-sm text-gray-700 w-16 sm:w-20 lg:w-24 text-right">
              {formatCurrency(invoice.totalAmount)}
            </div>

            <div className="text-sm text-gray-700 w-16 sm:w-20 lg:w-24 text-right">
              {formatCurrency(invoice.paidAmount)}
            </div>

            <div className="text-sm text-gray-700 w-16 sm:w-20 lg:w-24 text-right">
              {formatCurrency(remainingAmount)}
            </div>

            <div className="w-16 sm:w-20">
              <Badge
                variant="outline"
                className={`text-xs ${
                  invoice.paymentMethod === "cash" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {invoice.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
              </Badge>
            </div>

            <div className="w-20 sm:w-24">
              {getTransactionTypeBadge(invoice.transactionType)}
            </div>

            <div className="w-16 sm:w-20">
              {getStatusBadge(invoice.status)}
            </div>

            <div className="w-12 flex justify-center">
              <ActionsDropdown
                invoice={invoice}
                openInvoiceDetail={openInvoiceDetail}
                onUpdateInvoice={onUpdateInvoice}
                onPayment={handlePayment}
                onPrint={handlePrint}
                paymentLoading={paymentLoading}
                printLoading={printLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TreatmentRecordHeader = ({
  group,
  isExpanded,
  onToggle,
  formatDate
}: {
  group: GroupedInvoice
  isExpanded: boolean
  onToggle: () => void
  formatDate: (dateString: string | null) => string
}) => {
  return (
    <div
      className="bg-blue-50 p-3 sm:p-4 cursor-pointer hover:bg-blue-100 transition-colors ml-2 sm:ml-4"
      onClick={onToggle}
    >
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-600" />
            )}
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 truncate">
              Hồ sơ: {group.treatmentRecordId}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(group.totalAmount)}
            </div>
            <div className="text-xs text-gray-500">Tổng tiền</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              {formatCurrency(group.paidAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {group.paymentProgress.toFixed(1)}% hoàn thành
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${group.remainingAmount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatCurrency(group.remainingAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {group.remainingAmount > 0 ? 'Chưa thanh toán' : 'Hoàn tất'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {group.invoices.length} hóa đơn
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(group.invoices[0]?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block min-w-[900px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex items-center space-x-3 min-w-0">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-900 truncate">
                Hồ sơ điều trị: {group.treatmentRecordId}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="w-20 lg:w-24"></div>
            
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(group.totalAmount)}
              </div>
              <div className="text-xs text-gray-500">Tổng tiền</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                {formatCurrency(group.paidAmount)}
              </div>
              <div className="text-xs text-gray-500">
                {group.paymentProgress.toFixed(1)}% hoàn thành
              </div>
            </div>

            <div className="text-right">
              <div className={`text-sm font-medium ${group.remainingAmount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(group.remainingAmount)}
              </div>
              <div className="text-xs text-gray-500">
                {group.remainingAmount > 0 ? 'Chưa thanh toán' : 'Hoàn tất'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {group.invoices.length} hóa đơn
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(group.invoices[0]?.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PatientGroupHeader = ({
  patientGroup,
  isExpanded,
  onToggle,
}: {
  patientGroup: PatientGroup
  isExpanded: boolean
  onToggle: () => void
}) => {
  return (
    <div
      className="bg-blue-100 p-3 sm:p-4 cursor-pointer hover:bg-blue-200 transition-colors border-b border-blue-200"
      onClick={onToggle}
    >
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-blue-700 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-700 flex-shrink-0" />
            )}
            <Users className="h-5 w-5 text-blue-700 flex-shrink-0" />
            <span className="text-base font-semibold text-blue-900 truncate">
              {patientGroup.patientName}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(patientGroup.totalAmount)}
            </div>
            <div className="text-xs text-gray-500">Tổng tiền</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              {formatCurrency(patientGroup.paidAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {patientGroup.paymentProgress.toFixed(2)}% hoàn thành
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${patientGroup.remainingAmount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatCurrency(patientGroup.remainingAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {patientGroup.remainingAmount > 0 ? 'Chưa thanh toán' : 'Hoàn tất'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {patientGroup.treatmentRecords.length} hồ sơ
            </div>
            <div className="text-xs text-gray-500">
              {patientGroup.treatmentRecords.reduce((sum, record) => sum + record.invoices.length, 0)} hóa đơn
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block min-w-[900px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-blue-700" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-700" />
              )}
            </div>
            <div className="flex items-center space-x-3 min-w-0">
              <Users className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="text-base font-semibold text-blue-900 truncate">
                {patientGroup.patientName}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="w-20 lg:w-24"></div>
            
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(patientGroup.totalAmount)}
              </div>
              <div className="text-xs text-gray-500">Tổng tiền</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                {formatCurrency(patientGroup.paidAmount)}
              </div>
              <div className="text-xs text-gray-500">
                {patientGroup.paymentProgress.toFixed(2)}% hoàn thành
              </div>
            </div>

            <div className="text-right">
              <div className={`text-sm font-medium ${patientGroup.remainingAmount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(patientGroup.remainingAmount)}
              </div>
              <div className="text-xs text-gray-500">
                {patientGroup.remainingAmount > 0 ? 'Chưa thanh toán' : 'Hoàn tất'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {patientGroup.treatmentRecords.length} hồ sơ
              </div>
              <div className="text-xs text-gray-500">
                {patientGroup.treatmentRecords.reduce((sum, record) => sum + record.invoices.length, 0)} hóa đơn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvoiceTable({
  displayData,
  formatDate,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail,
  onUpdateInvoice,
  isLoading = false,
}: InvoiceTableProps) {
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set())
  const [expandedTreatments, setExpandedTreatments] = useState<Set<string>>(new Set())

  const treatmentGroups = displayData.reduce((acc, invoice) => {
    const treatmentId = invoice.treatmentRecordId
    if (!acc[treatmentId]) {
      acc[treatmentId] = {
        treatmentRecordId: String(treatmentId),
        patientName: invoice.patientName,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        paymentProgress: 0,
        invoices: []
      }
    }

    acc[treatmentId].invoices.push(invoice)

    const groupInvoices = acc[treatmentId].invoices
    const totalAmount = Math.max(...groupInvoices.map(inv => inv.totalAmount || 0))
    const paidAmount = groupInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
    const remainingAmount = totalAmount - paidAmount
    const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    acc[treatmentId].totalAmount = totalAmount
    acc[treatmentId].paidAmount = paidAmount
    acc[treatmentId].remainingAmount = remainingAmount
    acc[treatmentId].paymentProgress = paymentProgress

    return acc
  }, {} as Record<string, GroupedInvoice>)

  const patientGroups = Object.values(treatmentGroups).reduce((acc, treatmentGroup) => {
    const patientName = treatmentGroup.patientName
    if (!acc[patientName]) {
      acc[patientName] = {
        patientName,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        paymentProgress: 0,
        treatmentRecords: []
      }
    }

    acc[patientName].treatmentRecords.push(treatmentGroup)

    const patientTreatments = acc[patientName].treatmentRecords
    const totalAmount = patientTreatments.reduce((sum, record) => sum + record.totalAmount, 0)
    const paidAmount = patientTreatments.reduce((sum, record) => sum + record.paidAmount, 0)
    const remainingAmount = totalAmount - paidAmount
    const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    acc[patientName].totalAmount = totalAmount
    acc[patientName].paidAmount = paidAmount
    acc[patientName].remainingAmount = remainingAmount
    acc[patientName].paymentProgress = paymentProgress

    return acc
  }, {} as Record<string, PatientGroup>)

  const patients = Object.values(patientGroups)

  const togglePatient = (patientName: string) => {
    const newExpanded = new Set(expandedPatients)
    if (newExpanded.has(patientName)) {
      newExpanded.delete(patientName)
    } else {
      newExpanded.add(patientName)
    }
    setExpandedPatients(newExpanded)
  }

  const toggleTreatment = (treatmentId: string) => {
    const newExpanded = new Set(expandedTreatments)
    if (newExpanded.has(treatmentId)) {
      newExpanded.delete(treatmentId)
    } else {
      newExpanded.add(treatmentId)
    }
    setExpandedTreatments(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="relative overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
        <TableSkeleton />
      </div>
    )
  }

  if (displayData.length === 0) {
    return (
      <div className="relative overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="divide-y divide-gray-200">
        {patients.map((patientGroup) => (
          <div key={patientGroup.patientName}>
            <PatientGroupHeader
              patientGroup={patientGroup}
              isExpanded={expandedPatients.has(patientGroup.patientName)}
              onToggle={() => togglePatient(patientGroup.patientName)}
            />

            {expandedPatients.has(patientGroup.patientName) && (
              <div className="bg-white">
                {patientGroup.treatmentRecords.map((treatmentGroup) => (
                  <div key={treatmentGroup.treatmentRecordId}>
                    <TreatmentRecordHeader
                      group={treatmentGroup}
                      isExpanded={expandedTreatments.has(treatmentGroup.treatmentRecordId)}
                      onToggle={() => toggleTreatment(treatmentGroup.treatmentRecordId)}
                      formatDate={formatDate}
                    />

                    {expandedTreatments.has(treatmentGroup.treatmentRecordId) && (
                      <div className="bg-white">
                        <div className="hidden sm:block bg-gray-50 px-4 py-2 border-b border-gray-200 ml-4 sm:ml-8">
                          <div className="min-w-[900px]">
                            <div className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center space-x-3">
                                <div className="w-4"></div>
                                <span>Ngày tạo</span>
                              </div>
                              <div className="flex items-center space-x-4 lg:space-x-6">
                                <div className="w-20 lg:w-24 text-right">Mã đơn hàng</div>
                                <div className="w-16 sm:w-20 lg:w-24 text-right">Tổng tiền</div>
                                <div className="w-16 sm:w-20 lg:w-24 text-right">Thanh toán</div>
                                <div className="w-16 sm:w-20 lg:w-24 text-right">Còn lại</div>
                                <div className="w-16 sm:w-20">Phương thức</div>
                                <div className="w-20 sm:w-24">Loại giao dịch</div>
                                <div className="w-16 sm:w-20">Trạng thái</div>
                                <div className="w-12 text-center">Thao tác</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {treatmentGroup.invoices.map((invoice) => (
                            <InvoiceRow
                              key={invoice.invoiceId}
                              invoice={invoice}
                              formatDate={formatDate}
                              getStatusBadge={getStatusBadge}
                              getTransactionTypeBadge={getTransactionTypeBadge}
                              openInvoiceDetail={openInvoiceDetail}
                              onUpdateInvoice={onUpdateInvoice}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-3 sm:px-6 py-3">
        <div className="block sm:hidden">
          <div className="text-xs text-gray-600 mb-2">
            <span>
              Tổng: {patients.length} bệnh nhân, {Object.values(treatmentGroups).length} hồ sơ, {displayData.length} hóa đơn
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {formatCurrency(patients.reduce((sum, patient) => sum + patient.totalAmount, 0))}
              </div>
              <div className="text-gray-500">Tổng giá trị</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {formatCurrency(patients.reduce((sum, patient) => sum + patient.paidAmount, 0))}
              </div>
              <div className="text-gray-500">Đã thu</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">
                {formatCurrency(patients.reduce((sum, patient) => sum + patient.remainingAmount, 0))}
              </div>
              <div className="text-gray-500">Còn lại</div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex justify-between items-center text-sm text-gray-600">
          <span className="truncate">
            Tổng cộng: {patients.length} bệnh nhân ({Object.values(treatmentGroups).length} hồ sơ điều trị, {displayData.length} hóa đơn)
          </span>
          <div className="flex space-x-4 lg:space-x-6 flex-shrink-0">
            <span className="whitespace-nowrap">
              Tổng giá trị: {formatCurrency(
                patients.reduce((sum, patient) => sum + patient.totalAmount, 0)
              )}
            </span>
            <span className="whitespace-nowrap">
              Đã thu: {formatCurrency(
                patients.reduce((sum, patient) => sum + patient.paidAmount, 0)
              )}
            </span>
            <span className="whitespace-nowrap">
              Còn lại: {formatCurrency(
                patients.reduce((sum, patient) => sum + patient.remainingAmount, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}