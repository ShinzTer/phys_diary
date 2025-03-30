import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserRole = "admin" | "teacher" | "student";

// Faculty table (matches ER diagram)
export const faculty = pgTable("faculty", {
  faculty_id: serial("faculty_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

// Group table (matches ER diagram)
export const group = pgTable("group", {
  group_id: serial("group_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  teacher_id: integer("teacher_id").notNull(), // Foreign key to teacher
});

// Teacher table (matches ER diagram)
export const teacher = pgTable("teacher", {
  teacher_id: serial("teacher_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  phone: integer("phone"),
});

// Student table (matches ER diagram)
export const student = pgTable("student", {
  student_id: serial("student_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: varchar("gender", { length: 10 }),
  birth_date: date("birth_date"),
  group_id: integer("group_id").notNull(), // Foreign key to group
  medical_group: varchar("medical_group", { length: 50 }),
});

// Period table (matches ER diagram)
export const period = pgTable("period", {
  period_id: serial("period_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

// Physical state table (matches ER diagram)
export const physical_state = pgTable("physical_state", {
  state_id: serial("state_id").primaryKey(),
  student_id: integer("student_id").notNull(), // Foreign key to student
  date: date("date").notNull(),
  height: integer("height"),
  weight: integer("weight"),
  ketle_index: numeric("ketle_index", { precision: 10, scale: 2 }),
  chest_circumference: numeric("chest_circumference", { precision: 10, scale: 2 }),
  waist_circumference: numeric("waist_circumference", { precision: 10, scale: 2 }),
  posture: varchar("posture", { length: 50 }),
  vital_capacity: integer("vital_capacity"),
  hand_strength: integer("hand_strength"),
  orthostatic_test: numeric("orthostatic_test", { precision: 10, scale: 2 }),
  shtange_test: integer("shtange_test"),
  martine_test: integer("martine_test"),
  heart_rate: integer("heart_rate"),
  blood_pressure: integer("blood_pressure"),
  pulse_pressure: integer("pulse_pressure"),
});

// Physical tests table (matches ER diagram)
export const physical_tests = pgTable("physical_tests", {
  test_id: serial("test_id").primaryKey(),
  student_id: integer("student_id").notNull(), // Foreign key to student
  date: date("date").notNull(),
  push_ups: integer("push_ups"),
  leg_hold: integer("leg_hold"),
  tapping_test: integer("tapping_test"),
  running_in_place: integer("running_in_place"),
  half_squat: integer("half_squat"),
  pull_ups: integer("pull_ups"),
  plank: integer("plank"),
  forward_bend: integer("forward_bend"),
  long_jump: numeric("long_jump", { precision: 10, scale: 2 }),
});

// Sport results table (matches ER diagram)
export const sport_results = pgTable("sport_results", {
  sport_result_id: serial("sport_result_id").primaryKey(),
  student_id: integer("student_id").notNull(), // Foreign key to student
  basketball_freethrow: integer("basketball_freethrow"),
  basketball_dribble: integer("basketball_dribble"),
  volleyball_pass: integer("volleyball_pass"),
  volleyball_serve: integer("volleyball_serve"),
  swimming_25m: numeric("swimming_25m", { precision: 10, scale: 2 }),
  swimming_50m: numeric("swimming_50m", { precision: 10, scale: 2 }),
  swimming_100m: numeric("swimming_100m", { precision: 10, scale: 2 }),
  running_100m: numeric("running_100m", { precision: 10, scale: 2 }),
  running_500m_1000m: numeric("running_500m_1000m", { precision: 10, scale: 2 }),
});

// Result table (junction table that connects everything together)
export const result = pgTable("result", {
  result_id: serial("result_id").primaryKey(),
  student_id: integer("student_id").notNull(), // Foreign key to student
  group_id: integer("group_id").notNull(), // Foreign key to group
  period_id: integer("period_id").notNull(), // Foreign key to period
  test_id: integer("test_id"), // Foreign key to physical_tests
  state_id: integer("state_id"), // Foreign key to physical_state
  sport_result_id: integer("sport_result_id"), // Foreign key to sport_results
  final_grade: numeric("final_grade", { precision: 10, scale: 2 }),
});

// Users table (for authentication - not in ER diagram but needed for the application)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().notNull().default("student"),
  student_id: integer("student_id"), // References student table if role is student
  teacher_id: integer("teacher_id"), // References teacher table if role is teacher
  visualSettings: text("visual_settings").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertFacultySchema = createInsertSchema(faculty).omit({
  faculty_id: true,
});

export const insertGroupSchema = createInsertSchema(group).omit({
  group_id: true,
});

export const insertTeacherSchema = createInsertSchema(teacher).omit({
  teacher_id: true,
});

export const insertStudentSchema = createInsertSchema(student).omit({
  student_id: true,
});

export const insertPeriodSchema = createInsertSchema(period).omit({
  period_id: true,
});

export const insertPhysicalStateSchema = createInsertSchema(physical_state).omit({
  state_id: true,
});

export const insertPhysicalTestsSchema = createInsertSchema(physical_tests).omit({
  test_id: true,
});

export const insertSportResultsSchema = createInsertSchema(sport_results).omit({
  sport_result_id: true,
});

export const insertResultSchema = createInsertSchema(result).omit({
  result_id: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Export TypeScript types
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type Group = typeof group.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Teacher = typeof teacher.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Medical Group Types (kept for compatibility)
export const MEDICAL_GROUP_TYPES = [
  "basic",
  "preparatory", 
  "special"
] as const;

export type MedicalGroupType = typeof MEDICAL_GROUP_TYPES[number];

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

// User profile schema for forms
export const userProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  schoolGraduated: z.string().optional(),
  medicalGroup: z.enum(["basic", "preparatory", "special"]).optional(),
  medicalDiagnosis: z.string().optional(),
  previousIllnesses: z.string().optional(),
  educationalDepartment: z.string().optional(),
  activeSports: z.string().optional(),
  previousSports: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
