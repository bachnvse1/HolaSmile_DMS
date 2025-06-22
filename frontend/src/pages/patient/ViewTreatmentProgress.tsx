import { useParams } from "react-router"
import TreatmentProgressView from "@/components/patientTreatment/TreatmentProgressView" 

export default function ViewTreatmentProgressPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) return <div className="p-6 text-center text-red-500">Không tìm thấy ID tiến độ điều trị</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <TreatmentProgressView treatmentProgressID={id} />
    </div>
  )
}
