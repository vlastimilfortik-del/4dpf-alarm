import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";
import { storage } from "./storage";

export type SoundType = "start" | "progress" | "complete" | "error";

const SOUND_ASSETS = {
  start: require("@/assets/sounds/start.wav"),
  progress: require("@/assets/sounds/progress.wav"),
  complete: require("@/assets/sounds/complete.wav"),
  error: require("@/assets/sounds/error.wav"),
};

const SOUND_CONFIG = {
  start: { frequency: 440, duration: 200 },
  progress: { frequency: 660, duration: 100 },
  complete: { frequency: 880, duration: 300 },
  error: { frequency: 220, duration: 400 },
};

let lastPlayTime: Record<SoundType, number> = {
  start: 0,
  progress: 0,
  complete: 0,
  error: 0,
};

const COOLDOWN_MS: Record<SoundType, number> = {
  start: 500,
  progress: 2000,
  complete: 500,
  error: 500,
};

let audioPlayers: Record<SoundType, AudioPlayer | null> = {
  start: null,
  progress: null,
  complete: null,
  error: null,
};

let isAudioInitialized = false;
let webAudioContext: AudioContext | null = null;

async function initializeAudio(): Promise<void> {
  if (isAudioInitialized || Platform.OS === "web") return;
  
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldDuckAndroid: true,
      shouldRouteThroughEarpiece: false,
    });
    isAudioInitialized = true;
  } catch (error) {
    console.error("Failed to initialize audio mode:", error);
  }
}

function getWebAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  
  if (!webAudioContext) {
    try {
      webAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
      return null;
    }
  }
  
  if (webAudioContext.state === "suspended") {
    webAudioContext.resume();
  }
  
  return webAudioContext;
}

async function getPlayer(type: SoundType): Promise<AudioPlayer | null> {
  if (Platform.OS === "web") {
    return null;
  }
  
  try {
    if (!audioPlayers[type]) {
      await initializeAudio();
      audioPlayers[type] = createAudioPlayer(SOUND_ASSETS[type]);
    }
    return audioPlayers[type];
  } catch (error) {
    console.error(`Failed to create audio player for ${type}:`, error);
    return null;
  }
}

export async function playNotificationSound(type: SoundType): Promise<void> {
  if (Platform.OS === "web") {
    playWebSound(type);
    return;
  }

  try {
    const soundEnabled = await storage.getSoundEnabled();
    if (!soundEnabled) return;

    const now = Date.now();
    if (now - lastPlayTime[type] < COOLDOWN_MS[type]) {
      return;
    }
    lastPlayTime[type] = now;

    const player = await getPlayer(type);
    if (player) {
      player.seekTo(0);
      player.play();
      console.log(`[Sound] Playing ${type} notification`);
    }
  } catch (error) {
    console.error("Failed to play sound:", error);
  }
}

function playWebSound(type: SoundType): void {
  const now = Date.now();
  if (now - lastPlayTime[type] < COOLDOWN_MS[type]) {
    return;
  }
  lastPlayTime[type] = now;

  storage.getSoundEnabled().then((enabled) => {
    if (!enabled) return;

    try {
      const audioContext = getWebAudioContext();
      if (!audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      const config = SOUND_CONFIG[type];

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = config.frequency;
      oscillator.type = type === "error" ? "sawtooth" : "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + config.duration / 1000
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration / 1000);

      console.log(`[Sound] Playing ${type} notification on web`);
    } catch (error) {
      console.error("Web audio error:", error);
    }
  });
}

export async function cleanupSounds(): Promise<void> {
  try {
    for (const type of Object.keys(audioPlayers) as SoundType[]) {
      const player = audioPlayers[type];
      if (player) {
        player.release();
        audioPlayers[type] = null;
      }
    }
    isAudioInitialized = false;
    
    if (webAudioContext) {
      webAudioContext.close();
      webAudioContext = null;
    }
  } catch (error) {
    console.error("Failed to cleanup sounds:", error);
  }
}
