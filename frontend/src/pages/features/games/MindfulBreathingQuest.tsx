import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MindfulBreathingQuest: React.FC = () => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathState, setBreathState] = useState('inhale');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      const breathCycle = () => {
        setBreathState('inhale');
        timer = setTimeout(() => {
          setBreathState('exhale');
        }, 4000);
      };
      breathCycle();
      const interval = setInterval(breathCycle, 8000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isBreathing]);

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <h2 className="text-2xl font-bold mb-4">Mindful Breathing Quest</h2>
      <div className="relative w-64 h-64 flex items-center justify-center">
        <motion.div
          className="absolute w-48 h-48 bg-blue-500 rounded-full"
          animate={{
            scale: isBreathing ? (breathState === 'inhale' ? 1.2 : 0.8) : 1,
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
      </div>
      {isBreathing && (
        <p className="text-2xl mt-4">
          {breathState === 'inhale' ? 'Inhale' : 'Exhale'}
        </p>
      )}
      <button
        className="mt-8 px-4 py-2 bg-blue-500 text-white rounded-lg"
        onClick={() => setIsBreathing(!isBreathing)}
      >
        {isBreathing ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};

export default MindfulBreathingQuest;
