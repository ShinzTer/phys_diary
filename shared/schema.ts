import { pgTable, text, serial, integer, boolean, timestamp, date, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserRole = "admin" | "teacher" | "student";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().notNull().default("student"),
  fullName: text("full_name").notNull(),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  address: text("address"),
  nationality: text("nationality"),
  previousSchool: text("previous_school"),
  facultyId: integer("faculty_id"),
  groupId: integer("group_id"),
  medicalGroup: text("medical_group").default("basic"),
  diagnosis: text("diagnosis"),
  previousIllnesses: text("previous_illnesses"),
  educationalDepartment: text("educational_department"),
  currentSports: text("current_sports"),
  previousSports: text("previous_sports"),
  additionalInfo: text("additional_info"),
  visualSettings: text("visual_settings").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
});

export const userProfileSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  role: true,
  username: true,
  createdAt: true,
});

// Faculties
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertFacultySchema = createInsertSchema(faculties).omit({
  id: true,
});

// Groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  facultyId: integer("faculty_id").notNull(),
  year: integer("year").notNull(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
});

// Tests
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testType: text("test_type").notNull(), // pushups, situps, tapping, etc.
  result: text("result").notNull(), // Store as text for flexibility, we'll parse on the client
  date: timestamp("date").defaultNow(),
  assessedBy: integer("assessed_by"), // Teacher ID
  grade: text("grade"), // A, B, C, etc. or numeric
  notes: text("notes"),
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  date: true,
});

// Samples (physical measurements)
export const samples = pgTable("samples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sampleType: text("sample_type").notNull(), // height, weight, lung capacity, etc.
  value: text("value").notNull(), // Store as text for flexibility, will parse on client
  date: timestamp("date").defaultNow(),
  recordedBy: integer("recorded_by"), // Teacher or student ID
  notes: text("notes"),
});

export const insertSampleSchema = createInsertSchema(samples).omit({
  id: true,
  date: true,
});

// Test Types Reference
export const TEST_TYPES = [
  "pushups",
  "abs",
  "tapping",
  "running_in_place",
  "semi_squat",
  "pullups",
  "plank",
  "forward_bend",
  "long_jump"
] as const;

// Sample Types Reference
export const SAMPLE_TYPES = [
  "body_length",
  "body_weight",
  "quetelet_index",
  "chest_circumference",
  "waist_circumference",
  "posture",
  "vital_lung_capacity",
  "hand_strength",
  "orthostatic_test",
  "barbell_test",
  "genchi_test",
  "martinet_kushelevsky_test",
  "heart_rate",
  "blood_pressure", 
  "pulse_pressure"
] as const;

// Control Exercise Types Reference
export const CONTROL_EXERCISE_TYPES = [
  "basketball",
  "volleyball",
  "swimming",
  "running"
] as const;

// Medical Group Types
export const MEDICAL_GROUP_TYPES = [
  "basic",
  "preparatory", 
  "special"
] as const;

// Types for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof faculties.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertSample = z.infer<typeof insertSampleSchema>;
export type Sample = typeof samples.$inferSelect;

export type TestType = typeof TEST_TYPES[number];
export type SampleType = typeof SAMPLE_TYPES[number];
export type ControlExerciseType = typeof CONTROL_EXERCISE_TYPES[number];
export type MedicalGroupType = typeof MEDICAL_GROUP_TYPES[number];
