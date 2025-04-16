import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from './mongo';
import { Transaction, InsertTransaction, User, InsertUser } from "@shared/schema";

// Fallback in-memory storage
const inMemoryTransactions = new Map<number, Transaction>();
let nextTransactionId = 1;

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
}

// Fallback MemoryStorage implementation
export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private nextUserId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const user = { ...insertUser, id } as User;
    this.users.set(id, user);
    return user;
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(inMemoryTransactions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return inMemoryTransactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = nextTransactionId++;
    const transaction = {
      ...insertTransaction,
      id,
      date: new Date(insertTransaction.date)
    } as unknown as Transaction;
    
    inMemoryTransactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = inMemoryTransactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = {
      ...transaction,
      ...updateData,
      date: updateData.date ? new Date(updateData.date) : transaction.date,
      // Keep the amount as is
      // Convert amount to number as needed by the schema
      amount: updateData.amount !== undefined 
        ? typeof updateData.amount === 'string' 
          ? parseFloat(updateData.amount) 
          : updateData.amount 
        : transaction.amount
    } as Transaction;

    inMemoryTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return inMemoryTransactions.delete(id);
  }
}

export class MongoDBStorage implements IStorage {
  private fallbackStorage = new MemStorage();
  private connected = false;
  
  private async getCollection(name: string): Promise<Collection> {
    try {
      const db = await getMongoDb();
      this.connected = true;
      return db.collection(name);
    } catch (error) {
      console.error(`Failed to get MongoDB collection ${name}:`, error);
      this.connected = false;
      throw error;
    }
  }

  // Helper to convert MongoDB _id to numeric id
  private convertFromMongo<T>(doc: any): T {
    if (!doc) return null as any;
    
    const { _id, ...rest } = doc;
    const idString = _id.toString();
    // Generate a numeric ID from MongoDB's ObjectId
    const numericId = parseInt(idString.substring(0, 8), 16);
    
    return {
      ...rest,
      id: numericId,
    } as T;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const collection = await this.getCollection('users');
      const user = await collection.findOne({ 
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, '0')) }] 
      });
      return user ? this.convertFromMongo<User>(user) : undefined;
    } catch (error) {
      console.error("Error getting user, using fallback storage:", error);
      return this.fallbackStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const collection = await this.getCollection('users');
      const user = await collection.findOne({ username });
      return user ? this.convertFromMongo<User>(user) : undefined;
    } catch (error) {
      console.error("Error getting user by username, using fallback storage:", error);
      return this.fallbackStorage.getUserByUsername(username);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const collection = await this.getCollection('users');
      const result = await collection.insertOne(insertUser as any);
      
      return {
        ...insertUser,
        id: parseInt(result.insertedId.toString().substring(0, 8), 16)
      } as User;
    } catch (error) {
      console.error("Error creating user, using fallback storage:", error);
      return this.fallbackStorage.createUser(insertUser);
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection('transactions');
      const transactions = await collection.find().sort({ date: -1 }).toArray();
      
      return transactions.map(doc => {
        // Ensure date is a Date object
        return this.convertFromMongo<Transaction>({
          ...doc,
          date: new Date(doc.date)
        });
      });
    } catch (error) {
      console.error("Error getting transactions, using fallback storage:", error);
      // Use fallback storage when MongoDB is not available
      return this.fallbackStorage.getTransactions();
    }
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const collection = await this.getCollection('transactions');
      const transaction = await collection.findOne({ 
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, '0')) }] 
      });
      
      if (!transaction) return undefined;
      
      return this.convertFromMongo<Transaction>({
        ...transaction,
        date: new Date(transaction.date)
      });
    } catch (error) {
      console.error("Error getting transaction, using fallback storage:", error);
      return this.fallbackStorage.getTransaction(id);
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    try {
      const collection = await this.getCollection('transactions');
      
      // Ensure date is properly formatted and amount is a number
      const amount = typeof insertTransaction.amount === 'string'
        ? parseFloat(insertTransaction.amount)
        : insertTransaction.amount;
        
      const transactionToInsert = {
        ...insertTransaction,
        amount,
        date: new Date(insertTransaction.date)
      };
      
      const result = await collection.insertOne(transactionToInsert as any);
      
      return {
        ...transactionToInsert,
        id: parseInt(result.insertedId.toString().substring(0, 8), 16)
      } as unknown as Transaction;
    } catch (error) {
      console.error("Error creating transaction, using fallback storage:", error);
      return this.fallbackStorage.createTransaction(insertTransaction);
    }
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      const collection = await this.getCollection('transactions');
      
      // Format date if present
      const updateObj = { ...updateData };
      if (updateObj.date) {
        updateObj.date = new Date(updateObj.date);
      }
      
      // Ensure amount is a number if provided
      if (updateObj.amount !== undefined) {
        updateObj.amount = typeof updateObj.amount === 'string'
          ? parseFloat(updateObj.amount)
          : updateObj.amount;
      }
      
      const result = await collection.findOneAndUpdate(
        { $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, '0')) }] },
        { $set: updateObj },
        { returnDocument: 'after' }
      );
      
      if (!result || !result.value) return undefined;
      
      return this.convertFromMongo<Transaction>({
        ...result.value,
        date: new Date(result.value.date)
      });
    } catch (error) {
      console.error("Error updating transaction, using fallback storage:", error);
      return this.fallbackStorage.updateTransaction(id, updateData);
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const collection = await this.getCollection('transactions');
      const result = await collection.deleteOne({ 
        $or: [{ id }, { _id: new ObjectId(id.toString().padStart(24, '0')) }] 
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting transaction, using fallback storage:", error);
      return this.fallbackStorage.deleteTransaction(id);
    }
  }
}

export const storage = new MongoDBStorage();