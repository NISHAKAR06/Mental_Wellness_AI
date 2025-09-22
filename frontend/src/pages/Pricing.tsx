import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Shield, Clock, Headphones } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  therapistHours: number;
  sessionsPerMonth: number;
  languages: string[];
}

export default function Pricing() {
  const { t } = useLanguage();

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free Support',
      price: '₹0',
      period: 'forever',
      description: 'Essential mental wellness tools for everyone',
      features: [
        '5 AI therapy sessions/month',
        'Basic emotion monitoring',
        '1 therapeutic game access',
        'Crisis helpline numbers',
        'Community forum access',
        'Basic progress tracking'
      ],
      therapistHours: 0,
      sessionsPerMonth: 5,
      languages: ['English']
    },
    {
      id: 'personal',
      name: 'Personal Care',
      price: '₹299',
      period: 'per month',
      description: 'Comprehensive personal mental health support',
      popular: true,
      features: [
        'Unlimited AI therapy sessions',
        'Advanced emotion monitoring',
        'All therapeutic games',
        'Session summary reports',
        'Multilingual support (3 languages)',
        'Progress analytics dashboard',
        'Emergency crisis alerts',
        '24/7 chat support'
      ],
      therapistHours: 1,
      sessionsPerMonth: -1, // unlimited
      languages: ['English', 'Hindi', 'Tamil']
    },
    {
      id: 'family',
      name: 'Family Wellness',
      price: '₹499',
      period: 'per month',
      description: 'Complete family mental health coverage',
      features: [
        'Everything in Personal Care',
        'Up to 4 family members',
        'Family therapy coordination',
        'Parent-child communication tools',
        'School stress monitoring',
        'Family progress reports',
        'Priority support',
        'Custom family therapy plans'
      ],
      therapistHours: 2,
      sessionsPerMonth: -1, // unlimited
      languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali']
    },
    {
      id: 'enterprise',
      name: 'Corporate Wellness',
      price: 'Custom',
      period: 'pricing',
      description: 'Organization-wide mental health solutions',
      features: [
        'Everything in Family Wellness',
        'Unlimited organization users',
        'Corporate dashboard analytics',
        'HR integration APIs',
        'Custom therapy tracks',
        'Manager coaching sessions',
        'Workplace stress assessment',
        'Dedicated account manager',
        'White-label branding option',
        'Compliance reporting (GDPR, HIPAA)'
      ],
      therapistHours: 10,
      sessionsPerMonth: -1, // unlimited
      languages: ['All supported languages']
    }
  ];

  const testimonials = [
    {
      name: "Rahul K.",
      role: "College Student",
      content: "The AI therapy sessions helped me manage exam anxiety. The emotion monitoring caught my stress before it became overwhelming.",
      rating: 5,
      location: "Delhi"
    },
    {
      name: "Priya M.",
      role: "Working Professional",
      content: "As a busy professional, I needed flexible mental health support. This app fits perfectly into my schedule.",
      rating: 5,
      location: "Mumbai"
    },
    {
      name: "Dr. Suresh R.",
      role: "Clinical Psychologist",
      content: "I recommend this to my patients as complementary therapy. The AI insights are remarkably accurate.",
      rating: 5,
      location: "Chennai"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft to-accent py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {t('pricing.hero_title')}{' '}
              <span className="text-primary">{t('pricing.hero_title_highlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('pricing.hero_subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{t('pricing.users_served')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{t('pricing.hipaa_compliant')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>{t('pricing.multilingual_support')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('pricing.plans_title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.plans_subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto justify-items-center">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`relative h-full ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : 'shadow-md'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        {t('pricing.popular_badge')}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex flex-col h-full">

                    {/* Features List */}
                    <div className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Section - Stats & Button */}
                    <div className="mt-auto pt-4 border-t border-muted">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 text-center mb-4 px-2">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary leading-tight">
                            {plan.therapistHours > 0 ? `${plan.therapistHours}h` : 'AI'}
                          </div>
                          <div className="text-xs text-muted-foreground leading-tight">{t('pricing.therapy_time')}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary leading-tight">
                            {plan.sessionsPerMonth === -1 ? '∞' : plan.sessionsPerMonth}
                          </div>
                          <div className="text-xs text-muted-foreground leading-tight">{t('pricing.sessions_month')}</div>
                        </div>
                      </div>

                      {/* Button */}
                      <Button
                        className={`w-full h-12 text-sm font-semibold ${plan.popular ? 'btn-hero shadow-lg transform hover:scale-105 transition-all' : plan.id === 'enterprise' ? 'bg-secondary hover:bg-secondary/90' : ''}`}
                        variant={plan.id === 'enterprise' ? 'secondary' : 'default'}
                        size="lg"
                      >
                        {plan.id === 'free' ? t('pricing.get_started_free') :
                         plan.id === 'enterprise' ? t('pricing.contact_sales') :
                         t('pricing.start_free_trial')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('pricing.testimonials_title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('pricing.testimonials_subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                      <Badge variant="outline">{testimonial.location}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-20 bg-primary-soft">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              Market Impact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">₹2,400</div>
                <div className="text-muted-foreground">Average annual therapy cost saved per user</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <div className="text-muted-foreground">of users show improved mental health scores</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">availability eliminates access barriers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">3x</div>
                <div className="text-muted-foreground">faster than traditional therapy wait times</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Transform Your Organization's Mental Health?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join leading companies providing comprehensive mental wellness to their employees
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-hero">
                Start Free Corporate Trial
              </Button>
              <Button size="lg" variant="outline">
                Schedule Enterprise Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
