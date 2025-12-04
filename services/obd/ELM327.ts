import bleManager from '../bluetooth/BleManager';

export type ELM327Info = {
  version: string;
  protocol: string;
  voltage: string;
};

class ELM327Service {
  private isInitialized: boolean = false;
  private info: ELM327Info | null = null;

  async initialize(): Promise<boolean> {
    try {
      await this.reset();
      
      await this.sendCommand('ATE0');
      
      await this.sendCommand('ATL0');
      
      await this.sendCommand('ATS0');
      
      await this.sendCommand('ATH1');
      
      const versionResponse = await this.sendCommand('ATI');
      this.info = {
        version: this.parseVersion(versionResponse),
        protocol: '',
        voltage: '',
      };

      const voltageResponse = await this.sendCommand('ATRV');
      this.info.voltage = this.parseVoltage(voltageResponse);

      await this.sendCommand('ATSP6');

      const protocolResponse = await this.sendCommand('ATDPN');
      this.info.protocol = this.parseProtocol(protocolResponse);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('ELM327 initialization error:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async reset(): Promise<void> {
    await this.sendCommand('ATZ');
    await this.delay(1000);
  }

  async sendCommand(command: string): Promise<string> {
    const response = await bleManager.sendCommand(command);
    return this.cleanResponse(response);
  }

  async sendRawCAN(canId: string, data: string): Promise<string> {
    await this.sendCommand(`ATSH${canId}`);
    
    const response = await this.sendCommand(data);
    return response;
  }

  async setCANReceiveAddress(address: string): Promise<void> {
    await this.sendCommand(`ATCRA${address}`);
  }

  async setCANFlowControl(enabled: boolean): Promise<void> {
    await this.sendCommand(enabled ? 'ATCFC1' : 'ATCFC0');
  }

  private cleanResponse(response: string): string {
    return response
      .replace(/>/g, '')
      .replace(/\r/g, '')
      .replace(/\n/g, ' ')
      .replace(/SEARCHING\.\.\./gi, '')
      .replace(/NO DATA/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseVersion(response: string): string {
    const match = response.match(/ELM\d+\s*v?\d+\.\d+/i);
    return match ? match[0] : 'Unknown';
  }

  private parseVoltage(response: string): string {
    const match = response.match(/(\d+\.?\d*)\s*V/i);
    return match ? `${match[1]}V` : 'Unknown';
  }

  private parseProtocol(response: string): string {
    const protocols: { [key: string]: string } = {
      '0': 'Auto',
      '1': 'SAE J1850 PWM',
      '2': 'SAE J1850 VPW',
      '3': 'ISO 9141-2',
      '4': 'ISO 14230-4 KWP',
      '5': 'ISO 14230-4 KWP (fast)',
      '6': 'ISO 15765-4 CAN (11bit, 500kbps)',
      '7': 'ISO 15765-4 CAN (29bit, 500kbps)',
      '8': 'ISO 15765-4 CAN (11bit, 250kbps)',
      '9': 'ISO 15765-4 CAN (29bit, 250kbps)',
      'A': 'SAE J1939 CAN',
      'B': 'User1 CAN',
      'C': 'User2 CAN',
    };

    const match = response.match(/[0-9A-C]/i);
    if (match) {
      const key = match[0].toUpperCase();
      return protocols[key] || `Protocol ${key}`;
    }
    return 'Unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getInfo(): ELM327Info | null {
    return this.info;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const elm327 = new ELM327Service();
export default elm327;
