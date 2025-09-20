import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { User, Palette, Languages, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </motion.div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="profile">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <span className="font-semibold">{t('settings.tabs.profile')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle>{t('settings.profile.title')}</CardTitle>
                <CardDescription>{t('settings.profile.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.profile.name')}</Label>
                  <Input id="name" defaultValue="Alex Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.profile.email')}</Label>
                  <Input id="email" type="email" defaultValue="alex.doe@example.com" />
                </div>
                <Button>{t('settings.profile.save')}</Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="appearance">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5" />
              <span className="font-semibold">{t('settings.tabs.theme')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle>{t('settings.theme.title')}</CardTitle>
                <CardDescription>{t('settings.theme.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('settings.theme.theme')}</Label>
                  <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.appearance.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.appearance.dark')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="language">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5" />
              <span className="font-semibold">{t('settings.tabs.language')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle>{t('settings.language.title')}</CardTitle>
                <CardDescription>{t('settings.language.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>{t('settings.language.select')}</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ta' | 'hi')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('settings.language.en')}</SelectItem>
                      <SelectItem value="ta">{t('settings.language.ta')}</SelectItem>
                      <SelectItem value="hi">{t('settings.language.hi')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <span className="font-semibold">{t('settings.tabs.notifications')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>{t('settings.notifications.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>{t('settings.notifications.email')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.notifications.emailDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>{t('settings.notifications.push')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.notifications.pushDesc')}</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">{t('settings.tabs.security')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardHeader>
                <CardTitle>{t('settings.security.title')}</CardTitle>
                <CardDescription>{t('settings.security.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t('settings.security.currentPassword')}</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('settings.security.newPassword')}</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('settings.security.confirmPassword')}</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>{t('settings.security.updatePassword')}</Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
