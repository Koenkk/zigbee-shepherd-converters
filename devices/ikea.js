const exposes = require('../lib/exposes');
const fz = {...require('../converters/fromZigbee'), legacy: require('../lib/legacy').fromZigbee};
const tz = require('../converters/toZigbee');
const ota = require('../lib/ota');
const constants = require('../lib/constants');
const reporting = require('../lib/reporting');
const extend = require('../lib/extend');
const e = exposes.presets;
const ea = exposes.access;

const bulbOnEvent = async (type, data, device) => {
    /**
     * IKEA bulbs lose their configured reportings when losing power.
     * A deviceAnnounce indicates they are powered on again.
     * Reconfigure the configured reoprting here.
     * NOTE: binds are not lost so rebinding is not needed!
     */
    if (type === 'deviceAnnounce') {
        for (const endpoint of device.endpoints) {
            for (const c of endpoint.configuredReportings) {
                await endpoint.configureReporting(c.cluster.name, [{
                    attribute: c.attribute.name, minimumReportInterval: c.minimumReportInterval,
                    maximumReportInterval: c.maximumReportInterval, reportableChange: c.reportableChange,
                }]);
            }
        }
    }
};

const tradfriExtend = {
    light_onoff_brightness: (options = {}) => ({
        ...extend.light_onoff_brightness(options),
        exposes: extend.light_onoff_brightness(options).exposes.concat(e.power_on_behavior()),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    }),
    light_onoff_brightness_colortemp: (options = {colorTempRange: [250, 454]}) => ({
        ...extend.light_onoff_brightness_colortemp(options),
        exposes: extend.light_onoff_brightness_colortemp(options).exposes.concat(e.power_on_behavior()),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    }),
    light_onoff_brightness_colortemp_color: (options = {disableColorTempStartup: true, colorTempRange: [250, 454]}) => ({
        ...extend.light_onoff_brightness_colortemp_color(options),
        exposes: extend.light_onoff_brightness_colortemp_color(options).exposes.concat(e.power_on_behavior()),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    }),
};


