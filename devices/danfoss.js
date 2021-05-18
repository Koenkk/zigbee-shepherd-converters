const exposes = require('../lib/exposes');
const fz = {...require('../converters/fromZigbee'), legacy: require('../lib/legacy').fromZigbee};
const tz = require('../converters/toZigbee');
const ota = require('../lib/ota');
const constants = require('../lib/constants');
const reporting = require('../lib/reporting');
const e = exposes.presets;
const ea = exposes.access;

module.exports = [
    {
        // eTRV0100 is the same as Hive TRV. If implementing anything, please consider changing Hive TRV001 too.
        zigbeeModel: ['eTRV0100'],
        model: '014G2461',
        vendor: 'Danfoss',
        description: 'Ally thermostat',
        fromZigbee: [fz.battery, fz.legacy.thermostat_att_report, fz.hvac_user_interface, fz.danfoss_thermostat],
        toZigbee: [tz.thermostat_occupied_heating_setpoint, tz.thermostat_local_temperature, tz.danfoss_mounted_mode_control,
            tz.danfoss_thermostat_orientation, tz.danfoss_algorithm_scale_factor, tz.danfoss_heat_available, tz.danfoss_day_of_week,
            tz.danfoss_trigger_time, tz.danfoss_window_open_internal, tz.danfoss_window_open_external, tz.danfoss_display_orientation,
            tz.thermostat_keypad_lockout],
        exposes: [e.battery(), e.keypad_lockout(),
            exposes.binary('mounted_mode_active', ea.STATE, true, false)
                .withDescription('Is the unit in mounting mode. This is set to `false` for mounted (already on ' +
                    'the radiator) or `true` for not mounted (after factory reset)'),
            exposes.binary('mounted_mode_control', ea.ALL, true, false)
                .withDescription('Set the unit mounting mode. `false` Go to Mounting Mode or `true` Go to Mounted Mode'),
            exposes.binary('heat_available', ea.ALL, true, false)
                .withDescription('Not clear how this affects operation. `false` No Heat Available or `true` Heat Available'),
            exposes.binary('heat_required', ea.STATE, true, false)
                .withDescription('Whether or not the unit needs warm water. `false` No Heat Request or `true` Heat Request'),
            exposes.binary('setpoint_change_source', ea.STATE, 0, 1)
                .withDescription('Values observed are `0` (set locally) or `2` (set via Zigbee)'),
            exposes.climate().withSetpoint('occupied_heating_setpoint', 5, 32, 0.5).withLocalTemperature().withPiHeatingDemand(),
            exposes.numeric('window_open_internal', ea.STATE_GET).withValueMin(0).withValueMax(4)
                .withDescription('0=Quarantine, 1=Windows are closed, 2=Hold - Windows are maybe about to open, ' +
                    '3=Open window detected, 4=In window open state from external but detected closed locally'),
            exposes.binary('window_open_external', ea.ALL, true, false)
                .withDescription('Set if the window is open or close. This setting will trigger a change in the internal ' +
                    'window and heating demand. `false` (windows are closed) or `true` (windows are open)'),
            exposes.numeric('day_of_week', ea.ALL).withValueMin(0).withValueMax(7)
                .withDescription('Exercise day of week: 0=Sun...6=Sat, 7=undefined'),
            exposes.numeric('trigger_time', ea.ALL).withValueMin(0).withValueMax(65535)
                .withDescription('Exercise trigger time. Minutes since midnight (65535=undefined). Range 0 to 1439'),
            exposes.numeric('algorithm_scale_factor', ea.ALL).withValueMin(1).withValueMax(10)
                .withDescription('Scale factor of setpoint filter timeconstant ("aggressiveness" of control algorithm) '+
                    '1= Quick ...  5=Moderate ... 10=Slow')],
        ota: ota.zigbeeOTA,
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            const options = {manufacturerCode: 0x1246};
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg', 'hvacThermostat']);

            // standard ZCL attributes
            await reporting.batteryPercentageRemaining(endpoint, {min: 60, max: 43200, change: 1});
            await reporting.thermostatTemperature(endpoint, {min: 0, max: constants.repInterval.MINUTES_10, change: 25});
            await reporting.thermostatPIHeatingDemand(endpoint, {min: 0, max: constants.repInterval.MINUTES_10, change: 1});
            await reporting.thermostatOccupiedHeatingSetpoint(endpoint, {min: 0, max: constants.repInterval.MINUTES_10, change: 25});

            // danfoss attributes
            await endpoint.configureReporting('hvacThermostat', [{attribute: {ID: 0x4012, type: 0x10}, minimumReportInterval: 0,
                maximumReportInterval: constants.repInterval.MINUTES_10, reportableChange: 1}], options);
            await endpoint.configureReporting('hvacThermostat', [{attribute: {ID: 0x4000, type: 0x30}, minimumReportInterval: 0,
                maximumReportInterval: constants.repInterval.HOUR, reportableChange: 1}], options);

            // read keypadLockout, we don't need reporting as it cannot be set physically on the device
            await endpoint.read('hvacUserInterfaceCfg', ['keypadLockout']);
            await endpoint.read('hvacThermostat', [0x4003, 0x4010, 0x4011, 0x4020], options);

            // Seems that it is bug in Danfoss, device does not asks for the time with binding
            // So, we need to write time during configure (same as for HEIMAN devices)
            const time = Math.round(((new Date()).getTime() - constants.OneJanuary2000) / 1000);
            // Time-master + synchronised
            const values = {timeStatus: 3, time: time, timeZone: ((new Date()).getTimezoneOffset() * -1) * 60};
            endpoint.write('genTime', values);
        },
    },
];
