import express from "express";
import type { Request, Response, Express } from "express";
import { createServer } from "http";
import type { Server } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
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
  studentProfileSchema,
  teacherProfileSchema,
  UserRole,
  type User,
  type Student,
  type Teacher,
  type InsertStudent,
  type InsertUser
} from "../shared/schema.js";
import { z } from "zod";
import { parse } from "csv-parse";
import fileUpload from "express-fileupload";
import { eq } from "drizzle-orm";

// Remove the custom interface since we're using the built-in Express types
export async function registerRoutes(app: Express): Promise<Server> {
  // Add file upload middleware
  app.use(fileUpload());

  // Setup authentication endpoints (/api/register, /api/login, /api/logout, /api/user)
  await setupAuth(app);

  // Get user record with associated teacher/student ID
  app.get("/api/users/:id/record", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = parseInt(req.params.id);

      // Users can only access their own record unless they're an admin
      if (req.user?.role !== "admin" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the user record
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the associated teacher/student record
      let record = {};
      if (user.role === "teacher") {
        const teachers = await storage.getAllTeachers();
        const teacherRecord = teachers.find(t => t.userId === userId);
        if (teacherRecord) {
          record = { teacherId: teacherRecord.teacherId };
        }
      } else if (user.role === "student") {
        const students = await storage.getAllStudents();
        const studentRecord = students.find(s => s.userId === userId);
        if (studentRecord) {
          record = { studentId: studentRecord.studentId };
        }
      }

      res.json(record);
    } catch (error) {
      console.error("Error fetching user record:", error);
      res.status(500).json({ message: "Error fetching user record" });
    }
  });

  // User management endpoints (admin only)
  app.get("/api/users/manage", async (req, res) => {
    try {
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

    app.get("/api/student/users", async (req, res) => {
    try {
     
      const users = await storage.getUsersByRole('student');
    
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

  app.put("/api/users/manage/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/users/manage/:id", async (req, res) => {
    try {
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
      
      // Allow access if forRegistration query param is true
      const forRegistration = req.query.forRegistration === 'true';
   
      if (!forRegistration) {
      // Check if user is admin or teacher
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Admin or teacher role required." });
        }
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

      // Validate that the group exists
      const existingGroup = await storage.getGroup(id);
      if (!existingGroup) {
        return res.status(404).json({ message: "Group not found" });
      }

      // If teacher is being updated, validate that the new teacher exists
      if (groupData.teacherId) {
        const teacher = await storage.getTeacher(parseInt(groupData.teacherId));
        if (!teacher) {
          return res.status(400).json({ message: "Teacher not found" });
        }
      }

      // If faculty is being updated, validate that the new faculty exists
      if (groupData.facultyId) {
        const faculty = await storage.getFaculty(parseInt(groupData.facultyId));
        if (!faculty) {
          return res.status(400).json({ message: "Faculty not found" });
        }
      }

      const updatedGroup = await storage.updateGroup(id, {
        name: groupData.name,
        teacherId: groupData.teacherId ? parseInt(groupData.teacherId) : undefined,
        facultyId: groupData.facultyId ? parseInt(groupData.facultyId) : undefined,
      });

      if (!updatedGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ 
        message: "Error updating group",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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
  app.get("/api/profile/student/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // Get the student record to check permissions
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Only allow students to access their own profile unless they're an admin/teacher
      if (req.user?.role === "student" && req.user?.id !== student.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const profileData = await storage.getStudentProfile(studentId);
      const user = await storage.getUser(student.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ message: "Error fetching student profile" });
    }
  });

  app.get("/api/profile/studen/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.userId);
      
      // Get the student record to check permissions
      const student = await storage.getStudentByUserId(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Only allow students to access their own profile unless they're an admin/teacher
      if (req.user?.role === "student" && req.user?.id !== student.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const profileData = await storage.getStudentProfile(studentId);
      const user = await storage.getUser(student.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error fetching student profile by userID:", error);
      res.status(500).json({ message: "Error fetching student profile by userID" });
    }
  });

  app.get("/api/profile/teacher/:teacherId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const teacherId = parseInt(req.params.teacherId);
      
      // Get the teacher record to check permissions
      const teacher = await storage.getTeacherByUserId(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Only allow teachers to access their own profile unless they're an admin
      if (req.user?.role === "teacher" && req.user?.id !== teacher.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const profileData = await storage.getTeacherProfileByUserId(teacherId);
      const user = await storage.getUser(teacher.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      res.status(500).json({ message: "Error fetching teacher profile" });
    }
  });

  app.put("/api/profile/student/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.studentId);
      
      // Get the student record to check permissions
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Only allow students to update their own profile unless they're an admin/teacher
      if (req.user?.role === "student" && req.user?.id !== student.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const studentProfileData = studentProfileSchema.parse(req.body);
      const profileData = await storage.updateStudentProfile(studentId, studentProfileData);

      const user = await storage.getUser(student.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error updating student profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating student profile" });
    }
  });

  app.put("/api/profile/teacher/:teacherId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const teacherId = parseInt(req.params.teacherId);
      
      // Get the teacher record to check permissions
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Only allow teachers to update their own profile unless they're an admin
      if (req.user?.role === "teacher" && req.user?.id !== teacher.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const teacherProfileData = teacherProfileSchema.parse(req.body);
      const profileData = await storage.updateTeacherProfile(teacherId, teacherProfileData);

      const user = await storage.getUser(teacher.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        profile: profileData
      });
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating teacher profile" });
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
      console.log(req.user);
      const studentId = parseInt(req.params.studentId);
      
      const tests = await storage.getPhysicalTestsByStudent(studentId);
      
      // If no tests found, return empty array instead of null
      res.json(tests || []);
    } catch (error) {
      console.error('Error fetching physical tests:', error);
      res.status(500).json({ message: "Error fetching physical tests", error: String(error) });
    }
  });


   app.get("/api/physical-tests-id/:studentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log(req.user);
      const studentId = parseInt(req.params.studentId);
      
      const tests = await storage.getPhysicalTest(studentId);
      
      // If no tests found, return empty array instead of null
      res.json(tests || []);
    } catch (error) {
      console.error('Error fetching physical tests:', error);
      res.status(500).json({ message: "Error fetching physical tests", error: String(error) });
    }
  });

  app.post("/api/physical-tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log(req.body)
      console.log(insertPhysicalTestsSchema)
      const testData = insertPhysicalTestsSchema.parse(req.body);
      
      // If student, can only create tests for themselves
      if (req.user?.role === "student" && testData.studentId !== req.user.id) {
        console.log(testData)
        console.log(req.user.id)
        return res.status(403).json({ message: "Access denied" });
      }
      console.log(testData);
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
      if (req.user?.role === "student" && existingTest.studentId !== req.user.id) {
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
      
      const states = await storage.getPhysicalStatesByStudent(studentId);
      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Error fetching physical states" });
    }
  });

  app.get("/api/samples/all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const states = await storage.getPhysicalStates();
      
      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Error fetching physical states" });
    }
  });


    app.get("/api/tests/all/:teacherId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" ) {
        return res.status(403).json({ message: "Access denied" });
      }
      const teacherId = parseInt(req.params.teacherId);
      const states = req.user?.role !== "teacher" ? await storage.getPhysicalTests() : await storage.getPhysicalTestsByTeacher(teacherId) ;
  
      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Error fetching physical tests" });
    }
  });

  app.post("/api/physical-states", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const stateData = insertPhysicalStateSchema.parse(req.body);
      
      // If student, can only create physical states for themselves
      if (req.user?.role === "student" && stateData.studentId !== req.user.studentId) {
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
      if (req.user?.role === "student" && existingState.studentId !== req.user.studentId) {
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
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.studentId !== studentId) { //тут беда
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await storage.getSportResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sport results" });
    }
  });

    app.get("/api/sport-results-id/:testId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.testId);
      
      const results = await storage.getSportResult(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sport results" });
    }
  });


  app.get("/api/sport-results-teacher/:teacherId/period/:periodId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const teacherId = parseInt(req.params.teacherId);
      const periodId = parseInt(req.params.periodId);
      
      // If not an admin or teacher, only allow access to own sport results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" ) { //тут беда
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await storage.getSportResultsByPeriodAndTeacher(teacherId, periodId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sport results" });
    }
  });

   app.get("/api/sport-results-period/:periodId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const studentId = parseInt(req.params.periodId);
      
      // If not an admin or teacher, only allow access to own sport results
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" ) { //тут беда
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await storage.getSportResultsByPeriod(studentId);
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
      if (req.user?.role === "student" && resultData.studentId !== req.user.studentId) { //тут беда
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
      if (req.user?.role === "student" && existingResult.studentId !== req.user.studentId) { //тут беда
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
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.studentId !== studentId) { //тут беда
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
      if (req.user?.role !== "admin" && req.user?.teacherId !== parseInt(req.params.id)) { //тут беда
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
      
      const { username, password, firstName, lastName, patronymic, facultyId, groupId } = req.body;

      // First, create the student record
      const studentData = {
        name: [firstName, lastName, patronymic].filter(Boolean).join(" "),
        groupId: groupId,
      };

      const student = await storage.createStudent(studentData);

      if (!student) {
        return res.status(500).json({ message: "Failed to create student record" });
      }

      // Then create the user account linked to the student
      const userData = {
        username,
        password,
        role: "student" as const,
        studentId: student.studentId,
        fullName: studentData.name || undefined,
      };

      const user = await storage.createUser(userData);

      if (!user) {
        // Rollback student creation if user creation fails
        await storage.deleteStudent(student.studentId);
        return res.status(500).json({ message: "Failed to create user account" });
      }

      // Return the created user (without password) and student data
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        ...userWithoutPassword,
        student,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating student" });
    }
  });
  
  app.post("/api/students/bulk", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      const groupId = parseInt(req.body.groupId);

      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const results = [];
      const parser = parse({ columns: true, skip_empty_lines: true });

      for await (const record of parser) {
        try {
          // Create student
          const fullName = [record.firstName, record.lastName, record.patronymic].filter(Boolean).join(" ");
          if (!fullName) {
            throw new Error("Full name is required");
          }

          const studentData: InsertStudent = {
            fullName,
            groupId,
            medicalGroup: "basic" as const,
          };

          const student = await storage.createStudent(studentData);

          // Create user account
          const userData: InsertUser = {
            username: record.username,
            password: record.password,
            role: "student" as const,
          };

          const user = await storage.createUser(userData);

          if (!user) {
            // Rollback student creation if user creation fails
            await storage.deleteStudent(student.studentId);
            throw new Error("Failed to create user account");
          }

          results.push({
            success: true,
            username: record.username,
            message: "Student and user account created successfully"
          });
        } catch (err) {
          results.push({
            success: false,
            username: record.username,
            message: err instanceof Error ? err.message : String(err)
          });
        }
      }

      res.status(201).json(results);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      res.status(500).json({ message: "Error processing file", error: error.message });
    }
  });
  
  app.put("/api/students/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user is admin, teacher, or the student themselves
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.studentId !== parseInt(req.params.id)) { //тут беда
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