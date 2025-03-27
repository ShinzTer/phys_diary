import { pgTable, text, serial, integer, boolean, date, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User, Role, and Auth schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  // Profile information
  fullName: text("full_name"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  address: text("address"),
  nationality: text("nationality"),
  schoolGraduated: text("school_graduated"),
  facultyId: integer("faculty_id").references(() => faculties.id),
  groupId: integer("group_id").references(() => groups.id),
  medicalGroup: text("medical_group", { enum: ["basic", "preparatory", "special"] }),
  medicalDiagnosis: text("medical_diagnosis"),
  previousIllnesses: text("previous_illnesses"),
  educationalDepartment: text("educational_department"),
  activeSports: text("active_sports"),
  previousSports: text("previous_sports"),
  additionalInfo: text("additional_info"),
  visualSettings: json("visual_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Faculty schema
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertFacultySchema = createInsertSchema(faculties).omit({
  id: true
});

export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof faculties.$inferSelect;

// Group schema
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  facultyId: integer("faculty_id").references(() => faculties.id).notNull(),
  year: integer("year"),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Test schema
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true
});

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

// Sample schema (physical measurements)
export const samples = pgTable("samples", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
});

export const insertSampleSchema = createInsertSchema(samples).omit({
  id: true
});

export type InsertSample = z.infer<typeof insertSampleSchema>;
export type Sample = typeof samples.$inferSelect;

// Control Exercise schema
export const controlExercises = pgTable("control_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
});

export const insertControlExerciseSchema = createInsertSchema(controlExercises).omit({
  id: true
});

export type InsertControlExercise = z.infer<typeof insertControlExerciseSchema>;
export type ControlExercise = typeof controlExercises.$inferSelect;

// Test Results schema
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  testId: integer("test_id").references(() => tests.id).notNull(),
  value: text("value").notNull(),
  assessment: text("assessment", { enum: ["excellent", "good", "satisfactory", "poor"] }),
  comments: text("comments"),
  assessedBy: integer("assessed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow(),
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  assessedAt: true
});

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

// Sample Results schema
export const sampleResults = pgTable("sample_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sampleId: integer("sample_id").references(() => samples.id).notNull(),
  value: text("value").notNull(),
  assessment: text("assessment", { enum: ["excellent", "good", "satisfactory", "poor"] }),
  comments: text("comments"),
  assessedBy: integer("assessed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow(),
});

export const insertSampleResultSchema = createInsertSchema(sampleResults).omit({
  id: true,
  assessedAt: true
});

export type InsertSampleResult = z.infer<typeof insertSampleResultSchema>;
export type SampleResult = typeof sampleResults.$inferSelect;

// Control Exercise Results schema
export const controlExerciseResults = pgTable("control_exercise_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => controlExercises.id).notNull(),
  value: text("value").notNull(),
  assessment: text("assessment", { enum: ["excellent", "good", "satisfactory", "poor"] }),
  comments: text("comments"),
  assessedBy: integer("assessed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow(),
});

export const insertControlExerciseResultSchema = createInsertSchema(controlExerciseResults).omit({
  id: true,
  assessedAt: true
});

export type InsertControlExerciseResult = z.infer<typeof insertControlExerciseResultSchema>;
export type ControlExerciseResult = typeof controlExerciseResults.$inferSelect;
