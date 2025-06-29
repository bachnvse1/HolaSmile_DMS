import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAllProcedures } from "@/services/procedureService";
import type { Procedure } from "@/types/procedure";

interface ProcedureSelectionModalProps {
  selectedProcedure: Procedure | null;
  onProcedureChange: (procedure: Procedure | null) => void;
  trigger?: React.ReactNode;
}

export function ProcedureSelectionModal({
  selectedProcedure,
  onProcedureChange,
  trigger,
}: ProcedureSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelectedProcedure, setTempSelectedProcedure] = useState<Procedure | null>(selectedProcedure);

  const { data: procedures = [], isLoading, error } = useQuery({
    queryKey: ["procedures"],
    queryFn: getAllProcedures,
  });

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setTempSelectedProcedure(selectedProcedure);
    }
  }, [open, selectedProcedure]);

  const filteredProcedures = procedures.filter((procedure) =>
    procedure.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    procedure.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    onProcedureChange(tempSelectedProcedure);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedProcedure(selectedProcedure);
    setOpen(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Plus className="h-4 w-4" /> Chọn Thủ Thuật
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Chọn Thủ Thuật Nha Khoa
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên thủ thuật hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {tempSelectedProcedure && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Đã chọn: {tempSelectedProcedure.procedureName}</p>
            </div>
          )}

          <RadioGroup
            value={tempSelectedProcedure?.procedureId.toString()}
            onValueChange={(value) => {
              const found = procedures.find((p) => p.procedureId === parseInt(value));
              setTempSelectedProcedure(found || null);
            }}
            className="flex-1 overflow-y-auto space-y-2"
          >
            {isLoading && <p className="text-center py-4 text-muted-foreground">Đang tải...</p>}
            {error && <p className="text-center py-4 text-red-500">Không tải được dữ liệu.</p>}
            {!isLoading && filteredProcedures.map((procedure) => {
              const isSelected = tempSelectedProcedure?.procedureId === procedure.procedureId;
              return (
                <Card
                  key={procedure.procedureId}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={procedure.procedureId.toString()}
                        id={`procedure-${procedure.procedureId}`}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{procedure.procedureName}</h3>
                            <p className="text-sm text-muted-foreground">{procedure.description}</p>
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-primary" />}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                          <div><span className="text-muted-foreground">Giá hiện tại: </span>{formatPrice(procedure.price)}</div>
                          <div><span className="text-muted-foreground">Giá gốc: </span>{formatPrice(procedure.originalPrice)}</div>
                          <div><span className="text-muted-foreground">Giảm giá: </span>{procedure.discount}%</div>
                          <div><span className="text-muted-foreground">Chi phí vật tư: </span>{formatPrice(procedure.consumableCost)}</div>
                          <div><span className="text-muted-foreground">Bảo hành: </span>{procedure.warrantyPeriod}</div>
                          <div><span className="text-muted-foreground">Hoa hồng bác sĩ: </span>{procedure.doctorCommissionRate}%</div>
                          <div><span className="text-muted-foreground">Hoa hồng trợ lý: </span>{procedure.assistantCommissionRate}%</div>
                          <div><span className="text-muted-foreground">Kỹ thuật viên: </span>{procedure.technicianCommissionRate}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!isLoading && filteredProcedures.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy thủ thuật nào phù hợp với tiêu chí tìm kiếm.</p>
              </div>
            )}
          </RadioGroup>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={handleCancel}>Hủy</Button>
            <Button onClick={handleConfirm} className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Xác Nhận ({tempSelectedProcedure ? 1 : 0})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
