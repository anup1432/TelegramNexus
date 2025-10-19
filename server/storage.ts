import { 
  type User, 
  type InsertUser, 
  type Group, 
  type InsertGroup,
  type Withdrawal,
  type InsertWithdrawal,
  type Transaction,
  type AdminSetting,
  type InsertAdminSetting,
  type PriceConfig,
  type InsertPriceConfig,
  type TelegramJoinLog,
  type InsertTelegramJoinLog,
  calculateGroupPrice
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<void>;
  updateUserAdmin(userId: string, isAdmin: number): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Group methods
  createGroup(ownerId: string, group: InsertGroup): Promise<Group>;
  getGroupsByOwnerId(ownerId: string): Promise<Group[]>;
  getAllGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  updateGroupStatus(id: string, status: string, reason?: string): Promise<void>;
  updateGroupPrice(id: string, price: number): Promise<void>;

  // Withdrawal methods
  createWithdrawal(userId: string, withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawalsByUserId(userId: string): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  updateWithdrawalStatus(id: string, status: string, reason?: string): Promise<void>;

  // Transaction methods
  createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;

  // Admin settings methods
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  updateAdminSetting(key: string, value: string): Promise<void>;
  deleteAdminSetting(key: string): Promise<void>;

  // Price config methods
  getAllPriceConfigs(): Promise<PriceConfig[]>;
  getPriceConfig(id: string): Promise<PriceConfig | undefined>;
  createPriceConfig(config: InsertPriceConfig): Promise<PriceConfig>;
  updatePriceConfig(id: string, price: string): Promise<void>;
  deletePriceConfig(id: string): Promise<void>;
  initializeDefaultPrices(): Promise<void>;

  // Telegram join log methods
  createTelegramJoinLog(log: Omit<TelegramJoinLog, "id" | "createdAt">): Promise<TelegramJoinLog>;
  updateTelegramJoinLog(id: string, updates: Partial<TelegramJoinLog>): Promise<void>;
  getTelegramJoinLogs(groupId?: string): Promise<TelegramJoinLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private withdrawals: Map<string, Withdrawal>;
  private transactions: Map<string, Transaction>;
  private adminSettings: Map<string, AdminSetting>;
  private priceConfigs: Map<string, PriceConfig>;
  private telegramJoinLogs: Map<string, TelegramJoinLog>;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.withdrawals = new Map();
    this.transactions = new Map();
    this.adminSettings = new Map();
    this.priceConfigs = new Map();
    this.telegramJoinLogs = new Map();

    // Create default admin user (password: admin123)
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "cap1432",
      password: "$2b$10$CGISTMLqonxKEB4eWYGEeupUXrNGe6pRErQCrzvki6d.l/TR1pPFO", // bcrypt hash of "admin123"
      telegramId: null,
      balance: "0.00",
      isAdmin: 1,
      createdAt: new Date(),
    });

    // Initialize default prices
    this.initializeDefaultPrices();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      telegramId: insertUser.telegramId || null,
      balance: "0.00",
      isAdmin: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.balance);
    const newBalance = currentBalance + amount;
    user.balance = newBalance.toFixed(2);
    this.users.set(userId, user);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserAdmin(userId: string, isAdmin: number): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    user.isAdmin = isAdmin;
    this.users.set(userId, user);
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  // Group methods
  async createGroup(ownerId: string, insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    
    // Default year if not provided (treat as newest/cheapest category)
    const year = insertGroup.groupAge || "2025";
    
    // Calculate price from dynamic price configuration with fallback to static prices
    const priceConfigs = await this.getAllPriceConfigs();
    
    // Try to get price from dynamic configuration
    const priceConfig = priceConfigs.find(p => p.year === year);
    
    let price = 0;
    if (priceConfig) {
      price = parseFloat(priceConfig.price);
    } else {
      // Fallback to static pricing using the helper function
      price = calculateGroupPrice(year);
    }
    
    const group: Group = {
      ...insertGroup,
      id,
      ownerId,
      description: insertGroup.description || null,
      members: insertGroup.members || null,
      groupAge: insertGroup.groupAge || null,
      status: "submitted",
      price: price.toFixed(2),
      rejectionReason: null,
      submittedAt: new Date(),
      verifiedAt: null,
      paidAt: null,
    };
    this.groups.set(id, group);
    return group;
  }

  async getGroupsByOwnerId(ownerId: string): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (group) => group.ownerId === ownerId,
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async updateGroupStatus(id: string, status: string, reason?: string): Promise<void> {
    const group = this.groups.get(id);
    if (!group) throw new Error("Group not found");

    group.status = status;
    
    if (status === "rejected" && reason) {
      group.rejectionReason = reason;
    }

    if (status === "verified") {
      group.verifiedAt = new Date();
    }

    if (status === "paid") {
      group.paidAt = new Date();
      // Add earnings to user balance
      const price = parseFloat(group.price || "0");
      if (price > 0) {
        await this.updateUserBalance(group.ownerId, price);
        
        // Create transaction
        await this.createTransaction({
          userId: group.ownerId,
          groupId: group.id,
          withdrawalId: null,
          type: "earning",
          amount: group.price || "0",
          status: "completed",
        });
      }
    }

    this.groups.set(id, group);
  }

  async updateGroupPrice(id: string, price: number): Promise<void> {
    const group = this.groups.get(id);
    if (!group) throw new Error("Group not found");
    
    group.price = price.toFixed(2);
    this.groups.set(id, group);
  }

  // Withdrawal methods
  async createWithdrawal(userId: string, insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = randomUUID();
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const requestedAmount = parseFloat(insertWithdrawal.amount);
    const availableBalance = parseFloat(user.balance);

    if (requestedAmount > availableBalance) {
      throw new Error("Insufficient balance");
    }

    const withdrawal: Withdrawal = {
      ...insertWithdrawal,
      id,
      userId,
      amount: requestedAmount.toFixed(2),
      details: insertWithdrawal.details || null,
      status: "pending",
      rejectionReason: null,
      requestedAt: new Date(),
      processedAt: null,
    };
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getWithdrawalsByUserId(userId: string): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).filter(
      (withdrawal) => withdrawal.userId === userId,
    ).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    return this.withdrawals.get(id);
  }

  async updateWithdrawalStatus(id: string, status: string, reason?: string): Promise<void> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) throw new Error("Withdrawal not found");

    const previousStatus = withdrawal.status;
    withdrawal.status = status;
    withdrawal.processedAt = new Date();

    if (status === "rejected" && reason) {
      withdrawal.rejectionReason = reason;
    }

    if (status === "approved") {
      // Deduct from user balance
      const amount = parseFloat(withdrawal.amount);
      await this.updateUserBalance(withdrawal.userId, -amount);

      // Create transaction
      await this.createTransaction({
        userId: withdrawal.userId,
        groupId: null,
        withdrawalId: withdrawal.id,
        type: "withdrawal",
        amount: withdrawal.amount,
        status: "completed",
      });
    }

    this.withdrawals.set(id, withdrawal);
  }

  // Transaction methods
  async createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Admin settings methods
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    return this.adminSettings.get(key);
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return Array.from(this.adminSettings.values());
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const existing = this.adminSettings.get(setting.settingKey);
    
    if (existing) {
      existing.settingValue = setting.settingValue;
      existing.description = setting.description || null;
      existing.updatedAt = new Date();
      this.adminSettings.set(setting.settingKey, existing);
      return existing;
    }

    const id = randomUUID();
    const newSetting: AdminSetting = {
      id,
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      description: setting.description || null,
      updatedAt: new Date(),
    };
    this.adminSettings.set(setting.settingKey, newSetting);
    return newSetting;
  }

  async updateAdminSetting(key: string, value: string): Promise<void> {
    const setting = this.adminSettings.get(key);
    if (!setting) throw new Error("Setting not found");
    
    setting.settingValue = value;
    setting.updatedAt = new Date();
    this.adminSettings.set(key, setting);
  }

  async deleteAdminSetting(key: string): Promise<void> {
    this.adminSettings.delete(key);
  }

  // Price config methods
  async getAllPriceConfigs(): Promise<PriceConfig[]> {
    return Array.from(this.priceConfigs.values()).sort(
      (a, b) => a.year.localeCompare(b.year)
    );
  }

  async getPriceConfig(id: string): Promise<PriceConfig | undefined> {
    return this.priceConfigs.get(id);
  }

  async createPriceConfig(config: InsertPriceConfig): Promise<PriceConfig> {
    const id = randomUUID();
    const priceValue = String(config.price);
    const newConfig: PriceConfig = {
      id,
      year: config.year,
      price: priceValue,
      updatedAt: new Date(),
    };
    this.priceConfigs.set(id, newConfig);
    return newConfig;
  }

  async updatePriceConfig(id: string, price: string): Promise<void> {
    const config = this.priceConfigs.get(id);
    if (!config) throw new Error("Price config not found");
    
    config.price = price;
    config.updatedAt = new Date();
    this.priceConfigs.set(id, config);
  }

  async deletePriceConfig(id: string): Promise<void> {
    this.priceConfigs.delete(id);
  }

  async initializeDefaultPrices(): Promise<void> {
    const defaultPrices = [
      { year: "2020", price: "12.00" },
      { year: "2021", price: "10.00" },
      { year: "2022", price: "7.00" },
      { year: "2023", price: "5.00" },
      { year: "2024", price: "3.00" },
      { year: "2025", price: "1.00" },
    ];

    for (const price of defaultPrices) {
      await this.createPriceConfig(price);
    }
  }

  // Telegram join log methods
  async createTelegramJoinLog(log: Omit<TelegramJoinLog, "id" | "createdAt">): Promise<TelegramJoinLog> {
    const id = randomUUID();
    const newLog: TelegramJoinLog = {
      ...log,
      id,
      createdAt: new Date(),
    };
    this.telegramJoinLogs.set(id, newLog);
    return newLog;
  }

  async updateTelegramJoinLog(id: string, updates: Partial<TelegramJoinLog>): Promise<void> {
    const log = this.telegramJoinLogs.get(id);
    if (!log) throw new Error("Telegram join log not found");
    
    const updatedLog = { ...log, ...updates };
    this.telegramJoinLogs.set(id, updatedLog);
  }

  async getTelegramJoinLogs(groupId?: string): Promise<TelegramJoinLog[]> {
    let logs = Array.from(this.telegramJoinLogs.values());
    
    if (groupId) {
      logs = logs.filter(log => log.groupId === groupId);
    }
    
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
