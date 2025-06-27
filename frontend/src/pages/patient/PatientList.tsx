import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Filter, UserPlus } from "lucide-react"
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

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const { fullName, role, userId } = useAuth();

  // Create userInfo object for StaffLayout
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getAllPatients()
        setPatients(data)
      } catch (error: any) {
        console.error("Failed to fetch patients:", error)
        toast.error(error.message || "Lỗi khi tải danh sách bệnh nhân")
      }
    }

    fetchPatients()
  }, [])

  useEffect(() => {
    const filtered = patients.filter((patient) => {
      const matchesSearch =
        patient.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)

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

  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Danh Sách Bệnh Nhân</h1>
              <p className="text-muted-foreground">Quản lý và xem tất cả hồ sơ bệnh nhân</p>
            </div>
            {role === "Receptionist" && (
              <Button
                onClick={() => navigate("/add-patient")}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Thêm Bệnh Nhân Mới
              </Button>
            )}
          </div>

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

          <PatientTable patients={paginatedPatients} />

          {filteredPatients.length > PAGE_SIZE && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
