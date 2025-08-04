import React, { useState, useMemo } from "react";
import { FileText, Calendar, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Printer } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { Button } from "@/components/ui/button2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TreatmentRecord } from "@/types/treatment";
import RecordRow from "./RecordRow";
import TreatmentRecordDetail from "./TreatmentRecordDetail"; // New import
import { formatDateOnly } from "@/utils/date";
import { CreateInvoiceModal } from "../invoice/CreateInvoiceModal";
import { invoiceService } from "@/services/invoiceService";
import { printDentalRecord } from "@/services/treatmentService";

interface TreatmentTableProps {
  records: TreatmentRecord[];
  onEdit: (record: TreatmentRecord) => void;
  onToggleDelete: (id: number) => void;
  onViewDetail?: (record: TreatmentRecord) => void;
  patientId: number;
  patientName: string;
  readonly?: boolean;
}

interface InvoiceFormData {
  patientId: number;
  treatmentRecordId: number;
  paymentMethod: string;
  transactionType: string;
  description: string;
  paidAmount: number;
}

interface GroupedRecord {
  date: string;
  records: TreatmentRecord[];
  totalAmount: number;
  appointmentId: number;
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];

const TreatmentTable: React.FC<TreatmentTableProps> = ({
  records,
  onEdit,
  onToggleDelete,
  patientId,
  patientName,
  readonly = false,
}) => {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TreatmentRecord | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [printingGroups, setPrintingGroups] = useState<Record<string, boolean>>({});

  // New states for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<TreatmentRecord | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newInvoice, setNewInvoice] = useState<InvoiceFormData>({
    patientId,
    treatmentRecordId: 0,
    paymentMethod: "",
    transactionType: "",
    description: "",
    paidAmount: 0,
  });

  // Group records by appointment date
  const groupedRecords = useMemo(() => {
    const groups: Record<string, GroupedRecord> = {};

    records.forEach(record => {
      const date = formatDateOnly(record.appointmentDate);
      if (!groups[date]) {
        groups[date] = {
          date,
          records: [],
          totalAmount: 0,
          appointmentId: record.appointmentID,
        };
      }
      groups[date].records.push(record);
      groups[date].totalAmount += record.totalAmount;
    });

    // Sort by date (newest first)
    return Object.values(groups).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [records]);

  // Pagination calculations
  const totalPages = Math.ceil(groupedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = groupedRecords.slice(startIndex, endIndex);

  // Reset to first page when itemsPerPage changes
  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(parseInt(newItemsPerPage));
    setCurrentPage(1);
  };

  // Reset to first page when records change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [records]);

  const toggleGroupExpansion = (date: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // New function to handle view detail
  const handleViewDetail = (record: TreatmentRecord) => {
    setSelectedDetailRecord(record);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedDetailRecord(null);
  };

  const handlePrintDentalRecord = async (appointmentId: number, date: string) => {
    setPrintingGroups(prev => ({ ...prev, [date]: true }));

    try {
      // Gọi API để lấy PDF blob
      const pdfBlob = await printDentalRecord(appointmentId);

      // Tạo URL từ blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Tạo cửa sổ mới để hiển thị PDF
      const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');

      if (printWindow) {
        // Đợi PDF load xong rồi tự động in
        printWindow.addEventListener('load', () => {
          printWindow.print();
          
          // Cleanup URL sau khi in
          printWindow.addEventListener('afterprint', () => {
            URL.revokeObjectURL(pdfUrl);
            printWindow.close();
          });
        });

        // Fallback nếu load event không fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
          }
        }, 1000);
      } else {
        // Nếu không thể mở popup, tự động tải xuống
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Ho_so_dieu_tri_${appointmentId}_${date}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
        
        toast.info("Không thể mở cửa sổ in. File PDF đã được tải xuống.");
      }

      toast.success("Đã tạo hồ sơ điều trị để in");
    } catch (error: any) {
      console.error("Error printing dental record:", error);
      toast.error(error.message || "Không thể in hồ sơ điều trị");
    } finally {
      setPrintingGroups(prev => ({ ...prev, [date]: false }));
    }
  };

  const handleOpenInvoiceModal = (patientId: number, treatmentRecordId: number) => {
    const record = records.find((r) => r.treatmentRecordID === treatmentRecordId);
    if (!record) {
      toast.error("Không tìm thấy hồ sơ điều trị");
      return;
    }

    setSelectedRecord(record);
    setNewInvoice({
      patientId,
      treatmentRecordId,
      paymentMethod: "",
      transactionType: "",
      description: "",
      paidAmount: 0,
    });
    setInvoiceModalOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.paymentMethod || !newInvoice.transactionType) {
      toast.warn("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (newInvoice.paidAmount <= 0) {
      toast.warn("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }

    if (selectedRecord && newInvoice.paidAmount > selectedRecord.totalAmount) {
      toast.warn("Số tiền thanh toán không được vượt quá tổng tiền điều trị");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const response = await invoiceService.createInvoice(newInvoice);
      toast.success(response.message || "Tạo hóa đơn thành công!");
      setInvoiceModalOpen(false);
      setSelectedRecord(null);
      // Reset form
      setNewInvoice({
        patientId,
        treatmentRecordId: 0,
        paymentMethod: "",
        transactionType: "",
        description: "",
        paidAmount: 0,
      });
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi không xác định";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || "Lỗi khi tạo hóa đơn";
      }

      toast.error(errorMessage);
      console.error("Error creating invoice:", error);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleCloseModal = () => {
    setInvoiceModalOpen(false);
    setSelectedRecord(null);
    setIsCreatingInvoice(false);
  };

  const getAppointmentStatus = (date: string) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "Hôm nay", color: "bg-blue-100 text-blue-800" };
    if (diffDays === 1) return { label: "Ngày mai", color: "bg-green-100 text-green-800" };
    if (diffDays > 1 && diffDays <= 7) return { label: "Tuần này", color: "bg-yellow-100 text-yellow-800" };
    if (diffDays < 0) return { label: "Đã qua", color: "bg-gray-100 text-gray-600" };
    return null;
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;

    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // Previous button
    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );

    // First page button (if not in range)
    if (startPage > 1) {
      buttons.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1"
        >
          1
        </Button>
      );

      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2 py-1 text-gray-500">...</span>
        );
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="px-3 py-1"
        >
          {i}
        </Button>
      );
    }

    // Last page button (if not in range)
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2 py-1 text-gray-500">...</span>
        );
      }

      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1"
        >
          {totalPages}
        </Button>
      );
    }

    // Next button
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    );

    return buttons;
  };

  // Tính số thứ tự cho mỗi record
  const calculateRecordOrder = (groupIndex: number, recordIndex: number) => {
    let orderNumber = 0;
    
    // Tính tổng số records từ các groups trước đó
    for (let i = 0; i < groupIndex; i++) {
      orderNumber += paginatedGroups[i].records.length;
    }
    
    // Cộng thêm index của record hiện tại trong group + 1
    orderNumber += recordIndex + 1;
    
    // Cộng thêm offset từ pagination (số records từ các trang trước)
    const pageOffset = (currentPage - 1) * itemsPerPage;
    let totalRecordsFromPreviousPages = 0;
    
    for (let i = 0; i < pageOffset; i++) {
      if (groupedRecords[i]) {
        totalRecordsFromPreviousPages += groupedRecords[i].records.length;
      }
    }
    
    return totalRecordsFromPreviousPages + orderNumber;
  };

  return (
    <div className="space-y-4">
      {records.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header with Summary and Pagination Controls */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-900">Danh sách điều trị</h3>
                <div className="text-sm text-gray-600">
                  Tổng cộng: {records.length} điều trị ({groupedRecords.length} lịch hẹn)
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hiển thị:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">/ trang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container with Sticky Actions Column */}
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full relative">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lịch hẹn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí răng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thủ thuật
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Chẩn đoán & Triệu chứng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thành tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày điều trị & TV tư vấn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="sticky right-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-l border-gray-200 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedGroups.map((group, groupIndex) => {
                    const appointmentStatus = getAppointmentStatus(group.date);
                    const isExpanded = expandedGroups[group.date] ?? false;
                    const isPrinting = printingGroups[group.date] ?? false;

                    return (
                      <React.Fragment key={group.date}>
                        {/* Date Group Header Row */}
                        <tr className="bg-blue-50 border-t-2 border-blue-200">
                          <td colSpan={readonly ? 9 : 9} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div
                                className="flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors rounded px-2 py-1"
                                onClick={() => toggleGroupExpansion(group.date)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-blue-600" />
                                )}
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">
                                  Lịch hẹn: {group.date}
                                </span>
                                {appointmentStatus && (
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${appointmentStatus.color}`}>
                                    {appointmentStatus.label}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-blue-700">
                                  {group.records.length} điều trị
                                </div>
                                {/* Nút in hồ sơ điều trị */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintDentalRecord(group.appointmentId, group.date)}
                                  disabled={isPrinting}
                                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Printer className="h-4 w-4" />
                                  {isPrinting ? "Đang in..." : "In hồ sơ"}
                                </Button>
                              </div>
                            </div>
                          </td>
                          {/* Sticky Actions Column for Group Header */}
                          {!readonly && (
                            <td className="sticky right-0 px-6 py-4 bg-blue-50 border-l border-gray-200 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                              {/* Empty cell for alignment */}
                            </td>
                          )}
                        </tr>

                        {/* Records for this date - Only show if expanded */}
                        {isExpanded && group.records.map((record, recordIndex) => (
                          <RecordRow
                            key={record.treatmentRecordID}
                            record={record}
                            onEdit={onEdit}
                            onToggleDelete={onToggleDelete}
                            onOpenInvoiceModal={handleOpenInvoiceModal}
                            onViewDetail={handleViewDetail} // New prop
                            patientId={patientId}
                            readonly={readonly}
                            orderNumber={calculateRecordOrder(groupIndex, recordIndex)}
                          />
                        ))}

                        {/* Add spacing between groups (except last group) */}
                        {groupIndex < paginatedGroups.length - 1 && (
                          <tr className="bg-gray-50">
                            <td colSpan={readonly ? 9 : 9} className="px-6 py-1"></td>
                            {!readonly && (
                              <td className="sticky right-0 px-6 py-1 bg-gray-50 border-l border-gray-200 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                                {/* Empty cell for alignment */}
                              </td>
                            )}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1} - {Math.min(endIndex, groupedRecords.length)} trên {groupedRecords.length} lịch hẹn
                </div>

                <div className="flex items-center gap-2">
                  {renderPaginationButtons()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {records.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Không tìm thấy hồ sơ điều trị phù hợp.</p>
          <p className="text-gray-500 text-sm mt-2">
            Hãy thêm hồ sơ điều trị mới hoặc thay đổi bộ lọc tìm kiếm.
          </p>
        </div>
      )}

      {/* Treatment Record Detail Modal */}
      <TreatmentRecordDetail
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        record={selectedDetailRecord}
      />

      {/* Invoice Creation Modal */}
      {selectedRecord && (
        <CreateInvoiceModal
          createOpen={invoiceModalOpen}
          setCreateOpen={handleCloseModal}
          newInvoice={newInvoice}
          setNewInvoice={setNewInvoice}
          patientName={patientName}
          treatmentRecord={{
            symptoms: selectedRecord.symptoms,
            totalAmount: selectedRecord.totalAmount,
            treatmentDate: formatDateOnly(selectedRecord.treatmentDate),
          }}
          handleCreateInvoice={handleCreateInvoice}
          isCreating={isCreatingInvoice}
        />
      )}
    </div>
  );
};

export default TreatmentTable;