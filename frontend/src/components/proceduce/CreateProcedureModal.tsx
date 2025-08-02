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

export function CreateProcedureModal({
  isOpen,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: CreateProcedureModalProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  
  // State for formatted currency display
  const [formattedPrices, setFormattedPrices] = useState({
    originalPrice: "",
    price: "",
    consumableCost: ""
  })

  // Initialize formatted prices when form changes
  useEffect(() => {
    setFormattedPrices({
      originalPrice: form.originalPrice > 0 ? formatCurrency(form.originalPrice) : "",
      price: form.price > 0 ? formatCurrency(form.price) : "",
      consumableCost: form.consumableCost > 0 ? formatCurrency(form.consumableCost) : ""
    })
  }, [form.originalPrice, form.price, form.consumableCost])

  const updateForm = (field: keyof ProcedureCreateForm, value: string | number | Supply[]) => {
    onFormChange({ ...form, [field]: value })
  }

  // Handle currency input for originalPrice
  const handleOriginalPriceChange = (value: string) => {
    handleCurrencyInput(value, (formatted) => {
      setFormattedPrices(prev => ({ ...prev, originalPrice: formatted }))
      const numericValue = parseCurrency(formatted)
      updateForm("originalPrice", numericValue)
    })
  }

  // Handle currency input for price
  const handlePriceChange = (value: string) => {
    handleCurrencyInput(value, (formatted) => {
      setFormattedPrices(prev => ({ ...prev, price: formatted }))
      const numericValue = parseCurrency(formatted)
      updateForm("price", numericValue)
    })
  }

  // Handle currency input for consumable cost
  const handleConsumableCostChange = (value: string) => {
    handleCurrencyInput(value, (formatted) => {
      setFormattedPrices(prev => ({ ...prev, consumableCost: formatted }))
      const numericValue = parseCurrency(formatted)
      updateForm("consumableCost", numericValue)
    })
  }

  useEffect(() => {
    if (form.originalPrice > 0 && form.discount >= 0) {
      const calculatedPrice = form.originalPrice * (1 - form.discount / 100)
      if (calculatedPrice !== form.price) {
        updateForm("price", Math.round(calculatedPrice))
        setFormattedPrices(prev => ({ ...prev, price: formatCurrency(Math.round(calculatedPrice)) }))
      }
    }
  }, [form.originalPrice, form.discount])

  const addSupplyFromSearch = (supplyItem: SupplyItem) => {
    const existing = form.suppliesUsed.find((s) => s.supplyId === supplyItem.id)
    if (existing) {
      const updated = form.suppliesUsed.map((s) =>
        s.supplyId === supplyItem.id ? { ...s, quantity: s.quantity + 1 } : s,
      )
      updateForm("suppliesUsed", updated)
    } else {
      updateForm("suppliesUsed", [
        ...form.suppliesUsed,
        { supplyId: supplyItem.id, quantity: 1, supplyName: supplyItem.name },
      ])
    }
  }

  const removeSupply = (index: number) => {
    updateForm("suppliesUsed", form.suppliesUsed.filter((_, i) => i !== index))
  }

  const updateSupplyQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return
    const updated = form.suppliesUsed.map((s, i) =>
      i === index ? { ...s, quantity } : s,
    )
    updateForm("suppliesUsed", updated)
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
    if (form.originalPrice <= 0 || form.price <= 0) {
      alert("Giá gốc và giá bán phải lớn hơn 0")
      return
    }
    if (form.discount < 0 || form.discount > 100) {
      alert("Giảm giá phải từ 0 đến 100%")
      return
    }
    const invalidSupply = form.suppliesUsed.find((s) => s.quantity <= 0)
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
            {/* Basic Information */}
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

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Thông Tin Giá Cả
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="discount">Giảm Giá (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.discount || ''}
                    onChange={(e) => updateForm("discount", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Giá Bán (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="text"
                    value={formattedPrices.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
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

            {/* Supplies Used */}
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

              {form.suppliesUsed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có vật tư nào được thêm</p>
                  <p className="text-sm">Nhấn "Tìm Vật Tư" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Supply List */}
                  {form.suppliesUsed.map((supply, index) => (
                    <div key={`${supply.supplyId}-${index}`} className="flex gap-4 items-center p-4 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{supply.supplyName}</h4>
                        </div>
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