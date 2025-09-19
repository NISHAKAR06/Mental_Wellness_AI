import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Moon, 
  Heart, 
  Footprints,
  Timer,
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Award
} from 'lucide-react';

export default function Lifestyle() {

  const todayStats = {
    steps: 8456,
    stepsGoal: 10000,
    heartRate: 72,
    sleep: 7.5,
    sleepGoal: 8,
    calories: 1950,
    caloriesGoal: 2200,
    water: 6,
    waterGoal: 8
  };

  const activities = [
    {
      id: 1,
      name: 'Morning Walk',
      type: 'cardio',
      duration: '30 min',
      calories: 120,
      time: '7:00 AM',
      icon: '🚶',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 2,
      name: 'Meditation',
      type: 'mindfulness',
      duration: '15 min',
      calories: 0,
      time: '8:00 AM',
      icon: '🧘',
      color: 'from-purple-500 to-violet-500'
    },
    {
      id: 3,
      name: 'Yoga Session',
      type: 'flexibility',
      duration: '45 min',
      calories: 180,
      time: '6:30 PM',
      icon: '🧘‍♀️',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const weeklyGoals = [
    { name: 'Exercise 5 times', current: 3, target: 5, unit: 'sessions' },
    { name: 'Sleep 8 hours daily', current: 6, target: 7, unit: 'days' },
    { name: 'Meditate daily', current: 4, target: 7, unit: 'days' },
    { name: 'Walk 10k steps', current: 5, target: 7, unit: 'days' }
  ];

  const healthMetrics = [
    {
      name: 'Heart Rate',
      value: todayStats.heartRate,
      unit: 'BPM',
      status: 'Normal',
      icon: Heart,
      color: 'text-red-500',
      trend: 'stable'
    },
    {
      name: 'Steps',
      value: todayStats.steps.toLocaleString(),
      unit: 'steps',
      status: `${Math.round((todayStats.steps / todayStats.stepsGoal) * 100)}% of goal`,
      icon: Footprints,
      color: 'text-blue-500',
      trend: 'up'
    },
    {
      name: 'Sleep',
      value: todayStats.sleep,
      unit: 'hours',
      status: `${Math.round((todayStats.sleep / todayStats.sleepGoal) * 100)}% of goal`,
      icon: Moon,
      color: 'text-indigo-500',
      trend: 'down'
    },
    {
      name: 'Active Time',
      value: '2.5',
      unit: 'hours',
      status: 'Above average',
      icon: Activity,
      color: 'text-green-500',
      trend: 'up'
    }
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
              Lifestyle Tools
            </h1>
            <p className="text-muted-foreground">
              Track your physical health, sleep patterns, and daily activities for better mental wellness
            </p>
          </motion.div>

          <div className="grid gap-6">
            {/* Health Metrics Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {healthMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="wellness-card">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`h-5 w-5 ${metric.color}`} />
                            <div className={`text-xs ${
                              metric.trend === 'up' ? 'text-green-600' : 
                              metric.trend === 'down' ? 'text-red-600' : 
                              'text-muted-foreground'
                            }`}>
                              {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-foreground">
                                {metric.value}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {metric.unit}
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              {metric.status}
                            </p>
                            
                            <p className="text-xs font-medium text-foreground">
                              {metric.name}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Today's Activities */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="wellness-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Today's Activities
                      </CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-accent/30"
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${activity.color} flex items-center justify-center text-xl`}>
                          {activity.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {activity.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            <span>{activity.duration}</span>
                            <span>•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                        
                        {activity.calories > 0 && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {activity.calories}
                            </p>
                            <p className="text-xs text-muted-foreground">cal</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Weekly Goals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="wellness-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Weekly Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklyGoals.map((goal) => (
                      <div key={goal.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {goal.name}
                          </span>
                          <span className="text-muted-foreground">
                            {goal.current}/{goal.target} {goal.unit}
                          </span>
                        </div>
                        <Progress 
                          value={(goal.current / goal.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Wellness Score */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <Card className="wellness-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Wellness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-accent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.85)}`}
                          className="text-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">85</div>
                          <div className="text-xs text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-lg font-semibold text-foreground mb-1">
                      Excellent
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your lifestyle habits are supporting great mental wellness
                    </p>
                    
                    <Button size="sm" className="btn-hero">
                      View Details
                    </Button>
                  </CardContent>
                </Card>

                {/* Achievement */}
                <Card className="wellness-card border-2 border-primary/20 bg-primary-soft">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-primary mb-1">
                      Achievement Unlocked!
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      7-day meditation streak completed
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      View All Achievements
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
    </div>
  );
}
