import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Camera, 
  Mic, 
  Activity, 
  TrendingUp,
  Heart,
  Smile,
  Meh,
  Frown
} from 'lucide-react';

export default function EmotionMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const emotions = [
    { name: 'Happy', value: 75, color: 'bg-green-500', icon: Smile },
    { name: 'Neutral', value: 15, color: 'bg-yellow-500', icon: Meh },
    { name: 'Anxious', value: 8, color: 'bg-orange-500', icon: Frown },
    { name: 'Stressed', value: 2, color: 'bg-red-500', icon: Frown }
  ];

  const vitalSigns = [
    { name: 'Heart Rate', value: '72 BPM', status: 'Normal', color: 'text-green-600' },
    { name: 'Voice Stress', value: 'Low', status: 'Calm', color: 'text-blue-600' },
    { name: 'Facial Tension', value: 'Minimal', status: 'Relaxed', color: 'text-green-600' }
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
              AI Emotion Monitoring
            </h1>
            <p className="text-muted-foreground">
              Real-time analysis of your emotional state using facial recognition and voice analysis
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monitoring Interface */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Live Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Camera View */}
                  <div className="relative mb-6 aspect-video rounded-xl bg-gradient-to-br from-primary-soft to-accent overflow-hidden">
                    <div className="flex h-full flex-col items-center justify-center">
                      <Camera className="h-16 w-16 text-primary mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        {isMonitoring ? 'Monitoring Active' : 'Ready to Monitor'}
                      </p>
                      <p className="text-sm text-muted-foreground text-center max-w-sm">
                        {isMonitoring 
                          ? 'AI is analyzing your facial expressions and voice patterns'
                          : 'Click start to begin emotion detection'
                        }
                      </p>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${isMonitoring ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>
                        <Camera className="h-3 w-3" />
                        Camera
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${isMonitoring ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>
                        <Mic className="h-3 w-3" />
                        Audio
                      </div>
                    </div>

                    {isMonitoring && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium">Analyzing</span>
                      </div>
                    )}
                  </div>

                  {/* Control Button */}
                  <Button
                    className={`w-full ${isMonitoring ? 'bg-destructive hover:bg-destructive/90' : 'btn-hero'}`}
                    onClick={() => setIsMonitoring(!isMonitoring)}
                  >
                    {isMonitoring ? (
                      <>
                        Stop Monitoring
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Start Monitoring
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Emotion Analysis */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Emotion Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emotions.map((emotion) => {
                      const Icon = emotion.icon;
                      return (
                        <div key={emotion.name}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                {emotion.name}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {emotion.value}%
                            </span>
                          </div>
                          <Progress value={emotion.value} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Vital Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vitalSigns.map((sign) => (
                      <div key={sign.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-foreground">{sign.name}</p>
                          <p className="text-sm text-muted-foreground">{sign.status}</p>
                        </div>
                        <div className={`font-mono font-bold ${sign.color}`}>
                          {sign.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="font-medium text-green-800 dark:text-green-400 mb-1">
                        Overall Wellbeing: Good 😊
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Your emotional state appears stable and positive. Keep up the good work!
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                        Recommendation
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Consider practicing deep breathing exercises to maintain this positive state.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
