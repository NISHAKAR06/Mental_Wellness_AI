import React from 'react';
import { Brain, Heart, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingTherapyProps {
  phase: 'connecting' | 'calibrating' | 'ready' | 'analyzing';
  message?: string;
}

export default function LoadingTherapy({ phase, message }: LoadingTherapyProps) {
  const getPhaseContent = () => {
    switch (phase) {
      case 'connecting':
        return {
          icon: Brain,
          title: "Connecting Your Mind",
          description: "Establishing a safe therapeutic space for you...",
          color: "text-blue-600 dark:text-blue-400"
        };
      case 'calibrating':
        return {
          icon: Heart,
          title: "Calibrating Emotional Sensitivity",
          description: "Tuning our AI to understand your unique emotional language...",
          color: "text-red-600 dark:text-red-400"
        };
      case 'ready':
        return {
          icon: Activity,
          title: "Your Therapy Session is Ready",
          description: "All systems are aligned for your healing journey...",
          color: "text-green-600 dark:text-green-400"
        };
      case 'analyzing':
        return {
          icon: Sparkles,
          title: "Processing With Care",
          description: "Applying therapeutic insights to your responses...",
          color: "text-purple-600 dark:text-purple-400"
        };
      default:
        return {
          icon: Brain,
          title: "Preparing Your Session",
          description: "Setting up the perfect environment for support...",
          color: "text-blue-600 dark:text-blue-400"
        };
    }
  };

  const content = getPhaseContent();
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[300px] p-8"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-6"
      >
        <Icon className={`w-16 h-16 ${content.color}`} />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl font-semibold text-center mb-3 text-foreground"
      >
        {content.title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center text-muted-foreground max-w-md"
      >
        {content.description}
      </motion.p>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4 p-3 rounded-lg bg-primary-soft/30 text-primary text-center max-w-sm"
        >
          {message}
        </motion.div>
      )}

      <motion.div
        className="mt-8 flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
