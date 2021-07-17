const exposes = require('../lib/exposes');
const fz = {...require('../converters/fromZigbee'), legacy: require('../lib/legacy').fromZigbee};
const tz = require('../converters/toZigbee');
const globalStore = require('../lib/store');
const constants = require('../lib/constants');
const reporting = require('../lib/reporting');
const extend = require('../lib/extend');
const e = exposes.presets;
const ea = exposes.access;

module.exports = [
    {
        zigbeeModel: ['CO_V15', 'CO_YDLV10', 'CO_V16', '1ccaa94c49a84abaa9e38687913947ba'],
        model: 'HS1CA-M',
        description: 'Smart carbon monoxide sensor',
        vendor: 'HEIMAN',
        fromZigbee: [fz.ias_carbon_monoxide_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
            await reporting.batteryAlarmState(endpoint);
        },
        exposes: [e.carbon_monoxide(), e.battery_low(), e.battery()],
    },
    {
        zigbeeModel: ['PIRSensor-N', 'PIRSensor-EM', 'PIRSensor-EF-3.0', 'PIR_TPV13'],
        model: 'HS3MS',
        vendor: 'HEIMAN',
        description: 'Smart motion sensor',
        fromZigbee: [fz.ias_occupancy_alarm_1],
        toZigbee: [],
        exposes: [e.occupancy(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['SmartPlug'],
        model: 'HS2SK',
        description: 'Smart metering plug',
        vendor: 'HEIMAN',
        fromZigbee: [fz.on_off, fz.electrical_measurement],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'haElectricalMeasurement']);
            await reporting.onOff(endpoint);
            await reporting.readEletricalMeasurementMultiplierDivisors(endpoint);
            await reporting.rmsVoltage(endpoint);
            await reporting.rmsCurrent(endpoint);
            await reporting.activePower(endpoint);
        },
        exposes: [e.switch(), e.power(), e.current(), e.voltage()],
    },
    {
        fingerprint: [{modelID: 'SmartPlug-N', manufacturerName: 'HEIMAN'}],
        model: 'HS2SK_nxp',
        description: 'Smart metering plug',
        vendor: 'HEIMAN',
        fromZigbee: [fz.on_off, fz.electrical_measurement],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'haElectricalMeasurement']);
            await reporting.onOff(endpoint);
            await reporting.readEletricalMeasurementMultiplierDivisors(endpoint);
        },
        onEvent: (type, data, device, options) => {
            const endpoint = device.getEndpoint(1);
            if (type === 'stop') {
                clearInterval(globalStore.getValue(device, 'interval'));
                globalStore.clearValue(device, 'interval');
            } else if (!globalStore.hasValue(device, 'interval')) {
                const seconds = options && options.measurement_poll_interval ? options.measurement_poll_interval : 60;
                const interval = setInterval(async () => {
                    try {
                        await endpoint.read('haElectricalMeasurement', ['rmsVoltage', 'rmsCurrent', 'activePower']);
                    } catch (error) {/* Do nothing*/}
                }, seconds*1000);
                globalStore.putValue(device, 'interval', interval);
            }
        },
        exposes: [e.switch(), e.power(), e.current(), e.voltage()],
    },
    {
        zigbeeModel: ['SMOK_V16', 'SMOK_V15', 'b5db59bfd81e4f1f95dc57fdbba17931', '98293058552c49f38ad0748541ee96ba', 'SMOK_YDLV10',
            'FB56-SMF02HM1.4', 'SmokeSensor-N-3.0', '319fa36e7384414a9ea62cba8f6e7626'],
        model: 'HS1SA',
        vendor: 'HEIMAN',
        description: 'Smoke detector',
        fromZigbee: [fz.ias_smoke_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.smoke(), e.battery_low(), e.battery()],
    },
    {
        zigbeeModel: ['SmokeSensor-N', 'SmokeSensor-EF-3.0', 'SmokeSensor-EM'],
        model: 'HS3SA',
        vendor: 'HEIMAN',
        description: 'Smoke detector',
        fromZigbee: [fz.ias_smoke_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.smoke(), e.battery_low(), e.battery()],
    },
    {
        zigbeeModel: ['GASSensor-N'],
        model: 'HS3CG',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_1],
        toZigbee: [],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['GASSensor-EN'],
        model: 'HS1CG-M',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_1],
        toZigbee: [],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['GAS_V15'],
        model: 'HS1CG_M',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_2],
        toZigbee: [],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['DoorSensor-N', 'DoorSensor-N-3.0'],
        model: 'HS3DS',
        vendor: 'HEIMAN',
        description: 'Door sensor',
        fromZigbee: [fz.ias_contact_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        exposes: [e.contact(), e.battery(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['DoorSensor-EM', 'DoorSensor-EF-3.0'],
        model: 'HS1DS',
        vendor: 'HEIMAN',
        description: 'Door sensor',
        fromZigbee: [fz.ias_contact_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        exposes: [e.contact(), e.battery_low(), e.tamper(), e.battery()],
    },
    {
        zigbeeModel: ['DOOR_TPV13', 'DOOR_TPV12'],
        model: 'HEIMAN-M1',
        vendor: 'HEIMAN',
        description: 'Door sensor',
        fromZigbee: [fz.ias_contact_alarm_1],
        toZigbee: [],
        exposes: [e.contact(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['WaterSensor-N', 'WaterSensor-EM', 'WaterSensor-N-3.0', 'WaterSensor-EF-3.0'],
        model: 'HS1WL/HS3WL',
        vendor: 'HEIMAN',
        description: 'Water leakage sensor',
        fromZigbee: [fz.ias_water_leak_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        exposes: [e.water_leak(), e.battery_low(), e.tamper(), e.battery()],
    },
    {
        fingerprint: [{modelID: 'RC-N', manufacturerName: 'HEIMAN'}],
        model: 'HS1RC-N',
        vendor: 'HEIMAN',
        description: 'Smart remote controller',
        fromZigbee: [fz.battery, fz.legacy.heiman_smart_controller_armmode, fz.command_emergency],
        toZigbee: [],
        exposes: [e.battery(), e.action(['emergency', 'disarm', 'arm_partial_zones', 'arm_all_zones'])],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
    },
    {
        fingerprint: [{modelID: 'RC-EF-3.0', manufacturerName: 'HEIMAN'}],
        model: 'HM1RC-2-E',
        vendor: 'HEIMAN',
        description: 'Smart remote controller',
        fromZigbee: [fz.battery, fz.command_arm, fz.command_emergency],
        toZigbee: [],
        exposes: [e.battery(), e.action(['emergency', 'disarm', 'arm_partial_zones', 'arm_all_zones'])],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        onEvent: async (type, data, device) => {
            // Since arm command has a response zigbee-herdsman doesn't send a default response.
            // This causes the remote to repeat the arm command, so send a default response here.
            if (data.type === 'commandArm' && data.cluster === 'ssIasAce') {
                await data.endpoint.defaultResponse(0, 0, 1281, data.meta.zclTransactionSequenceNumber);
            }
        },
    },
    {
        fingerprint: [{modelID: 'RC-EM', manufacturerName: 'HEIMAN'}],
        model: 'HS1RC-EM',
        vendor: 'HEIMAN',
        description: 'Smart remote controller',
        fromZigbee: [fz.battery, fz.legacy.heiman_smart_controller_armmode, fz.command_emergency],
        toZigbee: [],
        exposes: [e.battery(), e.action(['emergency', 'disarm', 'arm_partial_zones', 'arm_all_zones'])],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
    },
    {
        zigbeeModel: ['COSensor-EM', 'COSensor-N', 'COSensor-EF-3.0'],
        model: 'HS1CA-E',
        vendor: 'HEIMAN',
        description: 'Smart carbon monoxide sensor',
        fromZigbee: [fz.ias_carbon_monoxide_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.carbon_monoxide(), e.battery_low(), e.battery()],
    },
    {
        fingerprint: [{modelID: 'TS0216', manufacturerName: '_TYZB01_8scntis1'}],
        zigbeeModel: ['WarningDevice', 'WarningDevice-EF-3.0', 'SRHMP-I1'],
        model: 'HS2WD-E',
        vendor: 'HEIMAN',
        description: 'Smart siren',
        fromZigbee: [fz.battery, fz.ignore_basic_report],
        toZigbee: [tz.warning],
        meta: {disableDefaultResponse: true},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.battery(), e.warning()],
    },
    {
        zigbeeModel: ['SOHM-I1'],
        model: 'SOHM-I1',
        vendor: 'HEIMAN',
        description: 'Door contact sensor',
        fromZigbee: [fz.ias_contact_alarm_1],
        toZigbee: [],
        exposes: [e.contact(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['SWHM-I1'],
        model: 'SWHM-I1',
        vendor: 'HEIMAN',
        description: 'Water leakage sensor',
        fromZigbee: [fz.ias_water_leak_alarm_1],
        toZigbee: [],
        exposes: [e.water_leak(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['SMHM-I1', 'PIR_TPV12'],
        model: 'SMHM-I1',
        vendor: 'HEIMAN',
        description: 'Smart motion sensor',
        fromZigbee: [fz.ias_occupancy_alarm_1],
        toZigbee: [],
        exposes: [e.occupancy(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['HT-EM', 'TH-EM', 'TH-T_V14'],
        model: 'HS1HT',
        vendor: 'HEIMAN',
        description: 'Smart temperature & humidity Sensor',
        exposes: [e.battery(), e.temperature(), e.humidity()],
        fromZigbee: [fz.temperature, fz.humidity, fz.battery],
        toZigbee: [],
        meta: {battery: {voltageToPercentage: '3V_2500'}},
        whiteLabel: [{vendor: 'Ferguson', model: 'TH-T_V14'}],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint1 = device.getEndpoint(1);
            await reporting.bind(endpoint1, coordinatorEndpoint, ['msTemperatureMeasurement']);
            const endpoint2 = device.getEndpoint(2);
            await reporting.bind(endpoint2, coordinatorEndpoint, ['msRelativeHumidity', 'genPowerCfg']);
            await reporting.temperature(endpoint1);
            await reporting.humidity(endpoint2);
            await reporting.batteryVoltage(endpoint2);
            await reporting.batteryPercentageRemaining(endpoint2);
        },
    },
    {
        zigbeeModel: ['HT-N', 'HT-EF-3.0'],
        model: 'HS1HT-N',
        vendor: 'HEIMAN',
        description: 'Smart temperature & humidity Sensor',
        fromZigbee: [fz.temperature, fz.humidity, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint1 = device.getEndpoint(1);
            await reporting.bind(endpoint1, coordinatorEndpoint, ['msTemperatureMeasurement', 'genPowerCfg']);
            await reporting.temperature(endpoint1);
            await reporting.batteryPercentageRemaining(endpoint1, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint1.read('genPowerCfg', ['batteryPercentageRemaining']);

            const endpoint2 = device.getEndpoint(2);
            await reporting.bind(endpoint2, coordinatorEndpoint, ['msRelativeHumidity']);
            await reporting.humidity(endpoint2);
        },
        exposes: [e.temperature(), e.humidity(), e.battery()],
    },
    {
        zigbeeModel: ['SKHMP30-I1'],
        model: 'SKHMP30-I1',
        description: 'Smart metering plug',
        vendor: 'HEIMAN',
        fromZigbee: [fz.on_off, fz.electrical_measurement],
        exposes: [e.switch(), e.power(), e.current(), e.voltage()],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'haElectricalMeasurement']);
            await reporting.onOff(endpoint);
            await reporting.rmsVoltage(endpoint);
            await reporting.rmsCurrent(endpoint);
            await reporting.activePower(endpoint);
            endpoint.saveClusterAttributeKeyValue('haElectricalMeasurement', {
                acVoltageMultiplier: 1, acVoltageDivisor: 100,
                acCurrentMultiplier: 1, acCurrentDivisor: 100,
                acPowerMultiplier: 1, acPowerDivisor: 10,
            });
        },
    },
    {
        zigbeeModel: ['E_Socket'],
        model: 'HS2ESK-E',
        vendor: 'HEIMAN',
        description: 'Smart in wall plug',
        fromZigbee: [fz.on_off, fz.electrical_measurement],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'haElectricalMeasurement']);
            await reporting.onOff(endpoint);
            await reporting.readEletricalMeasurementMultiplierDivisors(endpoint);
            await reporting.rmsVoltage(endpoint);
            await reporting.rmsCurrent(endpoint);
            await reporting.activePower(endpoint);
        },
        exposes: [e.switch(), e.power(), e.current(), e.voltage()],
    },
    {
        zigbeeModel: ['SGMHM-I1'],
        model: 'SGMHM-I1',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_1],
        toZigbee: [],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['STHM-I1H'],
        model: 'STHM-I1H',
        vendor: 'HEIMAN',
        description: 'Heiman temperature & humidity sensor',
        fromZigbee: [fz.temperature, fz.humidity, fz.battery],
        toZigbee: [],
        meta: {battery: {voltageToPercentage: '3V_2500'}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            const bindClusters = ['msTemperatureMeasurement', 'msRelativeHumidity', 'genPowerCfg'];
            await reporting.bind(endpoint, coordinatorEndpoint, bindClusters);
            await reporting.temperature(endpoint);
            await reporting.humidity(endpoint, {min: 0, change: 25});
            await reporting.batteryVoltage(endpoint);
        },
        exposes: [e.temperature(), e.humidity(), e.battery()],
    },
    {
        fingerprint: [{modelID: 'SOS-EM', manufacturerName: 'HEIMAN'}],
        model: 'HS1EB/HS1EB-E',
        vendor: 'HEIMAN',
        description: 'Smart emergency button',
        fromZigbee: [fz.command_status_change_notification_action, fz.legacy.st_button_state, fz.battery],
        toZigbee: [],
        exposes: [e.battery(), e.action(['off', 'single', 'double', 'hold'])],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
    },
    {
        fingerprint: [{modelID: 'SceneSwitch-EM-3.0', manufacturerName: 'HEIMAN'}],
        model: 'HS2SS',
        vendor: 'HEIMAN',
        description: 'Smart scene switch',
        fromZigbee: [fz.battery, fz.heiman_scenes],
        exposes: [e.battery(), e.action(['cinema', 'at_home', 'sleep', 'go_out', 'repast'])],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg', 'heimanSpecificScenes']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
        },
    },
    {
        zigbeeModel: ['GASSensor-EM'],
        model: 'HS1CG-E',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_1],
        toZigbee: [],
        whiteLabel: [{vendor: 'Piri', model: 'HSIO18008'}],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['GASSensor-EFR-3.0', 'GASSensor-EF-3.0'],
        model: 'HS1CG-E_3.0',
        vendor: 'HEIMAN',
        description: 'Combustible gas sensor',
        fromZigbee: [fz.ias_gas_alarm_2],
        toZigbee: [],
        exposes: [e.gas(), e.battery_low(), e.tamper()],
    },
    {
        fingerprint: [{modelID: 'Vibration-N', manufacturerName: 'HEIMAN'}],
        model: 'HS1VS-N',
        vendor: 'HEIMAN',
        description: 'Vibration sensor',
        fromZigbee: [fz.ias_vibration_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        exposes: [e.vibration(), e.battery_low(), e.tamper(), e.battery()],
    },
    {
        fingerprint: [{modelID: 'Vibration-EF_3.0', manufacturerName: 'HEIMAN'}],
        model: 'HS1VS-EF',
        vendor: 'HEIMAN',
        description: 'Vibration sensor',
        fromZigbee: [fz.ias_vibration_alarm_1, fz.battery],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);
        },
        exposes: [e.vibration(), e.battery_low(), e.tamper(), e.battery()],
    },
    {
        fingerprint: [{modelID: 'HS2AQ-EM', manufacturerName: 'HEIMAN'}],
        model: 'HS2AQ-EM',
        vendor: 'HEIMAN',
        description: 'Air quality monitor',
        fromZigbee: [fz.battery, fz.temperature, fz.humidity, fz.heiman_pm25, fz.heiman_hcho, fz.heiman_air_quality],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const heiman = {
                configureReporting: {
                    pm25MeasuredValue: async (endpoint, overrides) => {
                        const payload = reporting.payload('measuredValue', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificPM25Measurement', payload);
                    },
                    formAldehydeMeasuredValue: async (endpoint, overrides) => {
                        const payload = reporting.payload('measuredValue', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificFormaldehydeMeasurement', payload);
                    },
                    batteryState: async (endpoint, overrides) => {
                        const payload = reporting.payload('batteryState', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificAirQuality', payload);
                    },
                    pm10measuredValue: async (endpoint, overrides) => {
                        const payload = reporting.payload('pm10measuredValue', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificAirQuality', payload);
                    },
                    tvocMeasuredValue: async (endpoint, overrides) => {
                        const payload = reporting.payload('tvocMeasuredValue', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificAirQuality', payload);
                    },
                    aqiMeasuredValue: async (endpoint, overrides) => {
                        const payload = reporting.payload('aqiMeasuredValue', 0, constants.repInterval.HOUR, 1, overrides);
                        await endpoint.configureReporting('heimanSpecificAirQuality', payload);
                    },
                },
            };

            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, [
                'genPowerCfg', 'genTime', 'msTemperatureMeasurement', 'msRelativeHumidity', 'heimanSpecificPM25Measurement',
                'heimanSpecificFormaldehydeMeasurement', 'heimanSpecificAirQuality']);

            await reporting.batteryPercentageRemaining(endpoint);
            await reporting.temperature(endpoint);
            await reporting.humidity(endpoint);

            await heiman.configureReporting.pm25MeasuredValue(endpoint);
            await heiman.configureReporting.formAldehydeMeasuredValue(endpoint);
            await heiman.configureReporting.batteryState(endpoint);
            await heiman.configureReporting.pm10measuredValue(endpoint);
            await heiman.configureReporting.tvocMeasuredValue(endpoint);
            await heiman.configureReporting.aqiMeasuredValue(endpoint);

            await endpoint.read('genPowerCfg', ['batteryPercentageRemaining']);

            // Seems that it is bug in HEIMAN, device does not asks for the time with binding
            // So, we need to write time during configure
            const time = Math.round(((new Date()).getTime() - constants.OneJanuary2000) / 1000);
            // Time-master + synchronised
            const values = {timeStatus: 3, time: time, timeZone: ((new Date()).getTimezoneOffset() * -1) * 60};
            endpoint.write('genTime', values);
        },
        exposes: [e.battery(), e.temperature(), e.humidity(), e.pm25(), e.hcho(), e.voc(), e.aqi(), e.pm10(),
            exposes.enum('battery_state', ea.STATE, ['not_charging', 'charging', 'charged'])],
    },
    {
        fingerprint: [{modelID: 'IRControl-EM', manufacturerName: 'HEIMAN'}],
        model: 'HS2IRC',
        vendor: 'HEIMAN',
        description: 'Smart IR Control',
        fromZigbee: [fz.battery, fz.heiman_ir_remote],
        toZigbee: [tz.heiman_ir_remote],
        exposes: [e.battery()],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg', 'heimanSpecificInfraRedRemote']);
            await reporting.batteryPercentageRemaining(endpoint, {min: constants.repInterval.MINUTES_5, max: constants.repInterval.HOUR});
        },
    },
    {
        zigbeeModel: ['BDHM8E27W70-I1'],
        model: 'BDHM8E27W70-I1',
        vendor: 'GS', // actually it is HEIMAN.
        description: 'Active light, warm to cool white (E27 & B22)',
        extend: extend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['HS2SW1L-EF-3.0', 'HS2SW1L-EFR-3.0', 'HS2SW1A-N'],
        fingerprint: [
            {modelID: 'HS2SW1A-EF-3.0', manufacturerName: 'HEIMAN'},
            {modelID: 'HS2SW1A-EFR-3.0', manufacturerName: 'HEIMAN'},
        ],
        model: 'HS2SW1A/HS2SW1A-N',
        vendor: 'HEIMAN',
        description: 'Smart switch - 1 gang with neutral wire',
        fromZigbee: [fz.ignore_basic_report, fz.on_off, fz.device_temperature],
        toZigbee: [tz.on_off],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genDeviceTempCfg']);
            await reporting.onOff(endpoint);
            await reporting.deviceTemperature(endpoint);
        },
        exposes: [e.switch(), e.device_temperature()],
    },
    {
        zigbeeModel: ['HS2SW2L-EF-3.0', 'HS2SW2L-EFR-3.0', 'HS2SW2A-N'],
        fingerprint: [
            {modelID: 'HS2SW2A-EF-3.0', manufacturerName: 'HEIMAN'},
            {modelID: 'HS2SW2A-EFR-3.0', manufacturerName: 'HEIMAN'},
        ],
        model: 'HS2SW2A/HS2SW2A-N',
        vendor: 'HEIMAN',
        description: 'Smart switch - 2 gang with neutral wire',
        fromZigbee: [fz.ignore_basic_report, fz.on_off, fz.device_temperature],
        toZigbee: [tz.on_off],
        endpoint: (device) => {
            return {left: 1, right: 2};
        },
        meta: {multiEndpoint: true},
        configure: async (device, coordinatorEndpoint, logger) => {
            await reporting.bind(device.getEndpoint(1), coordinatorEndpoint, ['genOnOff', 'genDeviceTempCfg']);
            await reporting.bind(device.getEndpoint(2), coordinatorEndpoint, ['genOnOff']);
            await reporting.deviceTemperature(device.getEndpoint(1));
        },
        exposes: [e.switch().withEndpoint('left'), e.switch().withEndpoint('right'), e.device_temperature()],
    },
    {
        zigbeeModel: ['HS2SW3L-EF-3.0', 'HS2SW3L-EFR-3.0', 'HS2SW3A-N'],
        fingerprint: [
            {modelID: 'HS2SW3A-EF-3.0', manufacturerName: 'HEIMAN'},
            {modelID: 'HS2SW3A-EFR-3.0', manufacturerName: 'HEIMAN'},
        ],
        model: 'HS2SW3A/HS2SW3A-N',
        vendor: 'HEIMAN',
        description: 'Smart switch - 3 gang with neutral wire',
        fromZigbee: [fz.ignore_basic_report, fz.on_off, fz.device_temperature],
        toZigbee: [tz.on_off],
        endpoint: (device) => {
            return {left: 1, center: 2, right: 3};
        },
        meta: {multiEndpoint: true},
        configure: async (device, coordinatorEndpoint, logger) => {
            await reporting.bind(device.getEndpoint(1), coordinatorEndpoint, ['genOnOff', 'genDeviceTempCfg']);
            await reporting.bind(device.getEndpoint(2), coordinatorEndpoint, ['genOnOff']);
            await reporting.bind(device.getEndpoint(3), coordinatorEndpoint, ['genOnOff']);
            await reporting.deviceTemperature(device.getEndpoint(1));
        },
        exposes: [e.switch().withEndpoint('left'), e.switch().withEndpoint('center'), e.switch().withEndpoint('right'),
            e.device_temperature()],
    },
    {
        zigbeeModel: ['CurtainMo-EF-3.0', 'CurtainMo-EF'],
        model: 'HS2CM-N-DC',
        vendor: 'HEIMAN',
        description: 'Gear window shade motor',
        fromZigbee: [fz.cover_position_via_brightness],
        toZigbee: [tz.cover_via_brightness],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genLevelCtrl', 'genPowerCfg']);
            await reporting.brightness(endpoint);
        },
        exposes: [e.cover_position().setAccess('state', ea.ALL)],
    },
    {
        zigbeeModel: ['PIR_TPV16'],
        model: 'HS1MS-M',
        vendor: 'HEIMAN',
        description: 'Smart motion sensor',
        fromZigbee: [fz.ias_occupancy_alarm_1],
        toZigbee: [],
        exposes: [e.occupancy(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['TY0202'],
        model: 'HS1MS-EF',
        vendor: 'HEIMAN',
        description: 'Smart motion sensor',
        fromZigbee: [fz.ias_occupancy_alarm_1],
        toZigbee: [],
        exposes: [e.occupancy(), e.battery_low(), e.tamper()],
    },
    {
        zigbeeModel: ['TS0211'],
        model: 'HS2DB',
        vendor: 'Heiman',
        description: 'Heiman Smart Doorbell',
        fromZigbee: [fz.battery, fz.tuya_doorbell_button, fz.ignore_basic_report],
        toZigbee: [],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        exposes: [e.battery(), e.action(['pressed']), e.battery_low(), e.tamper()],
    },
];
