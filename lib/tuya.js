'use strict';

const constants = require('./constants');
const globalStore = require('./store');
const {mapNumberRange} = require('./utils');
const {ColorHSV} = require('./color');

const dataTypes = {
    raw: 0, // [ bytes ]
    bool: 1, // [0/1]
    value: 2, // [ 4 byte value ]
    string: 3, // [ N byte string ]
    enum: 4, // [ 0-255 ]
    bitmap: 5, // [ 1,2,4 bytes ] as bits
};

const convertMultiByteNumberPayloadToSingleDecimalNumber = (chunks) => {
    // Destructuring "chunks" is needed because it's a Buffer
    // and we need a simple array.
    let value = 0;
    for (let i = 0; i < chunks.length; i++) {
        value = value << 8;
        value += chunks[i];
    }
    return value;
};

function getDataValue(dataType, data) {
    switch (dataType) {
    case dataTypes.raw:
        return data;
    case dataTypes.bool:
        return data[0] === 1;
    case dataTypes.value:
        return convertMultiByteNumberPayloadToSingleDecimalNumber(data);
    case dataTypes.string:
        // eslint-disable-next-line
        let dataString = '';
        // Don't use .map here, doesn't work: https://github.com/Koenkk/zigbee-herdsman-converters/pull/1799/files#r530377091
        for (let i = 0; i < data.length; ++i) {
            dataString += String.fromCharCode(data[i]);
        }
        return dataString;
    case dataTypes.enum:
        return data[0];
    case dataTypes.bitmap:
        return convertMultiByteNumberPayloadToSingleDecimalNumber(data);
    }
}

function convertDecimalValueTo4ByteHexArray(value) {
    const hexValue = Number(value).toString(16).padStart(8, '0');
    const chunk1 = hexValue.substr(0, 2);
    const chunk2 = hexValue.substr(2, 2);
    const chunk3 = hexValue.substr(4, 2);
    const chunk4 = hexValue.substr(6);
    return [chunk1, chunk2, chunk3, chunk4].map((hexVal) => parseInt(hexVal, 16));
}

function convertDecimalValueTo2ByteHexArray(value) {
    const hexValue = Number(value).toString(16).padStart(4, '0');
    const chunk1 = hexValue.substr(0, 2);
    const chunk2 = hexValue.substr(2);
    return [chunk1, chunk2].map((hexVal) => parseInt(hexVal, 16));
}

async function onEventSetTime(type, data, device) {
    if (data.type === 'commandSetTimeRequest' && data.cluster === 'manuSpecificTuya') {
        try {
            const utcTime = Math.round(((new Date()).getTime() - constants.OneJanuary2000) / 1000);
            const localTime = utcTime - (new Date()).getTimezoneOffset() * 60;
            const endpoint = device.getEndpoint(1);
            const payload = {
                payloadSize: 8,
                payload: [
                    ...convertDecimalValueTo4ByteHexArray(utcTime),
                    ...convertDecimalValueTo4ByteHexArray(localTime),
                ],
            };
            await endpoint.command('manuSpecificTuya', 'setTime', payload, {});
        } catch (error) {
            // endpoint.command can throw an error which needs to
            // be caught or the zigbee-herdsman may crash
            // Debug message is handled in the zigbee-herdsman
        }
    }
}

// set UTC and Local Time as total number of seconds from 00: 00: 00 on January 01, 1970
// force to update every device time every hour due to very poor clock
async function onEventSetLocalTime(type, data, device) {
    const nextLocalTimeUpdate = globalStore.getValue(device, 'nextLocalTimeUpdate');
    const forceTimeUpdate = nextLocalTimeUpdate == null || nextLocalTimeUpdate < new Date().getTime();

    if ((data.type === 'commandSetTimeRequest' && data.cluster === 'manuSpecificTuya') || forceTimeUpdate) {
        globalStore.putValue(device, 'nextLocalTimeUpdate', new Date().getTime() + 3600 * 1000);

        try {
            const utcTime = Math.round(((new Date()).getTime()) / 1000);
            const localTime = utcTime - (new Date()).getTimezoneOffset() * 60;
            const endpoint = device.getEndpoint(1);
            const payload = {
                payloadSize: 8,
                payload: [
                    ...convertDecimalValueTo4ByteHexArray(utcTime),
                    ...convertDecimalValueTo4ByteHexArray(localTime),
                ],
            };
            await endpoint.command('manuSpecificTuya', 'setTime', payload, {});
        } catch (error) {
            // endpoint.command can throw an error which needs to
            // be caught or the zigbee-herdsman may crash
            // Debug message is handled in the zigbee-herdsman
        }
    }
}