module.exports = [
    {
        zigbeeModel: ['ASKVADER on/off switch'],
        model: 'E1836',
        vendor: 'IKEA',
        description: 'ASKVADER on/off switch',
        extend: extend.switch(),
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff']);
            await reporting.onOff(endpoint);
        },
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WS opal 980lm', 'TRADFRI bulb E26 WS opal 980lm', 'TRADFRI bulb E27 WS\uFFFDopal 980lm'],
        model: 'LED1545G12',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E26/E27 980 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI Light Engine'],
        model: 'T2011',
        description: 'Osvalla panel round',
        vendor: 'IKEA',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WS clear 950lm', 'TRADFRI bulb E26 WS clear 950lm'],
        model: 'LED1546G12',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E26/E27 950 lumen, dimmable, white spectrum, clear',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 opal 1000lm', 'TRADFRI bulb E27 W opal 1000lm'],
        model: 'LED1623G12',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E27 1000 lumen, dimmable, opal white',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRIbulbG125E27WSopal470lm'],
        model: 'LED1936G5',
        vendor: 'IKEA',
        description: 'TRADFRI LED globe-bulb E27 470 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 opal 470lm', 'TRADFRI bulb E27 W opal 470lm', 'TRADFRIbulbT120E27WSopal470lm'],
        model: 'LED1937T5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E27 470 lumen, dimmable, opal white',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb GU10 WS 400lm'],
        model: 'LED1537R6/LED1739R5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb GU10 400 lumen, dimmable, white spectrum',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb GU10 W 400lm'],
        model: 'LED1650R5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb GU10 400 lumen, dimmable',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E14 WS opal 400lm', 'TRADFRI bulb E12 WS opal 400lm'],
        model: 'LED1536G5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E12/E14 400 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E14 WS 470lm', 'TRADFRI bulb E12 WS 450lm'],
        model: 'LED1903C5/LED1835C6',
        vendor: 'IKEA',
        description: 'TRADFRI bulb E12/E14 WS 450/470 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb GU10 WW 400lm'],
        model: 'LED1837R5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb GU10 400 lumen, dimmable',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WW clear 250lm', 'TRADFRI bulb E26 WW clear 250lm'],
        model: 'LED1842G3',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E27 WW clear 250 lumen, dimmable',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRIbulbE27WWclear250lm'],
        model: 'LED1934G3',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E27 WW clear 250 lumen, dimmable',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E14 WS opal 600lm'],
        model: 'LED1733G7',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E14 600 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E26 opal 1000lm', 'TRADFRI bulb E26 W opal 1000lm'],
        model: 'LED1622G12',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E26 1000 lumen, dimmable, opal white',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 CWS opal 600lm', 'TRADFRI bulb E26 CWS opal 600lm', 'TRADFRI bulb E14 CWS opal 600lm',
            'TRADFRI bulb E12 CWS opal 600lm'],
        model: 'LED1624G9',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E14/E26/E27 600 lumen, dimmable, color, opal white',
        extend: extend.light_onoff_brightness_color(),
        ota: ota.tradfri,
        meta: {supportsHueAndSaturation: false},
        onEvent: bulbOnEvent,
    },
    {
        zigbeeModel: ['TRADFRI bulb E26 CWS 800lm', 'TRADFRI bulb E27 CWS 806lm'],
        model: 'LED1924G9',
        vendor: 'IKEA',
        description: 'TRADFRI bulb E26/E27 CWS 800/806 lumen, dimmable, color, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp_color(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E14 W op/ch 400lm', 'TRADFRI bulb E12 W op/ch 400lm', 'TRADFRI bulb E17 W op/ch 400lm'],
        model: 'LED1649C5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E12/E14/E17 400 lumen, dimmable warm white, chandelier opal',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WS opal 1000lm', 'TRADFRI bulb E26 WS opal 1000lm'],
        model: 'LED1732G11',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E27 1000 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WW 806lm', 'TRADFRI bulb E26 WW 806lm'],
        model: 'LED1836G9',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E26/E27 806 lumen, dimmable, warm white',
        extend: tradfriExtend.light_onoff_brightness(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E27 WS clear 806lm', 'TRADFRI bulb E26 WS clear 806lm'],
        model: 'LED1736G9',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E26/E27 806 lumen, dimmable, white spectrum, clear',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['LEPTITER Recessed spot light'],
        model: 'T1820',
        vendor: 'IKEA',
        description: 'LEPTITER Recessed spot light, dimmable, white spectrum',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI wireless dimmer'],
        model: 'ICTC-G-1',
        vendor: 'IKEA',
        description: 'TRADFRI wireless dimmer',
        fromZigbee: [fz.legacy.cmd_move, fz.legacy.cmd_move_with_onoff, fz.legacy.cmd_stop, fz.legacy.cmd_stop_with_onoff,
            fz.legacy.cmd_move_to_level_with_onoff, fz.battery],
        exposes: [e.battery(), e.action(['brightness_move_up', 'brightness_move_down', 'brightness_stop', 'brightness_move_to_level'])],
        toZigbee: [],
        meta: {battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genLevelCtrl', 'genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
        ota: ota.tradfri,
    },
    {
        zigbeeModel: ['TRADFRI transformer 10W', 'TRADFRI Driver 10W'],
        model: 'ICPSHC24-10EU-IL-1',
        vendor: 'IKEA',
        description: 'TRADFRI driver for wireless control (10 watt)',
        extend: extend.light_onoff_brightness(),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    },
    {
        zigbeeModel: ['TRADFRI transformer 30W', 'TRADFRI Driver 30W'],
        model: 'ICPSHC24-30EU-IL-1',
        vendor: 'IKEA',
        description: 'TRADFRI driver for wireless control (30 watt)',
        extend: extend.light_onoff_brightness(),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    },
    {
        zigbeeModel: ['SILVERGLANS IP44 LED driver'],
        model: 'ICPSHC24-30-IL44-1',
        vendor: 'IKEA',
        description: 'SILVERGLANS IP44 LED driver for wireless control (30 watt)',
        extend: extend.light_onoff_brightness(),
        ota: ota.tradfri,
        onEvent: bulbOnEvent,
    },
    {
        zigbeeModel: ['FLOALT panel WS 30x30'],
        model: 'L1527',
        vendor: 'IKEA',
        description: 'FLOALT LED light panel, dimmable, white spectrum (30x30 cm)',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['FLOALT panel WS 60x60'],
        model: 'L1529',
        vendor: 'IKEA',
        description: 'FLOALT LED light panel, dimmable, white spectrum (60x60 cm)',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['JORMLIEN door WS 40x80'],
        model: 'L1530',
        vendor: 'IKEA',
        description: 'JORMLIEN door light panel, dimmable, white spectrum (40x80 cm)',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['FLOALT panel WS 30x90'],
        model: 'L1528',
        vendor: 'IKEA',
        description: 'FLOALT LED light panel, dimmable, white spectrum (30x90 cm)',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['SURTE door WS 38x64'],
        model: 'L1531',
        vendor: 'IKEA',
        description: 'SURTE door light panel, dimmable, white spectrum (38x64 cm)',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI control outlet'],
        model: 'E1603/E1702/E1708',
        description: 'TRADFRI control outlet',
        vendor: 'IKEA',
        extend: extend.switch(),
        toZigbee: extend.switch().toZigbee.concat([tz.power_on_behavior]),
        fromZigbee: extend.switch().fromZigbee.concat([fz.power_on_behavior]),
        // power_on_behavior 'toggle' does not seem to be supported
        exposes: extend.switch().exposes.concat([exposes.enum('power_on_behavior', ea.ALL, ['off', 'previous', 'on'])
            .withDescription('Controls the behaviour when the device is powered on')]),
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff']);
            await reporting.onOff(endpoint);
        },
        ota: ota.tradfri,
    },
    {
        zigbeeModel: ['TRADFRI remote control'],
        model: 'E1524/E1810',
        description: 'TRADFRI remote control',
        vendor: 'IKEA',
        fromZigbee: [fz.battery, fz.E1524_E1810_toggle, fz.E1524_E1810_levelctrl, fz.ikea_arrow_click, fz.ikea_arrow_hold,
            fz.ikea_arrow_release],
        exposes: [e.battery(), e.action(['arrow_left_click', 'arrow_left_hold', 'arrow_left_release', 'arrow_right_click',
            'arrow_right_hold', 'arrow_right_release', 'brightness_down_click', 'brightness_down_hold', 'brightness_down_release',
            'brightness_up_click', 'brightness_up_hold', 'brightness_up_release'])],
        toZigbee: [],
        ota: ota.tradfri,
        meta: {battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            // See explanation in E1743, only applies to E1810 (for E1524 it has no effect)
            // https://github.com/Koenkk/zigbee2mqtt/issues/2772#issuecomment-577389281
            await endpoint.bind('genOnOff', constants.defaultBindGroup);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['Remote Control N2'],
        model: 'E2001/E2002',
        vendor: 'IKEA',
        description: 'STYRBAR remote control N2',
        fromZigbee: [fz.battery, fz.command_on, fz.command_off, fz.command_move, fz.command_stop, fz.ikea_arrow_click,
            fz.ikea_arrow_hold, fz.ikea_arrow_release],
        exposes: [e.battery(), e.action(['on', 'off', 'brightness_move_up', 'brightness_move_down',
            'brightness_stop', 'arrow_left_click', 'arrow_right_click', 'arrow_left_hold',
            'arrow_right_hold', 'arrow_left_release', 'arrow_right_release'])],
        toZigbee: [],
        ota: ota.tradfri,
        meta: {battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await endpoint.bind('genOnOff', constants.defaultBindGroup);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['TRADFRI on/off switch'],
        model: 'E1743',
        vendor: 'IKEA',
        description: 'TRADFRI ON/OFF switch',
        fromZigbee: [fz.command_on, fz.legacy.genOnOff_cmdOn, fz.command_off, fz.legacy.genOnOff_cmdOff, fz.command_move, fz.battery,
            fz.legacy.E1743_brightness_up, fz.legacy.E1743_brightness_down, fz.command_stop, fz.legacy.E1743_brightness_stop],
        exposes: [e.battery(), e.action(['on', 'off', 'brightness_move_down', 'brightness_move_up', 'brightness_stop'])],
        toZigbee: [],
        ota: ota.tradfri,
        meta: {disableActionGroup: true, battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            // By default this device controls group 0, some devices are by default in
            // group 0 causing the remote to control them.
            // By binding it to a random group, e.g. 901, it will send the commands to group 901 instead of 0
            // https://github.com/Koenkk/zigbee2mqtt/issues/2772#issuecomment-577389281
            await endpoint.bind('genOnOff', constants.defaultBindGroup);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['KNYCKLAN Open/Close remote'],
        model: 'E1841',
        vendor: 'IKEA',
        description: 'KNYCKLAN open/close remote water valve',
        fromZigbee: [fz.command_on, fz.command_off, fz.battery],
        exposes: [e.battery(), e.action(['on', 'off'])],
        toZigbee: [],
        ota: ota.tradfri,
        meta: {disableActionGroup: true, battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            // By default this device controls group 0, some devices are by default in
            // group 0 causing the remote to control them.
            // By binding it to a random group, e.g. 901, it will send the commands to group 901 instead of 0
            // https://github.com/Koenkk/zigbee2mqtt/issues/2772#issuecomment-577389281
            await endpoint.bind('genOnOff', constants.defaultBindGroup);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['KNYCKLAN receiver'],
        model: 'E1842',
        description: 'KNYCKLAN receiver electronic water valve shut-off',
        vendor: 'IKEA',
        extend: extend.switch(),
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff']);
            await reporting.onOff(endpoint);
        },
        ota: ota.tradfri,
    },
    {
        zigbeeModel: ['TRADFRI SHORTCUT Button'],
        model: 'E1812',
        vendor: 'IKEA',
        description: 'TRADFRI shortcut button',
        fromZigbee: [fz.command_on, fz.command_move, fz.command_stop, fz.battery],
        exposes: [e.battery(), e.action(['on', 'brightness_move_up', 'brightness_stop'])],
        toZigbee: [],
        ota: ota.tradfri,
        meta: {disableActionGroup: true, battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            // By default this device controls group 0, some devices are by default in
            // group 0 causing the remote to control them.
            // By binding it to a random group, e.g. 901, it will send the commands to group 901 instead of 0
            await reporting.bind(endpoint, constants.defaultBindGroup, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['SYMFONISK Sound Controller'],
        model: 'E1744',
        vendor: 'IKEA',
        description: 'SYMFONISK sound controller',
        fromZigbee: [fz.legacy.cmd_move, fz.legacy.cmd_stop, fz.legacy.E1744_play_pause, fz.legacy.E1744_skip, fz.battery],
        toZigbee: [],
        exposes: [e.battery(), e.action([
            'brightness_move_up', 'brightness_move_down', 'brightness_stop', 'toggle', 'brightness_step_up', 'brightness_step_down'])],
        ota: ota.tradfri,
        meta: {battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genLevelCtrl', 'genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['TRADFRI motion sensor'],
        model: 'E1525/E1745',
        vendor: 'IKEA',
        description: 'TRADFRI motion sensor',
        fromZigbee: [fz.battery, fz.tradfri_occupancy, fz.E1745_requested_brightness],
        toZigbee: [],
        exposes: [e.battery(), e.occupancy(),
            exposes.numeric('requested_brightness_level', ea.STATE).withValueMin(76).withValueMax(254),
            exposes.numeric('requested_brightness_percent', ea.STATE).withValueMin(30).withValueMax(100)],
        ota: ota.tradfri,
        meta: {battery: {dontDividePercentage: true}},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
            device.powerSource = 'Battery';
            device.save();
        },
    },
    {
        zigbeeModel: ['TRADFRI signal repeater'],
        model: 'E1746',
        description: 'TRADFRI signal repeater',
        vendor: 'IKEA',
        fromZigbee: [fz.linkquality_from_basic],
        toZigbee: [],
        ota: ota.tradfri,
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            const payload = [{attribute: 'modelId', minimumReportInterval: 3600, maximumReportInterval: 14400}];
            await reporting.bind(endpoint, coordinatorEndpoint, ['genBasic']);
            await endpoint.configureReporting('genBasic', payload);
        },
        exposes: [],
    },
    {
        zigbeeModel: ['FYRTUR block-out roller blind'],
        model: 'E1757',
        vendor: 'IKEA',
        description: 'FYRTUR roller blind',
        fromZigbee: [fz.cover_position_tilt, fz.battery],
        toZigbee: [tz.cover_state, tz.cover_position_tilt],
        meta: {battery: {dontDividePercentage: true}},
        ota: ota.tradfri,
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg', 'closuresWindowCovering']);
            await reporting.batteryPercentageRemaining(endpoint);
            await reporting.currentPositionLiftPercentage(endpoint);
        },
        exposes: [e.cover_position(), e.battery()],
    },
    {
        zigbeeModel: ['KADRILJ roller blind'],
        model: 'E1926',
        vendor: 'IKEA',
        description: 'KADRILJ roller blind',
        fromZigbee: [fz.cover_position_tilt, fz.battery],
        toZigbee: [tz.cover_state, tz.cover_position_tilt],
        meta: {battery: {dontDividePercentage: true}},
        ota: ota.tradfri,
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg', 'closuresWindowCovering']);
            await reporting.batteryPercentageRemaining(endpoint);
            await reporting.currentPositionLiftPercentage(endpoint);
        },
        exposes: [e.cover_position(), e.battery()],
    },
    {
        zigbeeModel: ['TRADFRI open/close remote'],
        model: 'E1766',
        vendor: 'IKEA',
        description: 'TRADFRI open/close remote',
        fromZigbee: [fz.battery, fz.command_cover_close, fz.legacy.cover_close, fz.command_cover_open, fz.legacy.cover_open,
            fz.command_cover_stop, fz.legacy.cover_stop],
        exposes: [e.battery(), e.action(['close', 'open', 'stop'])],
        toZigbee: [],
        meta: {battery: {dontDividePercentage: true}},
        ota: ota.tradfri,
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            // By default this device controls group 0, some devices are by default in
            // group 0 causing the remote to control them.
            // By binding it to a random group, e.g. 901, it will send the commands to group 901 instead of 0
            // https://github.com/Koenkk/zigbee2mqtt/issues/2772#issuecomment-577389281
            await endpoint.bind('genOnOff', constants.defaultBindGroup);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genPowerCfg']);
            await reporting.batteryPercentageRemaining(endpoint);
        },
    },
    {
        zigbeeModel: ['GUNNARP panel round'],
        model: 'T1828',
        description: 'GUNNARP panel round',
        vendor: 'IKEA',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['GUNNARP panel 40*40'],
        model: 'T1829',
        description: 'GUNNARP panel 40*40',
        vendor: 'IKEA',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E12 WS opal 600lm'],
        model: 'LED1738G7',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E12 600 lumen, dimmable, white spectrum, opal white',
        extend: tradfriExtend.light_onoff_brightness_colortemp(),
    },
    {
        zigbeeModel: ['TRADFRI bulb GU10 CWS 345lm'],
        model: 'LED1923R5',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb GU10 345 lumen, dimmable, white spectrum, color spectrum',
        extend: tradfriExtend.light_onoff_brightness_colortemp_color(),
    },
    {
        zigbeeModel: ['TRADFRI bulb E14 CWS 470lm'],
        model: 'LED1925G6',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E14 470 lumen, opal, dimmable, white spectrum, color spectrum',
        extend: tradfriExtend.light_onoff_brightness_colortemp_color(),
    },
    {
        zigbeeModel: ['TRADFRIbulbE14WWclear250lm'],
        model: 'LED1935C3',
        vendor: 'IKEA',
        description: 'TRADFRI LED bulb E14 WW clear 250 lumen, dimmable',
        extend: tradfriExtend.light_onoff_brightness(),
    },
];
