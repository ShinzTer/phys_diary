import { 
  // User types and schema
  type User, type InsertUser, type UserRole, users,
  
  // Faculty types and schema
  type Faculty, type InsertFaculty, faculty,
  
  // Group types and schema
  type Group, type InsertGroup, group,
  
  // Teacher types and schema
  type Teacher, type InsertTeacher, teacher,
  
  // Student types and schema
  type Student, type InsertStudent, student,
  
  // Period types and schema
  type Period, type InsertPeriod, period,
  
  // Physical state types and schema
  type PhysicalState, type InsertPhysicalState, physical_state,
  
  // Physical tests types and schema
  type PhysicalTest, type InsertPhysicalTest, physical_tests,
  
  // Sport results types and schema
  type SportResult, type InsertSportResult, sport_results,
  
  // Result types and schema
  type Result, type InsertResult, result
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Faculty operations
  getAllFaculties(): Promise<Faculty[]>;
  getFaculty(id: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined>;
  deleteFaculty(id: number): Promise<boolean>;
  
  // Group operations
  getAllGroups(): Promise<Group[]>;
  getGroupsByFaculty(facultyId: number): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  
  // Teacher operations
  getAllTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;
  
  // Student operations
  getAllStudents(): Promise<Student[]>;
  getStudentsByGroup(groupId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Period operations
  getAllPeriods(): Promise<Period[]>;
  getPeriod(id: number): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriod(id: number, periodData: Partial<Period>): Promise<Period | undefined>;
  deletePeriod(id: number): Promise<boolean>;
  
  // Physical state operations
  getPhysicalStatesByStudent(studentId: number): Promise<PhysicalState[]>;
  getPhysicalState(id: number): Promise<PhysicalState | undefined>;
  createPhysicalState(physicalState: InsertPhysicalState): Promise<PhysicalState>;
  updatePhysicalState(id: number, physicalStateData: Partial<PhysicalState>): Promise<PhysicalState | undefined>;
  deletePhysicalState(id: number): Promise<boolean>;
  
  // Physical tests operations
  getPhysicalTestsByStudent(studentId: number): Promise<PhysicalTest[]>;
  getPhysicalTest(id: number): Promise<PhysicalTest | undefined>;
  createPhysicalTest(physicalTest: InsertPhysicalTest): Promise<PhysicalTest>;
  updatePhysicalTest(id: number, physicalTestData: Partial<PhysicalTest>): Promise<PhysicalTest | undefined>;
  deletePhysicalTest(id: number): Promise<boolean>;
  
  // Sport results operations
  getSportResultsByStudent(studentId: number): Promise<SportResult[]>;
  getSportResult(id: number): Promise<SportResult | undefined>;
  createSportResult(sportResult: InsertSportResult): Promise<SportResult>;
  updateSportResult(id: number, sportResultData: Partial<SportResult>): Promise<SportResult | undefined>;
  deleteSportResult(id: number): Promise<boolean>;
  
  // Result operations
  getResultsByStudent(studentId: number): Promise<Result[]>;
  getResultsByGroup(groupId: number): Promise<Result[]>;
  getResultsByPeriod(periodId: number): Promise<Result[]>;
  getResult(id: number): Promise<Result | undefined>;
  createResult(resultData: InsertResult): Promise<Result>;
  updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
  
  // Initialization
  initializeDatabase(): Promise<void>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: User[] = [];
  private faculties: Faculty[] = [];
  private groups: Group[] = [];
  private teachers: Teacher[] = [];
  private students: Student[] = [];
  private periods: Period[] = [];
  private physicalStates: PhysicalState[] = [];
  private physicalTests: PhysicalTest[] = [];
  private sportResults: SportResult[] = [];
  private results: Result[] = [];
  
  private nextUserId = 1;
  private nextFacultyId = 1;
  private nextGroupId = 1;
  private nextTeacherId = 1;
  private nextStudentId = 1;
  private nextPeriodId = 1;
  private nextStateId = 1;
  private nextTestId = 1;
  private nextSportResultId = 1;
  private nextResultId = 1;
  
  sessionStore: session.Store;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
  }

  async initializeDatabase(): Promise<void> {
    if (this.users.length === 0) {
      // Create default faculty
      const newFaculty = await this.createFaculty({
        name: "Physical Education Faculty"
      });
      
      // Create default teacher
      const newTeacher = await this.createTeacher({
        name: "John Smith", 
        position: "Senior Lecturer", 
        phone: 1234567890
      });
      
      // Create default group
      const newGroup = await this.createGroup({
        name: "PE-101", 
        teacher_id: newTeacher.teacher_id
      });
      
      // Create default period
      const newPeriod = await this.createPeriod({
        name: "Fall 2023"
      });
      
      // Create default student
      const newStudent = await this.createStudent({
        name: "Alex Johnson",
        gender: "Male",
        birth_date: new Date(2000, 0, 1).toISOString().split('T')[0],
        group_id: newGroup.group_id,
        medical_group: "basic"
      });
      
      // Create default admin user
      const adminUser = await this.createUser({
        username: 'admin',
        password: 'admin123', // This would be hashed in auth.ts
        role: 'admin' as const,
      });
      
      // Create default teacher user with associated teacher_id
      const teacherUser = await this.createUser({
        username: 'teacher',
        password: 'teacher123',
        role: 'teacher' as const,
      });
      
      // Update teacher user to include teacher_id
      await this.updateUser(teacherUser.id, { teacher_id: newTeacher.teacher_id });
      
      // Create default student user with associated student_id
      const studentUser = await this.createUser({
        username: 'student',
        password: 'student123',
        role: 'student' as const,
      });
      
      // Update student user to include student_id
      await this.updateUser(studentUser.id, { student_id: newStudent.student_id });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.users.filter(user => user.role === role);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      student_id: null,
      teacher_id: null,
      created_at: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...userData };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return initialLength > this.users.length;
  }

  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return this.faculties;
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.find(faculty => faculty.faculty_id === id);
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const faculty: Faculty = {
      faculty_id: this.nextFacultyId++,
      ...facultyData,
      created_at: new Date().toISOString()
    };
    this.faculties.push(faculty);
    return faculty;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const index = this.faculties.findIndex(faculty => faculty.faculty_id === id);
    if (index === -1) return undefined;
    
    this.faculties[index] = { ...this.faculties[index], ...facultyData };
    return this.faculties[index];
  }

  async deleteFaculty(id: number): Promise<boolean> {
    const initialLength = this.faculties.length;
    this.faculties = this.faculties.filter(faculty => faculty.faculty_id !== id);
    return initialLength > this.faculties.length;
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return this.groups;
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    // Note: In the new schema, groups don't directly reference faculty
    // For memory store, we'll just return all groups for now
    return this.groups;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.find(group => group.group_id === id);
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const group: Group = {
      group_id: this.nextGroupId++,
      ...groupData,
      created_at: new Date().toISOString()
    };
    this.groups.push(group);
    return group;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const index = this.groups.findIndex(group => group.group_id === id);
    if (index === -1) return undefined;
    
    this.groups[index] = { ...this.groups[index], ...groupData };
    return this.groups[index];
  }

  async deleteGroup(id: number): Promise<boolean> {
    const initialLength = this.groups.length;
    this.groups = this.groups.filter(group => group.group_id !== id);
    return initialLength > this.groups.length;
  }

  // Teacher operations
  async getAllTeachers(): Promise<Teacher[]> {
    return this.teachers;
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachers.find(teacher => teacher.teacher_id === id);
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const teacher: Teacher = {
      teacher_id: this.nextTeacherId++,
      ...teacherData,
      created_at: new Date().toISOString()
    };
    this.teachers.push(teacher);
    return teacher;
  }

  async updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined> {
    const index = this.teachers.findIndex(teacher => teacher.teacher_id === id);
    if (index === -1) return undefined;
    
    this.teachers[index] = { ...this.teachers[index], ...teacherData };
    return this.teachers[index];
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const initialLength = this.teachers.length;
    this.teachers = this.teachers.filter(teacher => teacher.teacher_id !== id);
    return initialLength > this.teachers.length;
  }

  // Student operations
  async getAllStudents(): Promise<Student[]> {
    return this.students;
  }

  async getStudentsByGroup(groupId: number): Promise<Student[]> {
    return this.students.filter(student => student.group_id === groupId);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.find(student => student.student_id === id);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const student: Student = {
      student_id: this.nextStudentId++,
      ...studentData,
      created_at: new Date().toISOString()
    };
    this.students.push(student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const index = this.students.findIndex(student => student.student_id === id);
    if (index === -1) return undefined;
    
    this.students[index] = { ...this.students[index], ...studentData };
    return this.students[index];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const initialLength = this.students.length;
    this.students = this.students.filter(student => student.student_id !== id);
    return initialLength > this.students.length;
  }

  // Period operations
  async getAllPeriods(): Promise<Period[]> {
    return this.periods;
  }

  async getPeriod(id: number): Promise<Period | undefined> {
    return this.periods.find(period => period.period_id === id);
  }

  async createPeriod(periodData: InsertPeriod): Promise<Period> {
    const period: Period = {
      period_id: this.nextPeriodId++,
      ...periodData,
      created_at: new Date().toISOString()
    };
    this.periods.push(period);
    return period;
  }

  async updatePeriod(id: number, periodData: Partial<Period>): Promise<Period | undefined> {
    const index = this.periods.findIndex(period => period.period_id === id);
    if (index === -1) return undefined;
    
    this.periods[index] = { ...this.periods[index], ...periodData };
    return this.periods[index];
  }

  async deletePeriod(id: number): Promise<boolean> {
    const initialLength = this.periods.length;
    this.periods = this.periods.filter(period => period.period_id !== id);
    return initialLength > this.periods.length;
  }

  // Physical state operations
  async getPhysicalStatesByStudent(studentId: number): Promise<PhysicalState[]> {
    return this.physicalStates.filter(state => state.student_id === studentId);
  }

  async getPhysicalState(id: number): Promise<PhysicalState | undefined> {
    return this.physicalStates.find(state => state.state_id === id);
  }

  async createPhysicalState(physicalStateData: InsertPhysicalState): Promise<PhysicalState> {
    const physicalState: PhysicalState = {
      state_id: this.nextStateId++,
      ...physicalStateData,
      created_at: new Date().toISOString()
    };
    this.physicalStates.push(physicalState);
    return physicalState;
  }

  async updatePhysicalState(id: number, physicalStateData: Partial<PhysicalState>): Promise<PhysicalState | undefined> {
    const index = this.physicalStates.findIndex(state => state.state_id === id);
    if (index === -1) return undefined;
    
    this.physicalStates[index] = { ...this.physicalStates[index], ...physicalStateData };
    return this.physicalStates[index];
  }

  async deletePhysicalState(id: number): Promise<boolean> {
    const initialLength = this.physicalStates.length;
    this.physicalStates = this.physicalStates.filter(state => state.state_id !== id);
    return initialLength > this.physicalStates.length;
  }

  // Physical tests operations
  async getPhysicalTestsByStudent(studentId: number): Promise<PhysicalTest[]> {
    return this.physicalTests.filter(test => test.student_id === studentId);
  }

  async getPhysicalTest(id: number): Promise<PhysicalTest | undefined> {
    return this.physicalTests.find(test => test.test_id === id);
  }

  async createPhysicalTest(physicalTestData: InsertPhysicalTest): Promise<PhysicalTest> {
    const physicalTest: PhysicalTest = {
      test_id: this.nextTestId++,
      ...physicalTestData,
      created_at: new Date().toISOString()
    };
    this.physicalTests.push(physicalTest);
    return physicalTest;
  }

  async updatePhysicalTest(id: number, physicalTestData: Partial<PhysicalTest>): Promise<PhysicalTest | undefined> {
    const index = this.physicalTests.findIndex(test => test.test_id === id);
    if (index === -1) return undefined;
    
    this.physicalTests[index] = { ...this.physicalTests[index], ...physicalTestData };
    return this.physicalTests[index];
  }

  async deletePhysicalTest(id: number): Promise<boolean> {
    const initialLength = this.physicalTests.length;
    this.physicalTests = this.physicalTests.filter(test => test.test_id !== id);
    return initialLength > this.physicalTests.length;
  }

  // Sport results operations
  async getSportResultsByStudent(studentId: number): Promise<SportResult[]> {
    return this.sportResults.filter(result => result.student_id === studentId);
  }

  async getSportResult(id: number): Promise<SportResult | undefined> {
    return this.sportResults.find(result => result.result_id === id);
  }

  async createSportResult(sportResultData: InsertSportResult): Promise<SportResult> {
    const sportResult: SportResult = {
      result_id: this.nextSportResultId++,
      ...sportResultData,
      created_at: new Date().toISOString()
    };
    this.sportResults.push(sportResult);
    return sportResult;
  }

  async updateSportResult(id: number, sportResultData: Partial<SportResult>): Promise<SportResult | undefined> {
    const index = this.sportResults.findIndex(result => result.result_id === id);
    if (index === -1) return undefined;
    
    this.sportResults[index] = { ...this.sportResults[index], ...sportResultData };
    return this.sportResults[index];
  }

  async deleteSportResult(id: number): Promise<boolean> {
    const initialLength = this.sportResults.length;
    this.sportResults = this.sportResults.filter(result => result.result_id !== id);
    return initialLength > this.sportResults.length;
  }

  // Result operations
  async getResultsByStudent(studentId: number): Promise<Result[]> {
    return this.results.filter(result => result.student_id === studentId);
  }

  async getResultsByGroup(groupId: number): Promise<Result[]> {
    // This is a more complex query that requires joining tables
    // First, get students in this group
    const studentsInGroup = await this.getStudentsByGroup(groupId);
    const studentIds = studentsInGroup.map(student => student.student_id);
    
    // Then get results for these students
    if (studentIds.length > 0) {
      return this.results.filter(result => studentIds.includes(result.student_id));
    }
    return [];
  }

  async getResultsByPeriod(periodId: number): Promise<Result[]> {
    return this.results.filter(result => result.period_id === periodId);
  }

  async getResult(id: number): Promise<Result | undefined> {
    return this.results.find(result => result.result_id === id);
  }

  async createResult(resultData: InsertResult): Promise<Result> {
    const newResult: Result = {
      result_id: this.nextResultId++,
      ...resultData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.results.push(newResult);
    return newResult;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const index = this.results.findIndex(result => result.result_id === id);
    if (index === -1) return undefined;
    
    this.results[index] = { 
      ...this.results[index], 
      ...resultData,
      updated_at: new Date().toISOString()
    };
    return this.results[index];
  }

  async deleteResult(id: number): Promise<boolean> {
    const initialLength = this.results.length;
    this.results = this.results.filter(result => result.result_id !== id);
    return initialLength > this.results.length;
  }
}

export const storage = new MemStorage();