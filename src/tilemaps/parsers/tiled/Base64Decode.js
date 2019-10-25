/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

// Import inflation function from pako library (v ...)
var PAKO = require('../../../utils/compression/pako_inflate');

/**
 * Decode base-64 encoded data, for example as exported by Tiled.
 *
 * @function Phaser.Tilemaps.Parsers.Tiled.Base64Decode
 * @since 3.0.0
 *
 * @param {object} data - Base-64 encoded data to decode.
 * @param {string} [compression] - Optional string inicating 'zlib' or 'gzip' compression.
 *
 * @return {array} Array containing the decoded bytes.
 */
var Base64Decode = function (data, compression)
{
    var binaryString = window.atob(data);
    if (compression)
    {
        if (compression === 'zlib' || compression === 'gzip')
        {
            var charData = binaryString.split('').map(function (x) { return x.charCodeAt(0); });
            var binData = PAKO.inflate(new Uint8Array(charData));
            binaryString = String.fromCharCode.apply(null, new Uint16Array(binData));
        }
        else
        {
            console.warn(
                'TilemapParser.Base64Decode: unsupported compression type \'' +
                compression + '\''
            );
            return null;
        }
    }

    // Interpret binaryString as an array of bytes representing little-endian encoded uint32 values.
    var len = binaryString.length;
    var bytes = new Array(len / 4);
    for (var i = 0; i < len; i += 4)
    {
        bytes[i / 4] = (
            binaryString.charCodeAt(i) |
            binaryString.charCodeAt(i + 1) << 8 |
            binaryString.charCodeAt(i + 2) << 16 |
            binaryString.charCodeAt(i + 3) << 24
        ) >>> 0;
    }

    return bytes;
};

module.exports = Base64Decode;
