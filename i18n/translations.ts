export type Language = 'cs' | 'en' | 'de';

export type TranslationKeys = {
  appName: string;
  version: string;
  connected: string;
  disconnected: string;
  connecting: string;
  initializing: string;
  error: string;
  obdAdapter: string;
  searchingAdapter: string;
  initializingElm: string;
  dpfFillPercent: string;
  start: string;
  stop: string;
  supportedBrands: string;
  activeRegeneration: string;
  doNotTurnOffEngine: string;
  dpfRegenerationInProgress: string;
  obdAdapters: string;
  searchingAdapters: string;
  noAdaptersFound: string;
  adapterHint: string;
  connectedTo: string;
  errorTitle: string;
  bluetoothNotAvailable: string;
  bluetoothWebHint: string;
  cannotStartMonitoring: string;
  notConnectedToAdapter: string;
  settings: string;
  soundSettings: string;
  soundEnabled: string;
  soundDisabled: string;
  language: string;
  selectLanguage: string;
  privacyNotice: string;
  privacyText: string;
  license: string;
  trialRemaining: string;
  licenseValidUntil: string;
  licenseExpired: string;
  daysRemaining: string;
  buyLicense: string;
  yearly: string;
  threeYearBundle: string;
  threeYearBundleDesc: string;
  restore: string;
  close: string;
  czech: string;
  english: string;
  german: string;
  bluetooth: string;
  unknownDevice: string;
};

const cs: TranslationKeys = {
  appName: '4 DPF Alarm',
  version: 'Verze',
  connected: 'PŘIPOJENO',
  disconnected: 'ODPOJENO',
  connecting: 'PŘIPOJOVÁNÍ...',
  initializing: 'INICIALIZACE...',
  error: 'CHYBA',
  obdAdapter: 'OBD-II adaptér',
  searchingAdapter: 'Hledání OBD-II adaptéru...',
  initializingElm: 'Inicializace ELM327...',
  dpfFillPercent: 'DPF: {percent}% naplnění',
  start: 'SPUSTIT',
  stop: 'ZASTAVIT',
  supportedBrands: 'Podporované značky',
  activeRegeneration: 'AKTIVNÍ REGENERACE DPF',
  doNotTurnOffEngine: 'NEVYPÍNEJTE MOTOR',
  dpfRegenerationInProgress: 'REGENERACE DPF PROBÍHÁ',
  obdAdapters: 'OBD-II adaptéry',
  searchingAdapters: 'Hledání OBD-II adaptérů...',
  noAdaptersFound: 'Žádné adaptéry nenalezeny',
  adapterHint: 'Ujistěte se, že je adaptér zapojený a Bluetooth zapnutý',
  connectedTo: 'Připojeno k {name}',
  errorTitle: 'Chyba',
  bluetoothNotAvailable: 'Bluetooth není dostupný na této platformě',
  bluetoothWebHint: 'Pro připojení k OBD-II adaptéru spusťte aplikaci v Expo Go nebo nainstalovanou verzi na vašem telefonu.',
  cannotStartMonitoring: 'Nepodařilo se spustit monitorování',
  notConnectedToAdapter: 'Není připojeno k OBD-II adaptéru',
  settings: 'Nastavení',
  soundSettings: 'Nastavení zvuku',
  soundEnabled: 'Zvuk zapnutý',
  soundDisabled: 'Zvuk vypnutý',
  language: 'Jazyk',
  selectLanguage: 'Vyberte jazyk',
  privacyNotice: 'Ochrana soukromí',
  privacyText: 'Tato aplikace NESBÍRÁ žádná data. Veškerá komunikace probíhá pouze lokálně mezi vaším telefonem a vozidlem přes OBD-II adaptér. Žádné informace o vašem vozidle ani jízdách nejsou odesílány na internet.',
  license: 'Licence',
  trialRemaining: 'Zbývá {days} dní zkušební verze',
  licenseValidUntil: 'Licence platná do: {date}',
  licenseExpired: 'Licence vypršela',
  daysRemaining: 'Zbývá {days} dní',
  buyLicense: 'Zakoupit licenci',
  yearly: 'Roční licence',
  threeYearBundle: 'Zvýhodněný balíček 3 roky',
  threeYearBundleDesc: 'Zaplaťte 2 roky, získejte 3 roky!',
  restore: 'Obnovit nákupy',
  close: 'Zavřít',
  czech: 'Čeština',
  english: 'English',
  german: 'Deutsch',
  bluetooth: 'Bluetooth',
  unknownDevice: 'Neznámé zařízení',
};

