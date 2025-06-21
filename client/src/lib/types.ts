export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  studentId?: number;
  teacherId?: number;
  fullName?: string;
  visualSettings?: string;
  createdAt?: Date;
}

export interface BaseProfile {
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  nationality?: string;
  educationalDepartment?: string;
}

export interface TeacherProfile extends BaseProfile {
  position: string;
}

export interface StudentProfile extends BaseProfile {
  gender: "М" | "Ж" | "Другое";
  placeOfBirth?: string;
  address: string;
  schoolGraduated?: string;
  medicalGroup: "Основная" | "Подготовительная" | "Специальная";
  medicalDiagnosis?: string;
  previousIllnesses?: string;
  activeSports?: string;
  previousSports?: string;
  additionalInfo?: string;
}

export interface Student {
  studentId: number;
  userId: number;
  fullName: string;
  gender: "М" | "Ж" | "Другое";
  dateOfBirth: string;
  placeOfBirth?: string;
  groupId: number;
  medicalGroup: "Основная" | "Подготовительная" | "Специальная";
  medicalDiagnosis?: string;
  previousIllnesses?: string;
  activeSports?: string;
  previousSports?: string;
  additionalInfo?: string;
  phone: string;
  nationality?: string;
  address?: string;
  schoolGraduated?: string;
  educationalDepartment?: string;
}

export interface Teacher {
  teacherId: number;
  userId: number;
  fullName: string;
  position: string;
  dateOfBirth?: string;
  educationalDepartment?: string;
  phone: string;
  nationality?: string;
}

export interface ExtendedUser extends User {
  student?: Student;
  teacher?: Teacher;
}

export interface PhysicalTest {
  testId: number;
  studentId: number;
  pushUps?: number;
  legHold?: number;
  tappingTest?: number;
  runningInPlace?: number;
  halfSquat?: number;
  pullUps?: number;
  plank?: number;
  forwardBend?: number;
  longJump?: number;
}

export interface PhysicalSample {
  sampleId: number;
  studentId: number;
  height?: number;
  weight?: number;
  ketleIndex?: number;
  chestCircumference?: number;
  waistCircumference?: number;
  posture?: string;
  vitalCapacity?: number;
  handStrength?: number;
  orthostaticTest?: number;
  shtangeTest?: number;
  martineTest?: number;
  heartRate?: number;
  bloodPressure?: number;
  pulsePressure?: number;
} 