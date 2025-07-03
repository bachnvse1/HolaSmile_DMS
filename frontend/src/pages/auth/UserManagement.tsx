import { useEffect, useState } from "react"
import { CreateUserModal } from "@/components/admin/CreateUserModal"
import { UserFilters } from "@/components/admin/UserFilter"
import { UserTable } from "@/components/admin/UserTable"
import { Pagination } from "@/components/ui/Pagination"
import type { User, CreateUserForm } from "@/types/user"
import { userService } from "@/services/userService"
import { toast } from "react-toastify"
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { useAuth } from "@/hooks/useAuth"

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [createForm, setCreateForm] = useState<CreateUserForm>({
        fullName: "",
        gender: true,
        email: "",
        phoneNumber: "",
        role: "",
    })

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const data = await userService.getAll()
            setUsers(data)
        } catch (err) {
            console.error("Error fetching users", err)
            toast.error("Failed to fetch users")
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleUserStatus = async (userId: number) => {
        try {
            await userService.toggleStatus(userId)
            toast.success("User status updated")
            await fetchUsers()
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to update user status"
            toast.error(message)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const paginatedFilteredUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const { fullName, userId, role } = useAuth()
    const userInfo = {
        id: userId || '',
        name: fullName || 'User',
        email: '',
        role: role || '',
        avatar: undefined
    }

    return (
        <AuthGuard requiredRoles={['Administrator']}>
            <StaffLayout userInfo={userInfo}>
                <div className="container mx-auto p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">User Management</h1>
                            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
                        </div>

                        <CreateUserModal
                            isOpen={isCreateModalOpen}
                            onOpenChange={setIsCreateModalOpen}
                            form={createForm}
                            onFormChange={setCreateForm}
                            onRefreshUsers={fetchUsers}
                        />
                    </div>

                    <UserFilters allUsers={users} onUsersFiltered={setFilteredUsers} />

                    <UserTable
                        users={paginatedFilteredUsers}
                        isLoading={isLoading}
                        onToggleStatus={handleToggleUserStatus}
                        onClearFilters={fetchUsers}
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={users.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            </StaffLayout>
        </AuthGuard>
    )
}
