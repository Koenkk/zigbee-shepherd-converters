const utils = require('zigbee-herdsman-converters/lib/utils');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const e = exposes.presets;
const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const reporting = require('zigbee-herdsman-converters/lib/reporting');

module.exports = [
    {
        zigbeeModel: ['wall pir'],
        model: 'PRZ01',
        vendor: 'jdwhale',
        description: 'Human body movement sensor',
        supports: 'occupancy',
        fromZigbee: [fz.ias_occupancy_alarm_1_with_timeout,fz.battery],
        toZigbee: [],
	    	exposes: [e.occupancy(), e.battery_low(), e.battery()],    
	  },
   {
        zigbeeModel: ['door sensor'],
        model: 'DSZ01',
        vendor: 'jdwhale',
        description: 'Door or window contact switch',
        supports: 'contact',
        fromZigbee: [fz.ias_contact_alarm_1,fz.battery],
        toZigbee: [],
        exposes: [e.contact(), e.battery_low()],   
	 },
  {
      zigbeeModel: ['JD-SWITCH\u000002'],
      model: 'WSZ01',
      vendor: 'jdwhale',
      description: 'Wireless switch',
      supports: 'Wireless switch with 1 button',
      fromZigbee: [fz.WSZ01_on_off_action,fz.battery],
      toZigbee: [],
	    exposes: [ e.action(['release','single', 'double', 'hold'])],
	},
  {
      zigbeeModel: ['00090bdc'],
      model: 'SPZ01',
      vendor: 'jdwhale',
      description: 'plug',
      supports: 'plug',
      fromZigbee: [fz.on_off, fz.electrical_measurement,fz.metering],
      exposes: [e.switch(), e.power()],
      toZigbee: [tz.on_off,tz.SPZ01_power_outage_memory],
      meta: {configureKey: 1},
      configure: async (device, coordinatorEndpoint, logger) => {
      const endpoint = device.getEndpoint(1);
      await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'haElectricalMeasurement']);
   },  
    
];      
