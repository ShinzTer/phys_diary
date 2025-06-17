import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserRole = "admin" | "teacher" | "student";

// Users table (for authentication only)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull().default("student"),
  visualSettings: text("visual_settings"),
});

// Faculty table
export const faculty = pgTable("faculty", {
  facultyId: serial("faculty_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

// Teacher table
export const teacher = pgTable("teacher", {
  teacherId: serial("teacher_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  position: text("position"),
  dateOfBirth: text("date_of_birth"),
  educationalDepartment: text("educational_department"),
  phone: text("phone"),
  nationality: text("nationality"),
});

// Group table
export const group = pgTable("group", {
  groupId: serial("group_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  teacherId: integer("teacher_id").notNull().references(() => teacher.teacherId),
  facultyId: integer("faculty_id").notNull().references(() => faculty.facultyId),
  dateOfCreation: date("date_of_creation").notNull().defaultNow(),
});

// Student table
export const student = pgTable("student", {
  studentId: serial("student_id").primaryKey(),
  userId: integer("user_id").unique().references(() => users.id),
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  placeOfBirth: text("place_of_birth"),
  groupId: integer("group_id").references(() => group.groupId).notNull(),
  medicalGroup: text("medical_group").notNull(),
  medicalDiagnosis: text("medical_diagnosis"),
  previousIllnesses: text("previous_illnesses"),
  activeSports: text("active_sports"),
  previousSports: text("previous_sports"),
  additionalInfo: text("additional_info"),
  phone: text("phone").notNull(),
  nationality: text("nationality"),
  address: text("address"),
  schoolGraduated: text("school_graduated"),
  educationalDepartment: text("educational_department"),
});

// Period table
export const period = pgTable("period", {
  periodId: serial("period_id").primaryKey(),
  periodOfStudy: text("period_of_study", { enum: ["first_course_beginning",  
    "semester_1",  "semester_2",  "second_course_beginning",  
    "semester_3",  "semester_4",  "third_course_beginning",  
    "semester_5",  "semester_6",  "fourth_course_beginning",  
    "semester_7",  "semester_8"] }).notNull(),
});

// Physical state table
export const physical_state = pgTable("physical_state", {
  stateId: serial("state_id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  height: integer("height"),
  weight: integer("weight"),
  ketleIndex: numeric("ketle_index", { precision: 10, scale: 2 }),
  chestCircumference: numeric("chest_circumference", { precision: 10, scale: 2 }),
  waistCircumference: numeric("waist_circumference", { precision: 10, scale: 2 }),
  posture: varchar("posture", { length: 50 }),
  vitalCapacity: integer("vital_capacity"),
  handStrength: integer("hand_strength"),
  orthostaticTest: numeric("orthostatic_test", { precision: 10, scale: 2 }),
  shtangeTest: integer("shtange_test"),
  martineTest: integer("martine_test"),
  heartRate: integer("heart_rate"),
  bloodPressure: integer("blood_pressure"),
  pulsePressure: integer("pulse_pressure"),
});

// Physical tests table
export const physical_tests = pgTable("physical_tests", {
  testId: serial("test_id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  periodId: integer("period_id").notNull().references(() => period.periodId),
  pushUps: integer("push_ups"),
  legHold: integer("leg_hold"),
  tappingTest: integer("tapping_test"),   
  runningInPlace: integer("running_in_place"),
  halfSquat: integer("half_squat"),
  pullUps: integer("pull_ups"),
  plank: integer("plank"),
  forwardBend: integer("forward_bend"),
  longJump: integer("long_jump"),
});

// Sport results table
export const sport_results = pgTable("sport_results", {
  sportResultId: serial("sport_result_id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  basketballFreethrow: integer("basketball_freethrow"),
  basketballDribble: integer("basketball_dribble"),
  volleyballPass: integer("volleyball_pass"),
  volleyballServe: integer("volleyball_serve"),
  swimming25m: numeric("swimming_25m", { precision: 10, scale: 2 }),
  swimming50m: numeric("swimming_50m", { precision: 10, scale: 2 }),
  swimming100m: numeric("swimming_100m", { precision: 10, scale: 2 }),
  running100m: numeric("running_100m", { precision: 10, scale: 2 }),
  running500m1000m: numeric("running_500m_1000m", { precision: 10, scale: 2 }),
  periodId: integer("period_id").notNull().references(() => period.periodId),
});

// Result table
export const result = pgTable("result", {
  resultId: serial("result_id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => student.studentId),
  groupId: integer("group_id").notNull().references(() => group.groupId),
  periodId: integer("period_id").notNull().references(() => period.periodId),
  testId: integer("test_id").references(() => physical_tests.testId),
  stateId: integer("state_id").references(() => physical_state.stateId),
  sportResultId: integer("sport_result_id").references(() => sport_results.sportResultId),
  finalGrade: numeric("final_grade", { precision: 10, scale: 2 }),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  visualSettings: true,
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  facultyId: true,
});

export const insertTeacherSchema = createInsertSchema(teacher).omit({
  teacherId: true,
});

export const insertGroupSchema = createInsertSchema(group).omit({
  groupId: true,
});

export const insertStudentSchema = createInsertSchema(student).omit({
  studentId: true,
});

export const insertPeriodSchema = createInsertSchema(period).omit({
  periodId: true,
});

export const insertPhysicalStateSchema = createInsertSchema(physical_state).omit({
  stateId: true,
});

export const insertPhysicalTestsSchema = createInsertSchema(physical_tests).omit({
  testId: true,
});

export const insertSportResultsSchema = createInsertSchema(sport_results).omit({
  sportResultId: true,
});

export const insertResultSchema = createInsertSchema(result).omit({
  resultId: true,
});

// Export types
export type User = {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  visualSettings?: string | null;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Teacher = typeof teacher.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Group = typeof group.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Student = typeof student.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Period = typeof period.$inferSelect;
export type InsertPeriod = z.infer<typeof insertPeriodSchema>;
export type PhysicalState = typeof physical_state.$inferSelect;
export type InsertPhysicalState = z.infer<typeof insertPhysicalStateSchema>;
export type PhysicalTest = typeof physical_tests.$inferSelect;
export type InsertPhysicalTest = z.infer<typeof insertPhysicalTestsSchema>;
export type SportResult = typeof sport_results.$inferSelect;
export type InsertSportResult = z.infer<typeof insertSportResultsSchema>;
export type Result = typeof result.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

// Medical Group Types (kept for compatibility)
export const MEDICAL_GROUP_TYPES = [
  "basic",
  "preparatory", 
  "special"
] as const;

export type MedicalGroupType = typeof MEDICAL_GROUP_TYPES[number];

//Periods of study
export const PERIODS_OF_STUDY = [
  "first_course_beginning",
  "semester_1",
  "semester_2",
  "second_course_beginning",
  "semester_3",
  "semester_4",
  "third_course_beginning",
  "semester_5",
  "semester_6",
  "fourth_course_beginning",
  "semester_7",
  "semester_8",
] as const;

// Physical Test types
export const TEST_TYPES = [
  "push_ups",
  "pull_ups",
  "tapping_test",
  "running_in_place",
  "half_squat",
  "plank",
  "forward_bend",
  "long_jump"
] as const;

// Physical Test types
export const TEST_TYPES_CAMEL = [
  "pushUps",
  "pullUps",
  "tappingTest",
  "runningInPlace",
  "halfSquat",
  "plank",
  "forwardBend",
  "longJump"
] as const;


// Control exercise types
export const CONTROL_EXERCISE_TYPES = [
  "basketball_freethrow",
  "basketball_dribble",
  "volleyball_pass",
  "volleyball_serve",
  "swimming_25m",
  "swimming_50m",
  "swimming_100m",
  "running_100m",
  "running_500m_1000m"
] as const;

export const CONTROL_EXERCISE_TYPES_CAMEL = [
  "basketballFreethrow",
  "basketballDribble",
  "volleyballPass",
  "volleyballServe",
  "swimming25m",
  "swimming50m",
  "swimming100m",
  "running100m",
  "running500m1000m"
] as const;

// Sample types (physical measurements)
export const SAMPLE_TYPES = [
  "height",
  "weight",
  "ketle_index",
  "chest_circumference",
  "waist_circumference",
  "posture",
  "vital_capacity",
  "hand_strength",
  "orthostatic_test",
  "shtange_test",
  "martine_test",
  "heart_rate",
  "blood_pressure",
  "pulse_pressure"
] as const;

// Base profile schema for common fields
export const baseProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().optional(),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format +375*********")
    .optional(),
  nationality: z.string().optional(),
  educationalDepartment: z.string().optional(),
});

// Teacher profile schema extends base schema
export const teacherProfileSchema = baseProfileSchema.extend({
  position: z.string().min(1, "Position is required"),
});

// Student profile schema extends base schema
export const studentProfileSchema = baseProfileSchema.extend({
  gender: z.enum(["male", "female", "other"]),
  placeOfBirth: z.string().optional(),
  address: z.string().min(2, "Address is required"),
  schoolGraduated: z.string().optional(),
  medicalGroup: z.enum(["basic", "preparatory", "special"]).optional(),
  medicalDiagnosis: z.string().optional(),
  previousIllnesses: z.string().optional(),
  activeSports: z.string().optional(),
  previousSports: z.string().optional(),
  additionalInfo: z.string().optional(),
});

// Generic user profile schema for the frontend
export const userProfileSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("teacher"),
    ...teacherProfileSchema.shape
  }),
  z.object({
    role: z.literal("student"),
    ...studentProfileSchema.shape
  }),
  z.object({
    role: z.literal("admin"),
    ...baseProfileSchema.shape
  })
]);

// Export types for frontend use
export type TeacherProfile = z.infer<typeof teacherProfileSchema>;
export type StudentProfile = z.infer<typeof studentProfileSchema>;
export type BaseProfile = z.infer<typeof baseProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
