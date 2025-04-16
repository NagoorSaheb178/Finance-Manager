import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for transactions
  const apiRouter = express.Router();

  // Get all transactions
  apiRouter.get("/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions", error: String(error) });
    }
  });

  // Get transaction by ID
  apiRouter.get("/transactions/:id", async (req: Request, res: Response) => {
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

  // Create new transaction
  apiRouter.post("/transactions", async (req: Request, res: Response) => {
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

  // Update transaction
  apiRouter.patch("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // We use a partial schema validation for updates
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

  // Delete transaction
  apiRouter.delete("/transactions/:id", async (req: Request, res: Response) => {
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

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
