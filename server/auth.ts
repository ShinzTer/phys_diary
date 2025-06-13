import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as SelectUser, InsertStudent, InsertUser, studentProfileSchema, student } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// User creation form schema
const baseUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "teacher", "student"]),
});

const studentUserSchema = baseUserSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format: +375*********"),
  medicalGroup: z.enum(["basic", "preparatory", "special"], {
    required_error: "Medical group is required",
  }),
  groupId: z.number({
    required_error: "Group is required",
  }),
});

// Student creation schema
const studentCreationSchema = z.object({
  userId: z.number(),
  fullName: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  groupId: z.number({
    required_error: "Group is required",
  }),
  medicalGroup: z.enum(["basic", "preparatory", "special"], {
    required_error: "Medical group is required",
  }),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format: +375*********"),
  placeOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  schoolGraduated: z.string().optional(),
  educationalDepartment: z.string().optional(),
});

// Teacher creation schema
const teacherCreationSchema = z.object({
  userId: z.number(),
  fullName: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  educationalDepartment: z.string().min(1, "Educational department is required"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format: +375*********"),
  nationality: z.string().optional(),
});

export async function setupAuth(app: Express) {
  // Initialize database and create default users if needed
  await storage.initializeDatabase();
  
  // For development, we'll use a simple session secret
  // In production, this should come from environment variables
  const sessionSecret = process.env.SESSION_SECRET || "dev_session_secret";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // For the initial users created in storage.ts, the passwords aren't hashed
        // In a real app, all passwords would be hashed
        if (user.id <= 3) {
          // Handle our seeded users with plain text passwords
          if (password !== user.password) {
            return done(null, false, { message: "Incorrect username or password" });
          }
        } else {
          // Handle properly hashed passwords
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Incorrect username or password" });
          }
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Validate request body based on role
      let validationResult;
      if (req.body.role === "student") {
        validationResult = studentUserSchema.safeParse(req.body);
      } else {
        validationResult = baseUserSchema.safeParse(req.body);
      }

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user first
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
        role: req.body.role,
      });

      // If registering a student, create student record with userId
      if (req.body.role === "student") {
        try {
          const studentData = studentCreationSchema.parse({
            userId: user.id,
            fullName: req.body.fullName,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth,
            medicalGroup: req.body.medicalGroup,
            groupId: req.body.groupId,
            phone: req.body.phone,
            placeOfBirth: req.body.placeOfBirth,
            nationality: req.body.nationality,
            address: req.body.address,
            schoolGraduated: req.body.schoolGraduated,
            educationalDepartment: req.body.educationalDepartment,
          });
          
          const student = await storage.createStudent(studentData);
          if (!student) {
            // Rollback user creation if student creation fails
            await storage.deleteUser(user.id);
            return res.status(500).json({ message: "Failed to create student record" });
          }
        } catch (error) {
          // Rollback user creation if student creation fails
          await storage.deleteUser(user.id);
          throw error;
        }
      }
      // If registering a teacher, create teacher record with userId
      else if (req.body.role === "teacher") {
        try {
          const teacherData = teacherCreationSchema.parse({
            userId: user.id,
            fullName: req.body.fullName,
            position: req.body.position,
            dateOfBirth: req.body.dateOfBirth,
            educationalDepartment: req.body.educationalDepartment,
            phone: req.body.phone,
            nationality: req.body.nationality,
          });
          
          const teacher = await storage.createTeacher(teacherData);
          if (!teacher) {
            // Rollback user creation if teacher creation fails
            await storage.deleteUser(user.id);
            return res.status(500).json({ message: "Failed to create teacher record" });
          }
        } catch (error) {
          // Rollback user creation if teacher creation fails
          await storage.deleteUser(user.id);
          throw error;
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password hash back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Don't send the password hash back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Don't send the password hash back to the client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Middleware to check for admin role - only for user management routes
  app.use(["/api/admin", "/api/users/manage"], (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as SelectUser;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    next();
  });

  // Middleware to check for teacher or admin role
  app.use(["/api/teacher"], (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as SelectUser;
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Teacher or admin role required." });
    }
    next();
  });
}
