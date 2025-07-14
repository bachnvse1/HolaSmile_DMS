import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import FilterBar from "./FilterBar"
import SummaryStats from "./SummaryStats"
import TreatmentTable from "./TreatmentTable"
import { getTreatmentRecordsByPatientId } from "@/services/treatmentService"
import type { FilterFormData, TreatmentRecord } from "@/types/treatment"

interface Props {
  patientId: number
}

export default function PatientTreatmentRecordsSection({ patientId }: Props) {
  const { register, watch } = useForm<FilterFormData>({
    defaultValues: {
      searchTerm: "",
      filterStatus: "all",
      filterDentist: "all",
    },
  })

  const [records, setRecords] = useState<TreatmentRecord[]>([])

  const searchTerm = watch("searchTerm")
  const filterStatus = watch("filterStatus")
  const filterDentist = watch("filterDentist")

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getTreatmentRecordsByPatientId(patientId)
        setRecords(data)
      } catch (error) {
        console.error("Error fetching treatment records:", error)
      }
    }

    fetchRecords()
  }, [patientId])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.toothPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatmentRecordID.toString().includes(searchTerm) ||
      (record.dentistName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesStatus =
      filterStatus === "all" || record.treatmentStatus.toLowerCase() === filterStatus.toLowerCase()

    const matchesDentist =
      filterDentist === "all" || record.dentistID.toString() === filterDentist

    return matchesSearch && matchesStatus && matchesDentist
  })

  return (
    <div className="mt-12 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Hồ sơ điều trị nha khoa</h2>
      <FilterBar register={register} />
      <TreatmentTable
        records={filteredRecords}
        patientId={patientId}
        readonly 
        onEdit={() => {}} 
        onToggleDelete={() => Promise.resolve()} 
      />
      <SummaryStats records={records} />
    </div>
  )
}
