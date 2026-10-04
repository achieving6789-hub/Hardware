import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'SmartDairy AI',
    'brand.subtitle': 'Intelligent Milking Line Monitoring & Early Mastitis Risk Detection',
    'brand.prototype': 'SIH Prototype — Shared Sensor Line & RFID Engine',
    'badge.demo_db': 'Demo DB Active',
    'badge.telemetry_live': 'Telemetry Live',
    'badge.connecting': 'Connecting...',
    'header.shared_line': 'Line: STN-01 (Shared Inline Sensors)',
    'header.alerts': 'Active Alerts',
    'header.logout': 'Log Out',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.live_milking': 'Live Milking',
    'nav.danger_map': 'Govt Outbreak & Risk Map',
    'nav.vet_danger_map': 'Clinical Epidemic Map',
    'nav.farm_map': 'Risk Map (GPS)',
    'nav.cattle_herd': 'Cattle Herd',
    'nav.sessions': 'Milking Session History',
    'nav.alerts': 'Alerts',
    'nav.analytics': 'Analytics',
    'nav.cip_cleaning': 'CIP Cleaning',
    'nav.sensor_line': 'Sensor Line',
    'nav.simulation': 'Demo Simulation',
    'nav.settings': 'Settings',

    // Dashboard Banners & Cards
    'dash.problem_statement': 'SIH Problem Statement 26109',
    'dash.mastitis_title': 'AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis',
    'dash.mastitis_desc': 'Forecasting mastitis risk 24–72 hours BEFORE clinical signs appear using inline sensor telemetry, acoustic rumination, pedometry, and THI.',
    'dash.herd_risk_index': 'Herd Risk Index',
    'dash.trending_upward': 'Trending Upward',
    'dash.forecast_warnings': 'Forecast Warnings',
    'dash.early_intervention': 'Early Intervention',
    'dash.total_cattle': 'Total Cattle',
    'dash.all_registered': 'All registered in DB',
    'dash.active_milking': 'Active Milking',
    'dash.todays_milk': 'Today\'s Milk',
    'dash.high_risk_cows': 'High Risk Cows',
    'dash.active_alerts': 'Active Alerts',
    'dash.sensor_uptime': 'Sensor Uptime',
    'dash.admin_console': 'System Administrator & Govt Console',
    'dash.admin_desc': 'IoT Edge Gateway, Hardware Fleet, and Outbreak Surveillance',
    'dash.sih_scenarios': 'SIH Demo Scenarios',
    'dash.ai_weights': 'AI Risk Weights',
    'dash.sources_real': 'Real Sensor',
    'dash.sources_sim': 'Simulated Sensor',
    'dash.sources_rec': 'Farm Record',
    'dash.sources_ai': 'AI Output',

    // Map Specific
    'map.title': 'Original Google Map — Village & Outbreak Danger Zones',
    'map.subtitle': 'Govt Animal Husbandry & Veterinary Surveillance for High-Risk Mastitis Villages',
    'map.google_satellite': 'Google Hybrid Satellite',
    'map.google_roadmap': 'Google Standard Map',
    'map.danger_only': 'Danger Places Only',
    'map.all_places': 'All Village Sectors',
    'map.total_herd': 'Monitored Herd',
    'map.critical_risk': 'Severe Danger Places',
    'map.moderate_risk': 'Observation Zones',
    'map.healthy_herd': 'Safe Pasture',
    'map.village_cluster': 'Village Dairy Cluster & Risk Sector',
    'map.govt_advisory': 'Govt Animal Husbandry Dept — Mastitis Biosecurity Surveillance Active',
    'map.rfid_tag': 'RFID Tag',
    'map.risk_score': 'Mastitis Risk Score',
    'map.last_yield': 'Last Milk Yield',
    'map.view_cow': 'View Clinical Profile',
    'map.simulate_milking': 'Send to STN-01 Milking',

    // Common Metrics
    'metric.scc': 'Somatic Cell Count (SCC)',
    'metric.yield': 'Milk Yield',
    'metric.ec': 'Electrical Conductivity (EC)',
    'metric.ph': 'Milk pH',
    'metric.temperature': 'Temperature',

    // Auth & Registration
    'auth.signin': 'Sign In',
    'auth.register': 'Register (Demo DB)',
    'auth.signin_btn': 'Sign In to Farm Console',
    'auth.register_btn': 'Register in Demo Database',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.full_name': 'Full Name',
    'auth.role': 'Role in Dairy Unit',
    'auth.farm_name': 'Farm / Dairy Unit Name',
    'auth.demo_notice': 'Operating on isolated Demo Database (demo.db). Original database is untouched.',
    'auth.quick_login': 'One-Click SIH Demo Accounts'
  },
  ta: {
    // Brand & Header
    'brand.title': 'ஸ்மார்ட் டெய்ரி AI',
    'brand.subtitle': 'நுண்ணறிவு பால் கறக்கும் வரிசை கண்காணிப்பு & முன்கூட்டிய மடிநோய் கண்டறிதல்',
    'brand.prototype': 'SIH மாதிரி திட்டம் — பகிரப்பட்ட உணரி வரிசை & RFID இயந்திரம்',
    'badge.demo_db': 'மாதிரி தரவுத்தளம் (demo.db)',
    'badge.telemetry_live': 'நேரலை இணைப்பு இயங்குகிறது',
    'badge.connecting': 'இணைக்கப்படுகிறது...',
    'header.shared_line': 'வரிசை: STN-01 (பகிரப்பட்ட உணரி)',
    'header.alerts': 'நடப்பு எச்சரிக்கைகள்',
    'header.logout': 'வெளியேறு',

    // Navigation
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.live_milking': 'நேரலை பால் கறத்தல்',
    'nav.danger_map': 'அரசு நோய் அபாய வரைபடம் (Danger Map)',
    'nav.vet_danger_map': 'கால்நடை தொற்று நோய் வரைபடம்',
    'nav.farm_map': 'அபாய வரைபடம் (GPS)',
    'nav.cattle_herd': 'மாடுகள் பட்டியல்',
    'nav.sessions': 'பால் கறவை பதிவேடு',
    'nav.alerts': 'எச்சரிக்கைகள்',
    'nav.analytics': 'விரிவான பகுப்பாய்வு',
    'nav.cip_cleaning': 'CIP சுத்திகரிப்பு',
    'nav.sensor_line': 'உணரி வரிசை',
    'nav.simulation': 'மாதிரி சோதனைகள்',
    'nav.settings': 'அமைப்புகள்',

    // Dashboard Banners & Cards
    'dash.problem_statement': 'SIH பிரச்சனை அறிக்கை 26109',
    'dash.mastitis_title': 'கால்நடை மடிநோயை முன்கூட்டியே கணிக்கும் AI நுண்ணறிவு மாதிரி',
    'dash.mastitis_desc': 'மருத்துவ அறிகுறிகள் தோன்றுவதற்கு 24–72 மணி நேரத்திற்கு முன்பே சென்சார், அசைபோடும் ஒலி, நடை அளவு மற்றும் வெப்பநிலை கொண்டு மடிநோய் அபாயத்தை முன்கூட்டியே கண்டறிதல்.',
    'dash.herd_risk_index': 'மந்தை நோய் அபாயக் குறியீடு',
    'dash.trending_upward': 'அபாயம் அதிகரிக்கும் மாடுகள்',
    'dash.forecast_warnings': 'முன்னெச்சரிக்கை அறிவிப்புகள்',
    'dash.early_intervention': 'உடனடி மருத்துவ கவனிப்பு தேவை',
    'dash.total_cattle': 'மொத்த மாடுகள்',
    'dash.all_registered': 'பதிவு செய்யப்பட்டவை',
    'dash.active_milking': 'நடப்பு பால் கறவை',
    'dash.todays_milk': 'இன்றைய பால் உற்பத்தி',
    'dash.high_risk_cows': 'அதிக ஆபத்துள்ள மாடுகள்',
    'dash.active_alerts': 'நடப்பு எச்சரிக்கைகள்',
    'dash.sensor_uptime': 'உணரிகள் இயங்கும் நேரம்',
    'dash.admin_console': 'அரசு & கணினி நிர்வாக மையம்',
    'dash.admin_desc': 'IoT கேட்வே, சென்சார் தொகுப்பு மற்றும் தொற்றுநோய் கண்காணிப்பு',
    'dash.sih_scenarios': 'SIH மாதிரி சோதனைகள்',
    'dash.ai_weights': 'AI காரணி எடைகள்',
    'dash.sources_real': 'உண்மை உணரி',
    'dash.sources_sim': 'மாதிரி உணரி',
    'dash.sources_rec': 'பண்ணை பதிவு',
    'dash.sources_ai': 'AI கணிப்பு',

    // Map Specific
    'map.title': 'அசல் கூகிள் வரைபடம் — கிராம மற்றும் நோய் ஆபத்து மண்டலங்கள்',
    'map.subtitle': 'அரசு கால்நடை பராமரிப்பு துறை & மருத்துவர்களுக்கான தீவிர மடிநோய் கண்காணிப்பு',
    'map.google_satellite': 'கூகிள் செயற்கைக்கோள் வரைபடம் (Google Satellite)',
    'map.google_roadmap': 'கூகிள் சாலை வரைபடம் (Google Roads)',
    'map.danger_only': 'ஆபத்து பகுதிகள் மட்டும் (Danger Only)',
    'map.all_places': 'அனைத்து கிராம பகுதிகள்',
    'map.total_herd': 'கண்காணிக்கப்படும் மாடுகள்',
    'map.critical_risk': 'தீவிர ஆபத்து பகுதிகள்',
    'map.moderate_risk': 'கண்காணிப்பு பகுதிகள்',
    'map.healthy_herd': 'பாதுகாப்பான மேய்ச்சல்',
    'map.village_cluster': 'கிராம பால் சேகரிப்பு & தொற்று அபாய மண்டலம்',
    'map.govt_advisory': '🔴 தமிழ்நாடு கால்நடை பராமரிப்பு துறை: மடிநோய் உயிரியல் பாதுகாப்பு கண்காணிப்பு இயங்குகிறது',
    'map.rfid_tag': 'RFID குறிப்பான்',
    'map.risk_score': 'மடிநோய் ஆபத்து மதிப்பீடு',
    'map.last_yield': 'கடைசி பால் அளவு (லி)',
    'map.view_cow': 'மருத்துவ குறிப்புகள் காண்க',
    'map.simulate_milking': 'STN-01 பால் கறவைக்கு அனுப்பு',

    // Common Metrics
    'metric.scc': 'உயிரணு எண்ணிக்கை (SCC)',
    'metric.yield': 'பால் அளவு (லிட்டர்)',
    'metric.ec': 'மின்கடத்து திறன் (EC)',
    'metric.ph': 'பால் அமில-கார காரணி (pH)',
    'metric.temperature': 'பால் வெப்பநிலை (°C)',

    // Auth & Registration
    'auth.signin': 'உள்நுழைக',
    'auth.register': 'புதிய பதிவு (Demo DB)',
    'auth.signin_btn': 'பண்ணை பலகையில் நுழைக',
    'auth.register_btn': 'மாதிரி தரவுத்தளத்தில் கணக்கு துவங்கு',
    'auth.email': 'மின்னஞ்சல் முகவரி',
    'auth.password': 'கடவுச்சொல்',
    'auth.confirm_password': 'கடவுச்சொல்லை உறுதிசெய்',
    'auth.full_name': 'முழு பெயர்',
    'auth.role': 'பண்ணை பொறுப்பு (Role)',
    'auth.farm_name': 'பண்ணை / பால் நிலையம் பெயர்',
    'auth.demo_notice': 'பாதுகாப்பான மாதிரி தரவுத்தளத்தில் (demo.db) இயங்குகிறது. அசல் தரவுகள் மாற்றப்படாது.',
    'auth.quick_login': '1-சொடுக்கில் மாதிரி கணக்குகளில் உள்நுழைக'
  },
  hi: {
    // Brand & Header
    'brand.title': 'स्मार्ट डेयरी AI',
    'brand.subtitle': 'स्मार्ट मिल्किंग लाइन निगरानी एवं थनैला (मैस्टाइटिस) रोग का प्रारंभिक पूर्वानुमान',
    'brand.prototype': 'एसआईएच प्रोटोटाइप — साझा सेंसर लाइन एवं आरएफआईडी इंजन',
    'badge.demo_db': 'डेमो डेटाबेस सक्रिय (demo.db)',
    'badge.telemetry_live': 'लाइव टेलीमेट्री चालू है',
    'badge.connecting': 'कनेक्ट हो रहा है...',
    'header.shared_line': 'लाइन: STN-01 (साझा इनलाइन सेंसर)',
    'header.alerts': 'सक्रिय अलर्ट',
    'header.logout': 'लॉग आउट',

    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.live_milking': 'लाइव दुग्ध दोहन',
    'nav.danger_map': 'सरकारी रोग एवं जोखिम नक्शा',
    'nav.vet_danger_map': 'महामारी एवं क्वारंटाइन नक्शा',
    'nav.farm_map': 'जोखिम नक्शा (GPS)',
    'nav.cattle_herd': 'मवेशी झुंड',
    'nav.sessions': 'मिल्किंग लॉग्स',
    'nav.alerts': 'अलर्ट्स',
    'nav.analytics': 'डेटा विश्लेषण',
    'nav.cip_cleaning': 'सीआईपी सफाई',
    'nav.sensor_line': 'सेंसर लाइन',
    'nav.simulation': 'डेमो सिमुलेशन',
    'nav.settings': 'सेटिंग्स',

    // Dashboard Banners & Cards
    'dash.problem_statement': 'एसआईएच समस्या विवरण 26109',
    'dash.mastitis_title': 'बोवाइन मैस्टाइटिस के प्रारंभिक पूर्वानुमान हेतु एआई-आधारित प्रेडिक्टिव मॉडलिंग',
    'dash.mastitis_desc': 'नैदानिक लक्षण दिखने से 24–72 घंटे पहले ही इनलाइन सेंसर और एआई द्वारा थनैला रोग के जोखिम का सटीक पूर्वानुमान।',
    'dash.herd_risk_index': 'झुंड जोखिम सूचकांक',
    'dash.trending_upward': 'बढ़ते जोखिम वाले मवेशी',
    'dash.forecast_warnings': 'पूर्वानुमान चेतावनियां',
    'dash.early_intervention': 'शीघ्र हस्तक्षेप आवश्यक',
    'dash.total_cattle': 'कुल मवेशी',
    'dash.all_registered': 'सभी पंजीकृत',
    'dash.active_milking': 'सक्रिय दोहन',
    'dash.todays_milk': 'आज का दूध',
    'dash.high_risk_cows': 'उच्च जोखिम वाली गायें',
    'dash.active_alerts': 'सक्रिय अलर्ट',
    'dash.sensor_uptime': 'सेंसर अपटाइम',
    'dash.admin_console': 'सिस्टम व्यवस्थापक एवं सरकारी कंसोल',
    'dash.admin_desc': 'आईओटी गेटवे, हार्डवेयर बेड़ा एवं प्रकोप निगरानी',
    'dash.sih_scenarios': 'एसआईएच परिदृश्य',
    'dash.ai_weights': 'एआई जोखिम भार',
    'dash.sources_real': 'वास्तविक सेंसर',
    'dash.sources_sim': 'सिम्युलेटेड सेंसर',
    'dash.sources_rec': 'फार्म रिकॉर्ड',
    'dash.sources_ai': 'एआई आउटपुट',

    // Map Specific
    'map.title': 'मूल गूगल मानचित्र — गांव एवं प्रकोप खतरे के क्षेत्र',
    'map.subtitle': 'उच्च जोखिम वाले गांवों हेतु सरकारी पशुपालन एवं पशु चिकित्सा निगरानी',
    'map.google_satellite': 'गूगल हाइब्रिड सैटेलाइट (Google Satellite)',
    'map.google_roadmap': 'गूगल रोड मैप (Google Roads)',
    'map.danger_only': 'केवल खतरे के क्षेत्र (Danger Only)',
    'map.all_places': 'सभी ग्रामीण क्षेत्र',
    'map.total_herd': 'निगरानी वाले मवेशी',
    'map.critical_risk': 'गंभीर खतरे के क्षेत्र',
    'map.moderate_risk': 'अवलोकन क्षेत्र',
    'map.healthy_herd': 'सुरक्षित चारागाह',
    'map.village_cluster': 'ग्रामीण दुग्ध संकलन एवं प्रकोप क्लस्टर',
    'map.govt_advisory': 'पशुपालन विभाग: थनैला रोग जैव-सुरक्षा निगरानी सक्रिय है',
    'map.rfid_tag': 'आरएफआईडी टैग',
    'map.risk_score': 'मैस्टाइटिस जोखिम स्कोर',
    'map.last_yield': 'पिछला दूध उत्पादन (L)',
    'map.view_cow': 'प्रोफ़ाइल देखें',
    'map.simulate_milking': 'STN-01 दोहन हेतु भेजें',

    // Common Metrics
    'metric.scc': 'सोमैटिक सेल काउंट (SCC)',
    'metric.yield': 'दूध उत्पादन (लीटर)',
    'metric.ec': 'विद्युत चालकता (EC)',
    'metric.ph': 'दूध का पीएच (pH)',
    'metric.temperature': 'दूध का तापमान (°C)',

    // Auth & Registration
    'auth.signin': 'साइन इन करें',
    'auth.register': 'नया पंजीकरण (डेमो डेटाबेस)',
    'auth.signin_btn': 'फार्म कंसोल में प्रवेश करें',
    'auth.register_btn': 'डेमो डेटाबेस में खाता बनाएं',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.confirm_password': 'पासवर्ड की पुष्टि करें',
    'auth.full_name': 'पूरा नाम',
    'auth.role': 'डेयरी में पद / भूमिका',
    'auth.farm_name': 'फार्म / डेयरी यूनिट का नाम',
    'auth.demo_notice': 'सुरक्षित डेमो डेटाबेस (demo.db) पर कार्यरत। मूल डेटा सुरक्षित है।',
    'auth.quick_login': 'एक-क्लिक एसआईएच डेमो खाते'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartdairy_lang') as Language;
    return saved === 'ta' || saved === 'hi' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('smartdairy_lang', lang);
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
