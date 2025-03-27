import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, insertFacultySchema, insertGroupSchema,
  insertTestResultSchema, insertSampleResultSchema, insertControlExerciseResultSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Admin routes
  // Users management
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user?.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Admin can access any user, teachers can access students, users can access themselves
      const userId = parseInt(req.params.id);
      if (
        req.user?.id !== userId && 
        req.user?.role !== "admin" && 
        !(req.user?.role === "teacher" && (await storage.getUser(userId))?.role === "student")
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      // Users can update their own profiles, admins can update any user
      if (req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the current user to check if exists
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow changing role unless admin
      if (req.body.role && req.body.role !== currentUser.role && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Cannot change role" });
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Faculty management
  app.get("/api/faculties", async (req, res, next) => {
    try {
      const faculties = await storage.getAllFaculties();
      res.json(faculties);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/faculties", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(facultyData);
      res.status(201).json(faculty);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/faculties/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const facultyId = parseInt(req.params.id);
      const updatedFaculty = await storage.updateFaculty(facultyId, req.body);
      
      if (!updatedFaculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json(updatedFaculty);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/faculties/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const facultyId = parseInt(req.params.id);
      const deleted = await storage.deleteFaculty(facultyId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Group management
  app.get("/api/groups", async (req, res, next) => {
    try {
      const facultyId = req.query.facultyId ? parseInt(req.query.facultyId as string) : undefined;
      
      const groups = facultyId 
        ? await storage.getGroupsByFaculty(facultyId)
        : await storage.getAllGroups();
        
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/groups", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const groupData = insertGroupSchema.parse(req.body);
      
      // Check if faculty exists
      const faculty = await storage.getFaculty(groupData.facultyId);
      if (!faculty) {
        return res.status(400).json({ message: "Faculty not found" });
      }
      
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/groups/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const groupId = parseInt(req.params.id);
      
      // If faculty is being changed, check if it exists
      if (req.body.facultyId) {
        const faculty = await storage.getFaculty(req.body.facultyId);
        if (!faculty) {
          return res.status(400).json({ message: "Faculty not found" });
        }
      }
      
      const updatedGroup = await storage.updateGroup(groupId, req.body);
      
      if (!updatedGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(updatedGroup);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/groups/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const groupId = parseInt(req.params.id);
      const deleted = await storage.deleteGroup(groupId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Tests, Samples, and Control Exercises
  app.get("/api/tests", async (req, res, next) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/samples", async (req, res, next) => {
    try {
      const samples = await storage.getAllSamples();
      res.json(samples);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/control-exercises", async (req, res, next) => {
    try {
      const exercises = await storage.getAllControlExercises();
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });
  
  // Test Results
  app.get("/api/test-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const testId = req.query.testId ? parseInt(req.query.testId as string) : undefined;
      
      // Validate access permissions
      if (userId && userId !== req.user?.id && req.user?.role === "student") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      let results;
      if (userId) {
        results = await storage.getTestResultsByUser(userId);
      } else if (testId) {
        // Only teachers and admins can see all results for a test
        if (req.user?.role === "student") {
          return res.status(403).json({ message: "Access denied" });
        }
        results = await storage.getTestResultsByTest(testId);
      } else {
        // If no filters, only admins and teachers can see all results
        if (req.user?.role === "student") {
          results = await storage.getTestResultsByUser(req.user.id);
        } else {
          return res.status(400).json({ message: "Must provide userId or testId filter" });
        }
      }
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/test-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Parse and validate the data
      const resultData = insertTestResultSchema.parse(req.body);
      
      // Students can only add their own results
      // Teachers can assess any student's results
      if (
        req.user?.role === "student" && 
        (resultData.userId !== req.user?.id || resultData.assessedBy)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If a teacher is assessing, set the assessedBy field
      if (req.user?.role === "teacher" && !resultData.assessedBy) {
        resultData.assessedBy = req.user.id;
      }
      
      // Create the test result
      const result = await storage.createTestResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Sample Results
  app.get("/api/sample-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const sampleId = req.query.sampleId ? parseInt(req.query.sampleId as string) : undefined;
      
      // Validate access permissions
      if (userId && userId !== req.user?.id && req.user?.role === "student") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      let results;
      if (userId) {
        results = await storage.getSampleResultsByUser(userId);
      } else if (sampleId) {
        // Only teachers and admins can see all results for a sample
        if (req.user?.role === "student") {
          return res.status(403).json({ message: "Access denied" });
        }
        results = await storage.getSampleResultsByTest(sampleId);
      } else {
        // If no filters, only admins and teachers can see all results
        if (req.user?.role === "student") {
          results = await storage.getSampleResultsByUser(req.user.id);
        } else {
          return res.status(400).json({ message: "Must provide userId or sampleId filter" });
        }
      }
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/sample-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Parse and validate the data
      const resultData = insertSampleResultSchema.parse(req.body);
      
      // Students can only add their own results
      // Teachers can assess any student's results
      if (
        req.user?.role === "student" && 
        (resultData.userId !== req.user?.id || resultData.assessedBy)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If a teacher is assessing, set the assessedBy field
      if (req.user?.role === "teacher" && !resultData.assessedBy) {
        resultData.assessedBy = req.user.id;
      }
      
      // Create the sample result
      const result = await storage.createSampleResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Control Exercise Results
  app.get("/api/control-exercise-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const exerciseId = req.query.exerciseId ? parseInt(req.query.exerciseId as string) : undefined;
      
      // Validate access permissions
      if (userId && userId !== req.user?.id && req.user?.role === "student") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      let results;
      if (userId) {
        results = await storage.getControlExerciseResultsByUser(userId);
      } else if (exerciseId) {
        // Only teachers and admins can see all results for an exercise
        if (req.user?.role === "student") {
          return res.status(403).json({ message: "Access denied" });
        }
        results = await storage.getControlExerciseResultsByExercise(exerciseId);
      } else {
        // If no filters, only admins and teachers can see all results
        if (req.user?.role === "student") {
          results = await storage.getControlExerciseResultsByUser(req.user.id);
        } else {
          return res.status(400).json({ message: "Must provide userId or exerciseId filter" });
        }
      }
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/control-exercise-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Parse and validate the data
      const resultData = insertControlExerciseResultSchema.parse(req.body);
      
      // Students can only add their own results
      // Teachers can assess any student's results
      if (
        req.user?.role === "student" && 
        (resultData.userId !== req.user?.id || resultData.assessedBy)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If a teacher is assessing, set the assessedBy field
      if (req.user?.role === "teacher" && !resultData.assessedBy) {
        resultData.assessedBy = req.user.id;
      }
      
      // Create the control exercise result
      const result = await storage.createControlExerciseResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all teachers for students
  app.get("/api/teachers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const teachers = await storage.getUsersByRole("teacher");
      
      // Remove sensitive data
      const teachersPublicInfo = teachers.map(teacher => {
        const { password, ...teacherWithoutPassword } = teacher;
        return teacherWithoutPassword;
      });
      
      res.json(teachersPublicInfo);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all students for teachers
  app.get("/api/students", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user?.role !== "admin" && req.user?.role !== "teacher")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const facultyId = req.query.facultyId ? parseInt(req.query.facultyId as string) : undefined;
      const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : undefined;
      
      let students;
      if (facultyId) {
        students = await storage.getUsersByFaculty(facultyId);
        students = students.filter(user => user.role === "student");
      } else if (groupId) {
        students = await storage.getUsersByGroup(groupId);
        students = students.filter(user => user.role === "student");
      } else {
        students = await storage.getUsersByRole("student");
      }
      
      // Remove sensitive data
      const studentsPublicInfo = students.map(student => {
        const { password, ...studentWithoutPassword } = student;
        return studentWithoutPassword;
      });
      
      res.json(studentsPublicInfo);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
