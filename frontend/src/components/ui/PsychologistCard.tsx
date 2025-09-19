import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './card';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';

interface PsychologistCardProps {
  name: string;
  avatarUrl: string;
  onStartSession: () => void;
}

const PsychologistCard: React.FC<PsychologistCardProps> = ({ name, avatarUrl, onStartSession }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Specializes in providing support for various mental health concerns.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onStartSession} className="w-full">
          Start Session
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PsychologistCard;
