export interface OBD2Data {
  dpfTemperature: number;
  dpfPressure: number;
  dpfSootLevel: number;
  exhaustTemperature: number;
  engineRPM: number;
  vehicleSpeed: number;
  coolantTemperature: number;
  fuelLevel: number;
  batteryVoltage: number;
  intakeAirTemperature: number;
  massAirFlow: number;
  throttlePosition: number;
  engineLoad: number;
  isRegenerating: boolean;
  regenerationProgress: number;
  oilTemperature: number;
  turboBoostPressure: number;
}

export interface OBD2Status {
  connected: boolean;
  protocol: string | null;
  vehicleVIN: string | null;
  lastUpdate: number;
  errorCodes: string[];
}

const DPF_BASE_TEMP = 200;
const DPF_REGEN_TEMP = 600;
const DPF_MAX_TEMP = 650;

const ERROR_CODES = {
  P2002: "DPF Efficiency Below Threshold (Bank 1)",
  P2003: "DPF Efficiency Below Threshold (Bank 2)",
  P2452: "Diesel Particulate Filter Pressure Sensor A Circuit",
  P2458: "Diesel Particulate Filter Regeneration Duration",
  P2459: "Diesel Particulate Filter Regeneration Frequency",
  P0401: "Exhaust Gas Recirculation Flow Insufficient",
  P0087: "Fuel Rail/System Pressure Too Low",
  P0171: "System Too Lean (Bank 1)",
};

export interface SimulatorState {
  data: OBD2Data;
  status: OBD2Status;
  isRunning: boolean;
}

export type OBD2DataCallback = (data: OBD2Data) => void;

class OBD2Simulator {
  private state: SimulatorState;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private updateCallbacks: OBD2DataCallback[] = [];
  private regenerationStartTime: number = 0;
  private targetRegenProgress: number = 0;

  constructor() {
    this.state = {
      data: this.getDefaultData(),
      status: {
        connected: false,
        protocol: null,
        vehicleVIN: null,
        lastUpdate: Date.now(),
        errorCodes: [],
      },
      isRunning: false,
    };
  }

  private getDefaultData(): OBD2Data {
    return {
      dpfTemperature: DPF_BASE_TEMP,
      dpfPressure: 30,
      dpfSootLevel: 45,
      exhaustTemperature: 180,
      engineRPM: 800,
      vehicleSpeed: 0,
      coolantTemperature: 85,
      fuelLevel: 65,
      batteryVoltage: 12.6,
      intakeAirTemperature: 25,
      massAirFlow: 2.5,
      throttlePosition: 0,
      engineLoad: 15,
      isRegenerating: false,
      regenerationProgress: 0,
      oilTemperature: 90,
      turboBoostPressure: 0,
    };
  }