const en: TranslationKeys = {
  appName: '4 DPF Alarm',
  version: 'Version',
  connected: 'CONNECTED',
  disconnected: 'DISCONNECTED',
  connecting: 'CONNECTING...',
  initializing: 'INITIALIZING...',
  error: 'ERROR',
  obdAdapter: 'OBD-II adapter',
  searchingAdapter: 'Searching for OBD-II adapter...',
  initializingElm: 'Initializing ELM327...',
  dpfFillPercent: 'DPF: {percent}% filled',
  start: 'START',
  stop: 'STOP',
  supportedBrands: 'Supported brands',
  activeRegeneration: 'ACTIVE DPF REGENERATION',
  doNotTurnOffEngine: 'DO NOT TURN OFF ENGINE',
  dpfRegenerationInProgress: 'DPF REGENERATION IN PROGRESS',
  obdAdapters: 'OBD-II adapters',
  searchingAdapters: 'Searching for OBD-II adapters...',
  noAdaptersFound: 'No adapters found',
  adapterHint: 'Make sure the adapter is plugged in and Bluetooth is enabled',
  connectedTo: 'Connected to {name}',
  errorTitle: 'Error',
  bluetoothNotAvailable: 'Bluetooth is not available on this platform',
  bluetoothWebHint: 'To connect to an OBD-II adapter, run the app in Expo Go or the installed version on your phone.',
  cannotStartMonitoring: 'Failed to start monitoring',
  notConnectedToAdapter: 'Not connected to OBD-II adapter',
  settings: 'Settings',
  soundSettings: 'Sound settings',
  soundEnabled: 'Sound enabled',
  soundDisabled: 'Sound disabled',
  language: 'Language',
  selectLanguage: 'Select language',
  privacyNotice: 'Privacy Notice',
  privacyText: 'This app does NOT collect any data. All communication happens locally between your phone and vehicle via the OBD-II adapter. No information about your vehicle or trips is sent to the internet.',
  license: 'License',
  trialRemaining: '{days} days of trial remaining',
  licenseValidUntil: 'License valid until: {date}',
  licenseExpired: 'License expired',
  daysRemaining: '{days} days remaining',
  buyLicense: 'Buy license',
  yearly: 'Yearly license',
  threeYearBundle: '3-year bundle deal',
  threeYearBundleDesc: 'Pay for 2 years, get 3 years!',
  restore: 'Restore purchases',
  close: 'Close',
  czech: 'Čeština',
  english: 'English',
  german: 'Deutsch',
  bluetooth: 'Bluetooth',
  unknownDevice: 'Unknown device',
};

const de: TranslationKeys = {
  appName: '4 DPF Alarm',
  version: 'Version',
  connected: 'VERBUNDEN',
  disconnected: 'GETRENNT',
  connecting: 'VERBINDEN...',
  initializing: 'INITIALISIERUNG...',
  error: 'FEHLER',
  obdAdapter: 'OBD-II Adapter',
  searchingAdapter: 'Suche nach OBD-II Adapter...',
  initializingElm: 'Initialisiere ELM327...',
  dpfFillPercent: 'DPF: {percent}% gefüllt',
  start: 'STARTEN',
  stop: 'STOPPEN',
  supportedBrands: 'Unterstützte Marken',
  activeRegeneration: 'AKTIVE DPF-REGENERATION',
  doNotTurnOffEngine: 'MOTOR NICHT AUSSCHALTEN',
  dpfRegenerationInProgress: 'DPF-REGENERATION LÄUFT',
  obdAdapters: 'OBD-II Adapter',
  searchingAdapters: 'Suche nach OBD-II Adaptern...',
  noAdaptersFound: 'Keine Adapter gefunden',
  adapterHint: 'Stellen Sie sicher, dass der Adapter eingesteckt und Bluetooth aktiviert ist',
  connectedTo: 'Verbunden mit {name}',
  errorTitle: 'Fehler',
  bluetoothNotAvailable: 'Bluetooth ist auf dieser Plattform nicht verfügbar',
  bluetoothWebHint: 'Um eine Verbindung zum OBD-II Adapter herzustellen, starten Sie die App in Expo Go oder der installierten Version auf Ihrem Telefon.',
  cannotStartMonitoring: 'Überwachung konnte nicht gestartet werden',
  notConnectedToAdapter: 'Nicht mit OBD-II Adapter verbunden',
  settings: 'Einstellungen',
  soundSettings: 'Toneinstellungen',
  soundEnabled: 'Ton aktiviert',
  soundDisabled: 'Ton deaktiviert',
  language: 'Sprache',
  selectLanguage: 'Sprache auswählen',
  privacyNotice: 'Datenschutzhinweis',
  privacyText: 'Diese App sammelt KEINE Daten. Die gesamte Kommunikation erfolgt lokal zwischen Ihrem Telefon und dem Fahrzeug über den OBD-II Adapter. Es werden keine Informationen über Ihr Fahrzeug oder Ihre Fahrten ins Internet gesendet.',
  license: 'Lizenz',
  trialRemaining: 'Noch {days} Tage Testversion',
  licenseValidUntil: 'Lizenz gültig bis: {date}',
  licenseExpired: 'Lizenz abgelaufen',
  daysRemaining: 'Noch {days} Tage',
  buyLicense: 'Lizenz kaufen',
  yearly: 'Jahreslizenz',
  threeYearBundle: '3-Jahres-Bundle',
  threeYearBundleDesc: 'Zahlen Sie 2 Jahre, erhalten Sie 3 Jahre!',
  restore: 'Käufe wiederherstellen',
  close: 'Schließen',
  czech: 'Čeština',
  english: 'English',
  german: 'Deutsch',
  bluetooth: 'Bluetooth',
  unknownDevice: 'Unbekanntes Gerät',
};

export const translations: Record<Language, TranslationKeys> = {
  cs,
  en,
  de,
};

export const languageNames: Record<Language, string> = {
  cs: 'Čeština',
  en: 'English',
  de: 'Deutsch',
};

export function t(key: keyof TranslationKeys, lang: Language, params?: Record<string, string | number>): string {
  let text = translations[lang][key];
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}
