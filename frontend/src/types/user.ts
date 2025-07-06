export interface User {
  userId: string
  email: string
  fullName: string
  phoneNumber: string
  role: string
  createdAt: string
  status: boolean
  gender: boolean
}

export interface CreateUserForm {
  fullName: string
  gender: boolean
  email: string
  phoneNumber: string
  role: string
}
