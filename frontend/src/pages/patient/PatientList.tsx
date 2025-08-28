import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button2"
import { Filter, UserPlus, Users, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import PatientTable from "@/components/patient/PatientTable"
import PatientFilters from "@/components/patient/PatientFilters"
import PaginationControls from "@/components/ui/PaginationControls"
import type { Patient } from "@/types/patient"
import { getAllPatients } from "@/services/patientService"
import { useNavigate } from "react-router"
import { useAuth } from '../../hooks/useAuth';
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { toast } from "react-toastify"

const PAGE_SIZE = 5

const EmptyState = ({ 
  type, 
  onAddPatient 
}: { 
  type: 'no-data' | 'no-results'
  onAddPatient?: () => void 
}) => {
  if (type === 'no-data') {
    return (
      <Card className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-6">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Chưa có bệnh nhân nào</h3>
            <p className="text-muted-foreground max-w-md">
              Hệ thống chưa có dữ liệu bệnh nhân. Hãy thêm bệnh nhân đầu tiên để bắt đầu.
            </p>
          </div>
          {onAddPatient && (
            <Button onClick={onAddPatient} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Thêm Bệnh Nhân Đầu Tiên
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="text-center py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Không tìm thấy kết quả</h3>
          <p className="text-muted-foreground max-w-md">
            Không có bệnh nhân nào phù hợp với tiêu chí tìm kiếm. 
            Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const navigate = useNavigate()

  const { fullName, role, userId } = useAuth();

  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  };

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await getAllPatients()
      
      const response = data as any
      
      if (response && typeof response === 'object' && response.message && !Array.isArray(response)) {
        setPatients([])
        return
      }
      
      if (Array.isArray(response)) {
        setPatients(response)
      } else {
        console.warn("API returned non-array data:", response)
        setPatients([])
      }
    } catch (error: any) {
      console.error("Error fetching patients:", error)
      toast.error(error.message || "Lỗi khi tải danh sách bệnh nhân")
      setPatients([])
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

useEffect(() => {
  if (!Array.isArray(patients)) {
    console.warn("Patients data is not an array:", patients)
    return
  }

  const filtered = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (patient.fullname && patient.fullname.toLowerCase().includes(searchLower)) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
      (patient.phone && patient.phone.includes(searchTerm))

    const matchesGender =
      genderFilter === "all" || patient.gender === genderFilter

    return matchesSearch && matchesGender
  })

  setFilteredPatients(filtered)
  setCurrentPage(1)
}, [patients, searchTerm, genderFilter])

  const pageCount = Math.ceil(filteredPatients.length / PAGE_SIZE)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const hasNoData = initialLoadComplete && (!Array.isArray(patients) || patients.length === 0)
  const hasNoResults = initialLoadComplete && Array.isArray(patients) && patients.length > 0 && filteredPatients.length === 0
  const hasResults = Array.isArray(filteredPatients) && filteredPatients.length > 0

  const canAddPatient = role === "Receptionist"

  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Danh Sách Bệnh Nhân</h1>
              <p className="text-muted-foreground">
                Quản lý và xem tất cả hồ sơ bệnh nhân
                {initialLoadComplete && Array.isArray(patients) && (
                  <span className="ml-2">
                    ({patients.length} bệnh nhân)
                  </span>
                )}
              </p>
            </div>
            {canAddPatient && (
              <Button
                onClick={() => navigate("/add-patient")}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Thêm Bệnh Nhân Mới
              </Button>
            )}
          </div>

          {!hasNoData && (
            <Card className="space-y-4">
              <h3 className="px-4 pt-2 text-xl font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ Lọc & Tìm Kiếm
              </h3>
              <PatientFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                genderFilter={genderFilter}
                onGenderChange={setGenderFilter}
              />
            </Card>
          )}

          {loading ? (
            <Card className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Đang tải danh sách bệnh nhân...</p>
              </div>
            </Card>
          ) : hasNoData ? (
            <EmptyState 
              type="no-data" 
              onAddPatient={canAddPatient ? () => navigate("/add-patient") : undefined}
            />
          ) : hasNoResults ? (
            <EmptyState type="no-results" />
          ) : hasResults ? (
            <>
              <PatientTable patients={paginatedPatients} refetchPatients={fetchPatients} />
              
              {pageCount > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={pageCount}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : null}
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}