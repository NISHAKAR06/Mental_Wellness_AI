import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Brain, Shield, Users, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';

export default function Landing() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced emotion recognition and mental health insights'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Your privacy and data security are our top priorities'
    },
    {
      icon: Users,
      title: 'Peer Support',
      description: 'Connect with others on similar wellness journeys'
    },
    {
      icon: Zap,
      title: 'Real-time Help',
      description: 'Instant access to AI guidance and support tools'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-accent opacity-60" />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto max-w-4xl"
          >
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {t('hero.title')}
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              {t('hero.subtitle')}
            </p>
            
            <p className="mb-10 text-base text-muted-foreground max-w-2xl mx-auto">
              {t('hero.description')}
            </p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="btn-hero glow group"
                onClick={() => navigate('/auth')}
              >
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute left-10 top-32 hidden animate-pulse text-6xl opacity-20 lg:block">
          🧠
        </div>
        <div className="absolute right-20 top-20 hidden animate-pulse text-4xl opacity-20 lg:block">
          ✨
        </div>
        <div className="absolute bottom-20 left-1/4 hidden animate-pulse text-5xl opacity-20 lg:block">
          🌿
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of mental wellness with our comprehensive AI-driven platform
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="wellness-card text-center group">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-primary-soft"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
            Ready to Begin Your Wellness Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of young people who are already improving their mental health with our AI-powered platform
          </p>
          
          <Button
            size="lg"
            className="btn-hero glow group"
            onClick={() => navigate('/auth')}
          >
            {t('hero.cta')}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Mental Wellness AI. Empowering youth through technology.
          </p>
        </div>
      </footer>
    </div>
  );
}