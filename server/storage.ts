import { 
  users, type User, type InsertUser,
  faculties, type Faculty, type InsertFaculty,
  groups, type Group, type InsertGroup,
  tests, type Test, type InsertTest,
  samples, type Sample, type InsertSample
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
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
  sessionStore: any;
}

// PostgreSQL implementation of storage
export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed database with default users if they don't exist
    this.seedDatabase();
  }
  
  private async seedDatabase() {
    // Check if admin user exists
    const adminExists = await this.getUserByUsername("admin");
    if (!adminExists) {
      await this.createUser({
        username: "admin",
        password: "admin123", // In production, this would be hashed
        role: "admin",
        fullName: "System Administrator"
      });
    }
    
    // Check if teacher user exists
    const teacherExists = await this.getUserByUsername("teacher");
    if (!teacherExists) {
      await this.createUser({
        username: "teacher",
        password: "teacher123", // In production, this would be hashed
        role: "teacher",
        fullName: "John Smith"
      });
    }
    
    // Check if student user exists
    const studentExists = await this.getUserByUsername("student");
    if (!studentExists) {
      await this.createUser({
        username: "student",
        password: "student123", // In production, this would be hashed
        role: "student",
        fullName: "Alex Johnson"
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData as any).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(userData as any).where(eq(users.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
  
  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return await db.select().from(faculties);
  }
  
  async getFaculty(id: number): Promise<Faculty | undefined> {
    const result = await db.select().from(faculties).where(eq(faculties.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const result = await db.insert(faculties).values(facultyData as any).returning();
    return result[0];
  }
  
  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const result = await db.update(faculties).set(facultyData as any).where(eq(faculties.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteFaculty(id: number): Promise<boolean> {
    const result = await db.delete(faculties).where(eq(faculties.id, id)).returning();
    return result.length > 0;
  }
  
  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }
  
  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.facultyId, facultyId));
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createGroup(groupData: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(groupData as any).returning();
    return result[0];
  }
  
  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const result = await db.update(groups).set(groupData as any).where(eq(groups.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    const result = await db.delete(groups).where(eq(groups.id, id)).returning();
    return result.length > 0;
  }
  
  // Test operations
  async getTestsByUser(userId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.userId, userId));
  }
  
  async getTest(id: number): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createTest(testData: InsertTest): Promise<Test> {
    const result = await db.insert(tests).values(testData as any).returning();
    return result[0];
  }
  
  async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    const result = await db.update(tests).set(testData as any).where(eq(tests.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    const result = await db.delete(tests).where(eq(tests.id, id)).returning();
    return result.length > 0;
  }
  
  // Sample operations
  async getSamplesByUser(userId: number): Promise<Sample[]> {
    return await db.select().from(samples).where(eq(samples.userId, userId));
  }
  
  async getSample(id: number): Promise<Sample | undefined> {
    const result = await db.select().from(samples).where(eq(samples.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createSample(sampleData: InsertSample): Promise<Sample> {
    const result = await db.insert(samples).values(sampleData as any).returning();
    return result[0];
  }
  
  async updateSample(id: number, sampleData: Partial<Sample>): Promise<Sample | undefined> {
    const result = await db.update(samples).set(sampleData as any).where(eq(samples.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteSample(id: number): Promise<boolean> {
    const result = await db.delete(samples).where(eq(samples.id, id)).returning();
    return result.length > 0;
  }
}

// Use memory storage for development or database storage in production
export const storage = new DatabaseStorage();
