/**
 * Jal Mitra - Conversational Water Assistant
 * Provides voice and text assistance in English, Hindi, and Tamil
 * with live context-awareness of the HydraOS purifier and grid state.
 */

class JalMitraAssistant {
  constructor() {
    this.currentLanguage = 'en'; // 'en', 'hi', 'ta'
    this.speechEnabled = true;

    // Knowledge base responses mapped by language and intent
    this.intents = {
      BABY_FORMULA: {
        en: (state) => {
          if (!state.actuators.solenoidInterlock) {
            return "⚠️ No, Lakshmi! The tap is locked due to high turbidity in the pipeline. Please do NOT use this water for baby formula right now. We suggest checking the nearest Safe Point on your map.";
          }
          if (state.sensors.outletTDS < 120 && state.sensors.turbidity < 0.5) {
            return `✅ Yes! Today's water is certified safe for baby formula. TDS is gentle at ${state.sensors.outletTDS} ppm, turbidity is pristine (${state.sensors.turbidity} NTU), and all nitrates and microbes are filtered out.`;
          }
          return `⚠️ Output TDS is currently ${state.sensors.outletTDS} ppm. For baby formula, we recommend switching to the 'Baby Ananya' profile on your dashboard to reduce solute load.`;
        },
        hi: (state) => {
          if (!state.actuators.solenoidInterlock) {
            return "⚠️ नहीं लक्ष्मी जी! पाइपलाइन में गंदा पानी आने से नल लॉक हो गया है। कृपया शिशु के लिए इस पानी का उपयोग न करें।";
          }
          return `✅ हाँ लक्ष्मी जी! आज का पानी शिशु के लिए बिल्कुल सुरक्षित है। TDS केवल ${state.sensors.outletTDS} ppm है और पानी पूरी तरह शुद्ध है।`;
        },
        ta: (state) => {
          if (!state.actuators.solenoidInterlock) {
            return "⚠️ வேண்டாம் லக்ஷ்மி! குழாயில் சேற்று நீர் வருவதால் குழாய் பூட்டப்பட்டுள்ளது. தயவுசெய்து குழந்தைக்கு இந்த நீரை கொடுக்க வேண்டாம்.";
          }
          return `✅ ஆம் லக்ஷ்மி! இன்றைய நீர் குழந்தைகளுக்கு கொடுக்க முற்றிலும் பாதுகாப்பானது. TDS அளவு ${state.sensors.outletTDS} ppm ஆக மிகச் சீராக உள்ளது.`;
        }
      },

      WHY_LOCKED: {
        en: (state) => {
          if (state.actuators.solenoidInterlock) {
            return "✨ Your tap is currently UNLOCKED and dispensing pure water. The indicator ring is glowing Green/Cyan.";
          }
          return `🚨 Tap is locked because: ${state.interlockReason}. HydraOS engaged the safety solenoid in 340 milliseconds to protect your family from drinking contaminated water.`;
        },
        hi: (state) => {
          if (state.actuators.solenoidInterlock) {
            return "✨ आपका नल सुरक्षित है और चालू है।";
          }
          return `🚨 नल इसलिए बंद किया गया है क्योंकि: ${state.interlockReason}। आपके परिवार की सुरक्षा के लिए HydraOS ने नल को तुरंत लॉक कर दिया है।`;
        },
        ta: (state) => {
          if (state.actuators.solenoidInterlock) {
            return "✨ உங்கள் குழாய் பாதுகாப்பாக இயங்குகிறது.";
          }
          return `🚨 குழாய் பூட்டப்பட்டதற்கான காரணம்: ${state.interlockReason}. உங்கள் குடும்பத்தின் பாதுகாப்பிற்காக HydraOS குழாயை நிறுத்தியுள்ளது.`;
        }
      },

      WATER_SAVED: {
        en: (state) => {
          const saved = state.waterTwin.waterSavedLitres.toFixed(1);
          return `💧 Great news! Your Zero-Reject Loop and Adaptive Eco-Bypass have saved ${saved} litres of water so far. Your secondary tank currently holds ${state.waterTwin.reuseTankCurrent}L ready for mopping and plant watering!`;
        },
        hi: (state) => {
          const saved = state.waterTwin.waterSavedLitres.toFixed(1);
          return `💧 बधाई हो! HydraOS के जीरो-रिजेक्ट सिस्टम ने अब तक ${saved} लीटर पानी बचाया है, जिसे आप पोछा लगाने या पौधों में डालने के लिए उपयोग कर सकते हैं।`;
        },
        ta: (state) => {
          const saved = state.waterTwin.waterSavedLitres.toFixed(1);
          return `💧 மகிழ்ச்சியான செய்தி! HydraOS இதுவரை ${saved} லிட்டர் தண்ணீரை வீணாகாமல் சேமித்துள்ளது.`;
        }
      },

      SAFE_POINT: {
        en: (state) => {
          return "🛡️ The nearest verified Safe Point is Dr. Nair Clinic (180 meters away) with 60 Litres of verified protected reserve, and Green Glen Apts Block B (250m). See the cyan route line on your Hydra Grid map!";
        },
        hi: (state) => {
          return "🛡️ निकटतम सुरक्षित केंद्र डॉ. नायर क्लिनिक (180 मीटर दूर) है जहाँ 60 लीटर स्वच्छ पानी उपलब्ध है। अपने मानचित्र पर देखें!";
        },
        ta: (state) => {
          return "🛡️ அருகிலுள்ள பாதுகாப்பான நீர் மையம் டாக்டர் நாயர் கிளினிக் (180 மீட்டர் தூரம்). உங்கள் வரைபடத்தில் நீல நிற வழியைக் காண்க!";
        }
      },

      WATER_SCORE: {
        en: (state) => {
          return `📊 Today's Water Health Score is ${state.waterScore}/100. Water DNA is recognized as '${state.waterDNA.label}'. Membrane health is at ${state.waterTwin.membraneHealth}%.`;
        },
        hi: (state) => {
          return `📊 आज का वाटर स्कोर ${state.waterScore}/100 है। पानी की गुणवत्ता बहुत अच्छी है और फ़िल्टर पूरी तरह स्वस्थ हैं।`;
        },
        ta: (state) => {
          return `📊 இன்றைய நீர் சுகாதார மதிப்பீடு ${state.waterScore}/100. நீர் தரம் மற்றும் பில்டர் நிலை மிகச் சிறப்பாக உள்ளது.`;
        }
      }
    };
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
  }

