import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "react-toastify"
import { Loader2, AlertTriangle } from "lucide-react"
import { deleteMaintenance } from "@/services/maintenanceService"

interface DeleteConfirmationModalProps {
  maintenanceId: number | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onRecordDeleted: () => void
  maintenanceDescription?: string
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      code?: string
      details?: string
    }
  }
  message?: string
  code?: string
}

const handleApiError = (error: unknown, defaultMessage: string): void => {
  const apiError = error as ApiError
  
  if (apiError?.response?.data?.code === 'MAINTENANCE_HAS_TRANSACTIONS') {
    toast.error("Không thể xóa phiếu bảo trì đã có phiếu chi. Vui lòng xóa các phiếu chi trước.")
    return
  }
  
  if (apiError?.response?.data?.code === 'MAINTENANCE_APPROVED') {
    toast.error("Không thể xóa phiếu bảo trì đã được phê duyệt.")
    return
  }
  
  if (apiError?.response?.data?.code === 'MAINTENANCE_NOT_FOUND') {
    toast.error("Phiếu bảo trì không tồn tại hoặc đã bị xóa.")
    return
  }
  
  const message = 
    apiError?.response?.data?.message || 
    apiError?.message || 
    defaultMessage
    
  toast.error(message)
}

export function DeleteConfirmationModal({
  maintenanceId,
  isOpen,
  onOpenChange,
  onRecordDeleted,
  maintenanceDescription
}: DeleteConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = useCallback(async () => {
    if (maintenanceId === null) {
      toast.error("Lỗi hệ thống: Không có phiếu bảo trì để xóa.")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      await deleteMaintenance(maintenanceId)
      toast.success("Đã xóa phiếu bảo trì thành công.")
      onRecordDeleted()
      onOpenChange(false)
    } catch (error) {
      const apiError = error as ApiError
      const errorMessage = 
        apiError?.response?.data?.message || 
        apiError?.message || 
        "Không thể xóa phiếu bảo trì."
      
      setError(errorMessage)
      handleApiError(error, "Không thể xóa phiếu bảo trì.")
    } finally {
      setIsLoading(false)
    }
  }, [maintenanceId, onRecordDeleted, onOpenChange])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setError(null)
    }
    onOpenChange(open)
  }, [onOpenChange])

  const handleCancel = useCallback(() => {
    if (!isLoading) {
      handleOpenChange(false)
    }
  }, [isLoading, handleOpenChange])

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                Xác nhận xóa phiếu bảo trì
              </AlertDialogTitle>
            </div>
          </div>
          
          <AlertDialogDescription className="text-left space-y-2">
            <div>
              Hành động này không thể hoàn tác. Phiếu bảo trì sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </div>
            
            {maintenanceDescription && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-900">Phiếu sẽ bị xóa:</div>
                <div className="text-sm text-gray-700 truncate" title={maintenanceDescription}>
                  Mô tả: {maintenanceDescription}
                </div>
              </div>
            )}

            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Việc xóa phiếu có thể ảnh hưởng đến:
                <ul className="mt-1 ml-4 space-y-1 list-disc">
                  <li>Các báo cáo thống kê</li>
                  <li>Lịch sử bảo trì</li>
                  <li>Dữ liệu liên quan khác</li>
                </ul>
              </div>
            </div>

            {error && (
              <div 
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md"
                role="alert"
                aria-live="polite"
              >
                <div className="text-sm text-red-800">
                  <strong>Lỗi:</strong> {error}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            disabled={isLoading}
            onClick={handleCancel}
            className="min-w-[80px]"
          >
            Hủy
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="min-w-[80px] bg-red-600 hover:bg-red-700 focus:ring-red-600"
            aria-label={isLoading ? "Đang xóa phiếu bảo trì" : "Xác nhận xóa phiếu bảo trì"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xóa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}