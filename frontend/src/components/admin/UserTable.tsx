import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserTableRow } from "./UserTableRow"
import { UserTableSkeleton } from "./UserTableSkeleton"
import type { User } from "@/types/user"

interface UserTableProps {
    users: User[]
    onToggleStatus: (userId: number) => void
    onClearFilters: () => void
    isLoading: boolean
}

export function UserTable({ users, onToggleStatus, onClearFilters, isLoading }: UserTableProps) {
    if (isLoading) {
        return <UserTableSkeleton />
    }

    return (
        <>
            <div className="shadow-lg rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, index) => (
                            <UserTableRow key={user.userId} user={user} index={index} onToggleStatus={onToggleStatus} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No users found. Create your first user to get started.</p>
                    <Button variant="outline" className="mt-2 bg-transparent" onClick={onClearFilters}>
                        Clear Filters
                    </Button>
                </div>
            )}
        </>
    )
}
