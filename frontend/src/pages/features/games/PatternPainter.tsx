import React, { useState, useEffect } from 'react';

const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'];

const PatternPainter: React.FC = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [message, setMessage] = useState('Press Start');
  const [isPlaying, setIsPlaying] = useState(false);

  const nextRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setPlayerSequence([]);
    playSequence(newSequence);
  };

  const playSequence = (seq: number[]) => {
    let i = 0;
    const interval = setInterval(() => {
      setActiveColor(seq[i]);
      setTimeout(() => setActiveColor(null), 500);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setMessage('Your turn');
      }
    }, 1000);
  };

  const handleColorClick = (colorIndex: number) => {
    if (!isPlaying || message !== 'Your turn') return;

    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setMessage('Wrong! Press Start to try again.');
      setIsPlaying(false);
      setSequence([]);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setMessage('Correct! Next round...');
      setTimeout(nextRound, 1000);
    }
  };

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setIsPlaying(true);
    setMessage('Watch the sequence');
    setTimeout(nextRound, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Pattern Painter</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className={`w-24 h-24 rounded-lg cursor-pointer transition-transform ${color} ${
              activeColor === index ? 'transform -translate-y-2' : ''
            }`}
            onClick={() => handleColorClick(index)}
          />
        ))}
      </div>
      <p className="text-lg mb-4">{message}</p>
      {!isPlaying && (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={startGame}
        >
          Start
        </button>
      )}
    </div>
  );
};

export default PatternPainter;
