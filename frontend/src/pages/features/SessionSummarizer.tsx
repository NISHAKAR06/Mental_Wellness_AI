import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Clock,
  User,
  Brain,
  TrendingUp,
  Target
} from 'lucide-react';

export default function SessionSummarizer() {
  const [sessionNotes, setSessionNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const pastSummaries = [
    {
      id: 1,
      date: '2024-01-15',
      therapist: 'Dr. Sarah Johnson',
      duration: '50 minutes',
      keyTopics: ['Anxiety Management', 'Coping Strategies', 'Goal Setting'],
      sentiment: 'Positive',
      progress: 'Good'
    },
    {
      id: 2,
      date: '2024-01-08',
      therapist: 'Dr. Sarah Johnson',
      duration: '50 minutes',
      keyTopics: ['Work Stress', 'Sleep Issues', 'Mindfulness'],
      sentiment: 'Neutral',
      progress: 'Stable'
    }
  ];

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  const mockSummary = {
    mainThemes: ['Emotional Regulation', 'Stress Management', 'Personal Growth'],
    keyInsights: [
      'Patient showed improved awareness of stress triggers',
      'Demonstrated effective use of breathing techniques',
      'Expressed willingness to try new coping strategies'
    ],
    actionItems: [
      'Practice daily mindfulness for 10 minutes',
      'Use journaling to track mood patterns',
      'Schedule regular sleep routine'
    ],
    nextSessionGoals: [
      'Discuss progress with mindfulness practice',
      'Explore workplace stress management',
      'Review mood tracking results'
    ]
  };

  return (
    <div className="min-h-screen bg-background">
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Session Summarizer
            </h1>
            <p className="text-muted-foreground">
              AI-powered analysis and summarization of therapy sessions
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Session Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter your session notes here... The AI will analyze and generate insights from your therapy session content."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {sessionNotes.length}/2000 characters
                    </p>
                    
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={!sessionNotes.trim() || isGenerating}
                      className="btn-hero"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Past Summaries */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastSummaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {summary.therapist}
                            </span>
                          </div>
                          <Badge variant="outline">{summary.progress}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {summary.date} • {summary.duration}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {summary.keyTopics.slice(0, 2).map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {summary.keyTopics.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{summary.keyTopics.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Generated Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="wellness-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Generated Summary
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Themes */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Main Themes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mockSummary.mainThemes.map((theme) => (
                        <Badge key={theme} className="bg-primary-soft text-primary">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Key Insights</h3>
                    <ul className="space-y-2">
                      {mockSummary.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-bold">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Action Items
                    </h3>
                    <ul className="space-y-2">
                      {mockSummary.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-4 h-4 rounded-sm border border-primary mt-0.5" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Session Goals */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Next Session Goals</h3>
                    <div className="space-y-2">
                      {mockSummary.nextSessionGoals.map((goal, index) => (
                        <div key={index} className="p-3 rounded-lg bg-accent/30">
                          <p className="text-sm text-foreground">{goal}</p>
                        </div>
                      ))}
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
