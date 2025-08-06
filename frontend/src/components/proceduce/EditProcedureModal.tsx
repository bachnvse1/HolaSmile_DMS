import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Package, Trash2, AlertCircle, Loader2, Calculator } from "lucide-react"
import { SupplySearch } from "./SupplySearch"
import { ConfirmModal } from "../common/ConfirmModal"
import type { Procedure, ProcedureUpdateForm, Supply, SupplyItem } from "@/types/procedure"
import { supplyApi, mapToSupplyItem } from "@/services/supplyApi"
import React from "react"
import { Badge } from "../ui/badge"
import { formatCurrency, parseCurrency, handleCurrencyInput } from "@/utils/currencyUtils"

interface EditProcedureModalProps {
    procedure: Procedure | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSave: (procedureId: number, updatedData: ProcedureUpdateForm) => Promise<void>
    isLoading?: boolean
}

interface FormErrors {
    procedureName?: string
    description?: string
    originalPrice?: string
    price?: string
    discount?: string
    consumableCost?: string
    general?: string
}

export function EditProcedureModal({
    procedure,
    isOpen,
    onOpenChange,
    onSave,
    isLoading = false
}: EditProcedureModalProps) {
    const [form, setForm] = React.useState<ProcedureUpdateForm>({
        procedureId: 0,
        procedureName: "",
        price: 0,
        description: "",
        discount: 0,
        originalPrice: 0,
        consumableCost: 0,
        suppliesUsed: [],
    })

    // State for formatted currency display
    const [formattedPrices, setFormattedPrices] = React.useState({
        originalPrice: "",
        price: "",
        estimatedCost: ""
    })

    const [errors, setErrors] = React.useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [autoCalculatePrice, setAutoCalculatePrice] = React.useState(true)
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
    const [supplyItems, setSupplyItems] = React.useState<SupplyItem[]>([])
    const [isLoadingSupplies, setIsLoadingSupplies] = React.useState(false)
    const [estimatedCost, setEstimatedCost] = React.useState(0)

    // Load all supply items when modal opens
    React.useEffect(() => {
        if (isOpen && supplyItems.length === 0) {
            const fetchSupplyItems = async () => {
                setIsLoadingSupplies(true)
                try {
                    const data = await supplyApi.getSupplies()
                    const mapped = data.map(mapToSupplyItem)
                    setSupplyItems(mapped)
                } catch (error) {
                    console.error("Lỗi khi tải danh sách vật tư:", error)
                } finally {
                    setIsLoadingSupplies(false)
                }
            }
            fetchSupplyItems()
        }
    }, [isOpen, supplyItems.length])

    React.useEffect(() => {
        if (procedure) {
            setForm({
                procedureId: procedure.procedureId,
                procedureName: procedure.procedureName,
                price: procedure.price,
                description: procedure.description,
                discount: procedure.discount ?? 0,
                originalPrice: procedure.originalPrice,
                consumableCost: procedure.consumableCost,
                suppliesUsed: procedure.suppliesUsed || [],
            })
            
            // Set formatted prices
            setFormattedPrices({
                originalPrice: formatCurrency(procedure.originalPrice),
                price: formatCurrency(procedure.price),
                estimatedCost: formatCurrency(procedure.consumableCost)
            })
            
            setErrors({})

            const totalCost = calculateTotalSupplyCost(procedure.suppliesUsed || [])
            setEstimatedCost(procedure.consumableCost - totalCost)
        }
    }, [procedure])

    const calculateTotalSupplyCost = React.useCallback((supplies: Supply[] = []): number => {
        return supplies.reduce((total, supply) => {
            const supplyItem = supplyItems.find(item => item.id === supply.supplyId)
            if (supplyItem) {
                return total + (supplyItem.price * supply.quantity)
            }
            return total
        }, 0)
    }, [supplyItems])

    React.useEffect(() => {
        setForm(prev => ({ ...prev, consumableCost: estimatedCost + calculateTotalSupplyCost(form.suppliesUsed) }));
    }, [estimatedCost, calculateTotalSupplyCost, form.suppliesUsed])

    React.useEffect(() => {
        if (autoCalculatePrice && form.originalPrice > 0) {
            const discountAmount = form.originalPrice * (form.discount / 100)
            const calculatedPrice = form.originalPrice - discountAmount + form.consumableCost
            const finalPrice = Math.max(0, calculatedPrice)
            setForm(prev => ({ ...prev, price: finalPrice }))
            setFormattedPrices(prev => ({ ...prev, price: formatCurrency(finalPrice) }))
        }
    }, [form.originalPrice, form.discount, autoCalculatePrice, form.consumableCost])

    const updateForm = React.useCallback((field: keyof ProcedureUpdateForm, value: string | number | Supply[]) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }, [errors])

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

    // Handle currency input for estimated cost
    const handleEstimatedCostChange = (value: string) => {
        handleCurrencyInput(value, (formatted) => {
            setFormattedPrices(prev => ({ ...prev, estimatedCost: formatted }))
            const numericValue = parseCurrency(formatted)
            setEstimatedCost(numericValue)
        })
    }

    const validateForm = React.useCallback((): FormErrors => {
        const newErrors: FormErrors = {}

        if (!form.procedureName.trim()) {
            newErrors.procedureName = "Tên thủ thuật là bắt buộc"
        } else if (form.procedureName.trim().length < 3) {
            newErrors.procedureName = "Tên thủ thuật phải có ít nhất 3 ký tự"
        }

        if (!form.description.trim()) {
            newErrors.description = "Mô tả là bắt buộc"
        } else if (form.description.trim().length < 10) {
            newErrors.description = "Mô tả phải có ít nhất 10 ký tự"
        }

        if (form.originalPrice <= 0) {
            newErrors.originalPrice = "Giá gốc phải lớn hơn 0"
        }

        if (form.price <= 0) {
            newErrors.price = "Giá bán phải lớn hơn 0"
        } else if (form.price > (form.originalPrice + form.consumableCost)) {
            newErrors.price = "Giá bán không được lớn hơn giá gốc"
        }

        if (form.discount < 0 || form.discount > 100) {
            newErrors.discount = "Giảm giá phải từ 0% đến 100%"
        }

        if (form.consumableCost < 0) {
            newErrors.consumableCost = "Chi phí vật tư không được âm"
        }

        if (autoCalculatePrice) {
            const expectedPrice = form.originalPrice * (1 - form.discount / 100) + form.consumableCost
            if (Math.abs(form.price - expectedPrice) > 0.01) {
                newErrors.price = "Giá bán không khớp với giá gốc và giảm giá"
            }
        }

        return newErrors
    }, [form, autoCalculatePrice])

    const addSupplyFromSearch = React.useCallback((supplyItem: SupplyItem) => {
        const currentSupplies = form.suppliesUsed || []
        const existingSupply = currentSupplies.find((s) => s.supplyId === supplyItem.id)

        if (existingSupply) {
            const updatedSupplies = currentSupplies.map((s) =>
                s.supplyId === supplyItem.id ? { ...s, quantity: s.quantity + 1 } : s,
            )
            updateForm("suppliesUsed", updatedSupplies)
        } else {
            const newSupply: Supply = {
                supplyId: supplyItem.id,
                quantity: 1,
                supplyName: supplyItem.name,
            }
            updateForm("suppliesUsed", [...currentSupplies, newSupply])
        }
    }, [form.suppliesUsed, updateForm])

    const removeSupply = React.useCallback((index: number) => {
        const currentSupplies = form.suppliesUsed || []
        const updatedSupplies = currentSupplies.filter((_, i) => i !== index)
        updateForm("suppliesUsed", updatedSupplies)
    }, [form.suppliesUsed, updateForm])

    const updateSupplyQuantity = React.useCallback((index: number, quantity: number) => {
        if (quantity <= 0) return
        const currentSupplies = form.suppliesUsed || []
        const updatedSupplies = currentSupplies.map((supply, i) =>
            i === index ? { ...supply, quantity } : supply
        )
        updateForm("suppliesUsed", updatedSupplies)
    }, [form.suppliesUsed, updateForm])

    const removeAllSupplies = React.useCallback(() => {
        if (confirm("Bạn có chắc chắn muốn xóa tất cả vật tư?")) {
            updateForm("suppliesUsed", [])
        }
    }, [updateForm])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors = validateForm()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }
        setIsConfirmOpen(true)
    }

    const handleConfirmSave = async () => {
        if (!procedure) return
        setIsSubmitting(true)
        try {
            const finalForm = {
                ...form,
                consumableCost: estimatedCost,
            }
            await onSave(procedure.procedureId, finalForm)
            onOpenChange(false)
        } catch (error) {
            setErrors({
                general: error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu thay đổi"
            })
        } finally {
            setIsSubmitting(false)
            setIsConfirmOpen(false)
        }
    }

    const handleClose = () => {
        if (isSubmitting) return
        onOpenChange(false)
        setErrors({})
    }
    if (!procedure) return null

    const currentSupplies = form.suppliesUsed || []
    const totalSupplyCost = calculateTotalSupplyCost(currentSupplies)

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogOverlay className="bg-white/80" />
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Chỉnh Sửa Thủ Thuật
                        </DialogTitle>
                        <DialogDescription>Điền và cập nhật thông tin thủ thuật</DialogDescription>
                    </DialogHeader>

                    {/* General Error Alert */}
                    {errors.general && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.general}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading supplies indicator */}
                    {isLoadingSupplies && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Đang tải thông tin vật tư...</AlertDescription>
                        </Alert>
                    )}

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
                                    disabled={isSubmitting}
                                    className={errors.procedureName ? "border-destructive" : ""}
                                />
                                {errors.procedureName && (
                                    <p className="text-sm text-destructive">{errors.procedureName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô Tả *</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => updateForm("description", e.target.value)}
                                    placeholder="Mô tả chi tiết về thủ thuật"
                                    rows={3}
                                    disabled={isSubmitting}
                                    className={errors.description ? "border-destructive" : ""}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Pricing Information */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Thông Tin Giá Cả</h3>
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    <label className="text-sm flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={autoCalculatePrice}
                                            onChange={(e) => setAutoCalculatePrice(e.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                        Tự động tính giá
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice">Giá Gốc (VNĐ) *</Label>
                                    <Input
                                        id="originalPrice"
                                        type="text"
                                        value={formattedPrices.originalPrice}
                                        onChange={(e) => handleOriginalPriceChange(e.target.value)}
                                        placeholder="0"
                                        disabled={isSubmitting}
                                        className={errors.originalPrice ? "border-destructive" : ""}
                                    />
                                    {errors.originalPrice && (
                                        <p className="text-sm text-destructive">{errors.originalPrice}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount">Giảm Giá (%)</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={form.discount}
                                        onChange={(e) => updateForm("discount", Number.parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        disabled={isSubmitting}
                                        className={errors.discount ? "border-destructive" : ""}
                                    />
                                    {errors.discount && (
                                        <p className="text-sm text-destructive">{errors.discount}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Giá Bán (VNĐ) *</Label>
                                    <Input
                                        id="price"
                                        type="text"
                                        value={formattedPrices.price}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        placeholder="0"
                                        disabled={isSubmitting || autoCalculatePrice}
                                        className={errors.price ? "border-destructive" : ""}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price}</p>
                                    )}
                                    {autoCalculatePrice && (
                                        <p className="text-xs text-muted-foreground">
                                            Tự động tính từ giá gốc và giảm giá
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="consumableCost">Chi Phí Khấu Hao(VNĐ)</Label>
                                <Input
                                    id="consumableCost"
                                    type="text"
                                    value={formatCurrency(form.consumableCost)}
                                    placeholder="0"
                                    disabled={true}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Chi phí khấu hao cho thủ thuật này
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="estimatedCost">Chi Phí Ước Tính (VNĐ)</Label>
                                </div>
                                <Input
                                    id="estimatedCost"
                                    type="text"
                                    value={formattedPrices.estimatedCost}
                                    onChange={(e) => handleEstimatedCostChange(e.target.value)}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    className={errors.consumableCost ? "border-destructive" : ""}
                                />
                                {errors.consumableCost && (
                                    <p className="text-sm text-destructive">{errors.consumableCost}</p>
                                )}
                            </div>
                        </div>

                        {/* Supplies Used */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Vật Tư Sử Dụng
                                    {currentSupplies.length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {currentSupplies.length} vật tư
                                        </Badge>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {totalSupplyCost > 0 && (
                                        <Badge variant="outline" className="text-green-600">
                                            Tổng: {formatCurrency(totalSupplyCost)}
                                        </Badge>
                                    )}
                                    <SupplySearch
                                        onSelectSupply={addSupplyFromSearch}
                                        selectedSupplies={currentSupplies}
                                        disabled={isSubmitting}
                                    />
                                    {currentSupplies.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={removeAllSupplies}
                                            disabled={isSubmitting}
                                            className="text-destructive hover:text-destructive bg-transparent"
                                        >
                                            Xóa tất cả
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {currentSupplies.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Chưa có vật tư nào được thêm</p>
                                    <p className="text-sm">Nhấn "Tìm Vật Tư" để bắt đầu</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentSupplies.map((supply, index) => {
                                        const supplyItem = supplyItems.find(item => item.id === supply.supplyId)
                                        const itemCost = supplyItem ? supplyItem.price * supply.quantity : 0

                                        return (
                                            <div key={`${supply.supplyId}-${index}`} className="flex gap-4 items-center p-4 border rounded-lg bg-muted/20">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{supply.supplyName}</h4>
                                                        {supplyItem && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {formatCurrency(supplyItem.price)}/{supplyItem.unit}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {itemCost > 0 && (
                                                        <p className="text-sm text-green-600 font-medium">
                                                            Thành tiền: {formatCurrency(itemCost)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`quantity-${index}`} className="text-sm">
                                                        Số lượng:
                                                    </Label>
                                                    <Input
                                                        id={`quantity-${index}`}
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={supply.quantity}
                                                        onChange={(e) => updateSupplyQuantity(index, Number.parseFloat(e.target.value) || 0)}
                                                        disabled={isSubmitting}
                                                        className="w-20"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeSupply(index)}
                                                    disabled={isSubmitting}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                                className="min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    "Lưu Thay Đổi"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmModal
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleConfirmSave}
                title="Xác nhận lưu thay đổi"
                message="Bạn có chắc chắn muốn lưu các thay đổi của thủ thuật này?"
                confirmText="Lưu"
                cancelText="Hủy"
                loading={isSubmitting}
            />
        </>
    )
}