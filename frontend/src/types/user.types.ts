// Role-specific data interfaces
export interface PatientData {
  patientId: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  medicalHistory?: string;
  allergies?: string;
  insuranceInfo?: string;
}

export interface DentistData {
  dentistId: string;
  licenseNumber: string;
  specialization: string;
  yearsOfExperience: number;
  education: string;
  certifications?: string[];
  workingHours: {
    start: string;
    end: string;
    workDays: string[];
  };
}

export interface ReceptionistData {
  receptionistId: string;
  department: string;
  workShift: 'morning' | 'afternoon' | 'evening' | 'night';
  permissions: string[];
}

export interface AssistantData {
  assistantId: string;
  supervisorId: string;
  certifications?: string[];
  specializedIn: string[];
}

export interface AdministratorData {
  administratorId: string;
  permissions: string[];
  managedDepartments: string[];
  accessLevel: 'full' | 'limited';
}

export interface OwnerData {
  ownerId: string;
  businessLicense: string;
  taxId: string;
  establishmentDate: string;
}

// Union type for all role data
export type RoleSpecificData = 
  | PatientData 
  | DentistData 
  | ReceptionistData 
  | AssistantData 
  | AdministratorData 
  | OwnerData;

// Role mapping type
export type UserRole = 'Patient' | 'Administrator' | 'Owner' | 'Receptionist' | 'Assistant' | 'Dentist';

// user interface with role-specific data
export interface UserInfo {
  // Base user info
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  
  // Role-specific info
  roleId: string;
  roleData: RoleSpecificData;

  fullname: string;
  phone?: string;
  avatar?: string;
}

// API response types
export interface LoginApiResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: UserInfo;
}

export interface UserProfileResponse {
  user: UserInfo;
  permissions: string[];
  lastLogin: string;
}