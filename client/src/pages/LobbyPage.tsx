import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Lobby from '@/components/Lobby';
import { GameRoom } from '@shared/types';
import { useSocket } from '@/context/SocketContext';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/stores/useAudio';
import { Button } from '@/components/ui/button';

const LobbyPage = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const { socket, isConnected } = useSocket();
  const { toggleMute, isMuted, backgroundMusic } = useAudio();
  
  // When component mounts, fetch rooms and start background music
  useEffect(() => {
    if (!socket) return;
    
    // Get available rooms
    socket.emit('get_rooms');
    
    // Listen for room updates
    socket.on('rooms_update', (updatedRooms: GameRoom[]) => {
      setRooms(updatedRooms);
    });
    
    // Play background music
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(err => console.log('Audio play prevented:', err));
    }
    
    return () => {
      socket.off('rooms_update');
    };
  }, [socket, backgroundMusic, isMuted]);
  
  return (
    <motion.div 
      className="min-h-screen bg-green-800 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>Truco Online - DM</title>
      </Helmet>
      
      {/* Header */}
      <header className="bg-green-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Truco Online - DM</h1>
          <Button variant="outline" className="text-white border-white" onClick={toggleMute}>
            {isMuted ? "Ativar Som" : "Silenciar"}
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Conectando ao servidor...</h2>
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        ) : (
          <Lobby rooms={rooms} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-green-900 text-white text-center p-4 mt-auto">
        <div className="container mx-auto">
          <p className="text-sm">
            Truco Online com marca d'água DM - Regras Paulistas © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default LobbyPage;
