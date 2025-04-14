import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager';
import { ActionType, GameMode, GameRoom } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { log } from './vite';

// Initialize the game manager
const gameManager = new GameManager();

export function setupWebSocketServer(server: HttpServer): void {
  const io = new Server(server);
  
  // Middleware for logging
  io.use((socket, next) => {
    log(`Socket connected: ${socket.id}`, 'socket');
    next();
  });

  io.on('connection', (socket: Socket) => {
    log(`Client connected: ${socket.id}`, 'socket');

    // Send available rooms to new client
    socket.emit('rooms_update', gameManager.getPublicRooms());

    // Get all available rooms
    socket.on('get_rooms', () => {
      socket.emit('rooms_update', gameManager.getPublicRooms());
    });

    // Create a new game
    socket.on(ActionType.CREATE_GAME, (data: { username: string, roomName: string, mode: GameMode }) => {
      try {
        const { username, roomName, mode } = data;
        if (!username || !roomName) {
          socket.emit(ActionType.ERROR, { message: 'Username and room name are required' });
          return;
        }

        // Create a new game
        const gameId = uuidv4();
        const game = gameManager.createGame(gameId, mode, roomName);
        
        // Add player to the game
        game.addPlayer(socket.id, username);
        
        // Join socket room
        socket.join(gameId);
        
        // Notify client
        socket.emit('game_created', { gameId });
        
        // Update available rooms
        io.emit('rooms_update', gameManager.getPublicRooms());
        
        log(`Game created: ${gameId}, Mode: ${mode}, Created by: ${username}`, 'game');
      } catch (error) {
        socket.emit(ActionType.ERROR, { message: 'Failed to create game' });
        log(`Error creating game: ${error}`, 'error');
      }
    });

    // Join an existing game
    socket.on(ActionType.JOIN_GAME, (data: { gameId: string, username: string }) => {
      try {
        const { gameId, username } = data;
        if (!gameId || !username) {
          socket.emit(ActionType.ERROR, { message: 'Game ID and username are required' });
          return;
        }

        // Check if game exists
        const game = gameManager.getGame(gameId);
        if (!game) {
          socket.emit(ActionType.ERROR, { message: 'Game not found' });
          return;
        }

        // Check if game is full
        if (game.isGameFull()) {
          socket.emit(ActionType.ERROR, { message: 'Game is full' });
          return;
        }

        // Add player to the game
        const player = game.addPlayer(socket.id, username);
        if (!player) {
          socket.emit(ActionType.ERROR, { message: 'Failed to join game' });
          return;
        }

        // Join socket room
        socket.join(gameId);
        
        // Send current game state to new player
        socket.emit(ActionType.GAME_UPDATE, game.gameState);
        
        // Send chat history
        const chatMessages = game.getChatMessages();
        chatMessages.forEach(message => {
          socket.emit('chat_message', message);
        });
        
        // Update available rooms
        io.emit('rooms_update', gameManager.getPublicRooms());
        
        log(`Player ${username} (${socket.id}) joined game ${gameId}`, 'game');
      } catch (error) {
        socket.emit(ActionType.ERROR, { message: 'Failed to join game' });
        log(`Error joining game: ${error}`, 'error');
      }
    });

    // Leave game
    socket.on(ActionType.LEAVE_GAME, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        // Check if game exists
        const game = gameManager.getGame(gameId);
        if (!game) return;

        // Remove player from the game
        game.removePlayer(socket.id);
        
        // Leave socket room
        socket.leave(gameId);
        
        // If game is empty, remove it
        if (game.getPlayerCount() === 0) {
          gameManager.removeGame(gameId);
        }
        
        // Update available rooms
        io.emit('rooms_update', gameManager.getPublicRooms());
        
        log(`Player ${socket.id} left game ${gameId}`, 'game');
      } catch (error) {
        log(`Error leaving game: ${error}`, 'error');
      }
    });

    // Player ready
    socket.on(ActionType.READY, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.setPlayerReady(socket.id);
        log(`Player ${socket.id} ready in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error setting player ready: ${error}`, 'error');
      }
    });

    // Start game
    socket.on(ActionType.START_GAME, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.startGame();
        
        // Update available rooms (game is now in progress)
        io.emit('rooms_update', gameManager.getPublicRooms());
        
        log(`Game ${gameId} started`, 'game');
      } catch (error) {
        log(`Error starting game: ${error}`, 'error');
      }
    });

    // Play card
    socket.on(ActionType.PLAY_CARD, (data: { gameId: string, cardId: string }) => {
      try {
        const { gameId, cardId } = data;
        if (!gameId || !cardId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.playCard(socket.id, cardId);
        log(`Player ${socket.id} played card ${cardId} in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error playing card: ${error}`, 'error');
      }
    });

    // Request truco
    socket.on(ActionType.REQUEST_TRUCO, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.requestTruco(socket.id);
        log(`Player ${socket.id} requested truco in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error requesting truco: ${error}`, 'error');
      }
    });

    // Accept truco
    socket.on(ActionType.ACCEPT_TRUCO, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.acceptTruco();
        log(`Player ${socket.id} accepted truco in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error accepting truco: ${error}`, 'error');
      }
    });

    // Decline truco
    socket.on(ActionType.DECLINE_TRUCO, (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.declineTruco();
        log(`Player ${socket.id} declined truco in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error declining truco: ${error}`, 'error');
      }
    });

    // Send chat message
    socket.on(ActionType.SEND_CHAT, (data: { gameId: string, content: string, isTeamOnly: boolean }) => {
      try {
        const { gameId, content, isTeamOnly } = data;
        if (!gameId || !content) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        const message = game.addChatMessage(socket.id, content, isTeamOnly);
        
        // Send to all players in the game
        io.to(gameId).emit('chat_message', message);
        
        log(`Chat in game ${gameId}: ${socket.id}: ${content}`, 'chat');
      } catch (error) {
        log(`Error sending chat: ${error}`, 'error');
      }
    });

    // Start new round after round is over
    socket.on('start_new_round', (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        if (!gameId) return;

        const game = gameManager.getGame(gameId);
        if (!game) return;

        game.startNewRound();
        log(`New round started in game ${gameId}`, 'game');
      } catch (error) {
        log(`Error starting new round: ${error}`, 'error');
      }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      try {
        log(`Client disconnected: ${socket.id}`, 'socket');
        
        // Find all games this player is in
        const playerGames = gameManager.getGamesByPlayerId(socket.id);
        
        // Mark player as disconnected but don't remove immediately
        // This allows players to reconnect to their games
        playerGames.forEach(game => {
          // Only mark disconnected, don't remove immediately
          game.markPlayerDisconnected(socket.id);
          
          // If game is empty (all players disconnected), remove it after timeout
          if (game.getConnectedPlayerCount() === 0) {
            setTimeout(() => {
              // Double check if still empty after timeout
              if (game.getConnectedPlayerCount() === 0) {
                gameManager.removeGame(game.gameState.id);
                io.emit('rooms_update', gameManager.getPublicRooms());
              }
            }, 60000); // 1 minute timeout to remove empty games
          }
        });
        
        // Update available rooms
        if (playerGames.length > 0) {
          io.emit('rooms_update', gameManager.getPublicRooms());
        }
      } catch (error) {
        log(`Error handling disconnect: ${error}`, 'error');
      }
    });
    
    // Handle reconnection
    socket.on('reconnect_game', (data: { username: string, gameId: string }) => {
      try {
        const { username, gameId } = data;
        if (!username || !gameId) {
          socket.emit(ActionType.ERROR, { message: 'Username and game ID are required' });
          return;
        }
        
        // Get the game
        const game = gameManager.getGame(gameId);
        if (!game) {
          socket.emit(ActionType.ERROR, { message: 'Game not found' });
          return;
        }
        
        // Try to reconnect player
        const reconnected = game.reconnectPlayer(socket.id, username);
        if (!reconnected) {
          // If player wasn't previously in the game, try to add them as new
          const player = game.addPlayer(socket.id, username);
          if (!player) {
            socket.emit(ActionType.ERROR, { message: 'Failed to join game' });
            return;
          }
        }
        
        // Join socket room
        socket.join(gameId);
        
        // Send current game state to reconnected player
        socket.emit(ActionType.GAME_UPDATE, game.gameState);
        
        // Send chat history
        const chatMessages = game.getChatMessages();
        chatMessages.forEach(message => {
          socket.emit('chat_message', message);
        });
        
        // Update all clients about the reconnection
        io.to(gameId).emit(ActionType.GAME_UPDATE, game.gameState);
        
        // Update available rooms
        io.emit('rooms_update', gameManager.getPublicRooms());
        
        log(`Player ${username} (${socket.id}) reconnected to game ${gameId}`, 'game');
      } catch (error) {
        socket.emit(ActionType.ERROR, { message: 'Failed to reconnect to game' });
        log(`Error reconnecting to game: ${error}`, 'error');
      }
    });
  });

  // Set up game events
  gameManager.on('game_update', (gameId, gameState) => {
    io.to(gameId).emit(ActionType.GAME_UPDATE, gameState);
  });
}
