import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LoadingTherapy from "@/components/ui/LoadingTherapy";
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

// Enhanced AIInsights Component that properly analyzes emotion data
const AIInsights = ({
  emotions,
  voiceStress,
  facialTension,
}: {
  emotions: Array<{ name: string; value: number; color: string; icon: any }>;
  voiceStress: { value: string; status: string; color: string };
  facialTension: { value: string; status: string; color: string };
}) => {
  // Check if we have meaningful data
  const totalEmotions = emotions.reduce(
    (sum, emotion) => sum + emotion.value,
    0
  );
  const hasEmotionData = totalEmotions > 5;

  // If no data yet, show loading state
  if (!hasEmotionData) {
    return (
      <div className="space-y-3 text-sm">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-800 dark:text-blue-400 mb-1">
            Overall Wellbeing: Starting 🧠
          </p>
          <p className="text-sm opacity-80">
            Analyzing your facial expressions and voice patterns...
          </p>
        </div>
        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <p className="font-medium text-orange-800 dark:text-orange-400 mb-2">
            Getting Started
          </p>
          <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-1">
            <li>• Allow camera and microphone access</li>
            <li>• Begin monitoring to see analysis</li>
            <li>• Insights will update in real-time</li>
          </ul>
        </div>
      </div>
    );
  }

  // Analyze all emotions
  console.log(
    "Emotion data for AI insights:",
    emotions.map((e) => `${e.name}: ${e.value.toFixed(1)}%`)
  );

  // Find dominant emotion
  const dominantEmotion = [...emotions].sort((a, b) => b.value - a.value)[0];

  // Categorize emotions by type
  const happyEmotions = emotions
    .filter(
      (e) =>
        e.color.includes("green") &&
        (e.name.toLowerCase().includes("happy") ||
          e.name.toLowerCase().includes("joy"))
    )
    .reduce((sum, e) => sum + e.value, 0);

  const negativeEmotions = emotions
    .filter((e) => e.color.includes("red") || e.color.includes("orange"))
    .reduce((sum, e) => sum + e.value, 0);

  const neutralEmotions = emotions
    .filter((e) => e.color.includes("yellow") || e.color.includes("blue"))
    .reduce((sum, e) => sum + e.value, 0);

  // Calculate percentages
  const happyPercent = (happyEmotions / totalEmotions) * 100;
  const negativePercent = (negativeEmotions / totalEmotions) * 100;

  console.log(
    `Emotion analysis: Happy:${happyPercent.toFixed(
      1
    )}% Negative:${negativePercent.toFixed(1)}% Dominant:${
      dominantEmotion.name
    }`
  );

  // Determine wellbeing state
  let wellbeing = "Balanced";
  let emoji = "😐";
  let insights = "";
  let recommendations = [];
  let wellbeingColor =
    "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400";

  if (happyPercent > 60 && negativePercent < 25) {
    wellbeing = "Excellent";
    emoji = "😊";
    wellbeingColor =
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400";
    insights = `Wonderful! Your emotional state is strongly positive with ${happyPercent.toFixed(
      1
    )}% happiness indicators.`;
    recommendations = [
      "Keep engaging in whatever is making you feel so good!",
      "Consider sharing your positive energy with others.",
      "Take mental notes of what brings you joy.",
    ];
  } else if (happyPercent > 40 && negativePercent < 35) {
    wellbeing = "Good";
    emoji = "😊";
    wellbeingColor =
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400";
    insights = `Your emotional state is positive with ${happyPercent.toFixed(
      1
    )}% positive emotions detected.`;
    recommendations = [
      "You're doing well emotionally! Keep it up.",
      "Consider activities that maintain this good state.",
    ];
  } else if (negativePercent > 40) {
    wellbeing = "Needs Attention";
    emoji = "😟";
    wellbeingColor =
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400";
    insights = `I'm detecting elevated stress indicators (${negativePercent.toFixed(
      1
    )}%). It's okay to acknowledge when you're not feeling at your best.`;
    recommendations = [
      "Take a few slow, deep breaths to help center yourself.",
      "Try progressive muscle relaxation - tense and release different muscle groups.",
      "Consider stepping away from your current task for a moment.",
      "Speaking with a trusted friend can help process difficult emotions.",
    ];
  } else if (negativePercent > 25) {
    wellbeing = "Moderate Stress";
    emoji = "🤔";
    wellbeingColor =
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-400";
    insights = `Your emotional analysis shows some stress indicators (${negativePercent.toFixed(
      1
    )}%). This can be completely normal and manageable.`;
    recommendations = [
      "Try the 4-4-4 breathing technique: 4 seconds in, hold for 4, out for 4.",
      "A short walk or stretch break can help reset your state.",
      "Consider journaling about how you're feeling.",
      "Reach out for support if you need to talk.",
    ];
  } else {
    wellbeing = "Stable";
    emoji = "✨";
    wellbeingColor =
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400";
    insights = `Your emotional state appears balanced and stable. ${
      dominantEmotion.name
    } is the most prominent emotion (${dominantEmotion.value.toFixed(1)}%).`;
    recommendations = [
      "You're maintaining good emotional balance.",
      "Keep practicing self-care habits.",
      "Continue monitoring for any changes in your wellbeing.",
    ];
  }

  // Override with voice stress if critical
  if (voiceStress.value === "Very High" || voiceStress.value === "Critical") {
    wellbeing = "Urgent: High Stress";
    emoji = "🚨";
    wellbeingColor =
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400";
    insights =
      "Voice analysis indicates very high physiological stress. Prioritize immediate self-care.";
    recommendations = [
      "Stop and focus on deep breathing: 4 seconds in, hold 4 seconds, out 6 seconds.",
      "Step away from current stressors if possible.",
      "Call a loved one or crisis line if needed.",
      "Professional mental health support may be beneficial.",
      "Consider short-term stress management techniques.",
    ];
  }

  return (
    <div className="space-y-3 text-sm">
      <div
        className={`p-3 rounded-lg ${wellbeingColor.split(" ")[0]} border ${
          wellbeingColor.split(" ")[1]
        } ${wellbeingColor.split(" ")[2] || ""}`}
      >
        <p className="font-medium mb-1">
          Overall Wellbeing: {wellbeing} {emoji}
        </p>
        <p className="text-sm opacity-80">{insights}</p>
      </div>

      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
        <p className="font-medium text-orange-800 dark:text-orange-400 mb-2">
          Recommendations
        </p>
        <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-1">
          {recommendations.map((rec, index) => (
            <li key={index}>• {rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function EmotionMonitoring() {
  const { t } = useLanguage();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<
    "connecting" | "calibrating" | "ready" | "analyzing" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState({
    stress_level: 0,
    facial_anxious: 0,
    facial_stressed: 0,
  });

  // Calculate voice stress and facial tension from emotion data
  const calculateVitalSigns = (emotionData) => {
    if (!emotionData) return;

    const { happy, neutral, anxious, stressed } = emotionData;

    // Calculate voice stress based on emotion patterns
    // High anxious/stressed levels typically correlate with voice stress
    let voiceStress = anxious + stressed;

    // Normalize to 0-100 range
    voiceStress = Math.min(voiceStress, 100);

    // Facial tension based on negative emotions
    const facialTension = anxious * 0.8 + stressed * 0.7;

    // Update voice analysis for vital signs
    setVoiceAnalysis({
      stress_level: voiceStress,
      facial_anxious: anxious,
      facial_stressed: stressed,
    });
  };
  const [emotions, setEmotions] = useState([
    {
      name: t("emotionmonitoring.happyclear"),
      value: 0,
      color: "bg-green-500",
      icon: Smile,
    },
    {
      name: t("emotionmonitoring.neutral"),
      value: 0,
      color: "bg-yellow-500",
      icon: Meh,
    },
    {
      name: t("emotionmonitoring.anxious"),
      value: 0,
      color: "bg-orange-500",
      icon: Frown,
    },
    {
      name: t("emotionmonitoring.stressed"),
      value: 0,
      color: "bg-red-500",
      icon: Frown,
    },
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
        setError(t("emotionmonitoring.camera_permission"));
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

  const handleToggleMonitoring = async () => {
    if (!isMonitoring) {
      // Starting monitoring - show loading states
      setLoadingPhase("connecting");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoadingPhase("calibrating");
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setIsMonitoring((prev) => !prev);
    setLoadingPhase(null);
  };

  useEffect(() => {
    if (isMonitoring) {
      const wsUrl =
        import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws/emotions/";
      ws.current = new WebSocket(wsUrl);

      startVideo(); // Start video after WebSocket is set up

      ws.current.onopen = () => {
        console.log('Emotion monitoring WebSocket connected');
      };

      ws.current.onclose = (event) => {
        console.log('Emotion monitoring WebSocket closed:', event.code, event.reason);
      };

      ws.current.onerror = (error) => {
        console.error('Emotion monitoring WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Emotion monitoring received:", data); // Debug log

          if (data.emotions) {
            const { happy, neutral, anxious, stressed } = data.emotions;

            // Validate emotion values are numbers
            if (
              typeof happy === "number" &&
              typeof neutral === "number" &&
              typeof anxious === "number" &&
              typeof stressed === "number"
            ) {
              setEmotions([
                {
                  name: t("emotionmonitoring.happyclear"),
                  value: happy,
                  color: "bg-green-500",
                  icon: Smile,
                },
                {
                  name: t("emotionmonitoring.neutral"),
                  value: neutral,
                  color: "bg-yellow-500",
                  icon: Meh,
                },
                {
                  name: t("emotionmonitoring.anxious"),
                  value: anxious,
                  color: "bg-orange-500",
                  icon: Frown,
                },
                {
                  name: t("emotionmonitoring.stressed"),
                  value: stressed,
                  color: "bg-red-500",
                  icon: Frown,
                },
              ]);

              // Calculate vital signs automatically from emotion data
              calculateVitalSigns(data.emotions);
              console.log("Emotions updated:", {
                happy,
                neutral,
                anxious,
                stressed,
              });
            }
          }

          if (data.voice_analysis) {
            setVoiceAnalysis(data.voice_analysis);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
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
          {
            name: t("emotionmonitoring.happyclear"),
            value: 0,
            color: "bg-green-500",
            icon: Smile,
          },
          {
            name: t("emotionmonitoring.neutral"),
            value: 0,
            color: "bg-yellow-500",
            icon: Meh,
          },
          {
            name: t("emotionmonitoring.anxious"),
            value: 0,
            color: "bg-orange-500",
            icon: Frown,
          },
          {
            name: t("emotionmonitoring.stressed"),
            value: 0,
            color: "bg-red-500",
            icon: Frown,
          },
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
            ws.current.send(
              JSON.stringify({ type: "image", image_data: dataUrl })
            );
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

  // Calculate vital signs from voice analysis data (no translations)
  const getVoiceStressLevel = () => {
    const stress = voiceAnalysis.stress_level;
    if (stress < 25)
      return { value: "Low", status: "Calm", color: "text-green-600" };
    if (stress < 50)
      return { value: "Medium", status: "Moderate", color: "text-yellow-600" };
    if (stress < 75)
      return { value: "High", status: "Elevated", color: "text-orange-600" };
    return { value: "Very High", status: "Critical", color: "text-red-600" };
  };

  const getFacialTensionLevel = () => {
    const facialStress = Math.max(
      voiceAnalysis.facial_anxious,
      voiceAnalysis.facial_stressed
    );
    if (facialStress < 25)
      return { value: "Minimal", status: "Relaxed", color: "text-green-600" };
    if (facialStress < 50)
      return { value: "Moderate", status: "Normal", color: "text-blue-600" };
    if (facialStress < 75)
      return { value: "High", status: "Tensed", color: "text-orange-600" };
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
            {t("emotionmonitoring.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("emotionmonitoring.subtitle")}
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
              <>{t("emotionmonitoring.stop_monitoring")}</>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                {t("emotionmonitoring.start_monitoring")}
              </>
            )}
          </Button>
        </motion.div>

        {/* Show therapeutic loading during startup */}
        {loadingPhase && (
          <div className="w-full mb-8">
            <LoadingTherapy
              phase={loadingPhase}
              message={
                loadingPhase === "ready"
                  ? "Click continue when ready..."
                  : undefined
              }
            />
          </div>
        )}

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
                    {t("emotionmonitoring.video_feed")}
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
                      <>{t("emotionmonitoring.stop_monitoring")}</>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        {t("emotionmonitoring.start_monitoring")}
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
                    {t("emotionmonitoring.vital_indicators")}
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
                    {t("emotionmonitoring.emotion_analysis")}
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
                    {t("emotionmonitoring.ai_insights")}
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
