import React from 'react';
import PsychologistCard from '../../components/ui/PsychologistCard';
import { useNavigate } from 'react-router-dom';

const psychologists = {
  academicStress: [
    { name: 'Dr. Alice Johnson', avatarUrl: '/placeholder.svg' },
    { name: 'Dr. Bob Williams', avatarUrl: '/placeholder.svg' },
  ],
  relationshipsProblems: [
    { name: 'Dr. Carol White', avatarUrl: '/placeholder.svg' },
    { name: 'Dr. David Green', avatarUrl: '/placeholder.svg' },
  ],
  careerAnxiety: [
    { name: 'Dr. Eve Black', avatarUrl: '/placeholder.svg' },
    { name: 'Dr. Frank Blue', avatarUrl: '/placeholder.svg' },
  ],
};

const VideoConferencing: React.FC = () => {
  const navigate = useNavigate();

  const handleStartSession = () => {
    navigate('/session-guidelines');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Video Conferencing</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Academic Stress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.academicStress.map((psychologist) => (
            <PsychologistCard
              key={psychologist.name}
              name={psychologist.name}
              avatarUrl={psychologist.avatarUrl}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Relationships Problems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.relationshipsProblems.map((psychologist) => (
            <PsychologistCard
              key={psychologist.name}
              name={psychologist.name}
              avatarUrl={psychologist.avatarUrl}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Career Anxiety</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {psychologists.careerAnxiety.map((psychologist) => (
            <PsychologistCard
              key={psychologist.name}
              name={psychologist.name}
              avatarUrl={psychologist.avatarUrl}
              onStartSession={handleStartSession}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default VideoConferencing;
