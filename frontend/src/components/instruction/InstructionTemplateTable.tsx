import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon, Search, FileText, Calendar, User, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface InstructionTemplate {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
  createdAt: string
  updatedAt?: string
  createByName?: string
  updateByName?: string
}

interface InstructionTemplateTableProps {
  templates: InstructionTemplate[]
  loading: boolean
  error: string | null
  onEdit: (template: InstructionTemplate) => void
  onDelete: (id: number) => void
  isAssistant: boolean
  isDentist: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  actionLoading?: boolean
}

export function InstructionTemplateTable({
  templates,
  loading,
  error,
  onEdit,
  onDelete,
  isAssistant,
  isDentist,
  searchTerm,
  onSearchChange,
  actionLoading = false,
}: InstructionTemplateTableProps) {

  const handleEdit = useCallback((template: InstructionTemplate) => {
    if (actionLoading) return
    onEdit(template)
  }, [onEdit, actionLoading])

  const handleDelete = useCallback((id: number) => {
    if (actionLoading) return
    onDelete(id)
  }, [onDelete, actionLoading])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const getTimeAgo = (dateString: string) => {
    // Check if date is default/empty value (0001-01-01T00:00:00 or similar)
    if (dateString && (dateString.startsWith("0001-01-01") || formatDate(dateString) === "01/01/0001, 00:00")) {
      return "N/A"
    }
    
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Vừa xong"
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`
    return formatDate(dateString)
  }

  const isValidDate = (dateString?: string) => {
    if (!dateString) return false
    if (dateString.startsWith("0001-01-01")) return false
    const formatted = formatDate(dateString)
    return formatted !== "01/01/0001, 00:00"
  }

  if (loading) {
    return (
      <Card className="shadow-sm border-0 bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="p-6">
          {/* Search skeleton */}
          <div className="mb-6">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          
          {/* Table skeleton */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-28" /></TableHead>
                  {(isAssistant || isDentist) && <TableHead><Skeleton className="h-4 w-20" /></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-slate-50">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    {(isAssistant || isDentist) && <TableCell><Skeleton className="h-8 w-20" /></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
        <CardContent className="p-12 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-semibold text-lg text-red-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Mẫu Chỉ Dẫn</h2>
                <p className="text-blue-100 text-sm">Quản lý các mẫu chỉ dẫn thông minh</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {templates.length} mẫu
            </Badge>
          </div>
          
          {/* Enhanced Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc nội dung chỉ dẫn..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40 rounded-xl backdrop-blur-sm transition-all duration-200"
            />
          </div>
          
          {searchTerm && (
            <div className="mt-3 flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Kết quả cho: "{searchTerm}"
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {templates.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-slate-600" />
              </div>
              <h3 className="font-semibold text-xl text-slate-900 mb-3">
                {searchTerm ? "Không tìm thấy kết quả" : "Chưa có mẫu chỉ dẫn nào"}
              </h3>
              <p className="text-slate-600 text-lg">
                {searchTerm 
                  ? "Thử tìm kiếm với từ khóa khác hoặc tạo mẫu chỉ dẫn mới" 
                  : "Bắt đầu bằng cách thêm mẫu chỉ dẫn đầu tiên của bạn"
                }
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 hover:bg-slate-100">
                    <TableHead className="font-semibold text-slate-700 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Tên Mẫu</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">Nội Dung</TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Ngày Tạo</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Người Tạo</span>
                      </div>
                    </TableHead>
                    {(isAssistant || isDentist) && (
                      <TableHead className="font-semibold text-slate-700 text-right">Thao Tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template, index) => (
                    <TableRow 
                      key={template.instruc_TemplateID} 
                      className={`group transition-colors hover:bg-slate-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-semibold text-sm">
                              {template.instruc_TemplateName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {template.instruc_TemplateName}
                            </div>
                            {template.updatedAt && isValidDate(template.updatedAt) && template.updatedAt !== template.createdAt && (
                              <div className="text-xs text-slate-500 flex items-center space-x-1">
                                <span>Cập nhật: {getTimeAgo(template.updatedAt)}</span>
                                {template.updateByName && (
                                  <span>• {template.updateByName}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="max-w-md">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border border-slate-200/50 cursor-help hover:border-slate-300/50 transition-colors">
                              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {truncateText(template.instruc_TemplateContext)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4 bg-slate-900 text-white">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {template.instruc_TemplateContext}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {getTimeAgo(template.createdAt)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(template.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {template.createByName && (
                          <div className="flex items-center space-x-2">
                            <div className="bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center">
                              <span className="text-slate-700 font-medium text-xs">
                                {template.createByName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm text-slate-700">{template.createByName}</span>
                          </div>
                        )}
                      </TableCell>
                      
                      {(isAssistant || isDentist) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEdit(template)}
                                  disabled={actionLoading}
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg h-8 w-8 p-0"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 text-white">
                                <p>Chỉnh sửa mẫu chỉ dẫn</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(template.instruc_TemplateID)}
                                  disabled={actionLoading}
                                  className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg h-8 w-8 p-0"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 text-white">
                                <p>Xóa mẫu chỉ dẫn</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}