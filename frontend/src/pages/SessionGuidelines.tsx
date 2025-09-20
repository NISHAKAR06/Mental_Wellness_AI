import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';

const SessionGuidelines: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStart = () => {
    navigate('/video-call');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('session_guidelines.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 text-gray-700">
            <li>- {t('session_guidelines.guideline_1')}</li>
            <li>- {t('session_guidelines.guideline_2')}</li>
            <li>- {t('session_guidelines.guideline_3')}</li>
            <li>- {t('session_guidelines.guideline_4')}</li>
          </ul>
          <Button onClick={handleStart} className="w-full mt-6">
            {t('session_guidelines.start_button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionGuidelines;
