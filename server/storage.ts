import { 
  // User types and schema
  type User, type InsertUser, type UserRole, users,
  
  // Faculty types and schema
  type Faculty, type InsertFaculty, faculty,
  
  // Group types and schema
  type Group, type InsertGroup, group,
  
  // Teacher types and schema
  type Teacher, type InsertTeacher, teacher,
  type TeacherProfile,
  
  // Student types and schema
  type Student, type InsertStudent, student,
  type StudentProfile,
  
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
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { PgDatabase } from "drizzle-orm/pg-core";

type DatabaseSchema = {
  users: typeof users;
  student: typeof student;
  teacher: typeof teacher;
  group: typeof group;
  faculty: typeof faculty;
  period: typeof period;
  physical_state: typeof physical_state;
  physical_tests: typeof physical_tests;
  sport_results: typeof sport_results;
  result: typeof resultTable;
};

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  createUser(userData: { username: string; password: string; role?: UserRole }): Promise<User>;
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
  createStudent(studentData: InsertStudent): Promise<Student>;
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

  // Profile methods
  getStudentProfile(studentId: number): Promise<StudentProfile | undefined>;
  updateStudentProfile(studentId: number, data: Partial<StudentProfile>): Promise<StudentProfile>;
  getTeacherProfile(teacherId: number): Promise<TeacherProfile | undefined>;
  updateTeacherProfile(teacherId: number, data: Partial<TeacherProfile>): Promise<TeacherProfile>;
}

// PostgreSQL implementation of the storage interface
export class Storage implements IStorage {
  private db: PgDatabase<any, DatabaseSchema>;
  sessionStore: session.Store;

