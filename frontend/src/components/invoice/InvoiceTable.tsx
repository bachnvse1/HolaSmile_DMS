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
  User, 
  MoreHorizontal, 
  Printer,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"
import { invoiceService } from "@/services/invoiceService"
import { useUserInfo } from "@/hooks/useUserInfo"
import { toast } from "react-toastify"

interface InvoiceTableProps {
  displayData: Invoice[]
  formatCurrency: (amount: number | null) => string
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
  isLoading?: boolean
}

// Grouped invoice data structure
interface GroupedInvoice {
  treatmentRecordId: string
  patientName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentProgress: number
  invoices: Invoice[]
}

// Loading skeleton component
const TableSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="border-b border-gray-200">
        {/* Group header skeleton */}
        <div className="bg-gray-50 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex items-center space-x-8">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        
        {/* Invoice rows skeleton */}
        {Array.from({ length: 2 }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center space-x-8">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </>
)

// Empty state component
const EmptyState = () => (
  <div className="text-center py-12">
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
  </div>
)

// Actions dropdown component
const ActionsDropdown = ({
  invoice,
  remainingAmount,
  openInvoiceDetail,
  onPayment,
  onPrint,
  paymentLoading,
  printLoading
}: {
  invoice: Invoice
  remainingAmount: number
  openInvoiceDetail: (invoice: Invoice) => void
  onPayment: () => void
  onPrint: () => void
  paymentLoading: boolean
  printLoading: boolean
}) => {
  const { role } = useUserInfo()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100"
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

        {role === "Patient" &&
          remainingAmount > 0 &&
          invoice.orderCode &&
          invoice.paymentMethod !== "cash" && (
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

// Individual invoice row component
const InvoiceRow = ({
  invoice,
  groupData,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail
}: {
  invoice: Invoice
  groupData: GroupedInvoice
  formatCurrency: (amount: number | null) => string
  formatDate: (dateString: string | null) => string
  getStatusBadge: (status: string) => JSX.Element
  getTransactionTypeBadge: (type: string) => JSX.Element
  openInvoiceDetail: (invoice: Invoice) => void
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)

  const handlePayment = async () => {
    if (!invoice.orderCode) {
      console.error('Order code is required for payment')
      return
    }

    setPaymentLoading(true)
    try {
      const response = await invoiceService.createPaymentLink(invoice.orderCode)

      if (response.checkoutUrl) {
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
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4"></div> {/* Spacer for alignment */}
        <div className="text-sm text-gray-600">
          {formatDate(invoice.createdAt)}
        </div>
      </div>
      
      <div className="flex items-center space-x-8">
        <div className="text-sm text-gray-700 w-24 text-right">
          {formatCurrency(invoice.totalAmount)}
        </div>
        
        <div className="text-sm text-gray-700 w-24 text-right">
          {formatCurrency(invoice.paidAmount)}
        </div>
        
        <div className="text-sm text-gray-700 w-24 text-right">
          {formatCurrency((invoice.totalAmount || 0) - (invoice.paidAmount || 0))}
        </div>
        
        <div className="w-20">
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300 text-xs"
          >
            {invoice.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
          </Badge>
        </div>
        
        <div className="w-24">
          {getTransactionTypeBadge(invoice.transactionType)}
        </div>
        
        <div className="w-20">
          {getStatusBadge(invoice.status)}
        </div>
        
        <div className="w-12 flex justify-center">
          <ActionsDropdown
            invoice={invoice}
            remainingAmount={groupData.remainingAmount}
            openInvoiceDetail={openInvoiceDetail}
            onPayment={handlePayment}
            onPrint={handlePrint}
            paymentLoading={paymentLoading}
            printLoading={printLoading}
          />
        </div>
      </div>
    </div>
  )
}

// Group header component
const GroupHeader = ({
  group,
  isExpanded,
  onToggle,
  formatCurrency,
  formatDate
}: {
  group: GroupedInvoice
  isExpanded: boolean
  onToggle: () => void
  formatCurrency: (amount: number | null) => string
  formatDate: (dateString: string | null) => string
}) => {
  return (
    <div 
      className="bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Hồ sơ điều trị: {group.treatmentRecordId}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {group.patientName}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
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
              {group.paymentProgress}% hoàn thành
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
  )
}

// Main component
export function InvoiceTable({
  displayData,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getTransactionTypeBadge,
  openInvoiceDetail,
  isLoading = false,
}: InvoiceTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group invoices by treatmentRecordId
  const groupedData = displayData.reduce((acc, invoice) => {
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
    
    // Calculate totals for the group
    const groupInvoices = acc[treatmentId].invoices
    const totalAmount = Math.max(...groupInvoices.map(inv => inv.totalAmount || 0))
    const paidAmount = groupInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
    const remainingAmount = totalAmount - paidAmount
    const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
    
    acc[treatmentId].totalAmount = totalAmount
    acc[treatmentId].paidAmount = paidAmount
    acc[treatmentId].remainingAmount = remainingAmount
    acc[treatmentId].paymentProgress = paymentProgress
    
    return acc
  }, {} as Record<string, GroupedInvoice>)

  const groups = Object.values(groupedData)

  const toggleGroup = (treatmentId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(treatmentId)) {
      newExpanded.delete(treatmentId)
    } else {
      newExpanded.add(treatmentId)
    }
    setExpandedGroups(newExpanded)
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
    <div className="relative overflow-hidden border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="divide-y divide-gray-200">
        {groups.map((group) => (
          <div key={group.treatmentRecordId}>
            <GroupHeader
              group={group}
              isExpanded={expandedGroups.has(group.treatmentRecordId)}
              onToggle={() => toggleGroup(group.treatmentRecordId)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
            
            {expandedGroups.has(group.treatmentRecordId) && (
              <div className="bg-white">
                {/* Sub-header for invoice details */}
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-3">
                      <div className="w-4"></div>
                      <span>Ngày tạo</span>
                      <span>Mã hóa đơn</span>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="w-24 text-right">Tổng tiền</div>
                      <div className="w-24 text-right">Thanh toán</div>
                      <div className="w-24 text-right">Còn lại</div>
                      <div className="w-20">Phương thức</div>
                      <div className="w-24">Loại giao dịch</div>
                      <div className="w-20">Trạng thái</div>
                      <div className="w-12 text-center">Thao tác</div>
                    </div>
                  </div>
                </div>
                
                {/* Invoice rows */}
                <div className="divide-y divide-gray-100">
                  {group.invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.invoiceId}
                      invoice={invoice}
                      groupData={group}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusBadge={getStatusBadge}
                      getTransactionTypeBadge={getTransactionTypeBadge}
                      openInvoiceDetail={openInvoiceDetail}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table footer with summary */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Tổng cộng: {groups.length} hồ sơ điều trị ({displayData.length} hóa đơn)</span>
          <div className="flex space-x-6">
            <span>
              Tổng giá trị: {formatCurrency(
                groups.reduce((sum, group) => sum + group.totalAmount, 0)
              )}
            </span>
            <span>
              Đã thu: {formatCurrency(
                groups.reduce((sum, group) => sum + group.paidAmount, 0)
              )}
            </span>
            <span>
              Còn lại: {formatCurrency(
                groups.reduce((sum, group) => sum + group.remainingAmount, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}