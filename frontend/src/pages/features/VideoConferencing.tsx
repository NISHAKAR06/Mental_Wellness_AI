import React from 'react';
import PsychologistCard from '../../components/ui/PsychologistCard';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const psychologists = {
  academicStress: [
    { nameKey: 'videoconferencing.psychologist.alice_johnson', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
    { nameKey: 'videoconferencing.psychologist.bob_williams', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
  relationshipsProblems: [
    { nameKey: 'videoconferencing.psychologist.carol_white', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
    { nameKey: 'videoconferencing.psychologist.david_green', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
  careerAnxiety: [
    { nameKey: 'videoconferencing.psychologist.eve_black', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
    { nameKey: 'videoconferencing.psychologist.frank_blue', avatarUrl: '/placeholder.svg', titleKey: 'videoconferencing.dr_title' },
  ],
};

const VideoConferencing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStartSession = () => {
    navigate('/session-guidelines');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('videoconferencing.title')}</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('videoconferencing.academic_stress')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.academicStress.map((psychologist) => (
            <PsychologistCard
              key={psychologist.nameKey}
              nameKey={psychologist.nameKey}
              avatarUrl={psychologist.avatarUrl}
              titleKey={psychologist.titleKey}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('videoconferencing.relationships_problems')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.relationshipsProblems.map((psychologist) => (
            <PsychologistCard
              key={psychologist.nameKey}
              nameKey={psychologist.nameKey}
              avatarUrl={psychologist.avatarUrl}
              titleKey={psychologist.titleKey}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('videoconferencing.career_anxiety')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.careerAnxiety.map((psychologist) => (
            <PsychologistCard
              key={psychologist.nameKey}
              nameKey={psychologist.nameKey}
              avatarUrl={psychologist.avatarUrl}
              titleKey={psychologist.titleKey}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default VideoConferencing;
