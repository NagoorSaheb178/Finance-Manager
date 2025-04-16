import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = [
  "Housing",
  "Food & Dining",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Income",
  "Other"
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category").notNull(),
  notes: text("notes"),
  isIncome: boolean("is_income").notNull().default(false),
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true })
  .extend({
    amount: z.string().or(z.number()).pipe(
      z.coerce.number().min(0.01, { message: "Amount must be greater than 0" })
    ),
    description: z.string().min(1, { message: "Description is required" }),
    category: z.enum(categories, { 
      errorMap: () => ({ message: "Please select a valid category" }) 
    }),
    date: z.string().or(z.date()).pipe(
      z.coerce.date({ message: "Please enter a valid date" })
    ),
  });

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  });

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories[number];
