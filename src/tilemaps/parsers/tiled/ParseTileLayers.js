/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Base64Decode = require('./Base64Decode');
var GetFastValue = require('../../../utils/object/GetFastValue');
var LayerData = require('../../mapdata/LayerData');
var ParseGID = require('./ParseGID');
var Tile = require('../../Tile');

/**
 * [description]
 *
 * @function Phaser.Tilemaps.Parsers.Tiled.ParseTileLayers
 * @since 3.0.0
 *
 * @param {object} json - [description]
 * @param {boolean} insertNull - [description]
 *
 * @return {array} [description]
 */
var ParseTileLayers = function (json, insertNull)
{
    var infiniteMap = GetFastValue(json, 'infinite', false);
    var tileLayers = [];

    for (var i = 0; i < json.layers.length; i++)
    {
        if (json.layers[i].type !== 'tilelayer')
        {
            continue;
        }

        var curl = json.layers[i];

        // Base64 decode data if necessary (possibly decompressing).
        if (curl.encoding && curl.encoding === 'base64')
        {
            var decodedData = Base64Decode(curl.data, curl.compression);
            delete curl.encoding; // Allow the same map to be parsed multiple times

            // Detect decoding errors
            if (decodedData === null)
            {
                console.warn(
                    'TilemapParser.parseTiledJSON - Layer could not be decoded, skipping layer \''
                    + curl.name + '\''
                );
                continue;
            }
            else
            {
                curl.data = decodedData;
            }
        }

        //  This is an array containing the tile indexes, one after the other. -1 = no tile,
        //  everything else = the tile index (starting at 1 for Tiled, 0 for CSV) If the map
        //  contains multiple tilesets then the indexes are relative to that which the set starts
        //  from. Need to set which tileset in the cache = which tileset in the JSON, if you do this
        //  manually it means you can use the same map data but a new tileset.

        var layerData;
        var gidInfo;
        var tile;
        var blankTile;

        var output = [];
        var x = 0;

        if (infiniteMap)
        {
            var layerOffsetX = GetFastValue(curl, 'startx', 0) + curl.x;
            var layerOffsetY = GetFastValue(curl, 'starty', 0) + curl.y;
            layerData = new LayerData({
                name: curl.name,
                x: layerOffsetX,
                y: layerOffsetY,
                width: curl.width,
                height: curl.height,
                tileWidth: json.tilewidth,
                tileHeight: json.tileheight,
                alpha: curl.opacity,
                visible: curl.visible,
                properties: GetFastValue(curl, 'properties', {})
            });

            for (var c = 0; c < curl.height; c++)
            {
                output.push([ null ]);

                for (var j = 0; j < curl.width; j++)
                {
                    output[c][j] = null;
                }
            }

            for (c = 0, len = curl.chunks.length; c < len; c++)
            {
                var chunk = curl.chunks[c];

                var offsetX = (chunk.x - layerOffsetX);
                var offsetY = (chunk.y - layerOffsetY);

                var y = 0;

                for (var t = 0, len2 = chunk.data.length; t < len2; t++)
                {
                    var newOffsetX = x + offsetX;
                    var newOffsetY = y + offsetY;

                    gidInfo = ParseGID(chunk.data[t]);

                    //  index, x, y, width, height
                    if (gidInfo.gid > 0)
                    {
                        tile = new Tile(layerData, gidInfo.gid, newOffsetX, newOffsetY, json.tilewidth,
                            json.tileheight);

                        // Turning Tiled's FlippedHorizontal, FlippedVertical and FlippedAntiDiagonal
                        // propeties into flipX, flipY and rotation
                        tile.rotation = gidInfo.rotation;
                        tile.flipX = gidInfo.flipped;

                        output[newOffsetY][newOffsetX] = tile;
                    }
                    else
                    {
                        blankTile = insertNull
                            ? null
                            : new Tile(layerData, -1, newOffsetX, newOffsetY, json.tilewidth, json.tileheight);

                        output[newOffsetY][newOffsetX] = blankTile;
                    }

                    x++;

                    if (x === chunk.width)
                    {
                        y++;
                        x = 0;
                    }
                }
            }
        }
        else
        {
            layerData = new LayerData({
                name: curl.name,
                x: GetFastValue(curl, 'offsetx', 0) + curl.x,
                y: GetFastValue(curl, 'offsety', 0) + curl.y,
                width: curl.width,
                height: curl.height,
                tileWidth: json.tilewidth,
                tileHeight: json.tileheight,
                alpha: curl.opacity,
                visible: curl.visible,
                properties: GetFastValue(curl, 'properties', {})
            });

            var row = [];

            //  Loop through the data field in the JSON.
            for (var k = 0, len = curl.data.length; k < len; k++)
            {
                gidInfo = ParseGID(curl.data[k]);

                //  index, x, y, width, height
                if (gidInfo.gid > 0)
                {
                    tile = new Tile(layerData, gidInfo.gid, x, output.length, json.tilewidth,
                        json.tileheight);

                    // Turning Tiled's FlippedHorizontal, FlippedVertical and FlippedAntiDiagonal
                    // propeties into flipX, flipY and rotation
                    tile.rotation = gidInfo.rotation;
                    tile.flipX = gidInfo.flipped;

                    row.push(tile);
                }
                else
                {
                    blankTile = insertNull
                        ? null
                        : new Tile(layerData, -1, x, output.length, json.tilewidth, json.tileheight);
                    row.push(blankTile);
                }

                x++;

                if (x === curl.width)
                {
                    output.push(row);
                    x = 0;
                    row = [];
                }
            }
        }

        layerData.data = output;

        tileLayers.push(layerData);
    }

    return tileLayers;
};

module.exports = ParseTileLayers;
