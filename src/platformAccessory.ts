import type { CharacteristicValue, PlatformAccessory } from 'homebridge';

import type { SOLHomebridgePlatform } from './platform.js';
import { SolApi, SolDevice } from './sol-api.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SOLPlatformAccessory {
  constructor(
    private readonly platform: SOLHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: SolDevice,
    private readonly solApi: SolApi,
  ) {
    // set accessory information
    // see https://developers.homebridge.io/#/service/AccessoryInformation
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Thoralf Rickert-Wendt')
      .setCharacteristic(this.platform.Characteristic.Model, device.name)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.id)
      .setCharacteristic(this.platform.Characteristic.Name, device.name);

    // HAP-NodeJS WARNING: The accessory 'Zimmer Mats-Ole' has an invalid 'Name' characteristic ('Zimmer Mats-Ole'). 
    // Please use only alphanumeric, space, and apostrophe characters. Ensure it starts and ends with an alphabetic 
    // or numeric character, and avoid emojis. This may prevent the accessory from being added in the Home App or
    // cause unresponsiveness.

    switch (device.type) {
    case 'lightbulb': {
      // https://developers.homebridge.io/#/service/Lightbulb
      //  - for Hue, Shelly, Fritzbox
    
      // get the LightBulb service if it exists, otherwise create a new LightBulb service
      // you can create multiple services for each accessory
      const lightbulb = this.accessory.getService(this.platform.Service.Lightbulb) 
                     || this.accessory.addService(this.platform.Service.Lightbulb);

      // register handlers for the On/Off Characteristic
      lightbulb.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
        .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
        
      if (device.getCapabilities().brightness) {
        // register handlers for the Brightness Characteristic
        lightbulb.getCharacteristic(this.platform.Characteristic.Brightness)
          .onGet(this.getBrightness.bind(this))
          .onSet(this.setBrightness.bind(this)); // SET - bind to the 'setBrightness` method below
      }
      
      if (device.getCapabilities().color) {
        // need to find a way from rgb to hue, saturation, color temperature
      }

      if (device.getCapabilities().temperature) {
        const temperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor) 
                               || this.accessory.addService(this.platform.Service.TemperatureSensor);
        temperatureSensor.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .onGet(this.getCurrentTemperature.bind(this));
      }
      break;
    }

    case 'daylight': {
      // https://developers.homebridge.io/#/service/LightSensor
      //  - for Shelly
      const lightsensor = this.accessory.getService(this.platform.Service.LightSensor)
                       || this.accessory.addService(this.platform.Service.LightSensor);
      // register handlers for the Brightness Characteristic
      lightsensor.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getDaylight.bind(this));
      break;
    }

    case 'sensor': {
      // https://developers.homebridge.io/#/service/Battery
      //  - for Sungrow
      //  - for EVCC Wallbox/Vehicle
      
      // https://developers.homebridge.io/#/service/CarbonDioxideSensor
      //  - for Shelly

      // https://developers.homebridge.io/#/service/CarbonMonoxideSensor
      //  - for Shelly

      // https://developers.homebridge.io/#/service/HeaterCooler
      //  - for Bosch

      // https://developers.homebridge.io/#/service/HumiditySensor
      //  - for Shelly
      if (device.getCapabilities().humidity) {
        const temperatureSensor = this.accessory.getService(this.platform.Service.HumiditySensor)
                              || this.accessory.addService(this.platform.Service.HumiditySensor);
        temperatureSensor.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
          .onGet(this.getCurrentHumidity.bind(this));
      }

      // https://developers.homebridge.io/#/service/PowerManagement
      //  - fir Fritzbox, Shelly, Sungrow, EVCC ???

      // https://developers.homebridge.io/#/service/SmokeSensor
      //  - for Shelly

      // https://developers.homebridge.io/#/service/TemperatureSensor
      //  - for Shelly, Fritzbox
      if (device.getCapabilities().temperature) {
        const temperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor)
                              || this.accessory.addService(this.platform.Service.TemperatureSensor);
        temperatureSensor.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .onGet(this.getCurrentTemperature.bind(this));
      }
      
      // https://developers.homebridge.io/#/service/WiFiRouter
      //  - for Fritzbox

      break;
    }

    default: {
      // https://developers.homebridge.io/#/service/Switch
      //  - for Shelly, Fritzbox, Hue
      const mySwitch = this.accessory.getService(this.platform.Service.Switch) 
                    || this.accessory.addService(this.platform.Service.Switch);
      // register handlers for the Brightness Characteristic
      mySwitch.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
        .onGet(this.getOn.bind(this));
      break;
    }
    }






    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same subtype id.)
     */

    // Example: add two "motion sensor" services to the accessory
    // const motionSensorOneService = this.accessory.getService('Motion Sensor One Name')
    //   || this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

    // const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name')
    //   || this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');

    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    // let motionDetected = false;
    // setInterval(() => {
    // EXAMPLE - inverse the trigger
    // motionDetected = !motionDetected;

    // push the new value to HomeKit
    // motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
    // motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

    // this.platform.log.debug('Triggering motionSensorOneService:', motionDetected);
    // this.platform.log.debug('Triggering motionSensorTwoService:', !motionDetected);
    // }, 10000);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    this.device.getState().on = value as boolean;
    this.platform.log.debug('['+this.device.name+'] Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    const isOn = this.device.getState().on;
    this.platform.log.debug('['+this.device.name+'] Get Characteristic On ->', isOn);
    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    this.device.getState().brightness = value as number;
    this.platform.log.debug('['+this.device.name+'] Set Characteristic Brightness -> ', value);
  }
  
  async getBrightness() :Promise<CharacteristicValue> {
    const brightness = this.device.getState().brightness;
    this.platform.log.debug('['+this.device.name+'] Get Characteristic Brightness ->', brightness);
    return brightness;
  }
  
  async getDaylight() :Promise<CharacteristicValue> {
    const currentValue = this.device.getState().on ? 100000 : 0.0001;
    this.platform.log.debug('['+this.device.name+'] Get Characteristics Daylight ->', currentValue);
    return currentValue;
  }
  
  async getCurrentTemperature() {
    const currentValue = this.device.getState().temperature;
    this.platform.log.debug('['+this.device.name+'] Get Characteristics Temperature ->', currentValue);
    return currentValue;
  }
  
  async getCurrentHumidity() {
    const currentValue = this.device.getState().humidity;
    this.platform.log.debug('['+this.device.name+'] Get Characteristics Humidity ->', currentValue);
    return currentValue;
  }


}
