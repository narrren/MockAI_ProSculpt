// Multi-language support

export const languages = {
  en: {
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.otp': 'Enter OTP',
    'auth.otpSent': 'OTP sent to your email',
    'auth.verifyOTP': 'Verify OTP',
    'auth.createAccount': 'Create Account',
    'auth.loginSuccess': 'Login successful!',
    'auth.signupSuccess': 'Account created successfully!',
    'auth.invalidOTP': 'Invalid OTP',
    'auth.otpExpired': 'OTP has expired',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.emailPlaceholder': 'Enter your email',
    'auth.passwordPlaceholder': 'Leave empty for OTP login',
    'auth.otpPlaceholder': '6-digit OTP',
    'auth.otpHint': 'Check your email for the OTP. It expires in 10 minutes.',
    'auth.otpHintWithEmail': 'Check your email for the OTP. It expires in 10 minutes.',
    'auth.testCredentialsOnly': 'Test credentials only',
    'auth.testCredentialsHint': 'Test credentials bypass OTP. Regular users will receive OTP via email.',
    'auth.sendOTP': 'Send OTP',
    'auth.namePlaceholder': 'Enter your full name',
    
    // App
    'app.title': 'Aptiva',
    'app.proctoringActive': 'Proctoring Active',
    'app.proctoringOffline': 'Proctoring Offline',
    'app.logout': 'Logout',
    'app.interviewer': 'AI Interviewer',
    'app.listening': 'Listening',
    'app.speaking': 'Speaking...',
    
    // Chat
    'chat.title': 'Interview Chat',
    'chat.placeholder': 'Type your message or click mic to speak...',
    'chat.listening': 'Listening...',
    'chat.send': 'Send',
    'chat.thinking': 'Thinking...',
    'chat.welcome': 'Hello! Welcome to your technical interview. I\'m your AI interviewer. Are you ready to begin?',
    
    // Code Editor
    'code.title': 'Coding Sandbox',
    'code.run': 'Run Code',
    'code.running': 'Running...',
    'code.clear': 'Clear Output',
    'code.output': 'Output:',
    'code.noOutput': 'No output yet. Click "Run Code" to execute your code.',
    
    // Alerts
    'alert.noFace': 'ALERT: No Face Detected!',
    'alert.multipleFaces': 'ALERT: Multiple Faces Detected!',
    'alert.headTurned': 'WARNING: Head turned away',
    'alert.eyesClosed': 'WARNING: Eyes closed',
    'alert.tabSwitch': 'ALERT: Tab switched or window hidden!',
    'alert.windowBlur': 'ALERT: Window lost focus!',
    'alert.copyBlocked': 'Copy operation blocked',
    'alert.pasteBlocked': 'Paste operation blocked',
    'alert.devToolsBlocked': 'Developer tools access blocked',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.optional': 'Optional',
    'common.back': 'Back',
    'common.to': 'to',
    'common.speakNow': 'Speak now',
  },
  
  es: {
    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.otp': 'Ingrese OTP',
    'auth.otpSent': 'OTP enviado a su correo',
    'auth.verifyOTP': 'Verificar OTP',
    'auth.createAccount': 'Crear Cuenta',
    'auth.loginSuccess': '¡Inicio de sesión exitoso!',
    'auth.signupSuccess': '¡Cuenta creada exitosamente!',
    'auth.invalidOTP': 'OTP inválido',
    'auth.otpExpired': 'OTP ha expirado',
    'auth.noAccount': '¿No tienes una cuenta?',
    'auth.haveAccount': '¿Ya tienes una cuenta?',
    'auth.emailPlaceholder': 'Ingresa tu correo electrónico',
    'auth.passwordPlaceholder': 'Deja vacío para inicio con OTP',
    'auth.otpPlaceholder': 'OTP de 6 dígitos',
    'auth.otpHint': 'Revisa tu correo para el OTP. Expira en 10 minutos.',
    'auth.otpHintWithEmail': 'Revisa tu correo para el OTP. Expira en 10 minutos.',
    'auth.testCredentialsOnly': 'Solo credenciales de prueba',
    'auth.testCredentialsHint': 'Las credenciales de prueba omiten OTP. Los usuarios regulares recibirán OTP por correo.',
    'auth.sendOTP': 'Enviar OTP',
    'auth.namePlaceholder': 'Ingresa tu nombre completo',
    
    // App
    'app.title': 'Aptiva',
    'app.proctoringActive': 'Vigilancia Activa',
    'app.proctoringOffline': 'Vigilancia Desconectada',
    'app.logout': 'Cerrar Sesión',
    'app.interviewer': 'Entrevistador IA',
    'app.listening': 'Escuchando',
    'app.speaking': 'Hablando...',
    
    // Chat
    'chat.title': 'Chat de Entrevista',
    'chat.placeholder': 'Escribe tu mensaje o haz clic en el micrófono para hablar...',
    'chat.listening': 'Escuchando...',
    'chat.send': 'Enviar',
    'chat.thinking': 'Pensando...',
    'chat.welcome': '¡Hola! Bienvenido a tu entrevista técnica. Soy tu entrevistador de IA. ¿Estás listo para comenzar?',
    
    // Code Editor
    'code.title': 'Zona de Código',
    'code.run': 'Ejecutar Código',
    'code.running': 'Ejecutando...',
    'code.clear': 'Limpiar Salida',
    'code.output': 'Salida:',
    'code.noOutput': 'Sin salida aún. Haz clic en "Ejecutar Código" para ejecutar tu código.',
    
    // Alerts
    'alert.noFace': 'ALERTA: ¡No se detectó cara!',
    'alert.multipleFaces': 'ALERTA: ¡Se detectaron múltiples caras!',
    'alert.headTurned': 'ADVERTENCIA: Cabeza girada',
    'alert.eyesClosed': 'ADVERTENCIA: Ojos cerrados',
    'alert.tabSwitch': 'ALERTA: ¡Pestaña cambiada o ventana oculta!',
    'alert.windowBlur': 'ALERTA: ¡Ventana perdió el foco!',
    'alert.copyBlocked': 'Operación de copia bloqueada',
    'alert.pasteBlocked': 'Operación de pegado bloqueada',
    'alert.devToolsBlocked': 'Acceso a herramientas de desarrollador bloqueado',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.optional': 'Opcional',
    'common.back': 'Atrás',
    'common.to': 'a',
    'common.speakNow': 'Habla ahora',
  },
  
  fr: {
    // Auth
    'auth.login': 'Connexion',
    'auth.signup': "S'inscrire",
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.otp': 'Entrez OTP',
    'auth.otpSent': 'OTP envoyé à votre e-mail',
    'auth.verifyOTP': 'Vérifier OTP',
    'auth.createAccount': 'Créer un compte',
    'auth.loginSuccess': 'Connexion réussie!',
    'auth.signupSuccess': 'Compte créé avec succès!',
    'auth.invalidOTP': 'OTP invalide',
    'auth.otpExpired': 'OTP a expiré',
    'auth.noAccount': "Vous n'avez pas de compte?",
    'auth.haveAccount': 'Vous avez déjà un compte?',
    'auth.emailPlaceholder': 'Entrez votre e-mail',
    'auth.passwordPlaceholder': 'Laissez vide pour connexion OTP',
    'auth.otpPlaceholder': 'OTP à 6 chiffres',
    'auth.otpHint': 'Vérifiez votre e-mail pour l\'OTP. Il expire dans 10 minutes.',
    'auth.otpHintWithEmail': 'Vérifiez votre e-mail pour l\'OTP. Il expire dans 10 minutes.',
    'auth.testCredentialsOnly': 'Identifiants de test uniquement',
    'auth.testCredentialsHint': 'Les identifiants de test contournent l\'OTP. Les utilisateurs réguliers recevront un OTP par e-mail.',
    'auth.sendOTP': 'Envoyer OTP',
    'auth.namePlaceholder': 'Entrez votre nom complet',
    
    // App
    'app.title': 'Aptiva',
    'app.proctoringActive': 'Surveillance Active',
    'app.proctoringOffline': 'Surveillance Hors Ligne',
    'app.logout': 'Déconnexion',
    'app.interviewer': 'Intervieweur IA',
    'app.listening': 'Écoute',
    'app.speaking': 'Parle...',
    
    // Chat
    'chat.title': 'Chat d\'Entretien',
    'chat.placeholder': 'Tapez votre message ou cliquez sur le micro pour parler...',
    'chat.listening': 'Écoute...',
    'chat.send': 'Envoyer',
    'chat.thinking': 'Réflexion...',
    'chat.welcome': 'Bonjour! Bienvenue à votre entretien technique. Je suis votre intervieweur IA. Êtes-vous prêt à commencer?',
    
    // Code Editor
    'code.title': 'Zone de Code',
    'code.run': 'Exécuter le Code',
    'code.running': 'Exécution...',
    'code.clear': 'Effacer la Sortie',
    'code.output': 'Sortie:',
    'code.noOutput': 'Aucune sortie pour le moment. Cliquez sur "Exécuter le Code" pour exécuter votre code.',
    
    // Alerts
    'alert.noFace': 'ALERTE: Aucun visage détecté!',
    'alert.multipleFaces': 'ALERTE: Plusieurs visages détectés!',
    'alert.headTurned': 'AVERTISSEMENT: Tête tournée',
    'alert.eyesClosed': 'AVERTISSEMENT: Yeux fermés',
    'alert.tabSwitch': 'ALERTE: Onglet changé ou fenêtre masquée!',
    'alert.windowBlur': 'ALERTE: Fenêtre a perdu le focus!',
    'alert.copyBlocked': 'Opération de copie bloquée',
    'alert.pasteBlocked': 'Opération de collage bloquée',
    'alert.devToolsBlocked': 'Accès aux outils de développement bloqué',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.optional': 'Optionnel',
    'common.back': 'Retour',
    'common.to': 'à',
    'common.speakNow': 'Parlez maintenant',
  },
  
  hi: {
    // Auth
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.otp': 'OTP दर्ज करें',
    'auth.otpSent': 'OTP आपके ईमेल पर भेजा गया',
    'auth.verifyOTP': 'OTP सत्यापित करें',
    'auth.createAccount': 'खाता बनाएं',
    'auth.loginSuccess': 'लॉगिन सफल!',
    'auth.signupSuccess': 'खाता सफलतापूर्वक बनाया गया!',
    'auth.invalidOTP': 'अमान्य OTP',
    'auth.otpExpired': 'OTP समाप्त हो गया',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.haveAccount': 'पहले से खाता है?',
    'auth.emailPlaceholder': 'अपना ईमेल दर्ज करें',
    'auth.passwordPlaceholder': 'OTP लॉगिन के लिए खाली छोड़ें',
    'auth.otpPlaceholder': '6-अंकीय OTP',
    'auth.otpHint': 'OTP के लिए अपना ईमेल जांचें। यह 10 मिनट में समाप्त होता है।',
    'auth.otpHintWithEmail': 'OTP के लिए अपना ईमेल जांचें। यह 10 मिनट में समाप्त होता है।',
    'auth.testCredentialsOnly': 'केवल परीक्षण क्रेडेंशियल',
    'auth.testCredentialsHint': 'परीक्षण क्रेडेंशियल OTP को बायपास करते हैं। नियमित उपयोगकर्ताओं को ईमेल द्वारा OTP प्राप्त होगा।',
    'auth.sendOTP': 'OTP भेजें',
    'auth.namePlaceholder': 'अपना पूरा नाम दर्ज करें',
    
    // App
    'app.title': 'Aptiva',
    'app.proctoringActive': 'निगरानी सक्रिय',
    'app.proctoringOffline': 'निगरानी ऑफलाइन',
    'app.logout': 'लॉगआउट',
    'app.interviewer': 'AI साक्षात्कारकर्ता',
    'app.listening': 'सुन रहा है',
    'app.speaking': 'बोल रहा है...',
    
    // Chat
    'chat.title': 'साक्षात्कार चैट',
    'chat.placeholder': 'अपना संदेश टाइप करें या बोलने के लिए माइक पर क्लिक करें...',
    'chat.listening': 'सुन रहा है...',
    'chat.send': 'भेजें',
    'chat.thinking': 'सोच रहा है...',
    'chat.welcome': 'नमस्ते! आपके तकनीकी साक्षात्कार में आपका स्वागत है। मैं आपका AI साक्षात्कारकर्ता हूं। क्या आप शुरू करने के लिए तैयार हैं?',
    
    // Code Editor
    'code.title': 'कोडिंग सैंडबॉक्स',
    'code.run': 'कोड चलाएं',
    'code.running': 'चल रहा है...',
    'code.clear': 'आउटपुट साफ करें',
    'code.output': 'आउटपुट:',
    'code.noOutput': 'अभी तक कोई आउटपुट नहीं। अपना कोड निष्पादित करने के लिए "कोड चलाएं" पर क्लिक करें।',
    
    // Alerts
    'alert.noFace': 'चेतावनी: कोई चेहरा नहीं मिला!',
    'alert.multipleFaces': 'चेतावनी: कई चेहरे मिले!',
    'alert.headTurned': 'चेतावनी: सिर घुमाया गया',
    'alert.eyesClosed': 'चेतावनी: आंखें बंद',
    'alert.tabSwitch': 'चेतावनी: टैब बदला या विंडो छुपाई गई!',
    'alert.windowBlur': 'चेतावनी: विंडो ने फोकस खो दिया!',
    'alert.copyBlocked': 'कॉपी ऑपरेशन अवरुद्ध',
    'alert.pasteBlocked': 'पेस्ट ऑपरेशन अवरुद्ध',
    'alert.devToolsBlocked': 'डेवलपर टूल्स एक्सेस अवरुद्ध',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.optional': 'वैकल्पिक',
    'common.back': 'वापस',
    'common.to': 'को',
    'common.speakNow': 'अभी बोलें',
  }
};

export const getLanguage = () => {
  return localStorage.getItem('language') || 'en';
};

export const setLanguage = (lang) => {
  localStorage.setItem('language', lang);
};

export const t = (key, fallback = null) => {
  const currentLang = getLanguage();
  const translations = languages[currentLang] || languages.en;
  const translation = translations[key];
  
  // If translation exists, return it
  if (translation) {
    return translation;
  }
  
  // If fallback provided, use it
  if (fallback) {
    return fallback;
  }
  
  // Otherwise return the key (for debugging)
  return key;
};

