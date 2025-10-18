import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, 
  loginSchema, 
  insertGroupSchema,
  insertWithdrawalSchema,
  type User 
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // Group routes
  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(req.user!.id, validatedData);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create group" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroupsByOwnerId(req.user!.id);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/stats", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroupsByOwnerId(req.user!.id);
      
      const totalEarnings = groups
        .filter(g => g.status === "paid")
        .reduce((sum, g) => sum + parseFloat(g.price || "0"), 0);

      const pendingGroups = groups.filter(
        g => g.status === "submitted" || g.status === "verified" || g.status === "ownership" || g.status === "review"
      ).length;

      const completedGroups = groups.filter(g => g.status === "paid").length;
      const availableBalance = parseFloat(req.user!.balance);

      res.json({
        totalEarnings,
        pendingGroups,
        completedGroups,
        availableBalance,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const validatedData = insertWithdrawalSchema.parse(req.body);
      const withdrawal = await storage.createWithdrawal(req.user!.id, validatedData);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create withdrawal request" });
    }
  });

  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByUserId(req.user!.id);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch withdrawals" });
    }
  });

  app.get("/api/withdrawals/stats", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByUserId(req.user!.id);
      const transactions = await storage.getTransactionsByUserId(req.user!.id);

      const totalEarnings = transactions
        .filter(t => t.type === "earning" && t.status === "completed")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
      const completedWithdrawals = withdrawals.filter(w => w.status === "approved").length;

      res.json({
        totalEarnings,
        pendingWithdrawals,
        completedWithdrawals,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch withdrawal stats" });
    }
  });

  // Admin routes
  app.get("/api/admin/groups", requireAuth, requireAdmin, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch groups" });
    }
  });

  app.patch("/api/admin/groups/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateGroupStatus(id, status, reason);
      const updatedGroup = await storage.getGroup(id);
      
      res.json(updatedGroup);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update group" });
    }
  });

  app.get("/api/admin/withdrawals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch withdrawals" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateWithdrawalStatus(id, status, reason);
      const updatedWithdrawal = await storage.getWithdrawal(id);
      
      res.json(updatedWithdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update withdrawal" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      const users = await storage.getAllUsers();
      
      const totalEarnings = groups
        .filter(g => g.status === "paid")
        .reduce((sum, g) => sum + parseFloat(g.price || "0"), 0);

      const pendingReviews = groups.filter(
        g => g.status === "submitted" || g.status === "verified" || g.status === "ownership" || g.status === "review"
      ).length;

      res.json({
        totalGroups: groups.length,
        totalUsers: users.length,
        totalEarnings,
        pendingReviews,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
