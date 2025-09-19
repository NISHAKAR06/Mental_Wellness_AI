import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { sidebarItems } from '@/lib/nav-items';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const features = sidebarItems.slice(1); // Exclude dashboard itself

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 p-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="rounded-2xl bg-gradient-to-r from-primary-soft to-accent p-8 text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-lg"
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              
              <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                Welcome back, {user?.name}! 👋
              </h1>
              
              <p className="text-lg text-muted-foreground mb-4">
                {t('dashboard.welcome')}
              </p>
              
              <p className="text-sm text-muted-foreground">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="mb-8">
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              Your Wellness Tools
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link to={feature.path} key={feature.path} className="group">
                    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-lg bg-primary-soft p-3">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{t(feature.translationKey)}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <Card className="wellness-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">6</div>
                <p className="text-sm text-muted-foreground">Tools Available</p>
              </CardContent>
            </Card>
            
            <Card className="wellness-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">AI Support</p>
              </CardContent>
            </Card>
            
            <Card className="wellness-card text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-muted-foreground">Possibilities</p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
    </div>
  );
}
