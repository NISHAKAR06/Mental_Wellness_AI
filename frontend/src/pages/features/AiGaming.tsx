import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Gamepad2, 
  Play, 
  Trophy, 
  Target,
  Heart,
  Brain,
  Zap,
  Star
} from 'lucide-react';
import CognitiveReframingCards from './games/CognitiveReframingCards';
import MindfulBreathingQuest from './games/MindfulBreathingQuest';
import MindfulMaze from './games/MindfulMaze';
import PatternPainter from './games/PatternPainter';

export default function AiGaming() {
  const { t } = useLanguage();
  const [currentGame, setCurrentGame] = useState(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentGame && gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentGame]);

  const handleCloseGame = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setCurrentGame(null);
  };

  const games = [
    {
      id: 1,
      title: t('gaming.mindful_breathing_quest'),
      description: t('gaming.mindful_breathing_quest_desc'),
      difficulty: t('gaming.beginner'),
      category: t('gaming.relaxation'),
      icon: '🌬️',
      color: 'from-blue-500 to-cyan-500',
      progress: 75,
      completed: false,
      component: MindfulBreathingQuest
    },
    {
      id: 2,
      title: t('gaming.cognitive_reframing'),
      description: t('gaming.cognitive_reframing_desc'),
      difficulty: t('gaming.intermediate'),
      category: t('gaming.cbt'),
      icon: '🔄',
      color: 'from-purple-500 to-pink-500',
      progress: 45,
      completed: false,
      component: CognitiveReframingCards
    },
    {
      id: 3,
      title: t('gaming.mindful_maze'),
      description: t('gaming.mindful_maze_desc'),
      difficulty: t('gaming.intermediate'),
      category: t('gaming.focus'),
      icon: '🗺️',
      color: 'from-red-500 to-orange-500',
      progress: 10,
      completed: false,
      component: MindfulMaze
    },
    {
      id: 4,
      title: t('gaming.pattern_painter'),
      description: t('gaming.pattern_painter_desc'),
      difficulty: t('gaming.beginner'),
      category: t('gaming.creativity'),
      icon: '🎨',
      color: 'from-green-500 to-emerald-500',
      progress: 20,
      completed: false,
      component: PatternPainter
    }
  ];

  return (
    <div className="min-h-screen bg-background">
        <main className="flex-1 p-6" ref={topRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('gaming.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('gaming.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6">
            {/* Games Grid */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="wellness-card group cursor-pointer hover:border-primary/20 h-full flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-grow">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                          {game.icon}
                        </div>
                        
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {game.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                          {game.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-primary bg-primary-soft px-2 py-1 rounded-full">
                            {game.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {game.difficulty}
                          </span>
                        </div>
                        
                        <Button 
                          className={`w-full mt-auto ${game.completed ? 'bg-green-600 hover:bg-green-700' : 'btn-hero'}`}
                          onClick={() => setCurrentGame(game)}
                        >
                          {game.completed ? (
                            <>
                              <Trophy className="mr-2 h-4 w-4" />
                              {t('gaming.completed')}
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {t('gaming.play')}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Game Demo */}
              {currentGame && (
                <motion.div
                  ref={gameRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="wellness-card border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5" />
                        {currentGame.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video rounded-xl bg-gradient-to-br from-primary-soft to-accent flex items-center justify-center mb-4">
                        <currentGame.component />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCloseGame}
                        >
                          {t('gaming.close')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
    </div>
  );
}
