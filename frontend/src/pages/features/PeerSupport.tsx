import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  ArrowLeft
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PeerSupport() {
  const navigate = useNavigate();
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showEngagePrompt, setShowEngagePrompt] = useState(true);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('join');
  const [newMessage, setNewMessage] = useState('');
  const [activeGroup, setActiveGroup] = useState(1);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const [supportGroups, setSupportGroups] = useState([
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
  ]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage('');
    }
  };

  const handleEngageYes = () => {
    setShowEngagePrompt(false);
    setShowUsernameForm(true);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsSignedUp(true);
      setShowUsernameForm(false);
    }
  };

  const handleJoinGroup = (groupId: number) => {
    setSupportGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId ? { ...group, isJoined: true } : group
      )
    );
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && newGroupDescription.trim()) {
      const newGroup = {
        id: supportGroups.length + 1,
        name: newGroupName,
        description: newGroupDescription,
        members: 1,
        online: 1,
        category: 'User Created',
        isJoined: true,
      };
      setSupportGroups(prevGroups => [...prevGroups, newGroup]);
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateGroupOpen(false);
      setActiveGroup(newGroup.id);
      setCurrentView('inbox');
    }
  };

  if (!isSignedUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          {showEngagePrompt && (
            <Card className="wellness-card max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Join Peer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Would you like to engage with our supportive community?
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleEngageYes} className="btn-hero">Yes, I'd like to engage</Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>Not right now</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showUsernameForm && (
            <Card className="wellness-card max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Username</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Choose a username to use in the support groups. You can be anonymous.
                </p>
                <form onSubmit={handleUsernameSubmit} className="flex gap-2">
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <Button type="submit" className="btn-hero">Submit</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
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
                Welcome, {username}! Connect with others who understand your journey.
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Groups List */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <Card className="wellness-card h-[600px] flex flex-col">
                    <CardHeader>
                      <Tabs defaultValue="join" onValueChange={(value) => setCurrentView(value as 'join' | 'inbox')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="join">
                            <Users className="mr-2 h-4 w-4" /> All Groups
                          </TabsTrigger>
                          <TabsTrigger value="inbox">
                            <MessageCircle className="mr-2 h-4 w-4" /> My Inbox
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 overflow-y-auto pt-4">
                      {supportGroups
                        .filter(group => currentView === 'inbox' ? group.isJoined : true)
                        .map((group) => (
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
                            {group.isJoined ? (
                              <Badge variant="default" className="text-xs">
                                Joined
                              </Badge>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinGroup(group.id);
                                }}
                              >
                                Join
                              </Button>
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
                          </div>
                        </div>
                      ))}
                      
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Group
                        </Button>
                      </DialogTrigger>
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
              </div>
          </main>
      </div>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Support Group</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new space for connection.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Creative Minds"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="col-span-3"
              placeholder="A short description of your group's purpose."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateGroup}>Create Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
