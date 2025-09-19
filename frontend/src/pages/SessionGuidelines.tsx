import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const SessionGuidelines: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/video-call');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Session Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 text-gray-700">
            <li>- Ensure you are in a quiet and private space.</li>
            <li>- Check your internet connection for stability.</li>
            <li>- Use headphones for better audio quality.</li>
            <li>- Be respectful and mindful of the session time.</li>
          </ul>
          <Button onClick={handleStart} className="w-full mt-6">
            Start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionGuidelines;
