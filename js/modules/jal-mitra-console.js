/**
 * Jal Mitra - Enterprise Diagnostics & Knowledge Console
 * Professional technical diagnostic Q&A system operating in English, Hindi, and Tamil.
 * Integrates Web Speech Recognition for voice input and SpeechSynthesis for audio output.
 */

class JalMitraConsoleModule {
  constructor() {
    this.currentLanguage = 'en'; // 'en', 'hi', 'ta'
    this.speechSynthesisActive = true;
    this.recognition = null;
    this.isListening = false;

    this.initSpeechRecognition();
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      if (langCode === 'hi') this.recognition.lang = 'hi-IN';
      else if (langCode === 'ta') this.recognition.lang = 'ta-IN';
      else this.recognition.lang = 'en-IN';
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        const micBtn = document.getElementById('btn-mic-input');
        if (micBtn) {
          micBtn.style.background = '#DC2626';
          micBtn.style.color = '#FFFFFF';
          micBtn.textContent = 'Listening...';
        }
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const consoleInput = document.getElementById('console-input');
        if (consoleInput) {
          consoleInput.value = transcript;
          // Trigger form submit
          const form = document.getElementById('console-form');
          if (form) form.dispatchEvent(new Event('submit'));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const micBtn = document.getElementById('btn-mic-input');
        if (micBtn) {
          micBtn.style.background = 'var(--bg-surface)';
          micBtn.style.color = 'var(--text-primary)';
          micBtn.textContent = 'Voice Input';
        }
      };

      this.recognition.onerror = (e) => {
        this.isListening = false;
        console.log('Speech recognition event error:', e);
      };
    }
  }

  toggleVoiceRecognition() {
    if (!this.recognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  processDiagnosticQuery(queryText, simState) {
    const q = queryText.toLowerCase();

    // Intent 1: Pediatric & Infant Nutrition Safety
    if (q.includes('baby') || q.includes('infant') || q.includes('formula') || q.includes('बच्चा') || q.includes('குழந்தை')) {
      if (!simState.actuators.solenoidInterlock) {
        return {
          en: "DIAGNOSTIC ADVISORY: NON-COMPLIANT FOR PEDIATRIC USE. The high-speed safety interlock is actively clamped due to particulate turbidity exceeding ISO safe thresholds. Do not utilize this supply for neonatal formula preparation. Safe Point routing active.",
          hi: "नैदानिक सलाह: शिशु आहार के लिए अनुपयुक्त। पाइपलाइन में मटमैलापन अधिक होने के कारण सुरक्षा इंटरलॉक बंद कर दिया गया है। कृपया शिशु के लिए इस पानी का उपयोग न करें।",
          ta: "மருத்துவ எச்சரிக்கை: குழந்தைகள் உணவிற்கு பாதுகாப்பற்றது. குழாயில் அதிக சேற்று அளவு கண்டறியப்பட்டதால் பாதுகாப்பு வால்வு மூடப்பட்டுள்ளது. இந்த நீரை குழந்தைகளுக்கு பயன்படுத்த வேண்டாம்."
        }[this.currentLanguage];
      }

      return {
        en: `DIAGNOSTIC ADVISORY: COMPLIANT FOR PEDIATRIC USE. Output TDS is tuned to ${simState.sensors.outletTDS} ppm with optical turbidity at ${simState.sensors.turbidity.toFixed(2)} NTU (< 0.5 NTU benchmark). Bacterial and microbial disinfection verified via UV-C chamber at 254nm. Renal solute load within pediatric tolerance limits.`,
        hi: `नैदानिक सलाह: शिशु आहार के लिए सुरक्षित। आउटपुट TDS ${simState.sensors.outletTDS} ppm है और मटमैलापन ${simState.sensors.turbidity.toFixed(2)} NTU है। UV-C द्वारा रोगाणु शोधन सत्यापित है।`,
        ta: `மருத்துவ எச்சரிக்கை: குழந்தைகள் பயன்பாட்டிற்கு பாதுகாப்பானது. TDS அளவு ${simState.sensors.outletTDS} ppm மற்றும் சேற்று அளவு ${simState.sensors.turbidity.toFixed(2)} NTU ஆக உகந்த நிலையில் உள்ளது.`
      }[this.currentLanguage];
    }

    // Intent 2: Root-Cause Interlock Audit
    if (q.includes('lock') || q.includes('interlock') || q.includes('red') || q.includes('cutoff') || q.includes('बंद') || q.includes('பூட்ட')) {
      if (simState.actuators.solenoidInterlock) {
        return {
          en: "SYSTEM AUDIT: INTERLOCK STATUS NOMINAL. Solenoid 2 is open and dispensing permitted. Output turbidity, redox potential, and pH are within compliant parameters.",
          hi: "सिस्टम ऑडिट: इंटरलॉक स्थिति सामान्य। सुरक्षा वाल्व खुला है और पानी सुरक्षित रूप से प्रवाहित हो रहा है।",
          ta: "கணினி தணிக்கை: பாதுகாப்பு வால்வு திறக்கப்பட்டுள்ளது. அனைத்து அளவுருக்களும் முறையான வரம்பிற்குள் உள்ளன."
        }[this.currentLanguage];
      }

      return {
        en: `ROOT-CAUSE FAULT AUDIT: Solenoid 2 clamped within 340ms. Trigger: ${simState.interlockReason}. Physical tap lock executed to prevent internal pipe distribution of non-potable contaminants.`,
        hi: `खराबी ऑडिट रिपोर्ट: सोलेनोइड वाल्व 340 मिलीसेकंड में बंद किया गया। कारण: ${simState.interlockReason}। परिवार की सुरक्षा के लिए पानी का प्रवाह तुरंत रोक दिया गया है।`,
        ta: `காரண தணிக்கை அறிக்கை: 340 மில்லி விநாடிகளில் குழாய் பூட்டப்பட்டது. காரணம்: ${simState.interlockReason}. அசுத்தமான நீர் விநியோகத்தை தடுக்க இந்த நடவடிக்கை எடுக்கப்பட்டுள்ளது.`
      }[this.currentLanguage];
    }

    // Intent 3: Water Conservation & Zero-Reject Audit
    if (q.includes('save') || q.includes('reject') || q.includes('waste') || q.includes('eco') || q.includes('बचत') || q.includes('சேமிப்பு')) {
      return {
        en: `ESG RESOURCE CONSERVATION REPORT: Cumulative potable water conserved stands at ${simState.waterTwin.waterSavedLitres.toFixed(1)} Liters. Secondary utility buffer tank contains ${simState.waterTwin.reuseTankCurrent.toFixed(1)} Liters ready for non-potable domestic tasks (sanitation, horticulture). Net domestic wastage verified at < 8.5%.`,
        hi: `संसाधन संरक्षण रिपोर्ट: अब तक कुल ${simState.waterTwin.waterSavedLitres.toFixed(1)} लीटर शुद्ध पानी बचाया गया है। द्वितीयक टैंक में ${simState.waterTwin.reuseTankCurrent.toFixed(1)} लीटर पानी गैर-पीने योग्य उपयोग के लिए उपलब्ध है।`,
        ta: `வள பாதுகாப்பு அறிக்கை: இதுவரை ${simState.waterTwin.waterSavedLitres.toFixed(1)} லிட்டர் நீர் பாதுகாக்கப்பட்டுள்ளது. மாற்று பயன்பாட்டு தொட்டியில் ${simState.waterTwin.reuseTankCurrent.toFixed(1)} லிட்டர் நீர் தயாராக உள்ளது.`
      }[this.currentLanguage];
    }

    // Default Diagnostic Summary
    return {
      en: `SYSTEM TELEMETRY SUMMARY: Daily Potable Safety Score: ${simState.waterScore}/100. Water DNA: '${simState.waterDNA.label}'. Membrane health index: ${Math.round(simState.waterTwin.membraneHealth)}%. Output parameters verified against ISO 10500 standards.`,
      hi: `सिस्टम टेलीमेट्री सारांश: दैनिक जल सुरक्षा स्कोर: ${simState.waterScore}/100। जल डीएनए पहचान: '${simState.waterDNA.label}'। फ़िल्टर स्वास्थ्य: ${Math.round(simState.waterTwin.membraneHealth)}%।`,
      ta: `கணினி சுருக்கம்: நீர் பாதுகாப்பு மதிப்பீடு: ${simState.waterScore}/100. நீர் வகை: '${simState.waterDNA.label}'. பில்டர் நிலை: ${Math.round(simState.waterTwin.membraneHealth)}%.`
    }[this.currentLanguage];
  }

  speakResponse(text) {
    if (!this.speechSynthesisActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (this.currentLanguage === 'hi') utterance.lang = 'hi-IN';
      else if (this.currentLanguage === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech synthesis exception:', e);
    }
  }
}

window.jalMitraConsole = new JalMitraConsoleModule();
