import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Settings, 
  Users,
  Calendar,
  Clock
} from 'lucide-react';

export default function VideoConferencing() {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false);

  const upcomingSessions = [
    {
      id: 1,
      therapist: 'Dr. Sarah Johnson',
      time: '2:00 PM Today',
      type: 'Individual Therapy',
      duration: '50 minutes'
    },
    {
      id: 2,
      therapist: 'Dr. Mike Chen',
      time: '10:00 AM Tomorrow',
      type: 'Group Session',
      duration: '60 minutes'
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
              Video Conferencing
            </h1>
            <p className="text-muted-foreground">
              Connect with licensed therapists and counselors through secure video sessions
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Video Call Interface */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Video Preview */}
                  <div className="relative mb-6 aspect-video rounded-xl bg-gradient-to-br from-primary-soft to-accent overflow-hidden">
                    {!isInCall ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <Video className="h-16 w-16 text-primary mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">
                          Ready for your session
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                          Check your camera and microphone before joining
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-black/80">
                        <div className="text-center text-white">
                          <Users className="h-12 w-12 mx-auto mb-4" />
                          <p className="text-lg font-medium">In Session with Dr. Sarah Johnson</p>
                          <p className="text-sm opacity-80">Individual Therapy Session</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Preview badge */}
                    <div className="absolute top-4 right-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
                      {isVideoOn ? '📹 Camera On' : '📷 Camera Off'}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-4 mb-6">
                    <Button
                      variant={isVideoOn ? "default" : "destructive"}
                      size="sm"
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className="w-12 h-12 rounded-full"
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant={isAudioOn ? "default" : "destructive"}
                      size="sm"
                      onClick={() => setIsAudioOn(!isAudioOn)}
                      className="w-12 h-12 rounded-full"
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Join/End Call Button */}
                  <Button
                    className={`w-full ${isInCall ? 'bg-destructive hover:bg-destructive/90' : 'btn-hero'}`}
                    onClick={() => setIsInCall(!isInCall)}
                  >
                    {isInCall ? (
                      <>
                        <Phone className="mr-2 h-4 w-4 rotate-[135deg]" />
                        End Session
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Join Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-foreground">
                          {session.therapist}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {session.type}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </span>
                          <span>{session.duration}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Join
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle>Session Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Ensure you're in a private, quiet space
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Test your camera and microphone beforehand
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Have a stable internet connection
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Keep your phone on silent mode
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