  ask(questionText) {
    const q = questionText.toLowerCase();
    const state = window.hydraSimulation.getState();
    let reply = '';

    if (q.includes('baby') || q.includes('formula') || q.includes('infant') || q.includes('बच्चा') || q.includes('குழந்தை')) {
      reply = this.intents.BABY_FORMULA[this.currentLanguage](state);
    } else if (q.includes('lock') || q.includes('why') || q.includes('red') || q.includes('बंद') || q.includes('பூட்ட')) {
      reply = this.intents.WHY_LOCKED[this.currentLanguage](state);
    } else if (q.includes('saved') || q.includes('waste') || q.includes('reject') || q.includes('बचत') || q.includes('சேமிப்பு')) {
      reply = this.intents.WATER_SAVED[this.currentLanguage](state);
    } else if (q.includes('safe point') || q.includes('neighbour') || q.includes('neighbor') || q.includes('पास') || q.includes('மையம்')) {
      reply = this.intents.SAFE_POINT[this.currentLanguage](state);
    } else if (q.includes('score') || q.includes('health') || q.includes('गुणवत्ता') || q.includes('மதிப்பீடு')) {
      reply = this.intents.WATER_SCORE[this.currentLanguage](state);
    } else {
      reply = this.currentLanguage === 'hi' 
        ? `नमस्ते लक्ष्मी जी! मैं जल मित्र हूँ। आप मुझसे पानी की गुणवत्ता, शिशु सुरक्षा या नज़दीकी सेफ पॉइंट के बारे में पूछ सकते हैं। (वाटर स्कोर: ${state.waterScore}/100)`
        : (this.currentLanguage === 'ta'
          ? `வணக்கம் லக்ஷ்மி! நான் ஜல் மித்ரா. நீர் தரம் அல்லது பாதுகாப்பான மையங்கள் பற்றி என்னிடம் கேளுங்கள். (மதிப்பீடு: ${state.waterScore}/100)`
          : `Hello Lakshmi! I am Jal Mitra. I'm actively monitoring your water quality. Today's Water Score is ${state.waterScore}/100. Ask me about baby formula safety, why a tap locked, or nearest Safe Points!`);
    }

    if (this.speechEnabled && 'speechSynthesis' in window) {
      this.speak(reply);
    }

    return reply;
  }

  speak(text) {
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const cleanText = text.replace(/[\u{1F300}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (this.currentLanguage === 'hi') utterance.lang = 'hi-IN';
      else if (this.currentLanguage === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech synthesis unavailable:', e);
    }
  }
}

window.jalMitra = new JalMitraAssistant();
