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
    'nav.farm_map': 'Farm Map (GPS)',
    'nav.cattle_herd': 'Cattle Herd',
    'nav.alerts': 'Alerts',
    'nav.analytics': 'Analytics',
    'nav.cip_cleaning': 'CIP Cleaning',
    'nav.sensor_line': 'Sensor Line',
    'nav.simulation': 'Demo Simulation',
    'nav.settings': 'Settings',

    // Map Specific
    'map.title': 'Interactive Farm Map & Cattle Geo-Tracking',
    'map.subtitle': 'Real-time GPS livestock monitoring with live mastitis risk color-coding',
    'map.total_herd': 'Total Herd',
    'map.critical_risk': 'Critical / Mastitis',
    'map.moderate_risk': 'Moderate Risk',
    'map.healthy_herd': 'Healthy Herd',
    'map.filter_all': 'All Cattle (30)',
    'map.filter_critical': 'Critical Risk Only',
    'map.filter_moderate': 'Moderate Risk',
    'map.filter_healthy': 'Healthy Only',
    'map.facilities_title': 'Dairy Infrastructure & Sensor Stations',
    'map.zones_title': 'Monitored Farm Zones',
    'map.zone_parlor': 'Milking Parlor & STN-01 Line',
    'map.zone_stall_a': 'Stall Block A (Feeding Shed)',
    'map.zone_pasture': 'Open Grazing Pasture',
    'map.zone_quarantine': 'Veterinary Quarantine Ward',
    'map.zone_bulk': 'Bulk Milk Chilling & CIP Station',
    'map.cow_details': 'Cow Live Telemetry',
    'map.view_cow': 'View Cattle Profile',
    'map.simulate_milking': 'Send to STN-01 Milking',
    'map.rfid_tag': 'RFID Tag',
    'map.risk_score': 'Mastitis Risk Score',
    'map.last_yield': 'Last Milk Yield',
    'map.days_in_milk': 'Days in Milk',
    'map.lactation': 'Lactation',

    // Common Metrics
    'metric.scc': 'Somatic Cell Count (SCC)',
    'metric.yield': 'Milk Yield',
    'metric.ec': 'Electrical Conductivity (EC)',
    'metric.ph': 'Milk pH',
    'metric.temperature': 'Temperature',
    'status.healthy': 'Healthy',
    'status.warning': 'Moderate Risk',
    'status.critical': 'Critical Risk',
    'status.quarantine': 'Quarantine Required',

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
    'nav.farm_map': 'பண்ணை வரைபடம் (GPS)',
    'nav.cattle_herd': 'மாடுகள் பட்டியல்',
    'nav.alerts': 'எச்சரிக்கைகள்',
    'nav.analytics': 'விரிவான பகுப்பாய்வு',
    'nav.cip_cleaning': 'CIP சுத்திகரிப்பு',
    'nav.sensor_line': 'உணரி வரிசை',
    'nav.simulation': 'மாதிரி சோதனைகள்',
    'nav.settings': 'அமைப்புகள்',

    // Map Specific
    'map.title': 'ஊடாடும் பண்ணை வரைபடம் & மாடுகள் GPS கண்காணிப்பு',
    'map.subtitle': 'மடிநோய் ஆபத்து நிறக் குறியீட்டுடன் நிகழ்நேர கால்நடை இருப்பிட வரைபடம்',
    'map.total_herd': 'மொத்த மாடுகள்',
    'map.critical_risk': 'தீவிர மடிநோய் ஆபத்து',
    'map.moderate_risk': 'மிதமான ஆபத்து',
    'map.healthy_herd': 'ஆரோக்கியமான மாடுகள்',
    'map.filter_all': 'அனைத்து மாடுகள் (30)',
    'map.filter_critical': 'தீவிர ஆபத்து மட்டும்',
    'map.filter_moderate': 'மிதமான ஆபத்து',
    'map.filter_healthy': 'ஆரோக்கியமானவை மட்டும்',
    'map.facilities_title': 'பால் பண்ணை உள்கட்டமைப்பு & உணரி நிலையங்கள்',
    'map.zones_title': 'கண்காணிக்கப்படும் பண்ணை மண்டலங்கள்',
    'map.zone_parlor': 'பால் கறக்கும் அரங்கம் & STN-01 வரிசை',
    'map.zone_stall_a': 'தொழுவம் பிரிவு A (தீவனக் கூடம்)',
    'map.zone_pasture': 'பசுந்தீவன மேய்ச்சல் நிலம்',
    'map.zone_quarantine': 'கால்நடை தனிமைப்படுத்தல் சிகிச்சை அறை',
    'map.zone_bulk': 'பால் குளிரூட்டி & CIP சுத்திகரிப்பு நிலையம்',
    'map.cow_details': 'மாட்டின் நேரலை உணரி தகவல்கள்',
    'map.view_cow': 'முழு விவரங்கள் காண்க',
    'map.simulate_milking': 'STN-01 பால் கறத்தலுக்கு அனுப்பு',
    'map.rfid_tag': 'RFID குறிப்பான்',
    'map.risk_score': 'மடிநோய் ஆபத்து மதிப்பீடு',
    'map.last_yield': 'கடைசி பால் அளவு',
    'map.days_in_milk': 'பால் தரும் நாட்கள்',
    'map.lactation': 'ஈற்று எண்',

    // Common Metrics
    'metric.scc': 'உயிரணு எண்ணிக்கை (SCC)',
    'metric.yield': 'பால் அளவு (லிட்டர்)',
    'metric.ec': 'மின்கடத்து திறன் (EC)',
    'metric.ph': 'பால் அமில-கார காரணி (pH)',
    'metric.temperature': 'பால் வெப்பநிலை (°C)',
    'status.healthy': 'ஆரோக்கியமானது',
    'status.warning': 'கண்காணிப்பு தேவை',
    'status.critical': 'தீவிர சிகிச்சை தேவை',
    'status.quarantine': 'தனிமைப்படுத்துதல் அவசியம்',

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
    'nav.farm_map': 'फार्म नक्शा (GPS)',
    'nav.cattle_herd': 'मवेशी झुंड',
    'nav.alerts': 'अलर्ट्स',
    'nav.analytics': 'डेटा विश्लेषण',
    'nav.cip_cleaning': 'सीआईपी सफाई',
    'nav.sensor_line': 'सेंसर लाइन',
    'nav.simulation': 'डेमो सिमुलेशन',
    'nav.settings': 'सेटिंग्स',

    // Map Specific
    'map.title': 'इंटरैक्टिव फार्म मानचित्र एवं मवेशी जीपीएस ट्रैकिंग',
    'map.subtitle': 'थनैला रोग जोखिम रंग-कोडिंग के साथ वास्तविक समय पशुधन निगरानी',
    'map.total_herd': 'कुल मवेशी',
    'map.critical_risk': 'गंभीर / मैस्टाइटिस',
    'map.moderate_risk': 'मध्यम जोखिम',
    'map.healthy_herd': 'स्वस्थ मवेशी',
    'map.filter_all': 'सभी मवेशी (30)',
    'map.filter_critical': 'केवल गंभीर जोखिम',
    'map.filter_moderate': 'मध्यम जोखिम',
    'map.filter_healthy': 'केवल स्वस्थ',
    'map.facilities_title': 'डेयरी अवसंरचना एवं सेंसर स्टेशन',
    'map.zones_title': 'निगरानी वाले फार्म क्षेत्र',
    'map.zone_parlor': 'दुग्ध दोहन केंद्र एवं STN-01 लाइन',
    'map.zone_stall_a': 'तबेला ब्लॉक A (चारा शेड)',
    'map.zone_pasture': 'खुला चारागाह क्षेत्र',
    'map.zone_quarantine': 'पशु चिकित्सा पृथक वार्ड',
    'map.zone_bulk': 'थोक दूध चिलर एवं सीआईपी केंद्र',
    'map.cow_details': 'गाय की लाइव टेलीमेट्री',
    'map.view_cow': 'पूर्ण प्रोफ़ाइल देखें',
    'map.simulate_milking': 'STN-01 दोहन हेतु भेजें',
    'map.rfid_tag': 'आरएफआईडी टैग',
    'map.risk_score': 'मैस्टाइटिस जोखिम स्कोर',
    'map.last_yield': 'पिछला दूध उत्पादन',
    'map.days_in_milk': 'दुग्ध काल के दिन',
    'map.lactation': 'ब्यात संख्या',

    // Common Metrics
    'metric.scc': 'सोमैटिक सेल काउंट (SCC)',
    'metric.yield': 'दूध उत्पादन (लीटर)',
    'metric.ec': 'विद्युत चालकता (EC)',
    'metric.ph': 'दूध का पीएच (pH)',
    'metric.temperature': 'दूध का तापमान (°C)',
    'status.healthy': 'स्वस्थ',
    'status.warning': 'सावधानी / मध्यम जोखिम',
    'status.critical': 'अतिसंवेदनशील / तत्काल उपचार',
    'status.quarantine': 'पृथक वार्ड आवश्यक',

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
    // Fallback to English
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
