import { 
  type User, type InsertUser,
  type Faculty, type InsertFaculty,
  type Group, type InsertGroup,
  type Test, type InsertTest,
  type Sample, type InsertSample,
  type UserRole,
  users, faculties, groups, tests, samples
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
  
  // Test operations
  getTestsByUser(userId: number): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;
  
  // Sample operations
  getSamplesByUser(userId: number): Promise<Sample[]>;
  getSample(id: number): Promise<Sample | undefined>;
  createSample(sample: InsertSample): Promise<Sample>;
  updateSample(id: number, sampleData: Partial<Sample>): Promise<Sample | undefined>;
  deleteSample(id: number): Promise<boolean>;

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
      // Create default admin user
      await this.createUser({
        username: 'admin',
        password: 'admin123', // This would be hashed in auth.ts
        role: 'admin' as const,
        fullName: 'System Administrator',
      });
      
      // Create default teacher user
      await this.createUser({
        username: 'teacher',
        password: 'teacher123',
        role: 'teacher' as const,
        fullName: 'John Smith',
      });
      
      // Create default student user
      await this.createUser({
        username: 'student',
        password: 'student123',
        role: 'student' as const,
        fullName: 'Alex Johnson',
      });
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
    return await db.select().from(faculties);
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [faculty] = await db.select().from(faculties).where(eq(faculties.id, id));
    return faculty;
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const [faculty] = await db.insert(faculties).values([facultyData]).returning();
    return faculty;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const [updatedFaculty] = await db
      .update(faculties)
      .set(facultyData)
      .where(eq(faculties.id, id))
      .returning();
    return updatedFaculty;
  }

  async deleteFaculty(id: number): Promise<boolean> {
    const result = await db.delete(faculties).where(eq(faculties.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.facultyId, facultyId));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values([groupData]).returning();
    return group;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(groups)
      .set(groupData)
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const result = await db.delete(groups).where(eq(groups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Test operations
  async getTestsByUser(userId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.userId, userId));
  }

  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async createTest(testData: InsertTest): Promise<Test> {
    const [test] = await db.insert(tests).values([testData]).returning();
    return test;
  }

  async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    const [updatedTest] = await db
      .update(tests)
      .set(testData)
      .where(eq(tests.id, id))
      .returning();
    return updatedTest;
  }

  async deleteTest(id: number): Promise<boolean> {
    const result = await db.delete(tests).where(eq(tests.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sample operations
  async getSamplesByUser(userId: number): Promise<Sample[]> {
    return await db.select().from(samples).where(eq(samples.userId, userId));
  }

  async getSample(id: number): Promise<Sample | undefined> {
    const [sample] = await db.select().from(samples).where(eq(samples.id, id));
    return sample;
  }

  async createSample(sampleData: InsertSample): Promise<Sample> {
    const [sample] = await db.insert(samples).values([sampleData]).returning();
    return sample;
  }

  async updateSample(id: number, sampleData: Partial<Sample>): Promise<Sample | undefined> {
    const [updatedSample] = await db
      .update(samples)
      .set(sampleData)
      .where(eq(samples.id, id))
      .returning();
    return updatedSample;
  }

  async deleteSample(id: number): Promise<boolean> {
    const result = await db.delete(samples).where(eq(samples.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

// Use database storage
export const storage = new DatabaseStorage();
