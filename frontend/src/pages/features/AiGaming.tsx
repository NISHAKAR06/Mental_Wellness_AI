import { useState } from 'react';
import { motion } from 'framer-motion';
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

export default function AiGaming() {
  const [currentGame, setCurrentGame] = useState(null);

  const games = [
    {
      id: 1,
      title: 'Mindful Breathing Quest',
      description: 'Guide your character through peaceful landscapes using breathing techniques',
      difficulty: 'Beginner',
      category: 'Relaxation',
      icon: '🌬️',
      color: 'from-blue-500 to-cyan-500',
      progress: 75,
      completed: false
    },
    {
      id: 2,
      title: 'Emotion Detective',
      description: 'Identify and understand different emotions in various scenarios',
      difficulty: 'Intermediate',
      category: 'Emotional Intelligence',
      icon: '🕵️',
      color: 'from-purple-500 to-pink-500',
      progress: 45,
      completed: false
    },
    {
      id: 3,
      title: 'Stress Buster Arena',
      description: 'Battle stress monsters using coping strategies and positive thoughts',
      difficulty: 'Advanced',
      category: 'Stress Management',
      icon: '⚔️',
      color: 'from-red-500 to-orange-500',
      progress: 100,
      completed: true
    },
    {
      id: 4,
      title: 'Gratitude Garden',
      description: 'Grow a beautiful garden by practicing gratitude and positive thinking',
      difficulty: 'Beginner',
      category: 'Positivity',
      icon: '🌱',
      color: 'from-green-500 to-emerald-500',
      progress: 20,
      completed: false
    }
  ];

  const achievements = [
    { name: 'First Steps', description: 'Complete your first game', earned: true },
    { name: 'Mindful Master', description: 'Complete 5 breathing exercises', earned: true },
    { name: 'Emotion Expert', description: 'Identify 20 different emotions', earned: false },
    { name: 'Stress Warrior', description: 'Win 10 stress battles', earned: false }
  ];

  return (
    <div className="min-h-screen bg-background">
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              AI-Powered Gaming
            </h1>
            <p className="text-muted-foreground">
              Interactive games designed to improve mental health through engaging gameplay
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Games Grid */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="wellness-card group cursor-pointer hover:border-primary/20">
                      <CardContent className="p-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                          {game.icon}
                        </div>
                        
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {game.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">{game.progress}%</span>
                          </div>
                          <Progress value={game.progress} className="h-2" />
                        </div>
                        
                        <Button 
                          className={`w-full ${game.completed ? 'bg-green-600 hover:bg-green-700' : 'btn-hero'}`}
                          onClick={() => setCurrentGame(game)}
                        >
                          {game.completed ? (
                            <>
                              <Trophy className="mr-2 h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {game.progress > 0 ? 'Continue' : 'Start Game'}
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
                        <div className="text-center">
                          <div className="text-6xl mb-4">{currentGame.icon}</div>
                          <p className="text-lg font-medium text-foreground mb-2">
                            Game Loading...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentGame.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="btn-hero flex-1">
                          <Play className="mr-2 h-4 w-4" />
                          Start Playing
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentGame(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Sidebar Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Player Stats */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-primary-soft">
                    <div className="text-3xl font-bold text-primary mb-1">1,247</div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-accent/30">
                      <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <div className="font-bold text-foreground">85%</div>
                      <p className="text-xs text-muted-foreground">Wellness Score</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/30">
                      <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                      <div className="font-bold text-foreground">7</div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.name}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          achievement.earned 
                            ? 'bg-primary-soft border border-primary/20' 
                            : 'bg-accent/30 opacity-60'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${achievement.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {achievement.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Challenge */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Daily Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary-soft to-accent">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="font-medium text-foreground mb-1">
                      Practice Gratitude
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      List 3 things you're grateful for today
                    </p>
                    <Button size="sm" className="btn-hero">
                      Start Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
