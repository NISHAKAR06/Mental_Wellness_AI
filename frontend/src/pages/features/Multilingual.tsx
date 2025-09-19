import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Globe, 
  Volume2, 
  VolumeX, 
  Type,
  Eye,
  Ear,
  Mic,
  Languages,
  Accessibility
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Multilingual() {
  const { language, setLanguage } = useLanguage();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [fontSize, setFontSize] = useState([16]);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', region: 'Global' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'India' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', region: 'India' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'Spain' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', region: 'France' },
    { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', region: 'China' }
  ];

  const accessibilityFeatures = [
    {
      title: 'Screen Reader Support',
      description: 'Full compatibility with screen reading software',
      icon: Ear,
      enabled: true
    },
    {
      title: 'Voice Navigation',
      description: 'Navigate using voice commands',
      icon: Mic,
      enabled: false
    },
    {
      title: 'Keyboard Navigation',
      description: 'Complete keyboard accessibility',
      icon: Type,
      enabled: true
    },
    {
      title: 'Color Blind Support',
      description: 'Enhanced contrast and color alternatives',
      icon: Eye,
      enabled: false
    }
  ];

  const ttsDemo = {
    en: 'Welcome to Mental Wellness AI. This platform supports your mental health journey.',
    ta: 'மன நல AI-க்கு வரவேற்கிறோம். இந்த தளம் உங்கள் மன நல பயணத்தை ஆதரிக்கிறது.',
    hi: 'मानसिक कल्याण AI में आपका स्वागत है। यह प्लेटफॉर्म आपकी मानसिक स्वास्थ्य यात्रा का समर्थन करता है।'
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
              Multilingual & Accessibility
            </h1>
            <p className="text-muted-foreground">
              Customize language preferences and accessibility settings for an inclusive experience
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Language Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Language Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          language === lang.code 
                            ? 'border-primary bg-primary-soft' 
                            : 'border-border hover:bg-accent/50'
                        }`}
                        onClick={() => setLanguage(lang.code as 'en' | 'ta' | 'hi')}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <p className="font-medium text-foreground">
                              {lang.native}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {lang.name} • {lang.region}
                            </p>
                          </div>
                        </div>
                        {language === lang.code && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Text-to-Speech */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Text-to-Speech
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Enable Audio</p>
                      <p className="text-sm text-muted-foreground">
                        Hear content read aloud
                      </p>
                    </div>
                    <Switch
                      checked={audioEnabled}
                      onCheckedChange={setAudioEnabled}
                    />
                  </div>

                  {audioEnabled && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-accent/30">
                        <p className="text-sm text-foreground mb-3">
                          {ttsDemo[language as keyof typeof ttsDemo] || ttsDemo.en}
                        </p>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Volume2 className="h-4 w-4" />
                          Play Demo
                        </Button>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Speech Speed
                        </label>
                        <Slider
                          value={[1]}
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Slow</span>
                          <span>Normal</span>
                          <span>Fast</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Accessibility Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Accessibility Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">High Contrast</p>
                      <p className="text-sm text-muted-foreground">
                        Enhance color contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      checked={highContrast}
                      onCheckedChange={setHighContrast}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Reduce Motion</p>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      checked={reduceMotion}
                      onCheckedChange={setReduceMotion}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Font Size: {fontSize[0]}px
                    </label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      max={24}
                      min={12}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Small</span>
                      <span>Normal</span>
                      <span>Large</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility Features */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Accessibility Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accessibilityFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="flex items-start justify-between p-3 rounded-lg bg-accent/30"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">
                              {feature.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => {}}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Navigate menu</span>
                      <code className="bg-accent px-2 py-1 rounded">Tab</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activate element</span>
                      <code className="bg-accent px-2 py-1 rounded">Enter</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Go back</span>
                      <code className="bg-accent px-2 py-1 rounded">Esc</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toggle audio</span>
                      <code className="bg-accent px-2 py-1 rounded">Ctrl + M</code>
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
