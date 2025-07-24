import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  HeartPulse, 
  Info,
  Loader2
} from 'lucide-react'
import { getPatientById, type PatientDetail } from '@/services/patientService'

interface PatientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: number | null
}

export default function PatientDetailModal({ isOpen, onClose, patientId }: PatientDetailModalProps) {
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientDetail = async () => {
      if (!patientId || !isOpen) {
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getPatientById(patientId)
        setPatient(data)
      } catch (err) {
        console.error('Error fetching patient detail:', err)
        setError('Không thể tải thông tin bệnh nhân. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchPatientDetail()
  }, [patientId, isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPatient(null)
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải thông tin bệnh nhân...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lỗi</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!patient) {
    return null
  }

  const formattedDob = patient.dob.split("/").reverse().join("-")
  const dateOfBirth = new Date(formattedDob)
  const displayDob = dateOfBirth.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const displayGender = patient.gender ? "Nam" : "Nữ"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Chi Tiết Bệnh Nhân</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Patient Header Section */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
                  <AvatarImage 
                    src={patient.avatar || "/placeholder.svg?height=100&width=100"} 
                    alt={patient.fullname} 
                  />
                  <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                    {patient.fullname}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">
                  {patient.fullname}
                </h2>
                <Badge variant="secondary" className="px-3 py-1 text-base">
                  <User className="w-4 h-4 mr-2" />
                  {displayGender}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Thông Tin Liên Hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <span>{patient.address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Thông Tin Cá Nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Ngày Sinh: {displayDob}</span>
                </div>
                {patient.patientGroup && (
                  <div className="flex items-center gap-3 text-sm">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Nhóm Bệnh Nhân: <Badge variant="outline">{patient.patientGroup}</Badge>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medical Conditions */}
          {patient.underlyingConditions && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-primary" />
                  Tình Trạng Sức Khỏe
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-start gap-3 text-sm">
                <HeartPulse className="w-4 h-4 text-muted-foreground mt-1" />
                <span>Bệnh Nền: {patient.underlyingConditions}</span>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}