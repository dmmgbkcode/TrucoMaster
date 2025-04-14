import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupWebSocketServer } from "./webSocketHandler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Truco Online API is running' });
  });
  
  // Set up WebSocket server for real-time game communication
  setupWebSocketServer(httpServer);

  return httpServer;
}
