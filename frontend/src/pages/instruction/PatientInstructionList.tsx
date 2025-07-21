import { useEffect, useState, useMemo, useCallback } from "react"
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pagination } from "@/components/ui/Pagination"
import { X, Search, CalendarDays, User, ArrowLeft } from "lucide-react"
import type { InstructionDTO } from "@/services/instructionService"
import { getPatientInstructions } from "@/services/instructionService"
import { useNavigate, useParams } from 'react-router'
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { PatientLayout } from "@/layouts/patient"

// Utility function moved outside component to prevent re-creation
const formatDateTime = (isoString: string): string => {
    try {
        const date = new Date(isoString)
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return 'Không xác định'
    }
}

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-md dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2" />
                    <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                    </div>
                </CardHeader>
                <CardContent className="border-t pt-4 dark:border-gray-700">
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
)

// Instruction card component
const InstructionCard = ({ instruction }: { instruction: InstructionDTO }) => (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700 hover:scale-[1.01]">
        <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400 break-words">
                {instruction.instruc_TemplateName}
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>Bác sĩ:</span>
                    <span className="font-medium break-words">{instruction.dentistName}</span>
                </p>
                <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>Ngày tạo:</span>
                    <span className="font-medium">{formatDateTime(instruction.createdAt)}</span>
                </p>
            </div>
        </CardHeader>
        <CardContent className="border-t pt-4 dark:border-gray-700">
            <div className="whitespace-pre-wrap text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                {instruction.instruc_TemplateContext}
            </div>
        </CardContent>
    </Card>
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
const EmptyState = ({ hasSearchQuery }: { hasSearchQuery: boolean }) => (
    <div className="text-center py-12">
        <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {hasSearchQuery 
                ? "Không tìm thấy hướng dẫn nào phù hợp" 
                : "Chưa có hướng dẫn nào"
            }
        </p>
        {hasSearchQuery && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
                Hãy thử tìm kiếm với từ khóa khác
            </p>
        )}
    </div>
)

export default function PatientInstructionsList() {
    const { appointmentId } = useParams<{ appointmentId: string }>()
    const [searchQuery, setSearchQuery] = useState("")
    const [instructions, setInstructions] = useState<InstructionDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)
    const userInfo = useUserInfo()
    const navigate = useNavigate()

    // Validate appointment ID early
    const parsedId = useMemo(() => {
        const id = Number(appointmentId)
        return !isNaN(id) && id > 0 ? id : null
    }, [appointmentId])

    // Memoized filtered instructions
    const filteredInstructions = useMemo(() => {
        if (!searchQuery.trim()) return instructions
        
        const query = searchQuery.toLowerCase().trim()
        return instructions.filter((instruction) =>
            instruction.instruc_TemplateName.toLowerCase().includes(query) ||
            instruction.dentistName.toLowerCase().includes(query) ||
            instruction.instruc_TemplateContext.toLowerCase().includes(query)
        )
    }, [instructions, searchQuery])

    // Pagination calculations
    const totalPages = Math.ceil(filteredInstructions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedInstructions = filteredInstructions.slice(startIndex, endIndex)

    // Fetch instructions function
    const fetchInstructions = useCallback(async () => {
        if (!parsedId) return

        setLoading(true)
        setError("")
        
        try {
            const data = await getPatientInstructions(parsedId)
            setInstructions(data)
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : "Không thể tải danh sách hướng dẫn."
            setError(errorMessage)
            console.error('Error fetching instructions:', err)
        } finally {
            setLoading(false)
        }
    }, [parsedId])

    // Effect to fetch instructions
    useEffect(() => {
        fetchInstructions()
    }, [fetchInstructions])

    // Handlers
    const handleGoBack = useCallback(() => {
        navigate(`/patient/appointments/${parsedId}`)
    }, [navigate, parsedId])

    const handleClearSearch = useCallback(() => {
        setSearchQuery("")
        setCurrentPage(1) // Reset to first page when clearing search
    }, [])

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // Reset to first page when searching
    }, [])

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
        // Scroll to top when changing pages
        document.getElementById('instructions-container')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        })
    }, [])

    const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1) // Reset to first page when changing items per page
    }, [])

    // Early return for invalid ID
    if (!parsedId) {
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
                    <div className="container mx-auto p-4 max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
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

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 ml-3 flex-shrink-0" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm hướng dẫn theo tên, nha sĩ hoặc nội dung..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="flex-grow border-none focus-visible:ring-0 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    aria-label="Tìm kiếm hướng dẫn"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSearch}
                                        aria-label="Xóa tìm kiếm"
                                        className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 mr-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Tìm thấy {filteredInstructions.length} kết quả cho "{searchQuery}"
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <ErrorMessage 
                                message={error} 
                                onRetry={fetchInstructions} 
                            />
                        )}

                        {/* Content Area */}
                        <div id="instructions-container">
                            <ScrollArea className="h-[500px] w-full rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
                                {loading ? (
                                    <LoadingSkeleton />
                                ) : filteredInstructions.length === 0 ? (
                                    <EmptyState hasSearchQuery={!!searchQuery} />
                                ) : (
                                    <div className="grid gap-4">
                                        {paginatedInstructions.map((instruction) => (
                                            <InstructionCard
                                                key={instruction.instructionId}
                                                instruction={instruction}
                                            />
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Pagination */}
                        {!loading && !error && filteredInstructions.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={filteredInstructions.length}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    className="justify-center"
                                />
                            </div>
                        )}

                        {/* Footer Info */}
                        {!loading && !error && instructions.length > 0 && (
                            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? (
                                    <>
                                        Tìm thấy <span className="font-medium">{filteredInstructions.length}</span> kết quả 
                                        từ tổng số <span className="font-medium">{instructions.length}</span> hướng dẫn
                                        {filteredInstructions.length > itemsPerPage && (
                                            <> • Trang {currentPage} / {totalPages}</>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Tổng cộng <span className="font-medium">{instructions.length}</span> hướng dẫn
                                        {instructions.length > itemsPerPage && (
                                            <> • Trang {currentPage} / {totalPages}</>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </PatientLayout>
        </AuthGuard>
    )
}