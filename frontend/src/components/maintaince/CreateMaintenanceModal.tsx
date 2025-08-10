import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command"
import { CheckIcon, XIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { createMaintenance } from "@/services/maintenanceService"
import { supplyApi } from "@/services/supplyApi"

interface ApiSupply {
  SupplyID: number
  Name: string
  Unit: string
  Price: number
  ExpiryDate?: string
}

interface Supply {
  supplyId: number
  name: string
  unit: string
  price: number
  expiryDate?: string
}

interface CreateMaintenanceModalProps {
  onMaintenanceCreated: () => void
}

interface CreateMaintenanceRequest {
  maintenanceDate: string
  description: string
  status: string
  supplyIds: number[]
}

interface ApiError {
  response?: {
    data?: {
      message?: string
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

const validateForm = (description: string): string[] => {
  const errors: string[] = []
  
  if (!description.trim()) {
    errors.push("Vui lòng nhập mô tả bảo trì.")
  }
  
  if (description.length > 500) {
    errors.push("Mô tả không được vượt quá 500 ký tự.")
  }
  
  return errors
}

const mapApiSupplyToSupply = (apiSupply: ApiSupply): Supply => ({
  supplyId: apiSupply.SupplyID,
  name: apiSupply.Name,
  unit: apiSupply.Unit,
  price: apiSupply.Price,
  expiryDate: apiSupply.ExpiryDate,
})

export function CreateMaintenanceModal({ onMaintenanceCreated }: CreateMaintenanceModalProps) {
  const [formData, setFormData] = useState({
    description: "",
  })
  const [availableSupplies, setAvailableSupplies] = useState<Supply[]>([])
  const [selectedSupplies, setSelectedSupplies] = useState<Supply[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isSuppliesLoading, setIsSuppliesLoading] = useState(false)

  const selectedSupplyIds = useMemo(
    () => new Set(selectedSupplies.map(s => s.supplyId)),
    [selectedSupplies]
  )

  const loadSupplies = useCallback(async () => {
    setIsSuppliesLoading(true)
    try {
      const apiSupplies: ApiSupply[] = await supplyApi.getSupplies()
      const mappedSupplies = apiSupplies.map(mapApiSupplyToSupply)
      setAvailableSupplies(mappedSupplies)
    } catch (error) {
      handleApiError(error, "Không tải được danh sách vật tư.")
      setAvailableSupplies([])
    } finally {
      setIsSuppliesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && availableSupplies.length === 0) {
      loadSupplies()
    }
  }, [isOpen, availableSupplies.length, loadSupplies])

  const resetForm = useCallback(() => {
    setFormData({ description: "" })
    setSelectedSupplies([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm(formData.description)
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error))
      return
    }

    const supplyIds = selectedSupplies.map(s => s.supplyId)
    const requestData: CreateMaintenanceRequest = {
      maintenanceDate: new Date().toISOString(),
      description: formData.description,
      status: "Pending",
      supplyIds,
    }

    setIsLoading(true)
    try {
      await createMaintenance(requestData)
      toast.success("Phiếu bảo trì đã được tạo thành công.")
      resetForm()
      onMaintenanceCreated()
      setIsOpen(false)
    } catch (error) {
      handleApiError(error, "Không thể tạo phiếu bảo trì.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSupply = useCallback((supply: Supply) => {
    setSelectedSupplies(prev => {
      const isSelected = prev.some(s => s.supplyId === supply.supplyId)
      if (isSelected) {
        return prev.filter(s => s.supplyId !== supply.supplyId)
      } else {
        return [...prev, supply]
      }
    })
  }, [])

  const handleRemoveSupply = useCallback((supplyId: number) => {
    setSelectedSupplies(prev => prev.filter(s => s.supplyId !== supplyId))
  }, [])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }))
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && (formData.description || selectedSupplies.length > 0)) {
      const confirmClose = window.confirm("Bạn có chắc muốn đóng? Dữ liệu đã nhập sẽ bị mất.")
      if (!confirmClose) return
    }
    
    if (!open) {
      resetForm()
    }
    setIsOpen(open)
  }, [formData.description, selectedSupplies.length, resetForm])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Tạo bảo trì mới</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]" 
        aria-labelledby="create-maintenance-title"
        aria-describedby="create-maintenance-description"
      >
        <DialogHeader>
          <DialogTitle id="create-maintenance-title">Tạo phiếu bảo trì</DialogTitle>
          <DialogDescription id="create-maintenance-description">
            Nhập thông tin để tạo phiếu bảo trì mới.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Mô tả *
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Nhập mô tả bảo trì..."
                maxLength={500}
                required
                aria-describedby="description-help"
              />
              <div 
                id="description-help"
                className="text-xs text-muted-foreground text-right"
              >
                {formData.description.length}/500 ký tự
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Vật tư</Label>
            <div className="col-span-3 flex flex-col gap-2">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    aria-label="Chọn vật tư"
                    className="w-full justify-between bg-transparent"
                    disabled={isSuppliesLoading}
                  >
                    {isSuppliesLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải...
                      </>
                    ) : selectedSupplies.length > 0 ? (
                      `${selectedSupplies.length} vật tư đã chọn`
                    ) : (
                      "Chọn vật tư..."
                    )}
                    <CheckIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm vật tư..." />
                    <CommandList>
                      {isSuppliesLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>Không tìm thấy vật tư.</CommandEmpty>
                          <CommandGroup>
                            {availableSupplies.map(supply => (
                              <CommandItem
                                key={supply.supplyId}
                                onSelect={() => handleSelectSupply(supply)}
                                className="cursor-pointer"
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSupplyIds.has(supply.supplyId)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{supply.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {supply.unit} - {supply.price.toLocaleString("vi-VN")} VND
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedSupplies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Vật tư đã chọn">
                  {selectedSupplies.map(supply => (
                    <div key={supply.supplyId} role="listitem" className="flex">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span className="truncate max-w-[120px]">{supply.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveSupply(supply.supplyId)}
                          aria-label={`Xóa ${supply.name}`}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isSuppliesLoading}
              aria-label={isLoading ? "Đang tạo phiếu bảo trì" : "Tạo phiếu bảo trì"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}