import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Stethoscope, Package, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { ProcedureCreateForm, Supply, SupplyItem } from "@/types/procedure"
import { SupplySearch } from "./SupplySearch"
import { ConfirmModal } from "../common/ConfirmModal"
import { formatCurrency, parseCurrency, handleCurrencyInput } from "@/utils/currencyUtils"

interface CreateProcedureModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  form: ProcedureCreateForm
  onFormChange: (form: ProcedureCreateForm) => void
  onSubmit: () => void
}

interface ExtendedSupply extends Supply {
  supplyName: string
  unit: string
  price: number
}

export function CreateProcedureModal({
  isOpen,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: CreateProcedureModalProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [extendedSupplies, setExtendedSupplies] = useState<ExtendedSupply[]>([])
  
  const [formattedPrices, setFormattedPrices] = useState({
    originalPrice: "",
    price: "",
    consumableCost: "",
    calculatedSupplyCost: ""
  })

  const calculateSupplyCost = () => {
    return extendedSupplies.reduce((total, supply) => {
      if (supply.unit.toLowerCase() === "cái") {
        return total + (supply.price * supply.quantity)
      }
      return total
    }, 0)
  }

  const calculateSellingPrice = () => {
    const supplyCost = calculateSupplyCost()
    return form.originalPrice + form.consumableCost + supplyCost
  }

  useEffect(() => {
    const calculatedSupplyCost = calculateSupplyCost()
    const calculatedPrice = calculateSellingPrice()
    
    setFormattedPrices({
      originalPrice: form.originalPrice > 0 ? formatCurrency(form.originalPrice) : "",
      price: calculatedPrice > 0 ? formatCurrency(calculatedPrice) : "",
      consumableCost: form.consumableCost > 0 ? formatCurrency(form.consumableCost) : "",
      calculatedSupplyCost: calculatedSupplyCost > 0 ? formatCurrency(calculatedSupplyCost) : ""
    })

    if (calculatedPrice !== form.price) {
      updateForm("price", calculatedPrice)
    }
  }, [form.originalPrice, form.consumableCost, extendedSupplies])

  const updateForm = (field: keyof ProcedureCreateForm, value: string | number | Supply[]) => {
    onFormChange({ ...form, [field]: value })
  }

  const handleOriginalPriceChange = (value: string) => {
    handleCurrencyInput(value, (formatted) => {
      setFormattedPrices(prev => ({ ...prev, originalPrice: formatted }))
      const numericValue = parseCurrency(formatted)
      updateForm("originalPrice", numericValue)
    })
  }

  const handleConsumableCostChange = (value: string) => {
    handleCurrencyInput(value, (formatted) => {
      setFormattedPrices(prev => ({ ...prev, consumableCost: formatted }))
      const numericValue = parseCurrency(formatted)
      updateForm("consumableCost", numericValue)
    })
  }

  const addSupplyFromSearch = (supplyItem: SupplyItem) => {
    const existing = extendedSupplies.find((s) => s.supplyId === supplyItem.id)
    if (existing) {
      const updated = extendedSupplies.map((s) =>
        s.supplyId === supplyItem.id ? { ...s, quantity: s.quantity + 1 } : s,
      )
      setExtendedSupplies(updated)
      
      const formSupplies = updated.map(s => ({
        supplyId: s.supplyId,
        quantity: s.quantity,
        supplyName: s.supplyName
      }))
      updateForm("suppliesUsed", formSupplies)
    } else {
      const newSupply: ExtendedSupply = {
        supplyId: supplyItem.id,
        quantity: 1,
        supplyName: supplyItem.name,
        unit: supplyItem.unit,
        price: supplyItem.price
      }
      const updated = [...extendedSupplies, newSupply]
      setExtendedSupplies(updated)
      
      const formSupplies = updated.map(s => ({
        supplyId: s.supplyId,
        quantity: s.quantity,
        supplyName: s.supplyName
      }))
      updateForm("suppliesUsed", formSupplies)
    }
  }

  const removeSupply = (index: number) => {
    const updated = extendedSupplies.filter((_, i) => i !== index)
    setExtendedSupplies(updated)
    
    const formSupplies = updated.map(s => ({
      supplyId: s.supplyId,
      quantity: s.quantity,
      supplyName: s.supplyName
    }))
    updateForm("suppliesUsed", formSupplies)
  }

  const updateSupplyQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return
    const updated = extendedSupplies.map((s, i) =>
      i === index ? { ...s, quantity } : s,
    )
    setExtendedSupplies(updated)
    
    const formSupplies = updated.map(s => ({
      supplyId: s.supplyId,
      quantity: s.quantity,
      supplyName: s.supplyName
    }))
    updateForm("suppliesUsed", formSupplies)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.procedureName.trim()) {
      alert("Vui lòng nhập tên thủ thuật")
      return
    }
    if (!form.description.trim()) {
      alert("Vui lòng nhập mô tả thủ thuật")
      return
    }
    if (form.originalPrice <= 0) {
      alert("Giá gốc phải lớn hơn 0")
      return
    }
    if (form.price <= 0) {
      alert("Giá bán phải lớn hơn 0")
      return
    }
    const invalidSupply = extendedSupplies.find((s) => s.quantity <= 0)
    if (invalidSupply) {
      alert("Số lượng vật tư phải lớn hơn 0")
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = () => {
    onSubmit()
    setIsConfirmOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Thủ Thuật
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Tạo Thủ Thuật Mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông Tin Cơ Bản</h3>
              <div className="space-y-2">
                <Label htmlFor="procedureName">Tên Thủ Thuật *</Label>
                <Input
                  id="procedureName"
                  value={form.procedureName}
                  onChange={(e) => updateForm("procedureName", e.target.value)}
                  placeholder="Nhập tên thủ thuật"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô Tả *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Mô tả chi tiết về thủ thuật"
                  rows={3}
                  required
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground text-right">
                  {form.description.length}/1000
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Thông Tin Giá Cả
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Giá Gốc (VNĐ) *</Label>
                  <Input
                    id="originalPrice"
                    type="text"
                    value={formattedPrices.originalPrice}
                    onChange={(e) => handleOriginalPriceChange(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumableCost">Chi Phí Ước Tính (VNĐ)</Label>
                  <Input
                    id="consumableCost"
                    type="text"
                    value={formattedPrices.consumableCost}
                    onChange={(e) => handleConsumableCostChange(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calculatedSupplyCost">Chi Phí Vật Tư (VNĐ)</Label>
                  <Input
                    id="calculatedSupplyCost"
                    type="text"
                    value={formattedPrices.calculatedSupplyCost}
                    placeholder="0"
                    disabled
                    className="bg-muted"
                  />
                  <div className="text-xs text-muted-foreground">
                    Tự động tính từ vật tư có đơn vị "cái"
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Giá Bán (VNĐ)</Label>
                  <Input
                    id="price"
                    type="text"
                    value={formattedPrices.price}
                    placeholder="0"
                    disabled
                    className="bg-muted font-semibold"
                  />
                  <div className="text-xs text-muted-foreground">
                    Giá gốc + Chi phí khấu hao
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Vật Tư Sử Dụng
                </h3>
                <div className="flex gap-2">
                  <SupplySearch onSelectSupply={addSupplyFromSearch} selectedSupplies={form.suppliesUsed} />
                </div>
              </div>

              {extendedSupplies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có vật tư nào được thêm</p>
                  <p className="text-sm">Nhấn "Tìm Vật Tư" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {extendedSupplies.map((supply, index) => (
                    <div key={`${supply.supplyId}-${index}`} className="flex gap-4 items-center p-4 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{supply.supplyName}</h4>
                          <span className="text-sm text-muted-foreground">
                            ({supply.unit} - {formatCurrency(supply.price)})
                          </span>
                        </div>
                        {supply.unit.toLowerCase() === "cái" && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Thành tiền: {formatCurrency(supply.price * supply.quantity)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`quantity-${index}`} className="text-sm whitespace-nowrap">
                          Số lượng:
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          max="9999"
                          step="1"
                          value={supply.quantity || ''}
                          onChange={(e) => updateSupplyQuantity(index, Number.parseFloat(e.target.value) || 0)}
                          className="w-20"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSupply(index)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit">Tạo Thủ Thuật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận tạo thủ thuật"
        message="Bạn có chắc chắn muốn tạo thủ thuật này?"
        confirmText="Tạo"
        cancelText="Hủy"
      />
    </>
  )
}