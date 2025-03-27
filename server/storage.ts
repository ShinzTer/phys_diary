import { 
  users, type User, type InsertUser,
  faculties, type Faculty, type InsertFaculty,
  groups, type Group, type InsertGroup,
  tests, type Test, type InsertTest,
  samples, type Sample, type InsertSample
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

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
  sessionStore: session.SessionStore;
}

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private faculties: Map<number, Faculty>;
  private groups: Map<number, Group>;
  private tests: Map<number, Test>;
  private samples: Map<number, Sample>;
  
  private userIdCounter: number;
  private facultyIdCounter: number;
  private groupIdCounter: number;
  private testIdCounter: number;
  private sampleIdCounter: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.faculties = new Map();
    this.groups = new Map();
    this.tests = new Map();
    this.samples = new Map();
    
    this.userIdCounter = 1;
    this.facultyIdCounter = 1;
    this.groupIdCounter = 1;
    this.testIdCounter = 1;
    this.sampleIdCounter = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In production, this would be hashed
      role: "admin",
      fullName: "System Administrator"
    });
    
    // Initialize with a teacher
    this.createUser({
      username: "teacher",
      password: "teacher123", // In production, this would be hashed
      role: "teacher",
      fullName: "John Smith"
    });
    
    // Initialize with a student
    this.createUser({
      username: "student",
      password: "student123", // In production, this would be hashed
      role: "student",
      fullName: "Alex Johnson"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }
  
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }
  
  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const id = this.facultyIdCounter++;
    const faculty: Faculty = { ...facultyData, id };
    this.faculties.set(id, faculty);
    return faculty;
  }
  
  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const faculty = this.faculties.get(id);
    if (!faculty) return undefined;
    
    const updatedFaculty = { ...faculty, ...facultyData };
    this.faculties.set(id, updatedFaculty);
    return updatedFaculty;
  }
  
  async deleteFaculty(id: number): Promise<boolean> {
    return this.faculties.delete(id);
  }
  
  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }
  
  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(group => group.facultyId === facultyId);
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }
  
  async createGroup(groupData: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const group: Group = { ...groupData, id };
    this.groups.set(id, group);
    return group;
  }
  
  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const group = this.groups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...groupData };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    return this.groups.delete(id);
  }
  
  // Test operations
  async getTestsByUser(userId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => test.userId === userId);
  }
  
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async createTest(testData: InsertTest): Promise<Test> {
    const id = this.testIdCounter++;
    const date = new Date();
    const test: Test = { ...testData, id, date };
    this.tests.set(id, test);
    return test;
  }
  
  async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...testData };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    return this.tests.delete(id);
  }
  
  // Sample operations
  async getSamplesByUser(userId: number): Promise<Sample[]> {
    return Array.from(this.samples.values()).filter(sample => sample.userId === userId);
  }
  
  async getSample(id: number): Promise<Sample | undefined> {
    return this.samples.get(id);
  }
  
  async createSample(sampleData: InsertSample): Promise<Sample> {
    const id = this.sampleIdCounter++;
    const date = new Date();
    const sample: Sample = { ...sampleData, id, date };
    this.samples.set(id, sample);
    return sample;
  }
  
  async updateSample(id: number, sampleData: Partial<Sample>): Promise<Sample | undefined> {
    const sample = this.samples.get(id);
    if (!sample) return undefined;
    
    const updatedSample = { ...sample, ...sampleData };
    this.samples.set(id, updatedSample);
    return updatedSample;
  }
  
  async deleteSample(id: number): Promise<boolean> {
    return this.samples.delete(id);
  }
}

export const storage = new MemStorage();
