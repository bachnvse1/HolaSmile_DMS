import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MaintenanceTable } from "@/components/maintaince/MaintenanceTable"
import { CreateMaintenanceModal } from "@/components/maintaince/CreateMaintenanceModal"
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { 
  RefreshCw,
  Settings, 
  TrendingUp, 
  Calendar,
  AlertCircle 
} from "lucide-react"
import { getMaintenanceList } from "@/services/maintenanceService"
import { toast } from "react-toastify"
import { formatCurrency as formatCurrencyUtils } from "@/utils/currencyUtils"

interface MaintenanceStats {
  total: number
  pending: number
  approved: number
  totalCost: number
  thisMonthCount: number
  lastRefresh?: Date
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      code?: string
    }
  }
  message?: string
}

const handleApiError = (error: unknown, defaultMessage: string): void => {
  const apiError = error as ApiError
  const message = 
    apiError?.response?.data?.message || 
    apiError?.message || 
    defaultMessage
  toast.error(message)
}

const formatCurrency = (value: number | string) => {
  const out = formatCurrencyUtils(value as any)
  return `${out === "" ? "0" : out} VND`
}

const isCurrentMonth = (dateString: string): boolean => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  } catch {
    return false
  }
}

const calculateStats = (records: any[]): MaintenanceStats => {
  const now = new Date()
  
  const stats: MaintenanceStats = {
    total: 0,
    pending: 0,
    approved: 0,
    totalCost: 0,
    thisMonthCount: 0,
    lastRefresh: now
  }

  if (!Array.isArray(records)) return stats

  records.forEach(record => {
    try {
      stats.total++
      
      const status = String(record.status ?? "").toLowerCase()
      if (status === "approved" || status === "đã phê duyệt") {
        stats.approved++
      } else {
        stats.pending++
      }
      
      const cost = Number(record.price ?? record.Price ?? 0)
      if (Number.isFinite(cost)) {
        stats.totalCost += cost
      }
      
      const maintenanceDate = record.maintenanceDate ?? record.MaintenanceDate ?? 
                            record.maintenancedate ?? record.createdAt ?? record.CreatedAt
      if (maintenanceDate && isCurrentMonth(maintenanceDate)) {
        stats.thisMonthCount++
      }
    } catch (error) {
      console.warn("Error processing record for stats:", error, record)
    }
  })

  return stats
}

export default function MaintenancePage() {
  const [pageState, setPageState] = useState({
    refreshTable: 0,
    isRefreshing: false,
    stats: null as MaintenanceStats | null,
    isStatsLoading: true,
  })

  const userInfo = useUserInfo()

  const handleMaintenanceCreated = useCallback(() => {
    setPageState(prev => ({ 
      ...prev, 
      refreshTable: prev.refreshTable + 1 
    }))   
    loadStats()
  }, [])

  const loadStats = useCallback(async () => {
    try {
      setPageState(prev => ({ ...prev, isStatsLoading: true }))
      
      const response = await getMaintenanceList()
      const rawData = Array.isArray(response) ? response :
                     response?.data ?? response?.items ?? response?.result ?? 
                     response?.records ?? response?.maintenanceList ?? 
                     response?.maintenance ?? []
      
      const stats = calculateStats(rawData)
      
      setPageState(prev => ({ 
        ...prev, 
        stats, 
        isStatsLoading: false 
      }))
    } catch (error) {
      setPageState(prev => ({ 
        ...prev, 
        isStatsLoading: false,
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
          totalCost: 0,
          thisMonthCount: 0,
          lastRefresh: new Date()
        }
      }))
      handleApiError(error, "Không thể tải thống kê bảo trì.")
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setPageState(prev => ({ ...prev, isRefreshing: true }))
    
    try {
      await loadStats()
      setPageState(prev => ({ 
        ...prev, 
        refreshTable: prev.refreshTable + 1,
        isRefreshing: false 
      }))
      toast.success("Dữ liệu đã được làm mới!")
    } catch (error) {
      setPageState(prev => ({ ...prev, isRefreshing: false }))
      handleApiError(error, "Không thể làm mới dữ liệu.")
    }
  }, [loadStats])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const renderStatsCards = () => {
    if (pageState.isStatsLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded mb-1"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (!pageState.stats) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Không thể tải thống kê</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    const stats = pageState.stats

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phiếu
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả phiếu bảo trì
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ phê duyệt
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cần xem xét và phê duyệt
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tháng này
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bảo trì trong tháng
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi phí
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chi phí tích lũy
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard requiredRoles={["Receptionist"]}>
      <StaffLayout userInfo={userInfo}>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            <main className="flex flex-1 flex-col gap-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Quản lý bảo trì
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Theo dõi và quản lý các hoạt động bảo trì thiết bị
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={pageState.isRefreshing}
                    className="min-w-[100px]"
                  >
                    {pageState.isRefreshing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Làm mới
                      </>
                    )}
                  </Button>
                  
                  <CreateMaintenanceModal onMaintenanceCreated={handleMaintenanceCreated} />
                </div>
              </div>

              {renderStatsCards()}

              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-background to-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Danh sách bảo trì</CardTitle>
                      <CardDescription className="mt-1">
                        Xem và quản lý tất cả các phiếu bảo trì trong hệ thống
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <MaintenanceTable refreshTrigger={pageState.refreshTable} />
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
