import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';
import { queryClient } from './lib/queryClient';
import { Toaster } from 'sonner';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import Game from './pages/Game';
import LobbyPage from './pages/LobbyPage';
import NotFound from './pages/not-found';
import { useAudio } from './lib/stores/useAudio';
import { HelmetProvider } from 'react-helmet-async';

// Import Inter font
import '@fontsource/inter';

function App() {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    const hit = new Audio('/sounds/hit.mp3');
    hit.volume = 0.5;

    const success = new Audio('/sounds/success.mp3');
    success.volume = 0.5;

    // Set audio in store
    setBackgroundMusic(bgMusic);
    setHitSound(hit);
    setSuccessSound(success);

    return () => {
      bgMusic.pause();
      hit.pause();
      success.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <GameProvider>
            <Router>
              <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<LobbyPage />} />
                  <Route path="/game/:gameId" element={<Game />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
            <Toaster position="top-right" />
          </GameProvider>
        </SocketProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
