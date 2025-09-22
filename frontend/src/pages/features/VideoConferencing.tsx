import React from 'react';
import PsychologistCard from '../../components/ui/PsychologistCard';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const psychologists = {
  academicStress: [
    { id: 'alice_johnson', nameKey: 'videoconferencing.psychologist.alice_johnson', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
  relationshipsProblems: [
    { id: 'carol_white', nameKey: 'videoconferencing.psychologist.carol_white', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
  careerAnxiety: [
    { id: 'eve_black', nameKey: 'videoconferencing.psychologist.eve_black', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
};

const VideoConferencing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStartSession = (psychologistName: string) => {
    switch (psychologistName) {
      case 'alice_johnson':
        navigate('/dashboard/psychologists/alice-johnson');
        break;
      case 'carol_white':
        navigate('/dashboard/psychologists/carol-white');
        break;
      case 'eve_black':
        navigate('/dashboard/psychologists/eve-black');
        break;
      default:
        navigate('/session-guidelines');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('videoconferencing.title')}</h1>

      {/* First Row: Academic Stress and Relationships Problems */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Stress */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('videoconferencing.academic_stress')}</h2>
            <div className="flex justify-center">
              {psychologists.academicStress.map((psychologist) => (
                <div key={psychologist.nameKey} className="w-full max-w-sm">
                  <PsychologistCard
                    nameKey={psychologist.nameKey}
                    avatarUrl={psychologist.avatarUrl}
                    titleKey={psychologist.titleKey}
                    onStartSession={handleStartSession}
                    psychologistId={psychologist.id}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Relationships Problems */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('videoconferencing.relationships_problems')}</h2>
            <div className="flex justify-center">
              {psychologists.relationshipsProblems.map((psychologist) => (
                <div key={psychologist.nameKey} className="w-full max-w-sm">
                  <PsychologistCard
                    nameKey={psychologist.nameKey}
                    avatarUrl={psychologist.avatarUrl}
                    titleKey={psychologist.titleKey}
                    onStartSession={handleStartSession}
                    psychologistId={psychologist.id}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Second Row: Career Anxiety */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">{t('videoconferencing.career_anxiety')}</h2>
        <div className="flex justify-center">
          {psychologists.careerAnxiety.map((psychologist) => (
            <div key={psychologist.nameKey} className="w-full max-w-sm mx-auto">
              <PsychologistCard
                nameKey={psychologist.nameKey}
                avatarUrl={psychologist.avatarUrl}
                titleKey={psychologist.titleKey}
                onStartSession={handleStartSession}
                psychologistId={psychologist.id}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VideoConferencing;
