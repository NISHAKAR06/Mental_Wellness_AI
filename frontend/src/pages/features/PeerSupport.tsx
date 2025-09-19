import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageCircle, 
  Send, 
  Plus,
  Circle,
  Heart,
  Shield,
  Clock
} from 'lucide-react';

export default function PeerSupport() {
  const [newMessage, setNewMessage] = useState('');
  const [activeGroup, setActiveGroup] = useState(1);

  const supportGroups = [
    {
      id: 1,
      name: 'Young Adults (18-25)',
      members: 247,
      online: 32,
      description: 'Support for college students and young professionals',
      category: 'Age Group',
      isJoined: true
    },
    {
      id: 2,
      name: 'Anxiety Warriors',
      members: 189,
      online: 18,
      description: 'Coping with anxiety together',
      category: 'Condition',
      isJoined: true
    },
    {
      id: 3,
      name: 'Mindfulness Circle',
      members: 156,
      online: 24,
      description: 'Daily mindfulness practice and meditation',
      category: 'Practice',
      isJoined: false
    }
  ];

  const messages = [
    {
      id: 1,
      user: 'Sarah M.',
      avatar: '🌸',
      message: 'Just wanted to share that I had a breakthrough in therapy today! The breathing exercises we discussed really helped.',
      time: '10 minutes ago',
      likes: 5
    },
    {
      id: 2,
      user: 'Alex K.',
      avatar: '🌟',
      message: 'Having a tough day but remembering that it\'s okay to not be okay. Thanks for all the support yesterday!',
      time: '25 minutes ago',
      likes: 12
    },
    {
      id: 3,
      user: 'Jordan L.',
      avatar: '🦋',
      message: 'Does anyone have tips for managing social anxiety at work? Starting a new job next week.',
      time: '1 hour ago',
      likes: 8,
      replies: 3
    }
  ];

  const activeUsers = [
    { name: 'Emma', avatar: '🌺', status: 'online' },
    { name: 'Mike', avatar: '🌈', status: 'online' },
    { name: 'Zara', avatar: '🦋', status: 'away' },
    { name: 'Sam', avatar: '🌟', status: 'online' }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Peer Support Groups
            </h1>
            <p className="text-muted-foreground">
              Connect with others who understand your journey and share experiences
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Groups List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Support Groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supportGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeGroup === group.id 
                          ? 'border-primary bg-primary-soft' 
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => setActiveGroup(group.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm">
                          {group.name}
                        </h4>
                        {group.isJoined && (
                          <Badge variant="default" className="text-xs">
                            Joined
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {group.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.members}
                        </span>
                        <span className="flex items-center gap-1">
                          <Circle className="h-3 w-3 text-green-500 fill-current" />
                          {group.online} online
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Find More Groups
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Chat Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="wellness-card h-[600px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {supportGroups.find(g => g.id === activeGroup)?.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Circle className="h-4 w-4 text-green-500 fill-current" />
                      32 online
                    </div>
                  </div>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{message.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {message.user}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {message.time}
                            </span>
                          </div>
                          
                          <p className="text-sm text-foreground mb-2">
                            {message.message}
                          </p>
                          
                          <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <Heart className="h-3 w-3" />
                              {message.likes}
                            </button>
                            {message.replies && (
                              <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {message.replies} replies
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
                
                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Share your thoughts with the group..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} className="btn-hero">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Active Users & Guidelines */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Active Users */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="text-sm">Online Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeUsers.map((user) => (
                    <div key={user.name} className="flex items-center gap-2">
                      <div className="text-lg">{user.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Be respectful and supportive
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      No personal attacks or judgment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Keep discussions constructive
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Respect privacy and confidentiality
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Use trigger warnings when needed
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Crisis Support */}
              <Card className="wellness-card border-2 border-primary/20 bg-primary-soft">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🆘</div>
                  <p className="text-sm font-medium text-primary mb-2">
                    Need immediate help?
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    If you're in crisis, please reach out for professional support
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Crisis Resources
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
