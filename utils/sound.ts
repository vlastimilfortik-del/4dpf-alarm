import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";
import { storage } from "./storage";

export type SoundType = "dpfAlert";

const SOUND_ASSETS = {
  dpfAlert: require("@/assets/sounds/dpf_alert.mp3"),
};

let lastPlayTime = 0;
const COOLDOWN_MS = 1000;

let audioPlayer: AudioPlayer | null = null;
let isAudioInitialized = false;
let webAudioContext: AudioContext | null = null;
let webAudioBuffer: AudioBuffer | null = null;

async function initializeAudio(): Promise<void> {
  if (isAudioInitialized || Platform.OS === "web") return;
  
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
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

async function getPlayer(): Promise<AudioPlayer | null> {
  if (Platform.OS === "web") {
    return null;
  }
  
  try {
    if (!audioPlayer) {
      await initializeAudio();
      audioPlayer = createAudioPlayer(SOUND_ASSETS.dpfAlert);
    }
    return audioPlayer;
  } catch (error) {
    console.error("Failed to create audio player:", error);
    return null;
  }
}

export async function playDPFAlertSound(): Promise<void> {
  if (Platform.OS === "web") {
    playWebAlertSound();
    return;
  }

  try {
    const soundEnabled = await storage.getSoundEnabled();
    if (!soundEnabled) return;

    const now = Date.now();
    if (now - lastPlayTime < COOLDOWN_MS) {
      return;
    }
    lastPlayTime = now;

    const player = await getPlayer();
    if (player) {
      player.seekTo(0);
      player.play();
      console.log("[Sound] Playing DPF alert notification");
    }
  } catch (error) {
    console.error("Failed to play sound:", error);
  }
}

function playWebAlertSound(): void {
  const now = Date.now();
  if (now - lastPlayTime < COOLDOWN_MS) {
    return;
  }
  lastPlayTime = now;

  storage.getSoundEnabled().then((enabled) => {
    if (!enabled) return;

    try {
      const audioContext = getWebAudioContext();
      if (!audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);

      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 300);

      console.log("[Sound] Playing DPF alert on web");
    } catch (error) {
      console.error("Web audio error:", error);
    }
  });
}

export async function cleanupSounds(): Promise<void> {
  try {
    if (audioPlayer) {
      audioPlayer.release();
      audioPlayer = null;
    }
    isAudioInitialized = false;
    
    if (webAudioContext) {
      webAudioContext.close();
      webAudioContext = null;
    }
    webAudioBuffer = null;
  } catch (error) {
    console.error("Failed to cleanup sounds:", error);
  }
}