  connect(vehicleType: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const vins: Record<string, string> = {
          vw: "WVWZZZ3CZWE123456",
          audi: "WAUZZZ4B3XN123456",
          skoda: "TMBJJ7NSXL0123456",
          seat: "VSSZZZ5FZLR123456",
          cupra: "VSSZZZCJZMP123456",
        };

        this.state.status = {
          connected: true,
          protocol: "ISO 15765-4 (CAN 11/500)",
          vehicleVIN: vins[vehicleType] || "WVWZZZ3CZWE000000",
          lastUpdate: Date.now(),
          errorCodes: [],
        };

        this.startSimulation();
        resolve(true);
      }, 1500);
    });
  }

  disconnect(): void {
    this.stopSimulation();
    this.state = {
      data: this.getDefaultData(),
      status: {
        connected: false,
        protocol: null,
        vehicleVIN: null,
        lastUpdate: Date.now(),
        errorCodes: [],
      },
      isRunning: false,
    };
    this.notifyCallbacks();
  }

  private startSimulation(): void {
    if (this.intervalId) return;

    this.state.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateSimulatedData();
      this.notifyCallbacks();
    }, 500);
  }

  private stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state.isRunning = false;
  }

  private updateSimulatedData(): void {
    const data = this.state.data;
    const now = Date.now();

    data.engineRPM = this.oscillate(data.engineRPM, 750, 900, 10);
    data.coolantTemperature = this.oscillate(data.coolantTemperature, 82, 92, 0.5);
    data.batteryVoltage = this.oscillate(data.batteryVoltage, 12.4, 14.2, 0.1);
    data.intakeAirTemperature = this.oscillate(data.intakeAirTemperature, 20, 35, 0.3);
    data.massAirFlow = this.oscillate(data.massAirFlow, 2.0, 4.0, 0.2);
    data.engineLoad = this.oscillate(data.engineLoad, 10, 25, 1);
    data.oilTemperature = this.oscillate(data.oilTemperature, 85, 100, 0.3);
    data.fuelLevel = Math.max(0, data.fuelLevel - 0.001);

    if (data.isRegenerating) {
      const elapsed = (now - this.regenerationStartTime) / 1000;
      const duration = 120;
      
      data.regenerationProgress = Math.min(this.targetRegenProgress, (elapsed / duration) * 100);
      
      const targetTemp = DPF_BASE_TEMP + (DPF_MAX_TEMP - DPF_BASE_TEMP) * Math.min(data.regenerationProgress / 30, 1);
      data.dpfTemperature = this.approach(data.dpfTemperature, targetTemp, 5);
      
      data.exhaustTemperature = this.approach(data.exhaustTemperature, 450, 3);
      
      data.dpfSootLevel = Math.max(5, 45 - (data.regenerationProgress * 0.4));
      
      data.engineRPM = this.oscillate(1200 + data.regenerationProgress * 3, 1150, 1350, 15);
      data.engineLoad = this.oscillate(40 + data.regenerationProgress * 0.3, 35, 55, 2);
      data.turboBoostPressure = this.oscillate(1.2 + data.regenerationProgress * 0.01, 1.0, 1.8, 0.05);
      
      data.dpfPressure = this.approach(data.dpfPressure, 15 + (100 - data.regenerationProgress) * 0.3, 0.5);
      
      if (data.regenerationProgress >= 100) {
        data.isRegenerating = false;
        data.dpfSootLevel = 5;
      }
    } else {
      data.dpfTemperature = this.approach(data.dpfTemperature, DPF_BASE_TEMP, 2);
      data.exhaustTemperature = this.approach(data.exhaustTemperature, 180, 1);
      data.turboBoostPressure = this.approach(data.turboBoostPressure, 0, 0.1);
    }

    this.state.status.lastUpdate = now;
  }

  private oscillate(current: number, min: number, max: number, variance: number): number {
    const change = (Math.random() - 0.5) * 2 * variance;
    return Math.max(min, Math.min(max, current + change));
  }

  private approach(current: number, target: number, step: number): number {
    if (Math.abs(current - target) < step) return target;
    return current + (target > current ? step : -step);
  }

  startRegeneration(): boolean {
    if (!this.state.status.connected) return false;
    if (this.state.data.isRegenerating) return false;

    this.state.data.isRegenerating = true;
    this.state.data.regenerationProgress = 0;
    this.regenerationStartTime = Date.now();
    this.targetRegenProgress = 100;
    
    return true;
  }

  stopRegeneration(): number {
    const progress = this.state.data.regenerationProgress;
    this.state.data.isRegenerating = false;
    this.targetRegenProgress = 0;
    return progress;
  }

  setRegenerationProgress(progress: number): void {
    this.targetRegenProgress = progress;
  }

  readErrorCodes(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const codes: string[] = [];
        const codeKeys = Object.keys(ERROR_CODES);
        
        if (this.state.data.dpfSootLevel > 70) {
          codes.push("P2002");
        }
        if (this.state.data.dpfPressure > 80) {
          codes.push("P2452");
        }
        if (Math.random() < 0.1) {
          const randomCode = codeKeys[Math.floor(Math.random() * codeKeys.length)];
          if (!codes.includes(randomCode)) {
            codes.push(randomCode);
          }
        }
        
        this.state.status.errorCodes = codes;
        resolve(codes);
      }, 800);
    });
  }

  clearErrorCodes(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.state.status.errorCodes = [];
        resolve(true);
      }, 1200);
    });
  }

  getErrorCodeDescription(code: string): string {
    return ERROR_CODES[code as keyof typeof ERROR_CODES] || "Unknown Error Code";
  }

  getData(): OBD2Data {
    return { ...this.state.data };
  }

  getStatus(): OBD2Status {
    return { ...this.state.status };
  }

  isConnected(): boolean {
    return this.state.status.connected;
  }

  subscribe(callback: OBD2DataCallback): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyCallbacks(): void {
    const data = this.getData();
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("OBD2 callback error:", error);
      }
    });
  }
}

export const obd2Simulator = new OBD2Simulator();
