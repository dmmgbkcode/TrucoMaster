import { users, type User, type InsertUser } from "@shared/schema";
import { TrucoGame } from "./trucoGame";
import { GameMode } from "@shared/types";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game related storage
  getGame(id: string): Promise<TrucoGame | undefined>;
  getAllGames(): Promise<TrucoGame[]>;
  createGame(id: string, mode: GameMode): Promise<TrucoGame>;
  removeGame(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<string, TrucoGame>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game methods
  async getGame(id: string): Promise<TrucoGame | undefined> {
    return this.games.get(id);
  }
  
  async getAllGames(): Promise<TrucoGame[]> {
    return Array.from(this.games.values());
  }
  
  async createGame(id: string, mode: GameMode): Promise<TrucoGame> {
    const game = new TrucoGame(id, mode);
    this.games.set(id, game);
    return game;
  }
  
  async removeGame(id: string): Promise<boolean> {
    return this.games.delete(id);
  }
}

export const storage = new MemStorage();
