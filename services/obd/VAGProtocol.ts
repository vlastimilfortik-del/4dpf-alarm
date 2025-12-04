import elm327 from './ELM327';

export type DPFData = {
  sootLoad: number;
  sootLoadPercent: number;
  isRegenerating: boolean;
  regenPhase: 'none' | 'passive' | 'active' | 'service';
  dpfTemperature: number | null;
  exhaustTemperature: number | null;
  distanceSinceRegen: number | null;
  timeSinceRegen: number | null;
  lastUpdate: Date;
};

const ENGINE_ECU_CAN_ID_11BIT = '7E0';
const ENGINE_ECU_RESPONSE_11BIT = '7E8';

const ENGINE_ECU_CAN_ID_29BIT = '18DA10F1';
const ENGINE_ECU_RESPONSE_29BIT = '18DAF110';

const DPF_MEASURING_BLOCKS = {
  SOOT_MASS: '3278',
  DPF_TEMP: '3972',
  REGEN_STATUS: '3282',
  DISTANCE_SINCE_REGEN: '3274',
};

const UDS_START_DIAGNOSTIC_SESSION = '1003';
const UDS_READ_DATA_BY_ID = '22';

const REGEN_THRESHOLD_SOOT = 25;
const MAX_SOOT_LOAD = 45;

const TEMP_REGEN_THRESHOLD_DPF = 550;
const TEMP_REGEN_THRESHOLD_EXHAUST = 450;
const TEMP_NORMAL_MAX_DPF = 400;
const TEMP_RISE_RATE_THRESHOLD = 50;
const TEMP_HISTORY_SIZE = 10;

class VAGProtocolService {
  private lastDPFData: DPFData | null = null;
  private sessionActive: boolean = false;
  private use29BitAddressing: boolean = false;
  private tempHistory: { dpf: number[]; exhaust: number[]; timestamps: number[] } = {
    dpf: [],
    exhaust: [],
    timestamps: [],
  };
  private regenDetectedByTemp: boolean = false;

  async initializeVAGProtocol(): Promise<boolean> {
    try {
      await elm327.sendCommand('ATSP6');
      
      await elm327.sendCommand(`ATSH${ENGINE_ECU_CAN_ID_11BIT}`);
      await elm327.sendCommand(`ATCRA${ENGINE_ECU_RESPONSE_11BIT}`);
      await elm327.sendCommand('ATCFC1');
      
      const testResponse = await elm327.sendCommand('0100');
      
      if (testResponse.includes('41 00') || testResponse.includes('4100')) {
        const sessionStarted = await this.startDiagnosticSession();
        if (sessionStarted) {
          this.use29BitAddressing = false;
          return true;
        }
      }

      return await this.tryVAG29BitProtocol();
    } catch (error) {
      console.error('VAG protocol initialization error:', error);
      return false;
    }
  }

