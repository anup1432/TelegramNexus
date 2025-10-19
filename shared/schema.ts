import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramId: text("telegram_id"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isAdmin: integer("is_admin").notNull().default(0), // 0 = user, 1 = admin
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "single" or "folder"
  link: text("link").notNull(),
  description: text("description"),
  members: integer("members"), // Optional now
  groupAge: text("group_age"), // Year: "2020", "2021", "2022", etc.
  status: text("status").notNull().default("submitted"), // submitted, verified, ownership, review, paid, rejected
  price: decimal("price", { precision: 10, scale: 2 }),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  paidAt: timestamp("paid_at"),
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // "upi", "crypto", "bank", etc.
  details: text("details"), // payment details provided by user
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Transactions table - for tracking all monetary movements
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  groupId: varchar("group_id").references(() => groups.id),
  withdrawalId: varchar("withdrawal_id").references(() => withdrawals.id),
  type: text("type").notNull(), // "earning", "withdrawal"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // "completed", "pending", "failed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin settings table - for platform configuration
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Price configuration table - for dynamic pricing (year-based)
export const priceConfig = pgTable("price_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: text("year").notNull().unique(), // "2020", "2021", "2022", etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Telegram bot join logs - tracks auto-join activities
export const telegramJoinLogs = pgTable("telegram_join_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id),
  groupLink: text("group_link").notNull(),
  joinStatus: text("join_status").notNull(), // "joining", "joined", "verified", "message_sent", "failed"
  errorMessage: text("error_message"),
  joinedAt: timestamp("joined_at"),
  verifiedAt: timestamp("verified_at"),
  messageSentAt: timestamp("message_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  telegramId: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  telegramId: z.string().optional(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  type: true,
  link: true,
  description: true,
  members: true,
  groupAge: true,
}).extend({
  type: z.enum(["single", "folder"]),
  link: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  members: z.number().int().positive("Members must be a positive number").optional(),
  groupAge: z.string().optional(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).pick({
  amount: true,
  method: true,
  details: true,
}).extend({
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  method: z.string().min(1, "Please select a payment method"),
  details: z.string().min(1, "Please provide payment details"),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

export type Transaction = typeof transactions.$inferSelect;

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

export type PriceConfig = typeof priceConfig.$inferSelect;
export type InsertPriceConfig = typeof priceConfig.$inferInsert;

export type TelegramJoinLog = typeof telegramJoinLogs.$inferSelect;
export type InsertTelegramJoinLog = typeof telegramJoinLogs.$inferInsert;

// Insert schemas for admin
export const insertAdminSettingSchema = createInsertSchema(adminSettings).pick({
  settingKey: true,
  settingValue: true,
  description: true,
}).extend({
  settingKey: z.string().min(1, "Setting key is required"),
  settingValue: z.string().min(1, "Setting value is required"),
  description: z.string().optional(),
});

export const insertPriceConfigSchema = createInsertSchema(priceConfig).pick({
  year: true,
  price: true,
}).extend({
  year: z.string().min(4, "Year is required (e.g., 2020)"),
  price: z.string().refine((val) => parseFloat(val) >= 0, "Price must be 0 or greater"),
});

// Default price list configuration (year-based, simple)
export const priceList = [
  { year: "2020", price: 12.6 },
  { year: "2021", price: 12.6 },
  { year: "2022", price: 12.6 },
  { year: "2023", price: 8.5 },
  { year: "2024 jan-mar", price: 6.5 },
  { year: "2024 apr-may", price: 5 },
];

// Helper function to calculate price based on year only
export function calculateGroupPrice(year: string): number {
  const priceEntry = priceList.find(p => p.year === year);
  return priceEntry?.price || 0;
}