  constructor(db: PgDatabase<any, DatabaseSchema>) {
    this.db = db;
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      tableName: "session",
    });
  }

  async initializeDatabase(): Promise<void> {
    // Create session table if it doesn't exist
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);

    // Check if we have any users, if not, create default users
    const existingUsers = await this.db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Create default faculty
      const [newFaculty] = await this.db.insert(faculty).values({
        name: "Physical Education Faculty"
      }).returning();
      
      // Create default admin user
      const [adminUser] = await this.db.insert(users).values({
        username: 'admin',
        password: 'admin123', // This would be hashed in auth.ts
        role: 'admin' as UserRole,
      }).returning();
      
      // Create default teacher user
      const [teacherUser] = await this.db.insert(users).values({
        username: 'teacher',
        password: 'teacher123', // This would be hashed in auth.ts
        role: 'teacher' as UserRole,
      }).returning();
      
      // Create default teacher profile
      const [newTeacher] = await this.db.insert(teacher).values({
        userId: teacherUser.id,
        fullName: "John Smith",
        position: "Senior Lecturer",
        dateOfBirth: "1980-01-01",
        educationalDepartment: "Physical Education",
        phone: "+375291234567",
        nationality: null
      }).returning();
      
      // Create default group
      const [newGroup] = await this.db.insert(group).values({
        name: "PE-101",
        teacherId: newTeacher.teacherId,
        facultyId: newFaculty.facultyId,
      }).returning();
      
      // Create default student user
      const [studentUser] = await this.db.insert(users).values({
        username: 'student',
        password: 'student123', // This would be hashed in auth.ts
        role: 'student' as UserRole,
      }).returning();
      
      // Create default student profile
      await this.db.insert(student).values({
        userId: studentUser.id,
        fullName: "Alex Johnson",
        gender: "male",
        dateOfBirth: "2000-01-01",
        placeOfBirth: "Minsk",
        groupId: newGroup.groupId,
        medicalGroup: "basic",
        phone: "+375291234568",
        nationality: "Belarusian",
        address: "Minsk, Belarus",
        schoolGraduated: "School #1",
        educationalDepartment: "Physical Education"
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<(User & { teacher_id?: number, student_id?: number }) | undefined> {
    // First get the user
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    // If the user is a teacher, get their teacher_id
    if (user.role === 'teacher') {
      const [teacherRecord] = await this.db.select().from(teacher).where(eq(teacher.userId, id));
      if (teacherRecord) {
        return {
          ...user,
          teacher_id: teacherRecord.teacherId
        };
      }
    }

    // If the user is a student, get their student_id
    if (user.role === 'student') {
      const [studentRecord] = await this.db.select().from(student).where(eq(student.userId, id));
      if (studentRecord) {
        return {
          ...user,
          student_id: studentRecord.studentId
        };
      }
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    return this.getUser(user.id);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, role));
  }

  async createUser(userData: { username: string; password: string; role?: UserRole }): Promise<User> {
    const [user] = await this.db.insert(users).values({
      username: userData.username,
      password: userData.password,
      role: userData.role || 'student',
    }).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await this.db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return await this.db.select().from(faculty);
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [facultyRecord] = await this.db.select().from(faculty).where(eq(faculty.facultyId, id));
    return facultyRecord;
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const [facultyRecord] = await this.db.insert(faculty).values(facultyData).returning();
    return facultyRecord;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const [updatedFaculty] = await this.db
      .update(faculty)
      .set(facultyData)
      .where(eq(faculty.facultyId, id))
      .returning();
    return updatedFaculty;
  }

  async deleteFaculty(id: number): Promise<boolean> {
    const result = await this.db.delete(faculty).where(eq(faculty.facultyId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return await this.db.select().from(group);
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return await this.db.select().from(group).where(eq(group.facultyId, facultyId));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [groupRecord] = await this.db.select().from(group).where(eq(group.groupId, id));
    return groupRecord;
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const [groupRecord] = await this.db.insert(group).values(groupData).returning();
    return groupRecord;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const [updatedGroup] = await this.db
      .update(group)
      .set(groupData)
      .where(eq(group.groupId, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(group).where(eq(group.groupId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Teacher operations
  async getAllTeachers(): Promise<Teacher[]> {
    return await this.db.select().from(teacher);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacherRecord] = await this.db.select().from(teacher).where(eq(teacher.teacherId, id));
    return teacherRecord;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacherRecord] = await this.db.insert(teacher).values({
      userId: teacherData.userId,
      fullName: teacherData.fullName,
      position: teacherData.position,
      dateOfBirth: teacherData.dateOfBirth,
      educationalDepartment: teacherData.educationalDepartment,
      phone: teacherData.phone,
      nationality: teacherData.nationality,
    }).returning();
    
    // If this teacher is associated with a user, update the user's role
    if (teacherData.userId) {
      await this.updateUser(teacherData.userId, { role: 'teacher' });
    }
    
    return teacherRecord;
  }

  async updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined> {
    const [updatedTeacher] = await this.db
      .update(teacher)
      .set(teacherData)
      .where(eq(teacher.teacherId, id))
      .returning();
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await this.db.delete(teacher).where(eq(teacher.teacherId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Student operations
  async getAllStudents(): Promise<Student[]> {
    return await this.db.select().from(student);
  }

  async getStudentsByGroup(groupId: number): Promise<Student[]> {
    return await this.db.select().from(student).where(eq(student.groupId, groupId));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [studentRecord] = await this.db.select().from(student).where(eq(student.studentId, id));
    return studentRecord;
  }

    async getStudentByUserId(id: number): Promise<Student | undefined> {
    const [studentRecord] = await this.db.select().from(student).where(eq(student.userId, id));
    return studentRecord;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [newStudent] = await this.db.insert(student).values({
      userId: studentData.userId,
      fullName: studentData.fullName,
      gender: studentData.gender,
      dateOfBirth: studentData.dateOfBirth,
      placeOfBirth: studentData.placeOfBirth,
      groupId: studentData.groupId,
      medicalGroup: studentData.medicalGroup,
      phone: studentData.phone,
      nationality: studentData.nationality,
      address: studentData.address,
      schoolGraduated: studentData.schoolGraduated,
      educationalDepartment: studentData.educationalDepartment,
    }).returning();
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const [updatedStudent] = await this.db
      .update(student)
      .set(studentData)
      .where(eq(student.studentId, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await this.db.delete(student).where(eq(student.studentId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Period operations
  async getAllPeriods(): Promise<Period[]> {
    return await this.db.select().from(period);
  }

  async getPeriod(id: number): Promise<Period | undefined> {
    const [periodRecord] = await this.db.select().from(period).where(eq(period.periodId, id));
    return periodRecord;
  }

  async createPeriod(periodData: InsertPeriod): Promise<Period> {
    const [periodRecord] = await this.db.insert(period).values(periodData).returning();
    return periodRecord;
  }

  async updatePeriod(id: number, periodData: Partial<Period>): Promise<Period | undefined> {
    const [updatedPeriod] = await this.db
      .update(period)
      .set(periodData)
      .where(eq(period.periodId, id))
      .returning();
    return updatedPeriod;
  }

  async deletePeriod(id: number): Promise<boolean> {
    const result = await this.db.delete(period).where(eq(period.periodId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Physical state operations
  async getPhysicalStatesByStudent(studentId: number): Promise<PhysicalState[]> {
    return await this.db.select().from(physical_state).where(eq(physical_state.studentId, studentId));
  }

    async getPhysicalStates(): Promise<PhysicalState[]> {
    return await this.db.select().from(physical_state).orderBy(desc(physical_state.stateId));
  }

      async getPhysicalTests(): Promise<PhysicalTest[]> {
    return await this.db.select().from(physical_tests).orderBy(desc(physical_tests.testId));
  }

  async getPhysicalState(id: number): Promise<PhysicalState | undefined> {
    const [physicalStateRecord] = await this.db.select().from(physical_state).where(eq(physical_state.stateId, id));
    return physicalStateRecord;
  }

  async createPhysicalState(physicalStateData: InsertPhysicalState): Promise<PhysicalState> {
    const [physicalStateRecord] = await this.db.insert(physical_state).values(physicalStateData).returning();
    return physicalStateRecord;
  }

  async updatePhysicalState(id: number, physicalStateData: Partial<PhysicalState>): Promise<PhysicalState | undefined> {
    const [updatedPhysicalState] = await this.db
      .update(physical_state)
      .set(physicalStateData)
      .where(eq(physical_state.stateId, id))
      .returning();
    return updatedPhysicalState;
  }

  async deletePhysicalState(id: number): Promise<boolean> {
    const result = await this.db.delete(physical_state).where(eq(physical_state.stateId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Physical tests operations
  async getPhysicalTestsByStudent(studentId: number): Promise<PhysicalTest[]> {
    return await this.db.select().from(physical_tests).where(eq(physical_tests.studentId, studentId));
  }

  async getPhysicalTest(id: number): Promise<PhysicalTest | undefined> {
    const [physicalTestRecord] = await this.db.select().from(physical_tests).where(eq(physical_tests.testId, id));
    return physicalTestRecord;
  }

  async createPhysicalTest(physicalTestData: InsertPhysicalTest): Promise<PhysicalTest> {
   
   
    const [physicalTestRecord] = await this.db.insert(physical_tests).values(physicalTestData).returning();
    return physicalTestRecord;
  }

  async updatePhysicalTest(id: number, physicalTestData: Partial<PhysicalTest>): Promise<PhysicalTest | undefined> {
    const [updatedPhysicalTest] = await this.db
      .update(physical_tests)
      .set(physicalTestData)
      .where(eq(physical_tests.testId, id))
      .returning();
    return updatedPhysicalTest;
  }

  async deletePhysicalTest(id: number): Promise<boolean> {
    const result = await this.db.delete(physical_tests).where(eq(physical_tests.testId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sport results operations
  async getSportResultsByStudent(studentId: number): Promise<SportResult[]> {
    return await this.db.select().from(sport_results).where(eq(sport_results.studentId, studentId));
  }

  async getSportResult(id: number): Promise<SportResult | undefined> {
    const [sportResultRecord] = await this.db.select().from(sport_results).where(eq(sport_results.sportResultId, id));
    return sportResultRecord;
  }

  async createSportResult(sportResultData: InsertSportResult): Promise<SportResult> {
    const [sportResultRecord] = await this.db.insert(sport_results).values(sportResultData).returning();
    return sportResultRecord;
  }

  async updateSportResult(id: number, sportResultData: Partial<SportResult>): Promise<SportResult | undefined> {
    const [updatedSportResult] = await this.db
      .update(sport_results)
      .set(sportResultData)
      .where(eq(sport_results.sportResultId, id))
      .returning();
    return updatedSportResult;
  }

  async deleteSportResult(id: number): Promise<boolean> {
    const result = await this.db.delete(sport_results).where(eq(sport_results.sportResultId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Result operations
  async getResultsByStudent(studentId: number): Promise<Result[]> {
    return await this.db.select().from(resultTable).where(eq(resultTable.studentId, studentId));
  }

  async getResultsByGroup(groupId: number): Promise<Result[]> {
    return await this.db.select().from(resultTable).where(eq(resultTable.groupId, groupId));
  }

  async getResultsByPeriod(periodId: number): Promise<Result[]> {
    return await this.db.select().from(resultTable).where(eq(resultTable.periodId, periodId));
  }

  async getResult(id: number): Promise<Result | undefined> {
    const [resultRecord] = await this.db.select().from(resultTable).where(eq(resultTable.resultId, id));
    return resultRecord;
  }

  async createResult(resultData: InsertResult): Promise<Result> {
    const [resultRecord] = await this.db.insert(resultTable).values(resultData).returning();
    return resultRecord;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const [updatedResult] = await this.db
      .update(resultTable)
      .set(resultData)
      .where(eq(resultTable.resultId, id))
      .returning();
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await this.db.delete(resultTable).where(eq(resultTable.resultId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Student profile methods
  async getStudentProfile(studentId: number): Promise<StudentProfile | undefined> {
    const studentData = await this.getStudent(studentId);
    if (!studentData) return undefined;

    const profile: StudentProfile = {
      fullName: studentData.fullName,
      gender: studentData.gender as "male" | "female" | "other",
      dateOfBirth: studentData.dateOfBirth,
      placeOfBirth: studentData.placeOfBirth || "",
      address: studentData.address || "",
      nationality: studentData.nationality || "",
      schoolGraduated: studentData.schoolGraduated || "",
      medicalGroup: studentData.medicalGroup as "basic" | "preparatory" | "special",
      medicalDiagnosis: studentData.medicalDiagnosis || "",
      previousIllnesses: studentData.previousIllnesses || "",
      educationalDepartment: studentData.educationalDepartment || "",
      activeSports: studentData.activeSports || "",
      previousSports: studentData.previousSports || "",
      additionalInfo: studentData.additionalInfo || "",
      phone: studentData.phone,
    };

    return profile;
  }

  async updateStudentProfile(studentId: number, data: Partial<StudentProfile>): Promise<StudentProfile> {
    const studentData = await this.getStudent(studentId);
    if (!studentData) {
      throw new Error("Student not found");
    }

    const [updatedStudent] = await this.db
      .update(student)
      .set({
        fullName: data.fullName || studentData.fullName,
        gender: data.gender || studentData.gender,
        dateOfBirth: data.dateOfBirth || studentData.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        address: data.address,
        nationality: data.nationality,
        schoolGraduated: data.schoolGraduated,
        medicalGroup: data.medicalGroup || studentData.medicalGroup,
        medicalDiagnosis: data.medicalDiagnosis,
        previousIllnesses: data.previousIllnesses,
        educationalDepartment: data.educationalDepartment,
        activeSports: data.activeSports,
        previousSports: data.previousSports,
        additionalInfo: data.additionalInfo,
        phone: data.phone || studentData.phone,
      })
      .where(eq(student.studentId, studentId))
      .returning();

    if (!updatedStudent) {
      throw new Error("Failed to update student profile");
    }

    return this.getStudentProfile(studentId) as Promise<StudentProfile>;
  }

  // Teacher profile methods
  async getTeacherProfile(teacherId: number): Promise<TeacherProfile | undefined> {
    const teacherData = await this.getTeacher(teacherId);
    if (!teacherData) return undefined;

    const profile: TeacherProfile = {
      fullName: teacherData.fullName,
      position: teacherData.position || "",
      dateOfBirth: teacherData.dateOfBirth || undefined,
      educationalDepartment: teacherData.educationalDepartment || undefined,
      nationality: teacherData.nationality || undefined,
      phone: teacherData.phone || "",
    };

    return profile;
  }

  async updateTeacherProfile(teacherId: number, data: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const teacherData = await this.getTeacher(teacherId);
    if (!teacherData) {
      throw new Error("Teacher not found");
    }

    const [updatedTeacher] = await this.db
      .update(teacher)
      .set({
        fullName: data.fullName || teacherData.fullName,
        position: data.position || teacherData.position,
        dateOfBirth: data.dateOfBirth === undefined ? teacherData.dateOfBirth : data.dateOfBirth,
        educationalDepartment: data.educationalDepartment === undefined ? teacherData.educationalDepartment : data.educationalDepartment,
        nationality: data.nationality === undefined ? teacherData.nationality : data.nationality,
        phone: data.phone || teacherData.phone,
      })
      .where(eq(teacher.teacherId, teacherId))
      .returning();

    if (!updatedTeacher) {
      throw new Error("Failed to update teacher profile");
    }

    return this.getTeacherProfile(teacherId) as Promise<TeacherProfile>;
  }
}

export const storage = new Storage(db);