import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Package, Check } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SupplyItem, Supply } from "@/types/procedure"
import { supplyApi, mapToSupplyItem  } from "@/services/supplyApi" 
import { formatCurrency } from "@/utils/currencyUtils"

interface SupplySearchProps {
  onSelectSupply: (supply: SupplyItem) => void
  selectedSupplies: Supply[]
  disabled?: boolean
}

export function SupplySearch({ onSelectSupply, selectedSupplies, disabled = false }: SupplySearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allSupplies, setAllSupplies] = useState<SupplyItem[]>([])
  const [filteredSupplies, setFilteredSupplies] = useState<SupplyItem[]>([])

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        const data = await supplyApi.getSupplies()
        const mapped = data.map(mapToSupplyItem)
        setAllSupplies(mapped)
      } catch (err) {
        console.error("Lỗi khi tải vật tư:", err)
      }
    }
    fetchSupplies()
  }, [])

  useEffect(() => {
    const filtered = allSupplies.filter((supply) =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSupplies(filtered)
  }, [searchTerm, allSupplies])

  const isSupplySelected = (supplyId: number) =>
    selectedSupplies.some((s) => s.supplyId === supplyId)

  const handleSelectSupply = (supply: SupplyItem) => {
    if (disabled) return
    onSelectSupply(supply)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Search className="w-4 h-4 mr-2" />
          Tìm Vật Tư
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl [&~div]:backdrop-blur-none max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tìm Kiếm Vật Tư
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm vật tư</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nhập tên vật tư..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            {filteredSupplies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy vật tư nào</p>
              </div>
            ) : (
              <TooltipProvider>
                <div className="space-y-2">
                  {filteredSupplies.map((supply) => {
                    const isOutOfStock = supply.inStock === 0
                    const isDisabled = disabled || isOutOfStock

                    const content = (
                      <div
                        className={`p-4 border rounded-lg transition-colors ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:bg-muted/50"
                        } ${isSupplySelected(supply.id) ? "bg-blue-50 border-blue-200" : ""}`}
                        onClick={() => {
                          if (!isDisabled) handleSelectSupply(supply)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{supply.name}</h4>
                              {isSupplySelected(supply.id) && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>Đơn vị: {supply.unit}</span>
                              <span>
                                Tồn kho:{" "}
                                {isOutOfStock ? (
                                  <span className="text-red-500 font-medium">
                                    Hết hàng
                                  </span>
                                ) : (
                                  supply.inStock
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {formatCurrency(supply.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /{supply.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )

                    return isOutOfStock ? (
                      <Tooltip key={supply.id}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent>
                          <p>Không thể chọn</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={supply.id}>{content}</div>
                    )
                  })}
                </div>
              </TooltipProvider>
            )}
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={disabled}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}