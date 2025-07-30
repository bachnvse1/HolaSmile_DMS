import { useEffect, useState, useCallback } from "react"
import {
    Card, CardHeader, CardTitle, CardContent, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, User, ArrowLeft, FileText } from "lucide-react"
import type { InstructionDTO } from "@/services/instructionService"
import { getPatientInstructions } from "@/services/instructionService"
import { useNavigate, useParams } from 'react-router'
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { PatientLayout } from "@/layouts/patient"

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="flex justify-center">
        <Card className="shadow-lg border-t-4 border-gray-300 w-full max-w-2xl">
            <CardHeader className="pb-3">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            </CardHeader>
            <CardContent className="pt-3">
                <div className="space-y-2 mb-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
                </div>
                <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
            </CardContent>
        </Card>
    </div>
)

// Instruction card component
const InstructionCard = ({ instruction }: { instruction: InstructionDTO }) => (
    <div className="flex justify-center">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-500 w-full max-w-2xl">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                    Hướng dẫn
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Mẫu: {instruction.instruc_TemplateName || "N/A"}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
                <p className="text-base text-gray-700 mb-3 leading-relaxed">
                    {instruction.content}
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>Bởi: {instruction.dentistName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        <span>Ngày tạo: {new Date(instruction.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
)

// Error message component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <Alert variant="destructive" className="mb-4">
        <AlertDescription className="flex items-center justify-between">
            <span>{message}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
                Thử lại
            </Button>
        </AlertDescription>
    </Alert>
)

// Empty state component
const EmptyState = () => (
    <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Chưa có hướng dẫn nào
        </p>
    </div>
)

export default function PatientInstructionsList() {
    const { appointmentId } = useParams<{ appointmentId: string }>()
    const [instruction, setInstruction] = useState<InstructionDTO | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const userInfo = useUserInfo()
    const navigate = useNavigate()

    // Parse appointment ID
    const parsedId = appointmentId ? Number(appointmentId) : null
    const isValidId = parsedId && !isNaN(parsedId) && parsedId > 0

    // Fetch instruction function
    const fetchInstruction = useCallback(async () => {
        if (!isValidId) return

        setLoading(true)
        setError("")

        try {
            const data = await getPatientInstructions(parsedId)
            // Assuming we get the first instruction or only one instruction
            setInstruction(data.length > 0 ? data[0] : null)
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Không thể tải hướng dẫn."
            setError(errorMessage)
            console.error('Error fetching instruction:', err)
        } finally {
            setLoading(false)
        }
    }, [isValidId, parsedId])

    // Effect to fetch instruction
    useEffect(() => {
        fetchInstruction()
    }, [fetchInstruction])

    // Handler
    const handleGoBack = useCallback(() => {
        navigate(`/patient/appointments/${parsedId}`)
    }, [navigate, parsedId])

    // Early return for invalid ID
    if (!isValidId) {
        return (
            <AuthGuard requiredRoles={['Patient']}>
                <PatientLayout userInfo={userInfo}>
                    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
                        <div className="container mx-auto p-4 max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                            <Alert variant="destructive">
                                <AlertDescription>
                                    ID cuộc hẹn không hợp lệ. Vui lòng kiểm tra lại.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </PatientLayout>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard requiredRoles={['Patient']}>
            <PatientLayout userInfo={userInfo}>
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
                    <div className="container mx-auto p-4 max-w-4xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGoBack}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center flex-1">
                                Hướng dẫn Bệnh nhân
                            </h1>
                            <div className="w-20"></div> {/* Spacer for centering */}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <ErrorMessage
                                message={error}
                                onRetry={fetchInstruction}
                            />
                        )}

                        {/* Content Area */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !instruction ? (
                                <EmptyState />
                            ) : (
                                <InstructionCard instruction={instruction} />
                            )}
                        </div>
                    </div>
                </div>
            </PatientLayout>
        </AuthGuard>
    )
}