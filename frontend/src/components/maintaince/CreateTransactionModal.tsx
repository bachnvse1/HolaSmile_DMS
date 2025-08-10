import React, { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"
import { createMaintenanceTransaction } from "@/services/maintenanceService"

interface CreateTransactionModalProps {
  maintenanceId: number | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onVoucherCreated: () => void
}

interface CreateTransactionRequest {
  maintenanceId: number
  price: number
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      code?: string
    }
  }
  message?: string
}

const handleApiError = (error: unknown, defaultMessage: string): void => {
  const apiError = error as ApiError
  const message = 
    apiError?.response?.data?.message || 
    apiError?.message || 
    defaultMessage
  toast.error(message)
}

const validatePrice = (price: string | number): string[] => {
  const errors: string[] = []
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (!price || price === '') {
    errors.push("Vui lòng nhập số tiền.")
    return errors
  }
  
  if (isNaN(numPrice)) {
    errors.push("Giá phải là một số hợp lệ.")
    return errors
  }
  
  if (numPrice < 0) {
    errors.push("Giá không thể âm.")
  }
  
  if (numPrice === 0) {
    errors.push("Giá phải lớn hơn 0.")
  }
  
  if (numPrice > 10000000000) { 
    errors.push("Giá không thể vượt quá 10 tỷ VND.")
  }
  
  return errors
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CreateTransactionModal({
  maintenanceId,
  isOpen,
  onOpenChange,
  onVoucherCreated
}: CreateTransactionModalProps) {
  const [formData, setFormData] = useState({
    price: "" as string | number,
    rawInput: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const resetForm = useCallback(() => {
    setFormData({
      price: "",
      rawInput: ""
    })
    setValidationErrors([])
  }, [])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, maintenanceId, resetForm])

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      rawInput: value,
      price: value === "" ? "" : parseFloat(value) || ""
    }))
    
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }, [validationErrors.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (maintenanceId === null) {
      toast.error("Lỗi hệ thống: Không có ID bảo trì.")
      return
    }

    const errors = validatePrice(formData.price)
    if (errors.length > 0) {
      setValidationErrors(errors)
      errors.forEach(error => toast.error(error))
      return
    }

    const price = typeof formData.price === 'string' 
      ? parseFloat(formData.price) 
      : formData.price

    const requestData: CreateTransactionRequest = {
      maintenanceId,
      price: price as number
    }

    setIsLoading(true)
    try {
      await createMaintenanceTransaction(requestData)
      toast.success("Tạo phiếu chi thành công.")
      resetForm()
      onVoucherCreated()
      onOpenChange(false)
    } catch (error) {
      handleApiError(error, "Không thể tạo phiếu chi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = useCallback((open: boolean) => {
    if (!open && formData.rawInput && !isLoading) {
      const confirmClose = window.confirm(
        "Bạn có chắc muốn đóng? Dữ liệu đã nhập sẽ bị mất."
      )
      if (!confirmClose) return
    }
    
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }, [formData.rawInput, isLoading, resetForm, onOpenChange])

  const previewAmount = React.useMemo(() => {
    const price = typeof formData.price === 'string' 
      ? parseFloat(formData.price) 
      : formData.price
    
    return !isNaN(price as number) && (price as number) > 0 
      ? formatCurrency(price as number)
      : null
  }, [formData.price])

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        aria-labelledby="create-transaction-title"
        aria-describedby="create-transaction-description"
      >
        <DialogHeader>
          <DialogTitle id="create-transaction-title">Tạo phiếu chi</DialogTitle>
          <DialogDescription id="create-transaction-description">
            Nhập số tiền chi cho phiếu bảo trì.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="price" className="text-right pt-2">
              Giá chi *
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  value={formData.rawInput}
                  onChange={handlePriceChange}
                  placeholder="Nhập số tiền..."
                  min="0"
                  step="1000"
                  required
                  aria-describedby="price-help price-error"
                  className={validationErrors.length > 0 ? "border-red-500" : ""}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  VND
                </div>
              </div>
              
              {previewAmount && (
                <div className="text-sm text-muted-foreground" id="price-help">
                  Số tiền: <span className="font-medium text-foreground">{previewAmount}</span>
                </div>
              )}
              
              {validationErrors.length > 0 && (
                <div className="space-y-1" id="price-error" role="alert">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Nhập số tiền bằng VND
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalClose(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.rawInput}
              aria-label={isLoading ? "Đang tạo phiếu chi" : "Tạo phiếu chi"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo phiếu chi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}