const fz = require('../converters/fromZigbee');
const tz = require('../converters/toZigbee');
const exposes = require('../lib/exposes');
const reporting = require('../lib/reporting');
const e = exposes.presets;

module.exports = [
    {
        zigbeeModel: ['E-Wand'],
        model: 'CP180335E-01',
        vendor: 'Current Products Corp',
        description: 'Gen. 2 hybrid E-Wand',
        fromZigbee: [fz.battery, fz.cover_tilt],
        toZigbee: [tz.cover_tilt, tz.cover_state],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['closuresWindowCovering', 'genPowerCfg']);
            await reporting.currentPositionTiltPercentage(endpoint);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.battery(), e.cover_position()],
    },
];
