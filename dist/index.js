// server/index.ts
import express3 from "express";

// server/routes.ts
import express2 from "express";
import { createServer } from "http";

// server/storage.ts
import { ObjectId } from "mongodb";

// server/mongo.ts
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/mongo.ts
dotenv.config();
var DEFAULT_URI = "mongodb+srv://test2:Nagoor@test.gg7r1on.mongodb.net/?retryWrites=true&w=majority&appName=Test";
var MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;
var DB_NAME = process.env.MONGODB_DBNAME || "Finance";
var db;
var connectionInProgress = false;
var lastAttemptTime = 0;
var CONNECTION_RETRY_INTERVAL = 3e4;
async function connectToMongoDB() {
  if (db) {
    return db;
  }
  if (connectionInProgress) {
    throw new Error("MongoDB connection already in progress");
  }
  const now = Date.now();
  if (now - lastAttemptTime < CONNECTION_RETRY_INTERVAL) {
    throw new Error("MongoDB connection attempt rate limited");
  }
  connectionInProgress = true;
  lastAttemptTime = now;
  try {
    log("Attempting to connect to MongoDB...", "mongodb");
    if (!MONGODB_URI) {
      log("\u26A0\uFE0F MONGODB_URI environment variable not set. Using default local connection.", "mongodb");
    }
    const uri = MONGODB_URI || DEFAULT_URI;
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    log("\u2705 Connected to MongoDB successfully", "mongodb");
    process.on("SIGINT", async () => {
      try {
        await client.close();
        log("MongoDB connection closed", "mongodb");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
      }
      process.exit(0);
    });
    connectionInProgress = false;
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    log(`\u274C MongoDB connection failed: ${error instanceof Error ? error.message : "Unknown error"}`, "mongodb");
    connectionInProgress = false;
    throw error;
  }
}
async function getMongoDb() {
  if (!db) {
    return connectToMongoDB();
  }
  return db;
}

// server/storage.ts
var inMemoryTransactions = /* @__PURE__ */ new Map();
var nextTransactionId = 1;
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  nextUserId = 1;
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const id = this.nextUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getTransactions() {
    return Array.from(inMemoryTransactions.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getTransaction(id) {
    return inMemoryTransactions.get(id);
  }
  async createTransaction(insertTransaction) {
    const id = nextTransactionId++;
    const transaction = {
      ...insertTransaction,
      id,
      date: new Date(insertTransaction.date)
    };
    inMemoryTransactions.set(id, transaction);
    return transaction;
  }
  async updateTransaction(id, updateData) {
    const transaction = inMemoryTransactions.get(id);
    if (!transaction) return void 0;
    const updatedTransaction = {
      ...transaction,
      ...updateData,
      date: updateData.date ? new Date(updateData.date) : transaction.date,
      // Keep the amount as is
      // Convert amount to number as needed by the schema
      amount: updateData.amount !== void 0 ? typeof updateData.amount === "string" ? parseFloat(updateData.amount) : updateData.amount : transaction.amount
    };
    inMemoryTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  async deleteTransaction(id) {
    return inMemoryTransactions.delete(id);
  }
};
var MongoDBStorage = class {
  fallbackStorage = new MemStorage();
  connected = false;
  async getCollection(name) {
    try {
      const db2 = await getMongoDb();
      this.connected = true;
      return db2.collection(name);
    } catch (error) {
      console.error(`Failed to get MongoDB collection ${name}:`, error);
      this.connected = false;
      throw error;
    }
  }
  // Helper to convert MongoDB _id to numeric id
  convertFromMongo(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    const idString = _id.toString();
    const numericId = parseInt(idString.substring(0, 8), 16);
    return {
      ...rest,
      id: numericId
    };
  }
  async getUser(id) {
    try {
      const collection = await this.getCollection("users");
      const user = await collection.findOne({
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, "0")) }]
      });
      return user ? this.convertFromMongo(user) : void 0;
    } catch (error) {
      console.error("Error getting user, using fallback storage:", error);
      return this.fallbackStorage.getUser(id);
    }
  }
  async getUserByUsername(username) {
    try {
      const collection = await this.getCollection("users");
      const user = await collection.findOne({ username });
      return user ? this.convertFromMongo(user) : void 0;
    } catch (error) {
      console.error("Error getting user by username, using fallback storage:", error);
      return this.fallbackStorage.getUserByUsername(username);
    }
  }
  async createUser(insertUser) {
    try {
      const collection = await this.getCollection("users");
      const result = await collection.insertOne(insertUser);
      return {
        ...insertUser,
        id: parseInt(result.insertedId.toString().substring(0, 8), 16)
      };
    } catch (error) {
      console.error("Error creating user, using fallback storage:", error);
      return this.fallbackStorage.createUser(insertUser);
    }
  }
  async getTransactions() {
    try {
      const collection = await this.getCollection("transactions");
      const transactions2 = await collection.find().sort({ date: -1 }).toArray();
      return transactions2.map((doc) => {
        return this.convertFromMongo({
          ...doc,
          date: new Date(doc.date)
        });
      });
    } catch (error) {
      console.error("Error getting transactions, using fallback storage:", error);
      return this.fallbackStorage.getTransactions();
    }
  }
  async getTransaction(id) {
    try {
      const collection = await this.getCollection("transactions");
      const transaction = await collection.findOne({
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, "0")) }]
      });
      if (!transaction) return void 0;
      return this.convertFromMongo({
        ...transaction,
        date: new Date(transaction.date)
      });
    } catch (error) {
      console.error("Error getting transaction, using fallback storage:", error);
      return this.fallbackStorage.getTransaction(id);
    }
  }
  async createTransaction(insertTransaction) {
    try {
      const collection = await this.getCollection("transactions");
      const amount = typeof insertTransaction.amount === "string" ? parseFloat(insertTransaction.amount) : insertTransaction.amount;
      const transactionToInsert = {
        ...insertTransaction,
        amount,
        date: new Date(insertTransaction.date)
      };
      const result = await collection.insertOne(transactionToInsert);
      return {
        ...transactionToInsert,
        id: parseInt(result.insertedId.toString().substring(0, 8), 16)
      };
    } catch (error) {
      console.error("Error creating transaction, using fallback storage:", error);
      return this.fallbackStorage.createTransaction(insertTransaction);
    }
  }
  async updateTransaction(id, updateData) {
    try {
      const collection = await this.getCollection("transactions");
      const updateObj = { ...updateData };
      if (updateObj.date) {
        updateObj.date = new Date(updateObj.date);
      }
      if (updateObj.amount !== void 0) {
        updateObj.amount = typeof updateObj.amount === "string" ? parseFloat(updateObj.amount) : updateObj.amount;
      }
      const result = await collection.findOneAndUpdate(
        { $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, "0")) }] },
        { $set: updateObj },
        { returnDocument: "after" }
      );
      if (!result || !result.value) return void 0;
      return this.convertFromMongo({
        ...result.value,
        date: new Date(result.value.date)
      });
    } catch (error) {
      console.error("Error updating transaction, using fallback storage:", error);
      return this.fallbackStorage.updateTransaction(id, updateData);
    }
  }
  async deleteTransaction(id) {
    try {
      const collection = await this.getCollection("transactions");
      const result = await collection.deleteOne({
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, "0")) }]
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting transaction, using fallback storage:", error);
      return this.fallbackStorage.deleteTransaction(id);
    }
  }
};
var storage = new MongoDBStorage();

