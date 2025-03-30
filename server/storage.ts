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
  type Result, type InsertResult, result as resultTable
} from "@shared/schema";

import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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

// PostgreSQL implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  async initializeDatabase(): Promise<void> {
    // Check if we have any users, if not, create default users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Create default faculty
      const [newFaculty] = await db.insert(faculty).values([
        { name: "Physical Education Faculty" }
      ]).returning();
      
      // Create default teacher
      const [newTeacher] = await db.insert(teacher).values([
        { name: "John Smith", position: "Senior Lecturer", phone: 1234567890 }
      ]).returning();
      
      // Create default group
      const [newGroup] = await db.insert(group).values([
        { name: "PE-101", teacher_id: newTeacher.teacher_id }
      ]).returning();
      
      // Create default period
      const [newPeriod] = await db.insert(period).values([
        { name: "Fall 2023" }
      ]).returning();
      
      // Create default student
      const [newStudent] = await db.insert(student).values([
        { 
          name: "Alex Johnson", 
          gender: "Male", 
          birth_date: new Date(2000, 0, 1).toISOString().split('T')[0], 
          group_id: newGroup.group_id, 
          medical_group: "basic" 
        }
      ]).returning();
      
      // Create default admin user
      await this.createUser({
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Ensure role is one of the allowed UserRole values
    const validatedData = {
      ...userData,
      role: userData.role as UserRole
    };
    const [user] = await db.insert(users).values([validatedData]).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return await db.select().from(faculty);
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [facultyRecord] = await db.select().from(faculty).where(eq(faculty.faculty_id, id));
    return facultyRecord;
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const [facultyRecord] = await db.insert(faculty).values([facultyData]).returning();
    return facultyRecord;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const [updatedFaculty] = await db
      .update(faculty)
      .set(facultyData)
      .where(eq(faculty.faculty_id, id))
      .returning();
    return updatedFaculty;
  }

  async deleteFaculty(id: number): Promise<boolean> {
    const result = await db.delete(faculty).where(eq(faculty.faculty_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(group);
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    // Note: In the new schema, groups don't directly reference faculty
    // This would require a more complex query or modifying the schema to maintain this relationship
    // For now, returning all groups as a placeholder
    return await db.select().from(group);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [groupRecord] = await db.select().from(group).where(eq(group.group_id, id));
    return groupRecord;
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const [groupRecord] = await db.insert(group).values([groupData]).returning();
    return groupRecord;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(group)
      .set(groupData)
      .where(eq(group.group_id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const result = await db.delete(group).where(eq(group.group_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Teacher operations
  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teacher);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacherRecord] = await db.select().from(teacher).where(eq(teacher.teacher_id, id));
    return teacherRecord;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacherRecord] = await db.insert(teacher).values([teacherData]).returning();
    return teacherRecord;
  }

  async updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined> {
    const [updatedTeacher] = await db
      .update(teacher)
      .set(teacherData)
      .where(eq(teacher.teacher_id, id))
      .returning();
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teacher).where(eq(teacher.teacher_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Student operations
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(student);
  }

  async getStudentsByGroup(groupId: number): Promise<Student[]> {
    return await db.select().from(student).where(eq(student.group_id, groupId));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [studentRecord] = await db.select().from(student).where(eq(student.student_id, id));
    return studentRecord;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [studentRecord] = await db.insert(student).values([studentData]).returning();
    return studentRecord;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(student)
      .set(studentData)
      .where(eq(student.student_id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(student).where(eq(student.student_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Period operations
  async getAllPeriods(): Promise<Period[]> {
    return await db.select().from(period);
  }

  async getPeriod(id: number): Promise<Period | undefined> {
    const [periodRecord] = await db.select().from(period).where(eq(period.period_id, id));
    return periodRecord;
  }

  async createPeriod(periodData: InsertPeriod): Promise<Period> {
    const [periodRecord] = await db.insert(period).values([periodData]).returning();
    return periodRecord;
  }

  async updatePeriod(id: number, periodData: Partial<Period>): Promise<Period | undefined> {
    const [updatedPeriod] = await db
      .update(period)
      .set(periodData)
      .where(eq(period.period_id, id))
      .returning();
    return updatedPeriod;
  }

  async deletePeriod(id: number): Promise<boolean> {
    const result = await db.delete(period).where(eq(period.period_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Physical state operations
  async getPhysicalStatesByStudent(studentId: number): Promise<PhysicalState[]> {
    return await db.select().from(physical_state).where(eq(physical_state.student_id, studentId));
  }

  async getPhysicalState(id: number): Promise<PhysicalState | undefined> {
    const [physicalStateRecord] = await db.select().from(physical_state).where(eq(physical_state.state_id, id));
    return physicalStateRecord;
  }

  async createPhysicalState(physicalStateData: InsertPhysicalState): Promise<PhysicalState> {
    const [physicalStateRecord] = await db.insert(physical_state).values([physicalStateData]).returning();
    return physicalStateRecord;
  }

  async updatePhysicalState(id: number, physicalStateData: Partial<PhysicalState>): Promise<PhysicalState | undefined> {
    const [updatedPhysicalState] = await db
      .update(physical_state)
      .set(physicalStateData)
      .where(eq(physical_state.state_id, id))
      .returning();
    return updatedPhysicalState;
  }

  async deletePhysicalState(id: number): Promise<boolean> {
    const result = await db.delete(physical_state).where(eq(physical_state.state_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Physical tests operations
  async getPhysicalTestsByStudent(studentId: number): Promise<PhysicalTest[]> {
    return await db.select().from(physical_tests).where(eq(physical_tests.student_id, studentId));
  }

  async getPhysicalTest(id: number): Promise<PhysicalTest | undefined> {
    const [physicalTestRecord] = await db.select().from(physical_tests).where(eq(physical_tests.test_id, id));
    return physicalTestRecord;
  }

  async createPhysicalTest(physicalTestData: InsertPhysicalTest): Promise<PhysicalTest> {
    const [physicalTestRecord] = await db.insert(physical_tests).values([physicalTestData]).returning();
    return physicalTestRecord;
  }

  async updatePhysicalTest(id: number, physicalTestData: Partial<PhysicalTest>): Promise<PhysicalTest | undefined> {
    const [updatedPhysicalTest] = await db
      .update(physical_tests)
      .set(physicalTestData)
      .where(eq(physical_tests.test_id, id))
      .returning();
    return updatedPhysicalTest;
  }

  async deletePhysicalTest(id: number): Promise<boolean> {
    const result = await db.delete(physical_tests).where(eq(physical_tests.test_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sport results operations
  async getSportResultsByStudent(studentId: number): Promise<SportResult[]> {
    return await db.select().from(sport_results).where(eq(sport_results.student_id, studentId));
  }

  async getSportResult(id: number): Promise<SportResult | undefined> {
    const [sportResultRecord] = await db.select().from(sport_results).where(eq(sport_results.result_id, id));
    return sportResultRecord;
  }

  async createSportResult(sportResultData: InsertSportResult): Promise<SportResult> {
    const [sportResultRecord] = await db.insert(sport_results).values([sportResultData]).returning();
    return sportResultRecord;
  }

  async updateSportResult(id: number, sportResultData: Partial<SportResult>): Promise<SportResult | undefined> {
    const [updatedSportResult] = await db
      .update(sport_results)
      .set(sportResultData)
      .where(eq(sport_results.result_id, id))
      .returning();
    return updatedSportResult;
  }

  async deleteSportResult(id: number): Promise<boolean> {
    const result = await db.delete(sport_results).where(eq(sport_results.result_id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Result operations
  async getResultsByStudent(studentId: number): Promise<Result[]> {
    return await db.select().from(resultTable).where(eq(resultTable.student_id, studentId));
  }

  async getResultsByGroup(groupId: number): Promise<Result[]> {
    // This is a more complex query that requires joining tables
    // First, get students in this group
    const studentsInGroup = await this.getStudentsByGroup(groupId);
    const studentIds = studentsInGroup.map(student => student.student_id);
    
    // Then get results for these students
    if (studentIds.length > 0) {
      // Build WHERE conditions for each student_id
      const conditions = studentIds.map(id => eq(resultTable.student_id, id));
      // Combine conditions with OR
      return await db.select().from(resultTable).where(conditions[0]);
    }
    return [];
  }

  async getResultsByPeriod(periodId: number): Promise<Result[]> {
    return await db.select().from(resultTable).where(eq(resultTable.period_id, periodId));
  }

  async getResult(id: number): Promise<Result | undefined> {
    const [resultRecord] = await db.select().from(resultTable).where(eq(resultTable.result_id, id));
    return resultRecord;
  }

  async createResult(resultData: InsertResult): Promise<Result> {
    const [resultRecord] = await db.insert(resultTable).values([resultData]).returning();
    return resultRecord;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const [updatedResult] = await db
      .update(resultTable)
      .set(resultData)
      .where(eq(resultTable.result_id, id))
      .returning();
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    const deleteResult = await db.delete(resultTable).where(eq(resultTable.result_id, id));
    return deleteResult.rowCount !== null && deleteResult.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();