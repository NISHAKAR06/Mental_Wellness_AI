import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './card';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PsychologistCardProps {
  name?: string;
  nameKey?: string;
  avatarUrl: string;
  titleKey?: string;
  onStartSession: (psychologistName: string) => void;
  psychologistId: string;
}

const PsychologistCard: React.FC<PsychologistCardProps> = ({ name, nameKey, avatarUrl, titleKey, onStartSession, psychologistId }) => {
  const { t } = useLanguage();
  const displayName = nameKey ? t(nameKey) : (name || '');

  const handleStartSession = () => {
    onStartSession(psychologistId);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{titleKey ? `${t(titleKey)} ${displayName}` : displayName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          {t('videoconferencing.specializes_description')}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleStartSession} className="w-full">
          {t('videoconferencing.start_session')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PsychologistCard;
 