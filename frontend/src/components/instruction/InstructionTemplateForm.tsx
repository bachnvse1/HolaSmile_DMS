import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"
import { AlertCircle, FileText, Loader2, Eye, Sparkles, Type, AlignLeft } from "lucide-react"

interface InstructionTemplateFormData {
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

interface InstructionTemplate {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
  createdAt: string
  updatedAt?: string
  createByName?: string
  updateByName?: string
}

interface InstructionTemplateFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialData?: InstructionTemplate | null
  onSave: (data: InstructionTemplateFormData) => void
  title: string
  loading?: boolean
}

interface ValidationErrors {
  instruc_TemplateName?: string
  instruc_TemplateContext?: string
}

export function InstructionTemplateFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSave,
  title,
  loading = false,
}: InstructionTemplateFormDialogProps) {
  const [formData, setFormData] = useState<InstructionTemplateFormData>({
    instruc_TemplateName: "",
    instruc_TemplateContext: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          instruc_TemplateName: initialData.instruc_TemplateName,
          instruc_TemplateContext: initialData.instruc_TemplateContext,
        })
      } else {
        setFormData({
          instruc_TemplateName: "",
          instruc_TemplateContext: "",
        })
      }
      setErrors({})
      setTouched({})
      setShowPreview(false)
    }
  }, [initialData, isOpen])

  const validateField = useCallback((name: keyof InstructionTemplateFormData, value: string): string | undefined => {
    const trimmedValue = value.trim()

    switch (name) {
      case 'instruc_TemplateName':
        if (!trimmedValue) {
          return "Tên mẫu chỉ dẫn không được để trống"
        }
        if (trimmedValue.length < 3) {
          return "Tên mẫu chỉ dẫn phải có ít nhất 3 ký tự"
        }
        if (trimmedValue.length > 100) {
          return "Tên mẫu chỉ dẫn không được vượt quá 100 ký tự"
        }
        break

      case 'instruc_TemplateContext':
        if (!trimmedValue) {
          return "Nội dung chỉ dẫn không được để trống"
        }
        if (trimmedValue.length < 10) {
          return "Nội dung chỉ dẫn phải có ít nhất 10 ký tự"
        }
        if (trimmedValue.length > 2000) {
          return "Nội dung chỉ dẫn không được vượt quá 2000 ký tự"
        }
        break
    }

    return undefined
  }, [])

  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors = {}
    const nameError = validateField('instruc_TemplateName', formData.instruc_TemplateName)
    const contextError = validateField('instruc_TemplateContext', formData.instruc_TemplateContext)

    if (nameError) newErrors.instruc_TemplateName = nameError
    if (contextError) newErrors.instruc_TemplateContext = contextError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  const handleInputChange = (name: keyof InstructionTemplateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name] && touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleInputBlur = (name: keyof InstructionTemplateFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      instruc_TemplateName: true,
      instruc_TemplateContext: true,
    })

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập vào")
      return
    }

    const trimmedData = {
      instruc_TemplateName: formData.instruc_TemplateName.trim(),
      instruc_TemplateContext: formData.instruc_TemplateContext.trim(),
    }

    onSave(trimmedData)
  }

  const handleCancel = () => {
    if (loading) return
    onOpenChange(false)
  }

  const isFormValid = useMemo(() => {
    const hasErrors = Object.values(errors).some(error => error !== undefined && error !== '')

    // Kiểm tra có dữ liệu không
    const hasData = formData.instruc_TemplateName.trim().length > 0 &&
      formData.instruc_TemplateContext.trim().length > 0

    return !hasErrors && hasData
  }, [errors, formData])

  const getCharacterCountColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage > 90) return "text-red-500"
    if (percentage > 75) return "text-yellow-500"
    return "text-muted-foreground"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header with gradient */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-8">
            {/* Template Name Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-blue-500" />
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Tên mẫu chỉ dẫn <span className="text-red-500">*</span>
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  id="name"
                  value={formData.instruc_TemplateName}
                  onChange={(e) => handleInputChange('instruc_TemplateName', e.target.value)}
                  onBlur={() => handleInputBlur('instruc_TemplateName')}
                  placeholder="Nhập tên mẫu chỉ dẫn..."
                  className={`h-12 text-lg transition-all duration-200 ${errors.instruc_TemplateName && touched.instruc_TemplateName
                    ? "border-red-300 focus:border-red-500 ring-red-200"
                    : "focus:border-blue-500 focus:ring-blue-200"
                    }`}
                  disabled={loading}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {errors.instruc_TemplateName && touched.instruc_TemplateName && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errors.instruc_TemplateName}</span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getCharacterCountColor(formData.instruc_TemplateName.length, 100)}`}
                  >
                    {formData.instruc_TemplateName.length}/100
                  </Badge>
                </div>
              </div>
            </div>

            {/* Template Context Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlignLeft className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="context" className="text-sm font-semibold text-gray-700">
                    Nội dung chỉ dẫn <span className="text-red-500">*</span>
                  </Label>
                </div>
                {formData.instruc_TemplateContext.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{showPreview ? "Ẩn xem trước" : "Xem trước"}</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Textarea
                    id="context"
                    value={formData.instruc_TemplateContext}
                    onChange={(e) => handleInputChange('instruc_TemplateContext', e.target.value)}
                    onBlur={() => handleInputBlur('instruc_TemplateContext')}
                    placeholder="Nhập nội dung chỉ dẫn chi tiết..."
                    className={`min-h-[160px] resize-none text-base transition-all duration-200 ${errors.instruc_TemplateContext && touched.instruc_TemplateContext
                      ? "border-red-300 focus:border-red-500 ring-red-200"
                      : "focus:border-blue-500 focus:ring-blue-200"
                      }`}
                    disabled={loading}
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      {errors.instruc_TemplateContext && touched.instruc_TemplateContext && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{errors.instruc_TemplateContext}</span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCharacterCountColor(formData.instruc_TemplateContext.length, 2000)}`}
                    >
                      {formData.instruc_TemplateContext.length}/2000
                    </Badge>
                  </div>
                </div>

                {/* Preview Section */}
                {showPreview && formData.instruc_TemplateContext.trim() && (
                  <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Xem trước nội dung</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 border shadow-sm">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">
                          {formData.instruc_TemplateContext}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Success Indicator */}
            {isFormValid && !loading && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Mẫu chỉ dẫn đã sẵn sàng để lưu!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-gray-50/50 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="px-6"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="min-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Đang lưu..." : "Đang thêm..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {initialData ? "Lưu thay đổi" : "Thêm mẫu"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}