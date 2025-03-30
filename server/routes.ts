import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertFacultySchema, 
  insertGroupSchema, 
  insertTeacherSchema, 
  insertStudentSchema,
  insertPeriodSchema,
  insertPhysicalStateSchema,
  insertPhysicalTestsSchema,
  insertSportResultsSchema,
  insertResultSchema,
  insertUserSchema,
  UserRole
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication endpoints (/api/register, /api/login, /api/logout, /api/user)
  await setupAuth(app);

  // User management endpoints (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const role = req.query.role ? req.query.role as UserRole : undefined;
      const users = role ? await storage.getUsersByRole(role) : [];
      // Remove password field from each user
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only admins or the user themselves can update a user
      const id = parseInt(req.params.id);
      if (req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only admins can delete users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Faculty management endpoints
  app.get("/api/faculties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const faculties = await storage.getAllFaculties();
      res.json(faculties);
    } catch (error) {
      res.status(500).json({ message: "Error fetching faculties" });
    }
  });

  app.post("/api/faculties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(facultyData);
      res.status(201).json(faculty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid faculty data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating faculty" });
    }
  });

  app.put("/api/faculties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const facultyData = req.body;
      const updatedFaculty = await storage.updateFaculty(id, facultyData);
      if (!updatedFaculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(updatedFaculty);
    } catch (error) {
      res.status(500).json({ message: "Error updating faculty" });
    }
  });

  app.delete("/api/faculties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteFaculty(id);
      if (!success) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting faculty" });
    }
  });

  // Group management endpoints
  app.get("/api/groups", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const facultyId = req.query.facultyId ? parseInt(req.query.facultyId as string) : undefined;
      const groups = facultyId 
        ? await storage.getGroupsByFaculty(facultyId)
        : await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating group" });
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const groupData = req.body;
      const updatedGroup = await storage.updateGroup(id, groupData);
      if (!updatedGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ message: "Error updating group" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteGroup(id);
      if (!success) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting group" });
    }
  });

  // Profile endpoints
  app.get("/api/profile/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If not an admin or teacher, only allow access to own profile
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { password, ...profile } = user;
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile" });
    }
  });

  app.put("/api/profile/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      // Only allow users to update their own profile unless they're an admin
      if (req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Since we don't have userProfileSchema anymore, we'll validate the data manually
      const profileData = req.body;
      const updatedUser = await storage.updateUser(id, profileData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...updatedProfile } = updatedUser;
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Visual settings endpoint
  app.put("/api/settings/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      // Only allow users to update their own settings
      if (req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const visualSettings = req.body.visualSettings;
      const updatedUser = await storage.updateUser(id, { visualSettings });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ visualSettings: updatedUser.visualSettings });
    } catch (error) {
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Physical tests management endpoints
  app.get("/api/physical-tests/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // If not an admin or teacher, only allow access to own tests
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.student_id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tests = await storage.getPhysicalTestsByStudent(studentId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching physical tests" });
    }
  });

  app.post("/api/physical-tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const testData = insertPhysicalTestsSchema.parse(req.body);
      
      // If student, can only create tests for themselves
      if (req.user?.role === "student" && testData.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const test = await storage.createPhysicalTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid physical test data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating physical test" });
    }
  });

  app.put("/api/physical-tests/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const testData = req.body;
      
      const existingTest = await storage.getPhysicalTest(id);
      if (!existingTest) {
        return res.status(404).json({ message: "Physical test not found" });
      }
      
      // Students can only update their own tests
      if (req.user?.role === "student" && existingTest.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTest = await storage.updatePhysicalTest(id, testData);
      res.json(updatedTest);
    } catch (error) {
      res.status(500).json({ message: "Error updating physical test" });
    }
  });

  // Physical state management endpoints
  app.get("/api/physical-states/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // If not an admin or teacher, only allow access to own physical states
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.student_id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const states = await storage.getPhysicalStatesByStudent(studentId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Error fetching physical states" });
    }
  });

  app.post("/api/physical-states", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const stateData = insertPhysicalStateSchema.parse(req.body);
      
      // If student, can only create physical states for themselves
      if (req.user?.role === "student" && stateData.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const state = await storage.createPhysicalState(stateData);
      res.status(201).json(state);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid physical state data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating physical state" });
    }
  });

  app.put("/api/physical-states/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const stateData = req.body;
      
      const existingState = await storage.getPhysicalState(id);
      if (!existingState) {
        return res.status(404).json({ message: "Physical state not found" });
      }
      
      // Students can only update their own physical states
      if (req.user?.role === "student" && existingState.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedState = await storage.updatePhysicalState(id, stateData);
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ message: "Error updating physical state" });
    }
  });
  
  // Sport results management endpoints
  app.get("/api/sport-results/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // If not an admin or teacher, only allow access to own sport results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.student_id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await storage.getSportResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sport results" });
    }
  });

  app.post("/api/sport-results", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const resultData = insertSportResultsSchema.parse(req.body);
      
      // If student, can only create sport results for themselves
      if (req.user?.role === "student" && resultData.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = await storage.createSportResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sport result data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating sport result" });
    }
  });

  app.put("/api/sport-results/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const resultData = req.body;
      
      const existingResult = await storage.getSportResult(id);
      if (!existingResult) {
        return res.status(404).json({ message: "Sport result not found" });
      }
      
      // Students can only update their own sport results
      if (req.user?.role === "student" && existingResult.student_id !== req.user.student_id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedResult = await storage.updateSportResult(id, resultData);
      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ message: "Error updating sport result" });
    }
  });

  // Period management endpoints
  app.get("/api/periods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const periods = await storage.getAllPeriods();
      res.json(periods);
    } catch (error) {
      res.status(500).json({ message: "Error fetching periods" });
    }
  });
  
  app.post("/api/periods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const periodData = insertPeriodSchema.parse(req.body);
      const period = await storage.createPeriod(periodData);
      res.status(201).json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid period data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating period" });
    }
  });
  
  app.put("/api/periods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const id = parseInt(req.params.id);
      const periodData = req.body;
      
      const updatedPeriod = await storage.updatePeriod(id, periodData);
      if (!updatedPeriod) {
        return res.status(404).json({ message: "Period not found" });
      }
      
      res.json(updatedPeriod);
    } catch (error) {
      res.status(500).json({ message: "Error updating period" });
    }
  });
  
  app.delete("/api/periods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deletePeriod(id);
      
      if (!success) {
        return res.status(404).json({ message: "Period not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting period" });
    }
  });
  
  // Result management endpoints
  app.get("/api/results/student/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // If not an admin or teacher, only allow access to own results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.student_id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await storage.getResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching results" });
    }
  });
  
  app.get("/api/results/group/:groupId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const groupId = parseInt(req.params.groupId);
      const results = await storage.getResultsByGroup(groupId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching results by group" });
    }
  });
  
  app.get("/api/results/period/:periodId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const periodId = parseInt(req.params.periodId);
      const results = await storage.getResultsByPeriod(periodId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching results by period" });
    }
  });
  
  app.post("/api/results", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only admins and teachers can create results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const resultData = insertResultSchema.parse(req.body);
      const result = await storage.createResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid result data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating result" });
    }
  });
  
  app.put("/api/results/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only admins and teachers can update results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const id = parseInt(req.params.id);
      const resultData = req.body;
      
      const updatedResult = await storage.updateResult(id, resultData);
      if (!updatedResult) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ message: "Error updating result" });
    }
  });
  
  app.delete("/api/results/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only admins can delete results
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteResult(id);
      
      if (!success) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting result" });
    }
  });
  
  // Teacher management endpoints
  app.get("/api/teachers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teachers" });
    }
  });
  
  app.post("/api/teachers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teacher data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating teacher" });
    }
  });
  
  app.put("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or the teacher themselves
      if (req.user?.role !== "admin" && req.user?.teacher_id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const teacherData = req.body;
      
      const updatedTeacher = await storage.updateTeacher(id, teacherData);
      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.json(updatedTeacher);
    } catch (error) {
      res.status(500).json({ message: "Error updating teacher" });
    }
  });
  
  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeacher(id);
      
      if (!success) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting teacher" });
    }
  });
  
  // Student management endpoints
  app.get("/api/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
      }
      
      const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
      
      const students = groupId
        ? await storage.getStudentsByGroup(groupId)
        : await storage.getAllStudents();
        
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Error fetching students" });
    }
  });
  
  app.post("/api/students", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student" });
    }
  });
  
  app.put("/api/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin, teacher, or the student themselves
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.student_id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const studentData = req.body;
      
      const updatedStudent = await storage.updateStudent(id, studentData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Error updating student" });
    }
  });
  
  app.delete("/api/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}