import { 
  type User, type InsertUser,
  type Faculty, type InsertFaculty,
  type Group, type InsertGroup,
  type Test, type InsertTest,
  type Sample, type InsertSample
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
  sessionStore: any;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: User[] = [];
  private faculties: Faculty[] = [];
  private groups: Group[] = [];
  private tests: Test[] = [];
  private samples: Sample[] = [];
  private nextId = {
    users: 1,
    faculties: 1,
    groups: 1,
    tests: 1,
    samples: 1
  };
  sessionStore: any;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Seed default users
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create admin user if it doesn't exist
    const adminExists = this.users.find(u => u.username === 'admin');
    if (!adminExists) {
      this.createUser({
        username: 'admin',
        password: 'admin123', // This would be hashed in a real app
        role: 'admin',
        fullName: 'System Administrator',
      });
    }

    // Create teacher user if it doesn't exist
    const teacherExists = this.users.find(u => u.username === 'teacher');
    if (!teacherExists) {
      this.createUser({
        username: 'teacher',
        password: 'teacher123',
        role: 'teacher',
        fullName: 'John Smith',
      });
    }

    // Create student user if it doesn't exist
    const studentExists = this.users.find(u => u.username === 'student');
    if (!studentExists) {
      this.createUser({
        username: 'student',
        password: 'student123',
        role: 'student',
        fullName: 'Alex Johnson',
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId.users++,
      ...userData as any,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
    };
    
    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    return this.users.length !== initialLength;
  }

  // Faculty operations
  async getAllFaculties(): Promise<Faculty[]> {
    return this.faculties;
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.find(f => f.id === id);
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const faculty: Faculty = {
      id: this.nextId.faculties++,
      ...facultyData as any,
      createdAt: new Date(),
    };
    this.faculties.push(faculty);
    return faculty;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const facultyIndex = this.faculties.findIndex(f => f.id === id);
    if (facultyIndex === -1) return undefined;
    
    this.faculties[facultyIndex] = {
      ...this.faculties[facultyIndex],
      ...facultyData,
    };
    
    return this.faculties[facultyIndex];
  }

  async deleteFaculty(id: number): Promise<boolean> {
    const initialLength = this.faculties.length;
    this.faculties = this.faculties.filter(f => f.id !== id);
    return this.faculties.length !== initialLength;
  }

  // Group operations
  async getAllGroups(): Promise<Group[]> {
    return this.groups;
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return this.groups.filter(g => g.facultyId === facultyId);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.find(g => g.id === id);
  }

  async createGroup(groupData: InsertGroup): Promise<Group> {
    const group: Group = {
      id: this.nextId.groups++,
      ...groupData as any,
      createdAt: new Date(),
    };
    this.groups.push(group);
    return group;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const groupIndex = this.groups.findIndex(g => g.id === id);
    if (groupIndex === -1) return undefined;
    
    this.groups[groupIndex] = {
      ...this.groups[groupIndex],
      ...groupData,
    };
    
    return this.groups[groupIndex];
  }

  async deleteGroup(id: number): Promise<boolean> {
    const initialLength = this.groups.length;
    this.groups = this.groups.filter(g => g.id !== id);
    return this.groups.length !== initialLength;
  }

  // Test operations
  async getTestsByUser(userId: number): Promise<Test[]> {
    return this.tests.filter(t => t.userId === userId);
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.find(t => t.id === id);
  }

  async createTest(testData: InsertTest): Promise<Test> {
    const test: Test = {
      id: this.nextId.tests++,
      ...testData as any,
      createdAt: new Date(),
    };
    this.tests.push(test);
    return test;
  }

  async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    const testIndex = this.tests.findIndex(t => t.id === id);
    if (testIndex === -1) return undefined;
    
    this.tests[testIndex] = {
      ...this.tests[testIndex],
      ...testData,
    };
    
    return this.tests[testIndex];
  }

  async deleteTest(id: number): Promise<boolean> {
    const initialLength = this.tests.length;
    this.tests = this.tests.filter(t => t.id !== id);
    return this.tests.length !== initialLength;
  }

  // Sample operations
  async getSamplesByUser(userId: number): Promise<Sample[]> {
    return this.samples.filter(s => s.userId === userId);
  }

  async getSample(id: number): Promise<Sample | undefined> {
    return this.samples.find(s => s.id === id);
  }

  async createSample(sampleData: InsertSample): Promise<Sample> {
    const sample: Sample = {
      id: this.nextId.samples++,
      ...sampleData as any,
      createdAt: new Date(),
    };
    this.samples.push(sample);
    return sample;
  }

  async updateSample(id: number, sampleData: Partial<Sample>): Promise<Sample | undefined> {
    const sampleIndex = this.samples.findIndex(s => s.id === id);
    if (sampleIndex === -1) return undefined;
    
    this.samples[sampleIndex] = {
      ...this.samples[sampleIndex],
      ...sampleData,
    };
    
    return this.samples[sampleIndex];
  }

  async deleteSample(id: number): Promise<boolean> {
    const initialLength = this.samples.length;
    this.samples = this.samples.filter(s => s.id !== id);
    return this.samples.length !== initialLength;
  }
}

// Use memory storage for development
export const storage = new MemStorage();
