import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types/user"

interface UserFiltersProps {
    allUsers: User[]
    onUsersFiltered: (filtered: User[]) => void
}

export function UserFilters({ allUsers, onUsersFiltered }: UserFiltersProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [filteredCount, setFilteredCount] = useState(allUsers.length)

    useEffect(() => {
        const filtered = allUsers.filter((user) => {
            const matchesSearch =
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phoneNumber.includes(searchTerm)

            const matchesRole = roleFilter === "all" || user.role === roleFilter
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && user.status) ||
                (statusFilter === "banned" && !user.status)

            return matchesSearch && matchesRole && matchesStatus
        })

        setFilteredCount(filtered.length)
        onUsersFiltered(filtered)
    }, [searchTerm, roleFilter, statusFilter, allUsers, onUsersFiltered])

    const handleClearFilters = () => {
        setSearchTerm("")
        setRoleFilter("all")
        setStatusFilter("all")
    }

    return (
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Label htmlFor="search">Search Users</Label>
                    <Input
                        id="search"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                    />
                </div>

                <div className="sm:w-48">
                    <Label htmlFor="roleFilter">Filter by Role</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="Administrator">Administrator</SelectItem>
                            <SelectItem value="Receptionist">Receptionist</SelectItem>
                            <SelectItem value="Patient">Patient</SelectItem>
                            <SelectItem value="Dentist">Dentist</SelectItem>
                            <SelectItem value="Assistant">Assistant</SelectItem>
                            <SelectItem value="Owner">Owner</SelectItem>

                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:w-48">
                    <Label htmlFor="statusFilter">Filter by Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Showing {filteredCount} of {allUsers.length} users
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>
    )
}
