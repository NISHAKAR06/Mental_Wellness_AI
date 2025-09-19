import {
  Home,
  Video,
  Brain,
  FileText,
  Gamepad2,
  Users,
  Activity,
  Settings,
} from 'lucide-react';

export const sidebarItems = [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/dashboard',
    translationKey: 'nav.dashboard',
    description: 'Overview'
  },
  {
    icon: Video,
    label: 'Video Conferencing',
    path: '/dashboard/video-conferencing',
    translationKey: 'features.videoconf',
    description: 'Connect with therapists'
  },
  {
    icon: Brain,
    label: 'AI Emotion Monitoring',
    path: '/dashboard/emotion-monitoring',
    translationKey: 'features.emotion',
    description: 'AI emotion analysis'
  },
  {
    icon: FileText,
    label: 'Session Summarizer',
    path: '/dashboard/session-summarizer',
    translationKey: 'features.summarizer',
    description: 'Session insights'
  },
  {
    icon: Gamepad2,
    label: 'AI-Powered Gaming',
    path: '/dashboard/ai-gaming',
    translationKey: 'features.gaming',
    description: 'Mental health games'
  },
  {
    icon: Users,
    label: 'Peer Support Groups',
    path: '/dashboard/peer-support',
    translationKey: 'features.peersupport',
    description: 'Community support'
  },
  {
    icon: Activity,
    label: 'Lifestyle Tools',
    path: '/dashboard/lifestyle',
    translationKey: 'features.lifestyle',
    description: 'Health tracking'
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/dashboard/settings',
    translationKey: 'nav.settings',
    description: 'Manage your account'
  }
];