  private async tryVAG29BitProtocol(): Promise<boolean> {
    try {
      await elm327.sendCommand('ATSP6');
      await elm327.sendCommand('ATCEA');
      
      await elm327.sendCommand(`ATSH${ENGINE_ECU_CAN_ID_29BIT}`);
      await elm327.sendCommand(`ATCRA${ENGINE_ECU_RESPONSE_29BIT}`);
      
      await elm327.sendCommand('ATFCSH' + ENGINE_ECU_CAN_ID_29BIT);
      await elm327.sendCommand('ATFCSD300000');
      await elm327.sendCommand('ATFCSM1');
      
      const sessionStarted = await this.startDiagnosticSession();
      if (sessionStarted) {
        this.use29BitAddressing = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('29-bit protocol error:', error);
      return false;
    }
  }

  private async startDiagnosticSession(): Promise<boolean> {
    try {
      const response = await elm327.sendCommand(UDS_START_DIAGNOSTIC_SESSION);
      
      if (response.includes('50 03') || response.includes('5003')) {
        this.sessionActive = true;
        return true;
      }
      
      if (response.includes('7F')) {
        console.warn('Diagnostic session negative response:', response);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session start error:', error);
      return false;
    }
  }

  async readDPFData(): Promise<DPFData | null> {
    try {
      const sootData = await this.readSootLoad();
      const regenStatus = await this.readRegenStatus();
      const temperatures = await this.readTemperatures();
      const distance = await this.readDistanceSinceRegen();

      const isRegenerating = this.detectRegeneration(sootData, regenStatus, temperatures);

      this.lastDPFData = {
        sootLoad: sootData.sootMass,
        sootLoadPercent: Math.min(100, (sootData.sootMass / MAX_SOOT_LOAD) * 100),
        isRegenerating,
        regenPhase: this.getRegenPhase(regenStatus, isRegenerating),
        dpfTemperature: temperatures.dpfTemp,
        exhaustTemperature: temperatures.exhaustTemp,
        distanceSinceRegen: distance,
        timeSinceRegen: null,
        lastUpdate: new Date(),
      };

      return this.lastDPFData;
    } catch (error) {
      console.error('Error reading DPF data:', error);
      return await this.readDPFDataFallback();
    }
  }

  private async readSootLoad(): Promise<{ sootMass: number; calculated: number }> {
    try {
      const response = await elm327.sendCommand(`${UDS_READ_DATA_BY_ID}${DPF_MEASURING_BLOCKS.SOOT_MASS}`);
      const bytes = this.parseHexResponse(response);
      
      if (response.includes('62') && bytes.length >= 5) {
        const sootMass = ((bytes[3] << 8) + bytes[4]) / 100;
        return { sootMass, calculated: sootMass };
      }
    } catch (error) {
      console.error('Error reading soot load:', error);
    }

    return { sootMass: 0, calculated: 0 };
  }

  private async readRegenStatus(): Promise<number> {
    try {
      const response = await elm327.sendCommand(`${UDS_READ_DATA_BY_ID}${DPF_MEASURING_BLOCKS.REGEN_STATUS}`);
      const bytes = this.parseHexResponse(response);
      
      if (response.includes('62') && bytes.length >= 4) {
        return bytes[3];
      }
    } catch (error) {
      console.error('Error reading regen status:', error);
    }

    return 0;
  }

  private async readTemperatures(): Promise<{ dpfTemp: number | null; exhaustTemp: number | null }> {
    try {
      const response = await elm327.sendCommand(`${UDS_READ_DATA_BY_ID}${DPF_MEASURING_BLOCKS.DPF_TEMP}`);
      const bytes = this.parseHexResponse(response);
      
      if (response.includes('62') && bytes.length >= 7) {
        const dpfTemp = ((bytes[3] << 8) + bytes[4]) / 10 - 40;
        const exhaustTemp = ((bytes[5] << 8) + bytes[6]) / 10 - 40;
        return { dpfTemp, exhaustTemp };
      }
    } catch (error) {
      console.error('Error reading temperatures:', error);
    }

    return { dpfTemp: null, exhaustTemp: null };
  }

  private async readDistanceSinceRegen(): Promise<number | null> {
    try {
      const response = await elm327.sendCommand(`${UDS_READ_DATA_BY_ID}${DPF_MEASURING_BLOCKS.DISTANCE_SINCE_REGEN}`);
      const bytes = this.parseHexResponse(response);
      
      if (response.includes('62') && bytes.length >= 5) {
        return (bytes[3] << 8) + bytes[4];
      }
    } catch (error) {
      console.error('Error reading distance since regen:', error);
    }

    return null;
  }

  private async readDPFDataFallback(): Promise<DPFData | null> {
    try {
      let sootLoad = 0;
      let regenStatusByte = 0;

      try {
        const mode06Response = await elm327.sendCommand('06B2');
        const bytes = this.parseHexResponse(mode06Response);
        
        if (bytes.length >= 6) {
          sootLoad = bytes[4] / 2.55;
          regenStatusByte = bytes[5];
        }
      } catch (e) {
        console.log('Mode 06 not supported, using temperature detection only');
      }

      let dpfTemp: number | null = null;
      let exhaustTemp: number | null = null;

      try {
        const mode01Response = await elm327.sendCommand('017C');
        const mode01Bytes = this.parseHexResponse(mode01Response);
        
        if (mode01Bytes.length >= 4) {
          dpfTemp = ((mode01Bytes[2] << 8) + mode01Bytes[3]) / 10 - 40;
        }
      } catch (e) {
        console.log('PID 7C not supported');
      }

      if (dpfTemp === null) {
        try {
          const egt1Response = await elm327.sendCommand('0178');
          const egt1Bytes = this.parseHexResponse(egt1Response);
          
          if (egt1Bytes.length >= 4) {
            exhaustTemp = ((egt1Bytes[2] << 8) + egt1Bytes[3]) / 10 - 40;
          }
        } catch (e) {
          console.log('PID 78 not supported');
        }
      }

      const temperatures = { dpfTemp, exhaustTemp };
      const isRegenerating = this.detectRegeneration(
        { sootMass: sootLoad },
        regenStatusByte,
        temperatures
      );

      this.lastDPFData = {
        sootLoad,
        sootLoadPercent: Math.min(100, (sootLoad / MAX_SOOT_LOAD) * 100),
        isRegenerating,
        regenPhase: this.getRegenPhase(regenStatusByte, isRegenerating),
        dpfTemperature: dpfTemp,
        exhaustTemperature: exhaustTemp,
        distanceSinceRegen: null,
        timeSinceRegen: null,
        lastUpdate: new Date(),
      };

      return this.lastDPFData;
    } catch (error) {
      console.error('Fallback DPF read error:', error);
      return null;
    }
  }

  private detectRegeneration(
    sootData: { sootMass: number },
    regenStatus: number,
    temperatures: { dpfTemp: number | null; exhaustTemp: number | null }
  ): boolean {
    if (regenStatus > 0) {
      this.regenDetectedByTemp = false;
      return true;
    }

    if (this.lastDPFData) {
      const sootDropped = this.lastDPFData.sootLoad - sootData.sootMass > 5;
      const wasHighSoot = this.lastDPFData.sootLoad > REGEN_THRESHOLD_SOOT;
      
      if (sootDropped && wasHighSoot) {
        return true;
      }
    }

    const tempBasedRegen = this.detectRegenByTemperature(temperatures);
    if (tempBasedRegen) {
      this.regenDetectedByTemp = true;
      return true;
    }

    if (this.regenDetectedByTemp) {
      const regenEnded = this.checkRegenEndedByTemperature(temperatures);
      if (regenEnded) {
        this.regenDetectedByTemp = false;
        return false;
      }
      return true;
    }

    return false;
  }

  private detectRegenByTemperature(
    temperatures: { dpfTemp: number | null; exhaustTemp: number | null }
  ): boolean {
    const { dpfTemp, exhaustTemp } = temperatures;
    const now = Date.now();

    if (dpfTemp !== null) {
      this.tempHistory.dpf.push(dpfTemp);
      this.tempHistory.timestamps.push(now);
      if (this.tempHistory.dpf.length > TEMP_HISTORY_SIZE) {
        this.tempHistory.dpf.shift();
        this.tempHistory.timestamps.shift();
      }
    }

    if (exhaustTemp !== null) {
      this.tempHistory.exhaust.push(exhaustTemp);
      if (this.tempHistory.exhaust.length > TEMP_HISTORY_SIZE) {
        this.tempHistory.exhaust.shift();
      }
    }

    if (dpfTemp !== null && dpfTemp >= TEMP_REGEN_THRESHOLD_DPF) {
      console.log(`Regen detected: DPF temp ${dpfTemp}°C >= ${TEMP_REGEN_THRESHOLD_DPF}°C`);
      return true;
    }

    if (exhaustTemp !== null && exhaustTemp >= TEMP_REGEN_THRESHOLD_EXHAUST) {
      console.log(`Regen detected: Exhaust temp ${exhaustTemp}°C >= ${TEMP_REGEN_THRESHOLD_EXHAUST}°C`);
      return true;
    }

    if (this.tempHistory.dpf.length >= 3) {
      const riseRate = this.calculateTempRiseRate(this.tempHistory.dpf, this.tempHistory.timestamps);
      if (riseRate > TEMP_RISE_RATE_THRESHOLD && (dpfTemp ?? 0) > TEMP_NORMAL_MAX_DPF) {
        console.log(`Regen detected: Rapid temp rise ${riseRate.toFixed(1)}°C/min, current ${dpfTemp}°C`);
        return true;
      }
    }

    return false;
  }

  private checkRegenEndedByTemperature(
    temperatures: { dpfTemp: number | null; exhaustTemp: number | null }
  ): boolean {
    const { dpfTemp, exhaustTemp } = temperatures;

    if (dpfTemp !== null && dpfTemp < TEMP_NORMAL_MAX_DPF) {
      if (this.tempHistory.dpf.length >= 3) {
        const recentTemps = this.tempHistory.dpf.slice(-3);
        const allBelow = recentTemps.every(t => t < TEMP_NORMAL_MAX_DPF);
        if (allBelow) {
          console.log('Regen ended: DPF temp dropped below threshold');
          return true;
        }
      }
    }

    return false;
  }

  private calculateTempRiseRate(temps: number[], timestamps: number[]): number {
    if (temps.length < 2) return 0;

    const firstTemp = temps[0];
    const lastTemp = temps[temps.length - 1];
    const firstTime = timestamps[0];
    const lastTime = timestamps[timestamps.length - 1];

    const timeDiffMinutes = (lastTime - firstTime) / 60000;
    if (timeDiffMinutes <= 0) return 0;

    return (lastTemp - firstTemp) / timeDiffMinutes;
  }

  private getRegenPhase(
    regenStatus: number,
    isRegenerating: boolean
  ): 'none' | 'passive' | 'active' | 'service' {
    if (!isRegenerating) return 'none';

    if (this.regenDetectedByTemp && regenStatus === 0) {
      return 'active';
    }

    switch (regenStatus) {
      case 1:
        return 'passive';
      case 2:
        return 'active';
      case 3:
        return 'service';
      default:
        return 'active';
    }
  }

  isRegenDetectedByTemperature(): boolean {
    return this.regenDetectedByTemp;
  }

  private parseHexResponse(response: string): number[] {
    const cleaned = response.replace(/\s/g, '');
    const bytes: number[] = [];

    for (let i = 0; i < cleaned.length; i += 2) {
      const byte = parseInt(cleaned.substr(i, 2), 16);
      if (!isNaN(byte)) {
        bytes.push(byte);
      }
    }

    return bytes;
  }

  getLastDPFData(): DPFData | null {
    return this.lastDPFData;
  }
}

export const vagProtocol = new VAGProtocolService();
export default vagProtocol;