function convertStringToHexArray(value) {
    const asciiKeys = [];
    for (let i = 0; i < value.length; i ++) {
        asciiKeys.push(value[i].charCodeAt(0));
    }
    return asciiKeys;
}

// Contains all covers which need their position inverted by default
// Default is 100 = open, 0 = closed; Devices listed here will use 0 = open, 100 = closed instead
// Use manufacturerName to identify device!
// Dont' invert _TZE200_cowvfni3: https://github.com/Koenkk/zigbee2mqtt/issues/6043
const coverPositionInvert = ['_TZE200_wmcdj3aq', '_TZE200_nogaemzt', '_TZE200_xuzcvlku'];

// Gets a boolean indicating whether the cover by this manufacturerName needs reversed positions
function isCoverInverted(manufacturerName) {
    // Return true if cover is listed in coverPositionInvert
    // Return false by default, not inverted
    return coverPositionInvert.includes(manufacturerName);
}

const coverStateOverride = {
    // Contains all covers which differentiate from the default enum states
    // Use manufacturerName to identify device!
    // https://github.com/Koenkk/zigbee2mqtt/issues/5596#issuecomment-759408189
    '_TZE200_rddyvrci': {close: 1, open: 2, stop: 0},
    '_TZE200_wmcdj3aq': {close: 0, open: 2, stop: 1},
    '_TZE200_cowvfni3': {close: 0, open: 2, stop: 1},
    '_TYST11_cowvfni3': {close: 0, open: 2, stop: 1},
};

// Gets an array containing which enums have to be used in order for the correct close/open/stop commands to be sent
function getCoverStateEnums(manufacturerName) {
    if (manufacturerName in coverStateOverride) {
        return coverStateOverride[manufacturerName];
    } else {
        return {close: 2, open: 0, stop: 1}; // defaults
    }
}

const thermostatSystemModes = {
    0: 'off',
    1: 'auto',
    2: 'manual',
    3: 'comfort',
    4: 'eco',
    5: 'boost',
    6: 'complex',
};

const thermostatSystemModes2 = {
    0: 'auto',
    1: 'cool',
    2: 'heat',
    3: 'dry',
    4: 'fan',
};

const thermostatSystemModes3 = {
    0: 'auto',
    1: 'heat',
    2: 'off',
};

const thermostatSystemModes4 = {
    0: 'off',
    1: 'auto',
    2: 'heat',
};

