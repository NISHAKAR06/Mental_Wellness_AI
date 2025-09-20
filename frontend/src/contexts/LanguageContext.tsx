import { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ta' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'nav.settings': 'Settings',
    
    // Landing Page
    'hero.title': 'Generative AI for Youth Mental Wellness',
    'hero.subtitle': 'Empowering youth with AI-driven mental wellness support',
    'hero.cta': 'Get Started',
    'hero.description': 'Join our supportive community and access AI-powered tools designed specifically for youth mental health and wellbeing.',
    
    // Features
    'features.videoconf': 'Video Conferencing',
    'features.emotion': 'AI Emotion Monitoring',
    'features.summarizer': 'Session Summarizer',
    'features.gaming': 'AI-Powered Gaming',
    'features.peersupport': 'Peer Support Groups',
    'features.multilingual': 'Multilingual & Accessibility',
    'features.lifestyle': 'Lifestyle Tools',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back, take a deep breath, you\'re safe here 🌿',
    'dashboard.subtitle': 'Your mental wellness journey continues here',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.switchToRegister': 'Don\'t have an account? Sign up',
    'auth.switchToLogin': 'Already have an account? Sign in',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and preferences.',
    'settings.tabs.profile': 'Profile',
    'settings.tabs.theme': 'Theme',
    'settings.tabs.language': 'Language',
    'settings.tabs.notifications': 'Notifications',
    'settings.tabs.security': 'Security',
    'settings.profile.title': 'Profile Information',
    'settings.profile.description': 'Update your personal details.',
    'settings.profile.name': 'Name',
    'settings.profile.email': 'Email',
    'settings.profile.save': 'Save Changes',
    'settings.theme.title': 'Theme',
    'settings.theme.description': 'Customize the look and feel of the app.',
    'settings.theme.theme': 'Theme',
    'settings.appearance.light': 'Light',
    'settings.appearance.dark': 'Dark',
    'settings.language.title': 'Language',
    'settings.language.description': 'Choose your preferred language.',
    'settings.language.select': 'Select Language',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Manage how you receive notifications.',
    'settings.notifications.email': 'Email Notifications',
    'settings.notifications.emailDesc': 'Receive updates and alerts via email.',
    'settings.notifications.push': 'Push Notifications',
    'settings.notifications.pushDesc': 'Get real-time alerts on your device.',
    'settings.security.title': 'Security',
    'settings.security.description': 'Manage your password and security settings.',
    'settings.security.currentPassword': 'Current Password',
    'settings.security.newPassword': 'New Password',
    'settings.security.confirmPassword': 'Confirm New Password',
    'settings.security.updatePassword': 'Update Password',
  },
  ta: {
    // Navigation
    'nav.login': 'உள்நுழைய',
    'nav.register': 'பதிவு செய்க',
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.logout': 'வெளியேறு',
    'nav.settings': 'அமைப்புகள்',
    
    // Landing Page
    'hero.title': 'இளைஞர் மன நலனுக்கான உற்பத்தி செயற்கை நுண்ணறிவு',
    'hero.subtitle': 'AI-இயக்கப்படும் மன நல ஆதரவோடு இளைஞர்களை வலுப்படுத்துதல்',
    'hero.cta': 'தொடங்கவும்',
    'hero.description': 'எங்கள் ஆதரவான சமூகத்தில் சேரவும் மற்றும் இளைஞர் மன நலம் மற்றும் நலனுக்காக சிறப்பாக வடிவமைக்கப்பட்ட AI-இயங்கும் கருவிகளை அணுகவும்.',
    
    // Features  
    'features.videoconf': 'வீடியோ மாநாடு',
    'features.emotion': 'AI உணர்வு கண்காணிப்பு',
    'features.summarizer': 'அமர்வு சுருக்கம்',
    'features.gaming': 'AI-இயங்கும் விளையாட்டு',
    'features.peersupport': 'சக ஆதரவு குழுக்கள்',
    'features.multilingual': 'பல மொழி & அணுகல்தன்மை',
    'features.lifestyle': 'வாழ்க்கை முறை கருவிகள்',
    
    // Dashboard
    'dashboard.welcome': 'மீண்டும் வரவேற்கிறோம், ஆழமாக மூச்சு விடுங்கள், நீங்கள் இங்கே பாதுகாப்பாக இருக்கிறீர்கள் 🌿',
    'dashboard.subtitle': 'உங்கள் மன நல பயணம் இங்கே தொடர்கிறது',
    
    // Auth
    'auth.email': 'மின்னஞ்சல்',
    'auth.password': 'கடவுச்சொல்',
    'auth.login': 'உள்நுழைய',
    'auth.register': 'கணக்கு உருவாக்கு',
    'auth.switchToRegister': 'கணக்கு இல்லையா? பதிவு செய்யுங்கள்',
    'auth.switchToLogin': 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையுங்கள்',

    // Settings
    'settings.title': 'அமைப்புகள்',
    'settings.subtitle': 'உங்கள் கணக்கு மற்றும் விருப்பங்களை நிர்வகிக்கவும்.',
    'settings.tabs.profile': 'சுயவிவரம்',
    'settings.tabs.theme': 'தீம்',
    'settings.tabs.language': 'மொழி',
    'settings.tabs.notifications': 'அறிவிப்புகள்',
    'settings.tabs.security': 'பாதுகாப்பு',
    'settings.profile.title': 'சுயவிவரத் தகவல்',
    'settings.profile.description': 'உங்கள் தனிப்பட்ட விவரங்களைப் புதுப்பிக்கவும்.',
    'settings.profile.name': 'பெயர்',
    'settings.profile.email': 'மின்னஞ்சல்',
    'settings.profile.save': 'மாற்றங்களைச் சேமி',
    'settings.theme.title': 'தீம்',
    'settings.theme.description': 'பயன்பாட்டின் தோற்றத்தையும் உணர்வையும் தனிப்பயனாக்கவும்.',
    'settings.theme.theme': 'தீம்',
    'settings.appearance.light': 'ஒளி',
    'settings.appearance.dark': 'இருள்',
    'settings.language.title': 'மொழி',
    'settings.language.description': 'உங்களுக்கு விருப்பமான மொழியைத் தேர்வு செய்யவும்.',
    'settings.language.select': 'மொழியைத் தேர்ந்தெடுக்கவும்',
    'settings.notifications.title': 'அறிவிப்புகள்',
    'settings.notifications.description': 'நீங்கள் அறிவிப்புகளை எவ்வாறு பெறுகிறீர்கள் என்பதை நிர்வகிக்கவும்.',
    'settings.notifications.email': 'மின்னஞ்சல் அறிவிப்புகள்',
    'settings.notifications.emailDesc': 'மின்னஞ்சல் வழியாக புதுப்பிப்புகள் மற்றும் விழிப்பூட்டல்களைப் பெறுங்கள்.',
    'settings.notifications.push': 'புஷ் அறிவிப்புகள்',
    'settings.notifications.pushDesc': 'உங்கள் சாதனத்தில் நிகழ்நேர விழிப்பூட்டல்களைப் பெறுங்கள்.',
    'settings.security.title': 'பாதுகாப்பு',
    'settings.security.description': 'உங்கள் கடவுச்சொல் மற்றும் பாதுகாப்பு அமைப்புகளை நிர்வகிக்கவும்.',
    'settings.security.currentPassword': 'தற்போதைய கடவுச்சொல்',
    'settings.security.newPassword': 'புதிய கடவுச்சொல்',
    'settings.security.confirmPassword': 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    'settings.security.updatePassword': 'கடவுச்சொல்லைப் புதுப்பிக்கவும்',
  },
  hi: {
    // Navigation
    'nav.login': 'लॉगिन',
    'nav.register': 'रजिस्टर',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.logout': 'लॉगआउट',
    'nav.settings': 'सेटिंग्स',
    
    // Landing Page
    'hero.title': 'युवा मानसिक कल्याण के लिए जेनेरेटिव AI',
    'hero.subtitle': 'AI-संचालित मानसिक कल्याण सहायता के साथ युवाओं को सशक्त बनाना',
    'hero.cta': 'शुरू करें',
    'hero.description': 'हमारे सहायक समुदाय में शामिल हों और युवा मानसिक स्वास्थ्य और कल्याण के लिए विशेष रूप से डिज़ाइन किए गए AI-संचालित उपकरणों तक पहुंचें।',
    
    // Features
    'features.videoconf': 'वीडियो कॉन्फ्रेंसिंग',
    'features.emotion': 'AI भावना निगरानी',
    'features.summarizer': 'सेशन सारांश',
    'features.gaming': 'AI-संचालित गेमिंग',
    'features.peersupport': 'सहकर्मी सहायता समूह',
    'features.multilingual': 'बहुभाषी और पहुंच',
    'features.lifestyle': 'जीवनशैली उपकरण',
    
    // Dashboard
    'dashboard.welcome': 'वापस स्वागत है, गहरी सांस लें, आप यहाँ सुरक्षित हैं 🌿',
    'dashboard.subtitle': 'आपकी मानसिक कल्याण यात्रा यहाँ जारी है',
    
    // Auth
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.login': 'साइन इन',
    'auth.register': 'खाता बनाएं',
    'auth.switchToRegister': 'खाता नहीं है? साइन अप करें',
    'auth.switchToLogin': 'पहले से खाता है? साइन इन करें',

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपना खाता और प्राथमिकताएं प्रबंधित करें।',
    'settings.tabs.profile': 'प्रोफ़ाइल',
    'settings.tabs.theme': 'थीम',
    'settings.tabs.language': 'भाषा',
    'settings.tabs.notifications': 'सूचनाएं',
    'settings.tabs.security': 'सुरक्षा',
    'settings.profile.title': 'प्रोफ़ाइल जानकारी',
    'settings.profile.description': 'अपने व्यक्तिगत विवरण अपडेट करें।',
    'settings.profile.name': 'नाम',
    'settings.profile.email': 'ईमेल',
    'settings.profile.save': 'बदलाव सहेजें',
    'settings.theme.title': 'थीम',
    'settings.theme.description': 'ऐप का रंग-रूप अनुकूलित करें।',
    'settings.theme.theme': 'थीम',
    'settings.appearance.light': 'लाइट',
    'settings.appearance.dark': 'डार्क',
    'settings.language.title': 'भाषा',
    'settings.language.description': 'अपनी पसंदीदा भाषा चुनें।',
    'settings.language.select': 'भाषा चुनें',
    'settings.notifications.title': 'सूचनाएं',
    'settings.notifications.description': 'आप सूचनाएं कैसे प्राप्त करते हैं, इसे प्रबंधित करें।',
    'settings.notifications.email': 'ईमेल सूचनाएं',
    'settings.notifications.emailDesc': 'ईमेल के माध्यम से अपडेट और अलर्ट प्राप्त करें।',
    'settings.notifications.push': 'पुश सूचनाएं',
    'settings.notifications.pushDesc': 'अपने डिवाइस पर रीयल-टाइम अलर्ट प्राप्त करें।',
    'settings.security.title': 'सुरक्षा',
    'settings.security.description': 'अपना पासवर्ड और सुरक्षा सेटिंग्स प्रबंधित करें।',
    'settings.security.currentPassword': 'वर्तमान पासवर्ड',
    'settings.security.newPassword': 'नया पासवर्ड',
    'settings.security.confirmPassword': 'नए पासवर्ड की पुष्टि करें',
    'settings.security.updatePassword': 'पासवर्ड अपडेट करें',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
