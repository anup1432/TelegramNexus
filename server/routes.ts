import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TelegramService } from "./telegram-service";
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

const telegramService = new TelegramService(storage);

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

  // Admin users management routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isAdmin, balance } = req.body;

      if (isAdmin !== undefined) {
        await storage.updateUserAdmin(id, isAdmin);
      }

      if (balance !== undefined) {
        const user = await storage.getUser(id);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const newBalance = parseFloat(balance);
          const difference = newBalance - currentBalance;
          await storage.updateUserBalance(id, difference);
        }
      }

      const updatedUser = await storage.getUser(id);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting own account
      if (req.user!.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Admin price config routes
  app.get("/api/admin/prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const prices = await storage.getAllPriceConfigs();
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch prices" });
    }
  });

  app.patch("/api/admin/prices/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { price } = req.body;

      if (!price) {
        return res.status(400).json({ message: "Price is required" });
      }

      await storage.updatePriceConfig(id, price);
      const updatedPrice = await storage.getPriceConfig(id);
      
      res.json(updatedPrice);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update price" });
    }
  });

  // Admin settings routes
  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { settingKey, settingValue, description } = req.body;

      if (!settingKey || !settingValue) {
        return res.status(400).json({ message: "Setting key and value are required" });
      }

      const setting = await storage.setAdminSetting({
        settingKey,
        settingValue,
        description,
      });

      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to save setting" });
    }
  });

  app.patch("/api/admin/settings/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { settingValue } = req.body;

      if (!settingValue) {
        return res.status(400).json({ message: "Setting value is required" });
      }

      await storage.updateAdminSetting(key, settingValue);
      const updatedSetting = await storage.getAdminSetting(key);
      
      res.json(updatedSetting);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update setting" });
    }
  });

  app.delete("/api/admin/settings/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteAdminSetting(key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete setting" });
    }
  });

  // Telegram bot routes
  app.post("/api/telegram/init", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { apiId, apiHash, sessionString } = req.body;

      if (!apiId || !apiHash) {
        return res.status(400).json({ message: "API ID and API Hash are required" });
      }

      await telegramService.initializeClient(parseInt(apiId), apiHash, sessionString || "");
      
      await storage.setAdminSetting({
        settingKey: "telegram_api_id",
        settingValue: apiId,
        description: "Telegram API ID",
      });
      
      await storage.setAdminSetting({
        settingKey: "telegram_api_hash",
        settingValue: apiHash,
        description: "Telegram API Hash",
      });

      if (sessionString) {
        await storage.setAdminSetting({
          settingKey: "telegram_session",
          settingValue: sessionString,
          description: "Telegram session string",
        });
      }

      res.json({ message: "Telegram client initialized successfully", needsAuth: !sessionString });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to initialize Telegram client" });
    }
  });

  app.post("/api/telegram/send-code", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const result = await telegramService.sendPhoneCode(phoneNumber);
      res.json({ phoneCodeHash: result.phoneCodeHash });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to send verification code" });
    }
  });

  app.post("/api/telegram/auth", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { phoneNumber, phoneCode, phoneCodeHash, password } = req.body;

      if (!phoneNumber || !phoneCode || !phoneCodeHash) {
        return res.status(400).json({ message: "Phone number, code, and code hash are required" });
      }

      const sessionString = await telegramService.authenticateWithPhoneCode(
        phoneNumber,
        phoneCode,
        phoneCodeHash,
        password
      );

      await storage.setAdminSetting({
        settingKey: "telegram_session",
        settingValue: sessionString,
        description: "Telegram session string",
      });

      const userInfo = await telegramService.getCurrentUser();

      await storage.setAdminSetting({
        settingKey: "telegram_target_username",
        settingValue: userInfo.username,
        description: "Telegram account username for ownership transfer",
      });

      res.json({ 
        message: "Authentication successful", 
        sessionString,
        username: userInfo.username 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });

  app.post("/api/telegram/join", requireAuth, async (req, res) => {
    try {
      const { groupLink, groupId } = req.body;

      if (!groupLink) {
        return res.status(400).json({ message: "Group link is required" });
      }

      const result = await telegramService.joinGroupAndVerify(groupLink, groupId);
      
      if (result.success && groupId) {
        await storage.updateGroupStatus(groupId, "verified");
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to join group" });
    }
  });

  app.get("/api/telegram/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const isConnected = telegramService.isClientConnected();
      
      const apiIdSetting = await storage.getAdminSetting("telegram_api_id");
      const targetUsernameSetting = await storage.getAdminSetting("telegram_target_username");

      let username = "Not configured";
      if (isConnected) {
        try {
          const userInfo = await telegramService.getCurrentUser();
          username = userInfo.username;
        } catch (error) {
          username = targetUsernameSetting?.settingValue || "Not configured";
        }
      } else if (targetUsernameSetting) {
        username = targetUsernameSetting.settingValue;
      }

      res.json({
        isConnected,
        isConfigured: !!apiIdSetting,
        username,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get Telegram status" });
    }
  });

  app.get("/api/telegram/username", requireAuth, async (req, res) => {
    try {
      const targetUsernameSetting = await storage.getAdminSetting("telegram_target_username");
      
      res.json({
        username: targetUsernameSetting?.settingValue || "Not configured",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get username" });
    }
  });

  app.get("/api/telegram/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { groupId } = req.query;
      const logs = await storage.getTelegramJoinLogs(groupId as string);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch logs" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