const dataPoints = {
    // Common data points
    // Below data points are usually shared between devices
    state: 1,
    heatingSetpoint: 2,
    coverPosition: 2,
    dimmerLevel: 3,
    localTemp: 3,
    coverArrived: 3,
    occupancy: 3,
    mode: 4,
    fanMode: 5,
    motorDirection: 5,
    config: 5,
    childLock: 7,
    coverChange: 7,
    runningState: 14,
    valveDetection: 20,
    battery: 21,
    tempCalibration: 44,
    // Data points above 100 are usually custom function data points
    waterLeak: 101,
    minTemp: 102,
    maxTemp: 103,
    windowDetection: 104,
    boostTime: 105,
    coverSpeed: 105,
    forceMode: 106,
    comfortTemp: 107,
    ecoTemp: 108,
    valvePos: 109,
    batteryLow: 110,
    weekFormat: 111,
    scheduleWorkday: 112,
    scheduleHoliday: 113,
    awayTemp: 114,
    autoLock: 116,
    awayDays: 117,
    // Manufacturer specific
    // Earda
    eardaDimmerLevel: 2,
    // Siterwell Thermostat
    siterwellWindowDetection: 18,
    // Moes Thermostat
    moesHold: 2,
    moesScheduleEnable: 3,
    moesHeatingSetpoint: 16,
    moesMaxTempLimit: 18,
    moesMaxTemp: 19,
    moesDeadZoneTemp: 20,
    moesLocalTemp: 24,
    moesTempCalibration: 27,
    moesValve: 36,
    moesChildLock: 40,
    moesSensor: 43,
    moesSchedule: 101,
    etopErrorStatus: 13,
    // MoesS Thermostat
    moesSsystemMode: 1,
    moesSheatingSetpoint: 2,
    moesSlocalTemp: 3,
    moesSboostHeating: 4,
    moesSboostHeatingCountdown: 5,
    moesSreset: 7,
    moesSwindowDetectionFunktion_A2: 8,
    moesSwindowDetection: 9,
    moesSchildLock: 13,
    moesSbattery: 14,
    moesSschedule: 101,
    moesSvalvePosition: 104,
    moesSboostHeatingCountdownTimeSet: 103,
    moesScompensationTempSet: 105,
    moesSecoMode: 106,
    moesSecoModeTempSet: 107,
    moesSmaxTempSet: 108,
    moesSminTempSet: 109,
    // Neo T&H
    neoPowerType: 101,
    neoMelody: 102,
    neoDuration: 103,
    neoAlarm: 104,
    neoTemp: 105,
    neoHumidity: 106,
    neoMinTemp: 107,
    neoMaxTemp: 108,
    neoMinHumidity: 109,
    neoMaxHumidity: 110,
    neoUnknown2: 112,
    neoTempAlarm: 113,
    neoHumidityAlarm: 114,
    neoUnknown3: 115,
    neoVolume: 116,
    // Saswell TRV
    saswellWindowDetection: 8,
    saswellFrostDetection: 10,
    saswellTempCalibration: 27,
    saswellChildLock: 40,
    saswellState: 101,
    saswellLocalTemp: 102,
    saswellHeatingSetpoint: 103,
    saswellValvePos: 104,
    saswellBatteryLow: 105,
    saswellAwayMode: 106,
    saswellScheduleMode: 107,
    saswellScheduleEnable: 108,
    saswellScheduleSet: 109,
    saswellSetpointHistoryDay: 110,
    saswellTimeSync: 111,
    saswellSetpointHistoryWeek: 112,
    saswellSetpointHistoryMonth: 113,
    saswellSetpointHistoryYear: 114,
    saswellLocalHistoryDay: 115,
    saswellLocalHistoryWeek: 116,
    saswellLocalHistoryMonth: 117,
    saswellLocalHistoryYear: 118,
    saswellMotorHistoryDay: 119,
    saswellMotorHistoryWeek: 120,
    saswellMotorHistoryMonth: 121,
    saswellMotorHistoryYear: 122,
    saswellScheduleSunday: 123,
    saswellScheduleMonday: 124,
    saswellScheduleTuesday: 125,
    saswellScheduleWednesday: 126,
    saswellScheduleThursday: 127,
    saswellScheduleFriday: 128,
    saswellScheduleSaturday: 129,
    saswellAntiScaling: 130,
    // HY thermostat
    hyHeating: 102,
    hyExternalTemp: 103,
    hyAwayDays: 104,
    hyAwayTemp: 105,
    hyMaxTempProtection: 106,
    hyMinTempProtection: 107,
    hyTempCalibration: 109,
    hyHysteresis: 110,
    hyProtectionHysteresis: 111,
    hyProtectionMaxTemp: 112,
    hyProtectionMinTemp: 113,
    hyMaxTemp: 114,
    hyMinTemp: 115,
    hySensor: 116,
    hyPowerOnBehavior: 117,
    hyWeekFormat: 118,
    hyWorkdaySchedule1: 119,
    hyWorkdaySchedule2: 120,
    hyHolidaySchedule1: 121,
    hyHolidaySchedule2: 122,
    hyState: 125,
    hyHeatingSetpoint: 126,
    hyLocalTemp: 127,
    hyMode: 128,
    hyChildLock: 129,
    hyAlarm: 130,
    // Silvercrest
    silvercrestChangeMode: 2,
    silvercrestSetBrightness: 3,
    silvercrestSetColor: 5,
    silvercrestSetEffect: 6,
    // Fantem
    fantemReportingTime: 102,
    fantemTempCalibration: 104,
    fantemHumidityCalibration: 105,
    fantemLuxCalibration: 106,
    fantemTemp: 107,
    fantemHumidity: 108,
    fantemMotionEnable: 109,
    fantemBattery: 110,
    fantemLedEnable: 111,
    fantemReportingEnable: 112,
    // Woox
    wooxSwitch: 102,
    wooxBattery: 14,
    // FrankEver
    frankEverTimer: 9,
    frankEverTreshold: 101,
    // Dinrail power meter switch
    dinrailPowerMeterTotalEnergy: 17,
    dinrailPowerMeterCurrent: 18,
    dinrailPowerMeterPower: 19,
    dinrailPowerMeterVoltage: 20,
    // tuya smart air box
    tuyaSabCO2: 2,
    tuyaSabTemp: 18,
    tuyaSabHumidity: 19,
    tuyaSabVOC: 21,
    tuyaSabFormaldehyd: 22,
    lidlTimer: 5,

    /**
     * Tuya standard functions
     * These functions are standarized for every device type.
     * doc: https://developer.tuya.com/en/docs/iot/configure-in-platform/function-definition/standard-functions
     */
    standardFn: {
        lightSource: {
            /**
             * function: ON/OFF,
             * access: set/get,
             * dataType: boolean
             */
            switchLed: 1,
            /**
             * function: Mode,
             * access: set/get,
             * dataType: enum,
             * dataValue: white, colour, scene, music
             */
            workMode: 2,
            /**
             * function: Brightness,
             * access: set/get,
             * dataType: integer,
             * dataValue: range 10..1000
             */
            brightValue: 3,
            /**
             * function: Color Temp,
             * access: set/get,
             * dataType: integer,
             * dataValue: range 0..1000
             */
            tempValue: 4,
            /**
             * function: Colorful,
             * access: set/get,
             * dataType: string
             */
            colourData: 5,
            /**
             * function: Scene,
             * access: set/get,
             * dataType: string
             */
            sceneData: 6,
            /**
             * function: Timer,
             * access: set/get,
             * dataType: integer,
             * dataValue: 0..86400,
             * dataUnit: s
             */
            countdown: 7,
            /**
             * function: Music,
             * access: set,
             * dataType: string
             */
            musicData: 8,
            /**
             * function: Adjust,
             * access: set,
             * dataType: string
             */
            controlData: 9,
            /**
             * function: Rhythms,
             * access: set/get,
             * dataType: raw
             */
            rhythmMode: 30,
            /**
             * function: Light to sleep,
             * access: set/get,
             * dataType: raw
             */
            sleepMode: 31,
            /**
             * function: Light to wake,
             * access: set/get,
             * dataType: raw
             */
            wakeupMode: 32,
            /**
             * function: Power Off Memory,
             * access: set/get,
             * dataType: raw
             */
            powerMemory: 33,
            /**
             * function: Do not Disturb,
             * access: set/get,
             * dataType: boolean
             */
            doNotDisturb: 34,
            /**
             * function: ON/OFF gradient,
             * access: set/get,
             * dataType: raw
             */
            switchGradient: 35,
            /**
             * function: zigbee light link threshold,
             * access: set/get,
             * dataType: integer,
             * dataValue: -65..-45,
             * dataUnit: dBm
             */
            zllValue: 81,
            /**
             * function: Cycle Timing,
             * access: set/get,
             * dataType: raw
             */
            cycleTiming: 209,
            /**
             * function: Vacation Timing,
             * access: set/get,
             * dataType: raw
             */
            randomTiming: 210,
        },
    },
};

