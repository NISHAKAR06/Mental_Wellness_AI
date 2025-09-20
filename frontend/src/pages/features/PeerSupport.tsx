import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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

  // Initialize support groups with translations
  const getTranslatedGroups = () => [
    {
      id: 1,
      name: t('peersupport.group1_name'),
      members: 247,
      online: 32,
      description: t('peersupport.group1_desc'),
      category: t('peersupport.age_group'),
      isJoined: true
    },
    {
      id: 2,
      name: t('peersupport.group2_name'),
      members: 189,
      online: 18,
      description: t('peersupport.group2_desc'),
      category: t('peersupport.condition'),
      isJoined: true
    },
    {
      id: 3,
      name: t('peersupport.group3_name'),
      members: 156,
      online: 24,
      description: t('peersupport.group3_desc'),
      category: t('peersupport.practice'),
      isJoined: false
    }
  ];

  const [supportGroups, setSupportGroups] = useState(getTranslatedGroups());

  // Update groups when language changes
  useEffect(() => {
    setSupportGroups(getTranslatedGroups());
  }, [t]);

  const messages = [
    {
      id: 1,
      user: t('peersupport.users.sarah_m'),
      avatar: '🌸',
      message: t('peersupport.messages.sarah_message'),
      time: t('peersupport.time_stamps.ten_minutes_ago'),
      likes: 5
    },
    {
      id: 2,
      user: t('peersupport.users.alex_k'),
      avatar: '🌟',
      message: t('peersupport.messages.alex_message'),
      time: t('peersupport.time_stamps.twenty_five_minutes_ago'),
      likes: 12
    },
    {
      id: 3,
      user: t('peersupport.users.jordan_l'),
      avatar: '🦋',
      message: t('peersupport.messages.jordan_message'),
      time: t('peersupport.time_stamps.one_hour_ago'),
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
        category: t('peersupport.user_created'),
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
            <Card className="wellness-card max-w-lg mx-auto w-full">
          <CardHeader className="pb-2">
                <CardTitle className="text-xl sm:text-2xl leading-tight">{t('peersupport.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {t('peersupport.join_prompt')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button onClick={handleEngageYes} className="btn-hero w-full sm:w-auto">{t('peersupport.engage_yes')}</Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">{t('peersupport.engage_no')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showUsernameForm && (
            <Card className="wellness-card max-w-lg mx-auto w-full">
              <CardHeader>
                <CardTitle className="text-2xl">{t('peersupport.create_username')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  {t('peersupport.username_description')}
                </p>
                <form onSubmit={handleUsernameSubmit} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder={t('peersupport.username_placeholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="btn-hero w-full sm:w-auto">{t('peersupport.submit')}</Button>
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
                {t('peersupport.title')}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {t('peersupport.welcome_message').replace('{username}', username)}
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-3">
                {/* Groups List */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-2 xl:col-span-2 2xl:col-span-1"
                >
                  <Card className="wellness-card h-[600px] flex flex-col">
                    <CardHeader className="pb-3">
                      <Tabs defaultValue="join" onValueChange={(value) => setCurrentView(value as 'join' | 'inbox')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto">
                          <TabsTrigger value="join" className="text-xs sm:text-sm px-2 py-2">
                            <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{t('peersupport.all_groups')}</span>
                          </TabsTrigger>
                          <TabsTrigger value="inbox" className="text-xs sm:text-sm px-2 py-2">
                            <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{t('peersupport.my_inbox')}</span>
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
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            activeGroup === group.id
                              ? 'border-primary bg-primary-soft'
                              : 'border-border hover:bg-accent/50'
                          }`}
                          onClick={() => setActiveGroup(group.id)}
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <h4 className="font-medium text-foreground text-sm leading-tight flex-1 min-w-0">
                              {group.name}
                            </h4>
                            <div className="flex-shrink-0">
                              {group.isJoined ? (
                                <Badge variant="default" className="text-xs px-2 py-1">
                                  {t('peersupport.joined')}
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoinGroup(group.id);
                                  }}
                                >
                                  {t('peersupport.join_button')}
                                </Button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            {group.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3 w-3" />
                              {group.members}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          {t('peersupport.create_group')}
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
                  className="lg:col-span-3 xl:col-span-2 2xl:col-span-2"
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
                    <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-xl sm:text-2xl flex-shrink-0">{message.avatar}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <span className="font-medium text-foreground text-sm">
                                  {message.user}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  {message.time}
                                </span>
                              </div>

                              <p className="text-sm sm:text-base text-foreground mb-3 leading-relaxed break-words">
                                {message.message}
                              </p>

                              <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                  <Heart className="h-3 w-3 flex-shrink-0" />
                                  {message.likes}
                                </button>
                                {message.replies && (
                                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                    {message.replies} {t('peersupport.replies')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                    
                    {/* Message Input */}
                    <div className="border-t border-border p-4 sm:p-6">
                      <div className="flex gap-3">
                        <Input
                          placeholder={t('peersupport.share_thoughts')}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 text-sm sm:text-base"
                        />
                        <Button
                          onClick={handleSendMessage}
                          className="btn-hero flex-shrink-0 px-4"
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
          </main>
      </div>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl leading-tight">{t('peersupport.create_group_title')}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t('peersupport.create_group_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 items-start gap-4">
            <Label htmlFor="name" className="text-sm font-medium pt-3 sm:text-right sm:pt-0">
              {t('peersupport.group_name')}
            </Label>
            <Input
              id="name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="sm:col-span-4"
              placeholder={t('peersupport.group_name_placeholder')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 items-start gap-4">
            <Label htmlFor="description" className="text-sm font-medium pt-3 sm:text-right sm:pt-0">
              {t('peersupport.group_description')}
            </Label>
            <Textarea
              id="description"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="sm:col-span-4 min-h-[100px] resize-vertical"
              placeholder={t('peersupport.group_description_placeholder')}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="submit"
            onClick={handleCreateGroup}
            className="w-full sm:w-auto"
          >
            {t('peersupport.create_group')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
