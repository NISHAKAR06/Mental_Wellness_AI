import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Camera,
  Mic,
  Activity,
  TrendingUp,
  Heart,
  Smile,
  Meh,
  Frown,
} from "lucide-react";

// AIInsights Component
const AIInsights = ({
  emotions,
  voiceStress,
  facialTension,
}: {
  emotions: Array<{ name: string; value: number; color: string; icon: any }>;
  voiceStress: { value: string; status: string; color: string };
  facialTension: { value: string; status: string; color: string };
}) => {
  // Analyze emotional state and generate insights
  const analyzeEmotions = () => {
    const dominantEmotion = emotions.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );

    const happiness = emotions.find(e => e.name === "Happy")?.value || 0;
    const anxiety = emotions.find(e => e.name === "Anxious")?.value || 0;
    const stress = emotions.find(e => e.name === "Stressed")?.value || 0;

    // Overall wellbeing assessment
    let wellbeing = "Neutral";
    let emoji = "😐";
    let color = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    let titleColor = "text-blue-800 dark:text-blue-400";

    if (happiness > 60 && anxiety < 20 && stress < 20) {
      wellbeing = "Excellent";
      emoji = "😊";
      color = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      titleColor = "text-green-800 dark:text-green-400";
    } else if (anxiety > 40 || stress > 40) {
      wellbeing = "Needs Attention";
      emoji = "😟";
      color = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      titleColor = "text-red-800 dark:text-red-400";
    } else if (happiness > 40) {
      wellbeing = "Good";
      emoji = "😊";
      color = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      titleColor = "text-green-800 dark:text-green-400";
    }

    // Generate personalized insights
    let insights = "";
    let recommendations = [];

    if (voiceStress.value === "Medium" || voiceStress.value === "High" || voiceStress.value === "Very High") {
      insights += "Your voice analysis shows elevated stress levels. ";
      recommendations.push("Try deep breathing exercises to calm your vocal tension.");
    }

    if (facialTension.value === "High" || facialTension.value === "Very High") {
      insights += "Facial tension detected suggests physical stress. ";
      recommendations.push("Practice face relaxation exercises to release muscle tension.");
    }

    if (dominantEmotion.name === "Happy" && happiness > 50) {
      insights += "Strong positive emotions detected! ";
      recommendations.push("Keep engaging in whatever is making you feel this good!");
    }

    if (dominantEmotion.name === "Anxious" || dominantEmotion.name === "Stressed") {
      insights += "Stress indicators suggest you might benefit from relaxation techniques. ";
      recommendations.push("Consider taking a short break or practicing mindfulness.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Your emotional state appears balanced and stable.");
    }

    return { wellbeing, emoji, color, titleColor, insights, recommendations };
  };

  const analysis = analyzeEmotions();

  return (
    <div className="space-y-3 text-sm">
      <div className={`p-3 rounded-lg ${analysis.color} border`}>
        <p className={`font-medium ${analysis.titleColor} mb-1`}>
          Overall Wellbeing: {analysis.wellbeing} {analysis.emoji}
        </p>
        <p className={`text-sm ${analysis.titleColor.replace('text-', 'text-').replace('-800', '-700').replace('-400', '-300')}`}>
          {analysis.insights || "Your emotional state appears balanced and stable."}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
        <p className="font-medium text-orange-800 dark:text-orange-400 mb-1">
          Recommendation
        </p>
        <ul className="text-orange-700 dark:text-orange-300 text-sm">
          {analysis.recommendations.map((rec, index) => (
            <li key={index} className="mb-1">• {rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function EmotionMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState({
    stress_level: 0,
    facial_anxious: 0,
    facial_stressed: 0
  });
  const [emotions, setEmotions] = useState([
    { name: "Happy", value: 0, color: "bg-green-500", icon: Smile },
    { name: "Neutral", value: 0, color: "bg-yellow-500", icon: Meh },
    { name: "Anxious", value: 0, color: "bg-orange-500", icon: Frown },
    { name: "Stressed", value: 0, color: "bg-red-500", icon: Frown },
  ]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const ws = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setError(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Camera permission denied. Please allow camera access to use this feature."
        );
        setIsMonitoring(false);
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleToggleMonitoring = () => {
    setIsMonitoring((prev) => !prev);
  };

  useEffect(() => {
    if (isMonitoring) {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/emotions/`;
      ws.current = new WebSocket(wsUrl);

      startVideo(); // Start video after WebSocket is set up

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.emotions) {
          const { happy, neutral, anxious, stressed } = data.emotions;
          setEmotions([
            { name: "Happy", value: happy, color: "bg-green-500", icon: Smile },
            {
              name: "Neutral",
              value: neutral,
              color: "bg-yellow-500",
              icon: Meh,
            },
            {
              name: "Anxious",
              value: anxious,
              color: "bg-orange-500",
              icon: Frown,
            },
            {
              name: "Stressed",
              value: stressed,
              color: "bg-red-500",
              icon: Frown,
            },
          ]);
        }
        if (data.voice_analysis) {
          setVoiceAnalysis(data.voice_analysis);
        }
      };

      return () => {
        stopVideo();
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
        if (ws.current) {
          ws.current.close();
        }
        setEmotions([
          { name: "Happy", value: 0, color: "bg-green-500", icon: Smile },
          { name: "Neutral", value: 0, color: "bg-yellow-500", icon: Meh },
          { name: "Anxious", value: 0, color: "bg-orange-500", icon: Frown },
          { name: "Stressed", value: 0, color: "bg-red-500", icon: Frown },
        ]);
      };
    }
  }, [isMonitoring]);

  // Separate useEffect for MediaRecorder initialization
  useEffect(() => {
    if (ws.current && isMonitoring && videoRef.current?.srcObject) {
      mediaRecorderRef.current = new MediaRecorder(
        videoRef.current.srcObject as MediaStream
      );
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          ws.current &&
          ws.current.readyState === WebSocket.OPEN
        ) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(",")[1];
            ws.current.send(JSON.stringify({ audio: base64Audio }));
          };
          reader.readAsDataURL(event.data);
        }
      };
      mediaRecorderRef.current.start(1000); // Send audio data every second
    }
  }, [isMonitoring, videoRef.current?.srcObject]);

  useEffect(() => {
    if (isMonitoring && videoRef.current) {
      intervalRef.current = setInterval(() => {
        if (
          videoRef.current &&
          videoRef.current.videoWidth > 0 &&
          ws.current &&
          ws.current.readyState === WebSocket.OPEN
        ) {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg");
            ws.current.send(JSON.stringify({ image: dataUrl }));
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring]);

  // Calculate vital signs from voice analysis data
  const getVoiceStressLevel = () => {
    const stress = voiceAnalysis.stress_level;
    if (stress < 25) return { value: "Low", status: "Calm", color: "text-green-600" };
    if (stress < 50) return { value: "Medium", status: "Moderate", color: "text-yellow-600" };
    if (stress < 75) return { value: "High", status: "Elevated", color: "text-orange-600" };
    return { value: "Very High", status: "Critical", color: "text-red-600" };
  };

  const getFacialTensionLevel = () => {
    const facialStress = Math.max(voiceAnalysis.facial_anxious, voiceAnalysis.facial_stressed);
    if (facialStress < 25) return { value: "Minimal", status: "Relaxed", color: "text-green-600" };
    if (facialStress < 50) return { value: "Moderate", status: "Normal", color: "text-blue-600" };
    if (facialStress < 75) return { value: "High", status: "Tensed", color: "text-orange-600" };
    return { value: "Very High", status: "Stressed", color: "text-red-600" };
  };

  const voiceStress = getVoiceStressLevel();
  const facialTension = getFacialTensionLevel();

  const vitalSigns = [
    {
      name: "Voice Stress",
      value: voiceStress.value,
      status: voiceStress.status,
      color: voiceStress.color,
    },
    {
      name: "Facial Tension",
      value: facialTension.value,
      status: facialTension.status,
      color: facialTension.color,
    },
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
            Real-time analysis of your emotional state using facial recognition
            and voice analysis
          </p>
          <Button
            className={`mt-4 ${
              isMonitoring
                ? "bg-destructive hover:bg-destructive/90"
                : "btn-hero"
            }`}
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? (
              <>Stop Monitoring</>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Start Monitoring
              </>
            )}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column */}
          <div className="flex flex-col gap-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              <Card className="wellness-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Video Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-xl bg-gradient-to-br from-primary-soft to-accent overflow-hidden">
                    {error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white p-4">
                        {error}
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      className="w-full h-full rounded-md"
                      autoPlay
                      muted
                    ></video>
                  </div>
                  <Button
                    className={`w-full mt-4 ${
                      isMonitoring
                        ? "bg-destructive hover:bg-destructive/90"
                        : "btn-hero"
                    }`}
                    onClick={handleToggleMonitoring}
                  >
                    {isMonitoring ? (
                      <>Stop Monitoring</>
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <Card className="wellness-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Vital Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vitalSigns.map((sign) => (
                      <div
                        key={sign.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {sign.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sign.status}
                          </p>
                        </div>
                        <div className={`font-mono font-bold ${sign.color}`}>
                          {sign.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              <Card className="wellness-card h-full">
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
                              {emotion.value.toFixed(2)}%
                            </span>
                          </div>
                          <Progress value={emotion.value} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <Card className="wellness-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AIInsights
                    emotions={emotions}
                    voiceStress={voiceStress}
                    facialTension={facialTension}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