const thermostatWeekFormat = {
    0: '5+2',
    1: '6+1',
    2: '7',
};

const thermostatForceMode = {
    0: 'normal',
    1: 'open',
    2: 'close',
};

const thermostatPresets = {
    0: 'away',
    1: 'schedule',
    2: 'manual',
    3: 'comfort',
    4: 'eco',
    5: 'boost',
    6: 'complex',
};

const thermostatScheduleMode = {
    1: 'single', // One schedule for all days
    2: 'weekday/weekend', // Weekdays(2-5) and Holidays(6-1)
    3: 'weekday/sat/sun', // Weekdays(2-6), Saturday(7), Sunday(1)
    4: '7day', // 7 day schedule
};

const lightSourceModes = {
    white: 0,
    color: 1,
    scene: 2,
    music: 3,
};

const silvercrestModes = {
    white: 0,
    color: 1,
    effect: 2,
};

const silvercrestEffects = {
    steady: '00',
    snow: '01',
    rainbow: '02',
    snake: '03',
    twinkle: '04',
    firework: '08',
    horizontal_flag: '06',
    waves: '07',
    updown: '08',
    vintage: '09',
    fading: '0a',
    collide: '0b',
    strobe: '0c',
    sparkles: '0d',
    carnaval: '0e',
    glow: '0f',
};

