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
  },
  ta: {
    // Navigation
    'nav.login': 'உள்நுழைய',
    'nav.register': 'பதிவு செய்க',
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.logout': 'வெளியேறு',
    
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
  },
  hi: {
    // Navigation
    'nav.login': 'लॉगिन',
    'nav.register': 'रजिस्टर',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.logout': 'लॉगआउट',
    
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