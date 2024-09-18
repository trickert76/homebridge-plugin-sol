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
    const url: string = `${this.endpoint}/api/devices`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      if ('devices' in data) {
        data.devices.forEach( (device: any) => {
          this.log.info(`Found device ${device.name}`);
          devices.push(new SolDevice(device));
        });
      }
    } catch (exception) {
      this.log.error(`ERROR received from ${url}: ${exception}\n`);
    }
    return devices;
  }
}


export class SolDevice {
  public id: string;
  public name: string;
  public room: string;
  public bridge: string;
  public elements: SolDeviceElement[];
  
  constructor(device :any) {
    this.id = device.id;
    this.name = device.name;
    this.room = device.room;
    this.bridge = device.bridge;
    this.elements = [];
    device.elements.forEach((element :any) => this.elements.push(new SolDeviceElement(element)));
  }
}

export class SolDeviceElement {
  public id: string;
  public uniqueid: string;
  public checked: string;
  public capabilities: SolCapability;
  public state: SolState;
  constructor(element :any) {
    this.id = element.id;
    this.uniqueid = element.uniqueid;
    this.checked = element.checked;
    this.capabilities = new SolCapability(element.capability);
    this.state = new SolState(element.state);
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
    this.brightness = capability.brightness;
    this.color = capability.color;
    this.switch = capability.switch;
    this.power = capability.power;
    this.temperature = capability.temperature;
    this.humidity = capability.humidity;
  }
}


export class SolState {
  public reachable: boolean;
  public on: boolean;

  public brightness: number;
  public rgb: string;
  public power: number;
  public temperature: number;
  public humidity: number;
  constructor(state :any) {
    this.reachable = state.reachable;
    this.on = state.color;

    this.brightness = state.brightness;
    this.rgb = state.rgb;

    this.power = state.power;
    this.temperature = state.temperature;
    this.humidity = state.humidity;
  }
}