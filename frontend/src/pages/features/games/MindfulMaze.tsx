import React, { useState, useEffect } from 'react';

const mazeLayout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
];

const MindfulMaze: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState({ x: 1, y: 1 });
  const [win, setWin] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (win) return;
    const { x, y } = playerPosition;
    let newX = x;
    let newY = y;

    switch (e.key) {
      case 'ArrowUp':
        newY--;
        break;
      case 'ArrowDown':
        newY++;
        break;
      case 'ArrowLeft':
        newX--;
        break;
      case 'ArrowRight':
        newX++;
        break;
      default:
        return;
    }

    if (
      mazeLayout[newY] &&
      mazeLayout[newY][newX] !== undefined &&
      mazeLayout[newY][newX] !== 1
    ) {
      setPlayerPosition({ x: newX, y: newY });
      if (mazeLayout[newY][newX] === 2) {
        setWin(true);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerPosition, win]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Mindful Maze</h2>
      <div className="grid grid-cols-10 gap-1 bg-gray-300 p-2 rounded-lg">
        {mazeLayout.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                cell === 1 ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {playerPosition.x === x && playerPosition.y === y && (
                <div className="w-6 h-6 bg-blue-500 rounded-full" />
              )}
              {cell === 2 && (
                <div className="w-6 h-6 bg-green-500 rounded-full" />
              )}
            </div>
          ))
        )}
      </div>
      {win && <p className="mt-4 text-2xl font-bold text-green-500">You Win!</p>}
    </div>
  );
};

export default MindfulMaze;