const fanModes = {
    0: 'low',
    1: 'medium',
    2: 'high',
    3: 'auto',
};

async function sendDataPoint(entity, datatype, dp, data, cmd, transid) {
    if (transid === undefined) {
        if (sendDataPoint.transId === undefined) {
            sendDataPoint.transId = 0;
        } else {
            sendDataPoint.transId++;
            sendDataPoint.transId %= 256;
        }

        transid = sendDataPoint.transId;
    }

    await entity.command(
        'manuSpecificTuya',
        cmd || 'setData',
        {
            status: 0,
            transid,
            dp: dp,
            datatype: datatype,
            length_hi: (data.length >> 8) & 0xFF,
            length_lo: data.length & 0xFF,
            data: data,
        },
        {disableDefaultResponse: true},
    );
}

async function sendDataPointValue(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.value,
        dp,
        convertDecimalValueTo4ByteHexArray(value),
        cmd,
        transid,
    );
}

async function sendDataPointBool(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.bool,
        dp,
        [value ? 1 : 0],
        cmd,
        transid,
    );
}

async function sendDataPointEnum(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.enum,
        dp,
        [value],
        cmd,
        transid,
    );
}

async function sendDataPointRaw(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.raw,
        dp,
        value,
        cmd,
        transid,
    );
}

async function sendDataPointBitmap(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.bitmap,
        dp,
        value,
        cmd,
        transid,
    );
}

async function sendDataPointString(entity, dp, value, cmd, transid=undefined) {
    await sendDataPoint(
        entity,
        dataTypes.string,
        dp,
        convertStringToHexArray(value),
        cmd,
        transid,
    );
}

/**
 * @typedef {Object} HSV
 * @property {[number]} color.h hue (0..360)
 * @property {[number]} color.s saturation (0..100)
 * @property {[number]} color.v value/brightness (0..100)
 * @inner
 */

/**
 * Encode HSV color into Tuya color string.
 * @param {ColorHSV} color HSV color data
 * @return {string} encoded color data
 */
function encodeLightColor(color) {
    let ret = '';

    if (!(color instanceof ColorHSV)) {
        throw new Error('Argument must be an instance of ColorHSV');
    }

    if (color.hue === null) {
        return ret;
    }
    ret += Math.round((color.hue % 360)).toString(16).padStart(4, '0');

    if (color.saturation === null) {
        return ret;
    }
    ret += mapNumberRange(color.saturation, 0, 100, 0, 1000).toString(16).padStart(4, '0');

    if (color.value === null) {
        return ret;
    }
    ret += mapNumberRange(color.value, 0, 100, 10, 1000).toString(16).padStart(4, '0');

    return ret;
}

/**
 * Decode color data from Tuya into HSV object.
 * @param {string} value encoded color string
 * @return {ColorHSV} decoded HSV object
 */
function decodeLightColor(value) {
    if (value.length < 4) {
        return null;
    }

    const hue = parseInt(value.substring(0, 4), 16);
    let saturation = null;
    let brightness = null;

    if (value.length >= 8) {
        saturation = mapNumberRange(parseInt(value.substring(4, 8), 16), 0, 1000, 0, 100);
        if (value.length >= 12) {
            brightness = mapNumberRange(parseInt(value.substring(8, 12), 16), 10, 1000, 0, 100);
        }
    }

    return new ColorHSV(hue, saturation, brightness);
}

module.exports = {
    sendDataPoint,
    sendDataPointValue,
    sendDataPointBool,
    sendDataPointEnum,
    sendDataPointBitmap,
    sendDataPointRaw,
    sendDataPointString,
    getDataValue,
    dataTypes,
    dataPoints,
    convertDecimalValueTo4ByteHexArray,
    convertDecimalValueTo2ByteHexArray,
    onEventSetTime,
    onEventSetLocalTime,
    convertStringToHexArray,
    isCoverInverted,
    getCoverStateEnums,
    encodeLightColor,
    decodeLightColor,
    thermostatSystemModes4,
    thermostatSystemModes3,
    thermostatSystemModes2,
    thermostatSystemModes,
    thermostatWeekFormat,
    thermostatForceMode,
    thermostatPresets,
    thermostatScheduleMode,
    lightSourceModes,
    silvercrestModes,
    silvercrestEffects,
    fanModes,
};
