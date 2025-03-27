import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFacultySchema, insertGroupSchema, insertTestSchema, insertSampleSchema, userProfileSchema } from "@shared/schema";
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
      
      const users = await storage.getUsersByRole(req.query.role as string || "");
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

  app.delete("/api/users/:id", async (req, res) => {
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

      const profileData = userProfileSchema.parse(req.body);
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

  // Test management endpoints
  app.get("/api/tests/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = parseInt(req.params.userId);
      
      // If not an admin or teacher, only allow access to own tests
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tests = await storage.getTestsByUser(userId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tests" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const testData = insertTestSchema.parse(req.body);
      
      // If student, can only create tests for themselves
      if (req.user?.role === "student" && testData.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating test" });
    }
  });

  app.put("/api/tests/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const testData = req.body;
      
      const existingTest = await storage.getTest(id);
      if (!existingTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Students can only update their own tests
      if (req.user?.role === "student" && existingTest.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTest = await storage.updateTest(id, testData);
      res.json(updatedTest);
    } catch (error) {
      res.status(500).json({ message: "Error updating test" });
    }
  });

  // Sample management endpoints
  app.get("/api/samples/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = parseInt(req.params.userId);
      
      // If not an admin or teacher, only allow access to own samples
      if (req.user?.role !== "admin" && req.user?.role !== "teacher" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const samples = await storage.getSamplesByUser(userId);
      res.json(samples);
    } catch (error) {
      res.status(500).json({ message: "Error fetching samples" });
    }
  });

  app.post("/api/samples", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const sampleData = insertSampleSchema.parse(req.body);
      
      // If student, can only create samples for themselves
      if (req.user?.role === "student" && sampleData.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sample = await storage.createSample(sampleData);
      res.status(201).json(sample);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sample data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating sample" });
    }
  });

  app.put("/api/samples/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const sampleData = req.body;
      
      const existingSample = await storage.getSample(id);
      if (!existingSample) {
        return res.status(404).json({ message: "Sample not found" });
      }
      
      // Students can only update their own samples
      if (req.user?.role === "student" && existingSample.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedSample = await storage.updateSample(id, sampleData);
      res.json(updatedSample);
    } catch (error) {
      res.status(500).json({ message: "Error updating sample" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
