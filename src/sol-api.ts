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
  public type: string;
  public bridge: string;
  public elements: SolDeviceElement[];
  
  constructor(device :any) {
    this.id = device.id;
    this.name = device.name;
    this.room = device.room;
    this.type = 'lightbulb';
    this.bridge = device.bridge;
    this.elements = [];
    device.elements.forEach((element :any) => this.elements.push(new SolDeviceElement(element)));
  }
  
  public getCapabilities() :SolCapability {
    if (this.elements.length > 0) {
      return this.elements[0].capability;
    }
    return new SolCapability({});
  }

  public getState() :SolState {
    if (this.elements.length > 0) {
      return this.elements[0].state;
    }
    return new SolState({});
  }
}

export class SolDeviceElement {
  public id: string;
  public uniqueid: string;
  public checked: string;
  public capability: SolCapability;
  public state: SolState;

  constructor(element :any) {
    this.id = element.id;
    this.uniqueid = element.uniqueid;
    this.checked = element.checked;
    this.capability = new SolCapability(element.capability);
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
  public power: number;
  public temperature: number;
  public humidity: number;

  constructor(state :any) {
    this.reachable =  'reachable' in state ? state.reachable : false;
    this.on = 'on' in state ? state.on : false;

    this.brightness = 'brightness' in state ? state.brightness : 0;
    this.rgb = 'rgb' in state ? state.rgb : '#000000';
    this.power = 'power' in state ? state.power : 0;
    this.temperature = 'temperature' in state ? state.temperature : 0;
    this.humidity = 'humidity' in state ? state.humidity : 0;
  }
}