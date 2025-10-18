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
  members: integer("members").notNull(),
  groupAge: text("group_age"), // e.g., "2020-2021", "2022-2023"
  screenshotUrl: text("screenshot_url"),
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
  screenshotUrl: true,
}).extend({
  type: z.enum(["single", "folder"]),
  link: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  members: z.number().int().positive("Members must be a positive number"),
  groupAge: z.string().optional(),
  screenshotUrl: z.string().optional(),
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

// Price list configuration (can be moved to a separate config file if needed)
export const priceList = [
  { groupAge: "2020-2021", memberRange: "0-1000", price: 3 },
  { groupAge: "2020-2021", memberRange: "1001-5000", price: 5 },
  { groupAge: "2020-2021", memberRange: "5001-10000", price: 8 },
  { groupAge: "2020-2021", memberRange: "10001+", price: 12 },
  { groupAge: "2022-2023", memberRange: "0-1000", price: 2 },
  { groupAge: "2022-2023", memberRange: "1001-5000", price: 3.5 },
  { groupAge: "2022-2023", memberRange: "5001-10000", price: 5 },
  { groupAge: "2022-2023", memberRange: "10001+", price: 7 },
  { groupAge: "2024+", memberRange: "0-1000", price: 1 },
  { groupAge: "2024+", memberRange: "1001-5000", price: 2 },
  { groupAge: "2024+", memberRange: "5001-10000", price: 3 },
  { groupAge: "2024+", memberRange: "10001+", price: 4 },
];

// Helper function to calculate price based on group age and members
export function calculateGroupPrice(groupAge: string, members: number): number {
  const ranges = [
    { max: 1000, range: "0-1000" },
    { max: 5000, range: "1001-5000" },
    { max: 10000, range: "5001-10000" },
    { max: Infinity, range: "10001+" },
  ];

  const memberRange = ranges.find(r => members <= r.max)?.range || "10001+";
  const priceEntry = priceList.find(p => p.groupAge === groupAge && p.memberRange === memberRange);
  
  return priceEntry?.price || 0;
}