// shared/schema.ts
import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var categories = [
  "Housing",
  "Food & Dining",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Income",
  "Other"
];
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category").notNull(),
  notes: text("notes"),
  isIncome: boolean("is_income").notNull().default(false)
});
var insertTransactionSchema = createInsertSchema(transactions).omit({ id: true }).extend({
  amount: z.string().or(z.number()).pipe(
    z.coerce.number().min(0.01, { message: "Amount must be greater than 0" })
  ),
  description: z.string().min(1, { message: "Description is required" }),
  category: z.enum(categories, {
    errorMap: () => ({ message: "Please select a valid category" })
  }),
  date: z.string().or(z.date()).pipe(
    z.coerce.date({ message: "Please enter a valid date" })
  )
});
var insertUserSchema = createInsertSchema(users).omit({ id: true }).extend({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

// server/routes.ts
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  const apiRouter = express2.Router();
  apiRouter.get("/transactions", async (req, res) => {
    try {
      const transactions2 = await storage.getTransactions();
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions", error: String(error) });
    }
  });
  apiRouter.get("/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction", error: String(error) });
    }
  });
  apiRouter.post("/transactions", async (req, res) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: "Invalid transaction data", error: errorMessage });
      }
      const transaction = await storage.createTransaction(result.data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create transaction", error: String(error) });
    }
  });
  apiRouter.patch("/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const result = insertTransactionSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: "Invalid transaction data", error: errorMessage });
      }
      const updatedTransaction = await storage.updateTransaction(id, result.data);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction", error: String(error) });
    }
  });
  apiRouter.delete("/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction", error: String(error) });
    }
  });
  app2.use("/api", apiRouter);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const dbPromise = connectToMongoDB().then(() => {
      log("MongoDB connected successfully");
    }).catch((err) => {
      log(`MongoDB connection error: ${err?.message || "Unknown error"}`);
      console.error("MongoDB connection failed:", err);
    });
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = 5e3;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Server initialization error: ${error?.message || "Unknown error"}`);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
