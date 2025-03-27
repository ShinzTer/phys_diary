import { 
  User, InsertUser, Faculty, InsertFaculty, Group, InsertGroup,
  Test, InsertTest, Sample, InsertSample, ControlExercise, InsertControlExercise,
  TestResult, InsertTestResult, SampleResult, InsertSampleResult,
  ControlExerciseResult, InsertControlExerciseResult
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByFaculty(facultyId: number): Promise<User[]>;
  getUsersByGroup(groupId: number): Promise<User[]>;
  
  // Faculty operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, faculty: Partial<Faculty>): Promise<Faculty | undefined>;
  deleteFaculty(id: number): Promise<boolean>;
  getAllFaculties(): Promise<Faculty[]>;
  
  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  getAllGroups(): Promise<Group[]>;
  getGroupsByFaculty(facultyId: number): Promise<Group[]>;
  
  // Test operations
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  getAllTests(): Promise<Test[]>;
  
  // Sample operations
  getSample(id: number): Promise<Sample | undefined>;
  createSample(sample: InsertSample): Promise<Sample>;
  getAllSamples(): Promise<Sample[]>;
  
  // Control Exercise operations
  getControlExercise(id: number): Promise<ControlExercise | undefined>;
  createControlExercise(exercise: InsertControlExercise): Promise<ControlExercise>;
  getAllControlExercises(): Promise<ControlExercise[]>;
  
  // Test Results operations
  getTestResult(id: number): Promise<TestResult | undefined>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResultsByUser(userId: number): Promise<TestResult[]>;
  getTestResultsByTest(testId: number): Promise<TestResult[]>;
  
  // Sample Results operations
  getSampleResult(id: number): Promise<SampleResult | undefined>;
  createSampleResult(result: InsertSampleResult): Promise<SampleResult>;
  getSampleResultsByUser(userId: number): Promise<SampleResult[]>;
  getSampleResultsByTest(sampleId: number): Promise<SampleResult[]>;
  
  // Control Exercise Results operations
  getControlExerciseResult(id: number): Promise<ControlExerciseResult | undefined>;
  createControlExerciseResult(result: InsertControlExerciseResult): Promise<ControlExerciseResult>;
  getControlExerciseResultsByUser(userId: number): Promise<ControlExerciseResult[]>;
  getControlExerciseResultsByExercise(exerciseId: number): Promise<ControlExerciseResult[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private faculties: Map<number, Faculty>;
  private groups: Map<number, Group>;
  private tests: Map<number, Test>;
  private samples: Map<number, Sample>;
  private controlExercises: Map<number, ControlExercise>;
  private testResults: Map<number, TestResult>;
  private sampleResults: Map<number, SampleResult>;
  private controlExerciseResults: Map<number, ControlExerciseResult>;
  
  // IDs for auto-increment
  private userId: number;
  private facultyId: number;
  private groupId: number;
  private testId: number;
  private sampleId: number;
  private controlExerciseId: number;
  private testResultId: number;
  private sampleResultId: number;
  private controlExerciseResultId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.faculties = new Map();
    this.groups = new Map();
    this.tests = new Map();
    this.samples = new Map();
    this.controlExercises = new Map();
    this.testResults = new Map();
    this.sampleResults = new Map();
    this.controlExerciseResults = new Map();
    
    this.userId = 1;
    this.facultyId = 1;
    this.groupId = 1;
    this.testId = 1;
    this.sampleId = 1;
    this.controlExerciseId = 1;
    this.testResultId = 1;
    this.sampleResultId = 1;
    this.controlExerciseResultId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default data
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize default tests
    const defaultTests = [
      { name: "Push-ups (Arms flexion/extension)", description: "Flexion and extension of the arms in the prone position", unit: "reps", category: "Strength" },
      { name: "Abdominal Strength", description: "Lying on your back, keeping your feet off the floor", unit: "seconds", category: "Strength" },
      { name: "Tapping Test", description: "Hand tapping test for coordination", unit: "taps", category: "Coordination" },
      { name: "Running in place", description: "Running in place for 10 seconds", unit: "steps", category: "Endurance" },
      { name: "Semi-squat", description: "A semi-squat in static position", unit: "seconds", category: "Strength" },
      { name: "Pull-ups", description: "Pull-up on the crossbar", unit: "reps", category: "Strength" },
      { name: "Plank", description: "Core strength plank position", unit: "seconds", category: "Endurance" },
      { name: "Forward Bend", description: "Leaning forward from the initial sitting position", unit: "cm", category: "Flexibility" },
      { name: "Standing Long Jump", description: "Long jump from a standing position", unit: "cm", category: "Power" }
    ];
    
    defaultTests.forEach(test => {
      this.createTest(test);
    });
    
    // Initialize default samples
    const defaultSamples = [
      { name: "Body Length", description: "Height measurement", unit: "cm", category: "Anthropometry" },
      { name: "Body Weight", description: "Weight measurement", unit: "kg", category: "Anthropometry" },
      { name: "Quetelet Index", description: "Weight and height index", unit: "kg/m²", category: "Anthropometry" },
      { name: "Chest Circumference", description: "Chest measurement", unit: "cm", category: "Anthropometry" },
      { name: "Waist Circumference", description: "Waist measurement", unit: "cm", category: "Anthropometry" },
      { name: "Posture", description: "Posture assessment", unit: "score", category: "Functional" },
      { name: "Vital Lung Capacity", description: "Lung capacity measurement", unit: "ml", category: "Functional" },
      { name: "Hand Strength", description: "Hand dynamometer test", unit: "kg", category: "Strength" },
      { name: "Orthostatic Test", description: "Orthostatic measurement", unit: "bpm", category: "Functional" },
      { name: "Barbell Test", description: "Breath holding on inhale", unit: "seconds", category: "Functional" },
      { name: "Genchi Test", description: "Breath holding on exhale", unit: "seconds", category: "Functional" },
      { name: "Martinet-Kushelevsky Test", description: "Cardio recovery test", unit: "score", category: "Functional" },
      { name: "Heart Rate", description: "Resting heart rate", unit: "bpm", category: "Vital" },
      { name: "Blood Pressure", description: "Systolic and diastolic blood pressure", unit: "mmHg", category: "Vital" },
      { name: "Pulse Pressure", description: "Difference between systolic and diastolic pressure", unit: "mmHg", category: "Vital" }
    ];
    
    defaultSamples.forEach(sample => {
      this.createSample(sample);
    });
    
    // Initialize default control exercises
    const defaultExercises = [
      { name: "Basketball", description: "Basketball performance assessment", category: "Team Sport" },
      { name: "Volleyball", description: "Volleyball performance assessment", category: "Team Sport" },
      { name: "Swimming", description: "Swimming performance assessment", category: "Individual Sport" },
      { name: "Running", description: "Running performance assessment", category: "Track" }
    ];
    
    defaultExercises.forEach(exercise => {
      this.createControlExercise(exercise);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getUsersByFaculty(facultyId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.facultyId === facultyId);
  }

  async getUsersByGroup(groupId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.groupId === groupId);
  }

  // Faculty operations
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }

  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const id = this.facultyId++;
    const faculty: Faculty = { ...insertFaculty, id };
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

  async getAllFaculties(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }

  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupId++;
    const group: Group = { ...insertGroup, id };
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

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroupsByFaculty(facultyId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(group => group.facultyId === facultyId);
  }

  // Test operations
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.testId++;
    const test: Test = { ...insertTest, id };
    this.tests.set(id, test);
    return test;
  }

  async getAllTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }

  // Sample operations
  async getSample(id: number): Promise<Sample | undefined> {
    return this.samples.get(id);
  }

  async createSample(insertSample: InsertSample): Promise<Sample> {
    const id = this.sampleId++;
    const sample: Sample = { ...insertSample, id };
    this.samples.set(id, sample);
    return sample;
  }

  async getAllSamples(): Promise<Sample[]> {
    return Array.from(this.samples.values());
  }

  // Control Exercise operations
  async getControlExercise(id: number): Promise<ControlExercise | undefined> {
    return this.controlExercises.get(id);
  }

  async createControlExercise(insertExercise: InsertControlExercise): Promise<ControlExercise> {
    const id = this.controlExerciseId++;
    const exercise: ControlExercise = { ...insertExercise, id };
    this.controlExercises.set(id, exercise);
    return exercise;
  }

  async getAllControlExercises(): Promise<ControlExercise[]> {
    return Array.from(this.controlExercises.values());
  }

  // Test Results operations
  async getTestResult(id: number): Promise<TestResult | undefined> {
    return this.testResults.get(id);
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = this.testResultId++;
    const result: TestResult = { ...insertResult, id, assessedAt: new Date() };
    this.testResults.set(id, result);
    return result;
  }

  async getTestResultsByUser(userId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(result => result.userId === userId);
  }

  async getTestResultsByTest(testId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(result => result.testId === testId);
  }

  // Sample Results operations
  async getSampleResult(id: number): Promise<SampleResult | undefined> {
    return this.sampleResults.get(id);
  }

  async createSampleResult(insertResult: InsertSampleResult): Promise<SampleResult> {
    const id = this.sampleResultId++;
    const result: SampleResult = { ...insertResult, id, assessedAt: new Date() };
    this.sampleResults.set(id, result);
    return result;
  }

  async getSampleResultsByUser(userId: number): Promise<SampleResult[]> {
    return Array.from(this.sampleResults.values()).filter(result => result.userId === userId);
  }

  async getSampleResultsByTest(sampleId: number): Promise<SampleResult[]> {
    return Array.from(this.sampleResults.values()).filter(result => result.sampleId === sampleId);
  }

  // Control Exercise Results operations
  async getControlExerciseResult(id: number): Promise<ControlExerciseResult | undefined> {
    return this.controlExerciseResults.get(id);
  }

  async createControlExerciseResult(insertResult: InsertControlExerciseResult): Promise<ControlExerciseResult> {
    const id = this.controlExerciseResultId++;
    const result: ControlExerciseResult = { ...insertResult, id, assessedAt: new Date() };
    this.controlExerciseResults.set(id, result);
    return result;
  }

  async getControlExerciseResultsByUser(userId: number): Promise<ControlExerciseResult[]> {
    return Array.from(this.controlExerciseResults.values()).filter(result => result.userId === userId);
  }

  async getControlExerciseResultsByExercise(exerciseId: number): Promise<ControlExerciseResult[]> {
    return Array.from(this.controlExerciseResults.values()).filter(result => result.exerciseId === exerciseId);
  }
}

export const storage = new MemStorage();
