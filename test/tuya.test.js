const tuya = require('../lib/tuya');
const libColor = require('../lib/color');

describe('lib/tuya.js', () => {
    describe('{encode,decode}LightColor', () => {
        test.each([
            [{hue: 50, saturation: 100, value: 100}, [50, 1000, 1000]],
            [{hue: 50, saturation: 100}, [50, 1000]],
            [{hue: 50}, [50]],
            [{hue: 360}, [0]],
            [{hue: 480}, [120]],
            [{hue: 19.569712416109247, saturation: 93.3636249643794}, [20, 934]],
        ])('encode %j', (hsv, values) => {
            const color = libColor.ColorHSV.fromObject(hsv);
            const encoded = tuya.encodeLightColor(color);
            expect(encoded.length).toEqual(4 * values.length);
            for (let idx = 0; idx < values.length; idx++) {
                expect(parseInt(encoded.substr(idx * 4, 4), 16)).toEqual(values[idx]);
            }
        });

        test.each([
            [{hue: 50, saturation: 100, value: 100}],
            [{hue: 50, saturation: 100}],
            [{hue: 50}],
        ])('encode/decode %j', (hsv) => {
            const color = libColor.ColorHSV.fromObject(hsv);
            const encoded = tuya.encodeLightColor(color);
            const decoded = tuya.decodeLightColor(encoded);
            expect(decoded.toObject()).toStrictEqual(hsv);
        });
    });
});
