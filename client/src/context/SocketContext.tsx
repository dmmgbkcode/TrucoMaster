import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnectToGame: (username: string, gameId: string) => void;
  clearGameData: () => void; // Add function to clear saved game data
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnectToGame: () => {}, // No-op initial implementation
  clearGameData: () => {}    // No-op initial implementation
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Initialize from localStorage if available
  const [lastGameId, setLastGameId] = useState<string | null>(
    localStorage.getItem('truco_game_id') || null
  );
  const [lastUsername, setLastUsername] = useState<string | null>(
    localStorage.getItem('truco_username') || null
  );
  
  // Function to try to reconnect to a game
  const reconnectToGame = (username: string, gameId: string) => {
    if (!socket) return;
    
    // Save these details in case we need to reconnect later
    setLastGameId(gameId);
    setLastUsername(username);
    
    // Also save to localStorage
    localStorage.setItem('truco_game_id', gameId);
    localStorage.setItem('truco_username', username);
    
    // Try to reconnect to the game
    socket.emit('reconnect_game', { username, gameId });
    
    toast.info('Tentando reconectar ao jogo...');
    console.log(`Trying to reconnect to game ${gameId} as ${username}`);
  };
  
  useEffect(() => {
    // Initialize socket connection with reconnection options
    const socketInstance = io({
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'] // Try websocket first, fall back to polling
    });
    
    // Connection established
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected with ID:', socketInstance.id);
      
      // If we have saved game info, try to reconnect automatically
      if (lastGameId && lastUsername) {
        socketInstance.emit('reconnect_game', { 
          username: lastUsername, 
          gameId: lastGameId 
        });
        console.log(`Auto-reconnecting to game ${lastGameId} as ${lastUsername}`);
      }
    });
    
    // Connection lost
    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`Socket disconnected. Reason: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        toast.error('Conexão fechada pelo servidor. Tentando reconectar...');
        socketInstance.connect(); // Manually reconnect
      } else {
        toast.error('Conexão perdida com o servidor. Tentando reconectar automaticamente...');
      }
    });
    
    // Reconnect attempt
    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt: ${attempt}`);
      if (attempt > 5) {
        toast.error(`Tentativa de reconexão ${attempt}/10...`);
      }
    });
    
    // Reconnect successful
    socketInstance.io.on('reconnect', () => {
      console.log('Socket reconnected!');
      toast.success('Reconectado ao servidor!');
    });
    
    // Reconnection failed
    socketInstance.io.on('reconnect_failed', () => {
      console.log('Socket reconnection failed');
      toast.error('Falha ao reconectar ao servidor. Por favor, recarregue a página.');
    });
    
    // Connection error
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Erro de conexão com o servidor. Tentando novamente...');
    });
    
    // Listen for error messages from server
    socketInstance.on('error', (data: { message: string }) => {
      toast.error(data.message);
      console.error('Server error:', data.message);
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [lastGameId, lastUsername]);
  
  // Function to clear saved game data (used when leaving a game)
  const clearGameData = () => {
    localStorage.removeItem('truco_game_id');
    localStorage.removeItem('truco_username');
    setLastGameId(null);
    setLastUsername(null);
    console.log('Game data cleared');
  };
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnectToGame, clearGameData }}>
      {children}
    </SocketContext.Provider>
  );
};
