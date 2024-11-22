import type { Logging } from 'homebridge';
import axios from 'axios';

/* eslint-disable  @typescript-eslint/no-explicit-any */

export class SolApi {
  constructor(
    private readonly log: Logging,
    private readonly endpoint: string,
  ) {
    // nothing to do
  }

  /**
   * returns list of all SOL devices
   */
  public async getDevices() :Promise<SolDevice[]> {
    const devices : SolDevice[] = [];
    const url: string = `${this.endpoint}/api/homebridge/devices`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      if (typeof data === 'string') {
        this.log.info(`ERROR received error from ${url}: ${data}`);
      } else {
        if ('devices' in data) {
          data.devices.forEach( (device: any) => {
            this.log.info(`Received Status for SOL Device ${device.name}`);
            devices.push(new SolDevice(device, data.status.version));
          });
        }
      }
    } catch (exception) {
      this.log.error(`ERROR received from ${url}: ${exception}\n`);
    }
    return devices;
  }

  public async setState(device: SolDevice, state: boolean) :Promise<SolDevice | undefined> {
    const enable = state ? 'true' : 'false';
    const url: string = `${this.endpoint}/api/switch/?reference=${device.reference}&enable=${enable}`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      if ('smarthome' in data) {
        return new SolDevice(data.smarthome, data.status.version);
      }
    } catch (exception) {
      this.log.error(`ERROR received from ${url}: ${exception}\n`);
    }
    
    return undefined;
  }
  
  public async setBrightness(device: SolDevice, value: number) :Promise<SolDevice | undefined> {
    const url: string = `${this.endpoint}/api/brightness/`;
    const body = { reference: device.reference, value: value };
    try {
      const response = await axios.post(url, body);
      const data = response.data;
      
      if ('smarthome' in data) {
        return new SolDevice(data.smarthome, data.status.version);
      }
    } catch (exception) {
      this.log.error(`ERROR received from ${url}: ${exception}\n`);
    }
    
    return undefined;
  }
  

  public async setColor(device: SolDevice, value: string) :Promise<SolDevice | undefined> {
    const url: string = `${this.endpoint}/api/color/`;
    const body = { reference: device.reference, value: value };
    try {
      const response = await axios.post(url, body);
      const data = response.data;
      
      if ('smarthome' in data) {
        return new SolDevice(data.smarthome, data.status.version);
      }
    } catch (exception) {
      this.log.error(`ERROR received from ${url}: ${exception}\n`);
    }
    
    return undefined;
  }
}


export class SolDevice {
  public id: string;
  public reference: string;
  public name: string;
  public room: string;
  public type: string;
  public singleton: boolean;
  public bridge: string;
  public capability: SolCapability;
  public state: SolState;
  public extra: any;
  public elements: SolDeviceElement[];
  public version: string;
  
  constructor(device :any, version: string) {
    this.version = version;
    this.id = device.id;
    this.reference = device.reference;
    this.name = device.name;
    this.room = device.room;
    this.type = device.type;
    this.singleton = device.singleton;
    this.bridge = device.bridge;
    this.capability = new SolCapability(device.capabilities);
    this.state = new SolState(device.state);
    this.extra = device.extra;
    this.elements = [];
    device.elements.forEach((element :any) => this.elements.push(new SolDeviceElement(element)));
  }
}

export class SolDeviceElement {
  public id: string;
  public reference: string;
  public name: string;
  public checked: string;
  public capability: SolCapability;
  public state: SolState;
  public extra: any;

  constructor(element :any) {
    this.id = element.id;
    this.reference = element.reference;
    this.name = element.name;
    this.checked = element.checked;
    this.capability = new SolCapability(element.capabilities);
    this.state = new SolState(element.state);
    this.extra = element.extra;
  }
}

export class SolCapability {
  public brightness: boolean;
  public color: boolean;
  public switch: boolean;
  public power: boolean;
  public temperature: boolean;
  public humidity: boolean;

  constructor(capability :any) {
    this.brightness = 'brightness' in capability ? capability.brightness : false;
    this.color = 'color' in capability ? capability.color : false;
    this.switch = 'switch' in capability ? capability.switch : false;
    this.power = 'power' in capability ? capability.power : false;
    this.temperature = 'temperature' in capability ? capability.temperature : false;
    this.humidity = 'humidity' in capability ? capability.humidity : false;
  }
}


export class SolState {
  public reachable: boolean;
  public on: boolean;

  public brightness: number;
  public rgb: string;
  public hsb: SolHSB;
  public power: number;
  public temperature: number;
  public humidity: number;

  constructor(state :any) {
    this.reachable =  'reachable' in state ? state.reachable : false;
    this.on = 'on' in state ? state.on : false;

    this.brightness = 'brightness' in state ? state.brightness : 0;
    this.rgb = 'rgb' in state ? state.rgb : '#000000';
    this.hsb = new SolHSB(state.hsb);
    this.power = 'power' in state ? state.power : 0;
    this.temperature = 'temperature' in state ? state.temperature : 0;
    this.humidity = 'humidity' in state ? state.humidity : 0;
    
  }
}

export class SolHSB {
  public hue: number = 0;
  public saturation: number = 0;
  public brightness: number = 0;

  constructor(color :any) {
    if (color != null) {
      this.hue = color.hue;
      this.saturation = color.saturation;
      this.brightness = color.brightness;
    }
  }

  public saturation2hex(saturation: number) :string {
    return this.rgb2hex(this.hsb2rgb({ h: this.hue, s: saturation, b: this.brightness }));
  }

  public hue2hex(hue: number) :string {
    return this.rgb2hex(this.hsb2rgb({ h: hue, s: this.saturation, b: this.brightness }));
  }


  private hex2rgb(hex :string) :{ r :number, g :number, b :number } {
    let ha = hex.slice(hex.startsWith('#') ? 1 : 0);
    if (ha.length === 3) {
      ha = [...ha].map(x => x + x).join('');
    }
    const h = parseInt(ha, 16);
    
    return {
      r: (h >>> (16)),
      g: ((h & (0x00ff00)) >>> (8)),
      b: ((h & (0x0000ff)) >>> (0)),
    };
  }
  
  private rgb2hex(color: { r :number, g :number, b :number }) :string {
    return ((color.r << 16) + (color.g << 8) + color.b).toString(16).padStart(6, '0');
  }


  private rgb2hsb(color: { r :number, g :number, b :number }) :{ h :number, s :number, b :number } {
    color.r /= 255;
    color.g /= 255;
    color.b /= 255;
    const v = Math.max(color.r, color.g, color.b),
      n = v - Math.min(color.r, color.g, color.b);
    const h =
      n === 0 ? 0 : n && v === color.r ? (color.g - color.b) / n : v === color.g ? 2 + (color.b - color.r) / n : 4 + (color.r - color.g) / n;
    return {
      h: 60 * (h < 0 ? h + 6 : h),
      s: v && (n / v) * 100,
      b: v * 100,
    };
  }

  private hsb2rgb(color: { h :number, s :number, b :number }) :{ r :number, g :number, b :number } {
    color.s /= 100;
    color.b /= 100;
    const k = (n :number) => (n + color.h / 60) % 6;
    const f = (n :number) => color.b * (1 - color.s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return {
      r: 255 * f(5),
      g: 255 * f(3),
      b: 255 * f(1),
    };
  }
}