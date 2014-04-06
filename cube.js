"use strict";

var initCubes;
var Cube;

(function () {

    function handleLoadedTexture(texture) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var frontTextureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    
    var backTextureCoords = [
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    ];

    var topTextureCoords = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
    ];

    var bottomTextureCoords = [
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
    ];

    var rightTextureCoords = [
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    ];

    var leftTextureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    var translate = function (array, x, y) {
        var translatedArray = [];
        for (var i = 0; i < array.length; i++) {
            if (i % 2 === 0) {
                translatedArray.push(array[i] + x);
            } else if (i % 2 === 1) {
                translatedArray.push(array[i] + y);
            }
        }

        return translatedArray;
    }

    var scale = function (array, k) {
        var scaledArray = [];
        for (var i = 0; i < array.length; i++) {
            scaledArray.push(array[i] * k);
        }
        
        return scaledArray;
    }

    
    var _initCubes = function () {
        _Cube.numTypes = tileset.tiles.length;
        _Cube.typeNameToNumber = {};
        for (var i = 0; i < _Cube.numTypes; i++) {
            _Cube.typeNameToNumber[tileset.tiles[i].name] = i;
        }

        var scaleFactor = 1 / tileset.dimension;

        _Cube.textureCoords = [];
        for (var i = 0; i < _Cube.numTypes; i++) {
            var t = {};
            t.front = scale(translate(frontTextureCoords,
                                      tileset.tiles[i].front.x,
                                      tileset.tiles[i].front.y),
                            scaleFactor);
            t.back = scale(translate(backTextureCoords,
                                      tileset.tiles[i].back.x,
                                      tileset.tiles[i].back.y),
                            scaleFactor);
            t.top = scale(translate(topTextureCoords,
                                      tileset.tiles[i].top.x,
                                      tileset.tiles[i].top.y),
                            scaleFactor);
            t.bottom = scale(translate(bottomTextureCoords,
                                      tileset.tiles[i].bottom.x,
                                      tileset.tiles[i].bottom.y),
                            scaleFactor);
            t.left = scale(translate(leftTextureCoords,
                                      tileset.tiles[i].left.x,
                                      tileset.tiles[i].left.y),
                            scaleFactor);
            t.right = scale(translate(rightTextureCoords,
                                      tileset.tiles[i].right.x,
                                      tileset.tiles[i].right.y),
                            scaleFactor);
            _Cube.textureCoords.push(t);
        }

        _Cube.texture = gl.createTexture();
        _Cube.texture.image = new Image();
        _Cube.texture.image.onload = function() {
            handleLoadedTexture(_Cube.texture);
        }
        _Cube.texture.image.src = "assets/" + tileset.image;
    }

    // 'type' can be either a numerical cube type, or the name of a cube type. 
    var _Cube = {};
    _Cube.newCube = function (isActive, type) {
        var typeNum;
        if (type in _Cube.typeNameToNumber) {
            typeNum = _Cube.typeNameToNumber[type];
        } else if (type >= _Cube.numTypes || type < 0) {
            console.log("Invalid cube type specified");
            typeNum = 0;
        } else {
            typeNum = type;
        }

        if (isActive) {
            return 0x80000000 | typeNum;
        } else {
            return typeNum;
        }
    }

    _Cube.isActive = function (cube) {
        return (cube & 0x80000000) !== 0;
    }

    _Cube.getType = function (cube) {
        return cube & 0x7FFFFFFF;
    }

    _Cube.getFrontTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].front;
    }
    _Cube.getBackTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].back;
    }

    _Cube.getTopTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].top;
    }

    _Cube.getBottomTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].bottom;
    }

    _Cube.getLeftTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].left;
    }

    _Cube.getRightTextureCoords = function (cube) {
        return _Cube.textureCoords[_Cube.getType(cube)].right;
    }
    
    initCubes = _initCubes;
    Cube = _Cube;
} ());
