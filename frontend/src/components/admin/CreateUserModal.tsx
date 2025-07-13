import type React from "react"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { CreateUserForm } from "@/types/user"
import { userService } from "@/services/userService"
import { toast } from "react-toastify"

interface CreateUserModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    form: CreateUserForm
    onFormChange: (form: CreateUserForm) => void
    onRefreshUsers: () => void
}

export function CreateUserModal({ isOpen, onOpenChange, form, onFormChange, onRefreshUsers }: CreateUserModalProps) {
    const updateForm = (field: keyof CreateUserForm, value: string | boolean) => {
        onFormChange({ ...form, [field]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await userService.create(form)
            toast.success("User created successfully")
            onOpenChange(false)
            onRefreshUsers()
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to create user"
            toast.error(message)
        }
    }



    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md [&~div]:backdrop-blur-none">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={form.fullName}
                            onChange={(e) => updateForm("fullName", e.target.value)}
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={form.gender.toString()} onValueChange={(value) => updateForm("gender", value === "true")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Male</SelectItem>
                                <SelectItem value="false">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateForm("email", e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            value={form.phoneNumber}
                            onChange={(e) => updateForm("phoneNumber", e.target.value)}
                            placeholder="Enter phone number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={form.role} onValueChange={(value) => updateForm("role", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Administrator">Administrator</SelectItem>
                                <SelectItem value="Receptionist">Receptionist</SelectItem>
                                <SelectItem value="Dentist">Dentist</SelectItem>
                                <SelectItem value="Assistant">Assistant</SelectItem>
                                <SelectItem value="Owner">Owner</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create User</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
