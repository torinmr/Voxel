"use strict";

var Chunk;

(function () {
 
    var _Chunk = function (x, y, z, world) {
        this.world = world;
        this.xLocation = x;
        this.yLocation = y;
        this.zLocation = z;        
        this.cubes = new Array(_Chunk.xSize * _Chunk.ySize * _Chunk.zSize);

        for (var i=0; i < _Chunk.xSize; i++) {
            for (var j=0; j < _Chunk.ySize; j++) {
                for (var k=0; k < _Chunk.zSize; k++) {
                    var worldX = this.xLocation * _Chunk.xSize + i;
                    var worldY = this.yLocation * _Chunk.ySize + j;
                    var worldZ = this.zLocation * _Chunk.zSize + k;
                    
                    // Elevation as described by Notch in his blog.
                    var elevation = noise.simplex2(worldX / 200, worldZ / 300);
                    var roughness = noise.simplex2((worldX + 100000) / 300,
                                                   (worldZ + 100000) / 200);
                    var detail = noise.simplex2((worldX + 200000) / 25,
                                                 (worldZ + 200000) / 25);
                     
                    var stoneHeight = (elevation + 0.25*roughness*detail)*32 + 64;
                    if (worldY === 0) {
                        this.cubes[this.flattenCoordinates(i, j, k)] =
                            Cube.newCube(true, "bedrock");
                    } else if (stoneHeight > worldY) {
                        this.cubes[this.flattenCoordinates(i, j, k)] =
                            Cube.newCube(true, "stone");
                    } else if (stoneHeight + 3 > worldY) {
                        this.cubes[this.flattenCoordinates(i, j, k)] =
                            Cube.newCube(true, "dirt");
                    } else if (stoneHeight + 4 > worldY) {
                        this.cubes[this.flattenCoordinates(i, j, k)] =
                            Cube.newCube(true, "grass");
                    } else {
                        this.cubes[this.flattenCoordinates(i, j, k)] =
                            Cube.newCube(false, 0);
                    }
                }
            }
        }
    }

    _Chunk.xSize = 16;
    _Chunk.ySize = 16;
    _Chunk.zSize = 16;

    _Chunk.prototype.flattenCoordinates = function (x, y, z) {
        return z + _Chunk.zSize*(y + _Chunk.ySize*x);
    }


    var frontVertices = [
        0.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        1.0, 1.0, 1.0,
        0.0, 1.0, 1.0,
    ];

    var backVertices = [
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
    ];

    var topVertices = [
        0.0,  1.0, 0.0,
        0.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, 0.0,
    ];
    
    var bottomVertices = [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0,  1.0,
        0.0, 0.0,  1.0,
    ];
    
    var rightVertices = [
        1.0, 0.0, 0.0,
        1.0,  1.0, 0.0,
        1.0,  1.0,  1.0,
        1.0, 0.0,  1.0,
    ];

    var leftVertices = [
        0.0, 0.0, 0.0,
        0.0, 0.0,  1.0,
        0.0,  1.0,  1.0,
        0.0,  1.0, 0.0,
    ];

    var frontVertexNormals = [
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
    ];

    var backVertexNormals = [
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
    ];

    var topVertexNormals = [
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
    ];

    var bottomVertexNormals = [
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
    ];

    var rightVertexNormals = [
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
    ];

    var leftVertexNormals = [
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
    ];

    var singleFaceIndices = [ 0, 1, 2, 0, 2, 3 ];
    
    var append = function (array1, array2) {
        for (var i = 0; i < array2.length; i++) {
            array1.push(array2[i]);
        }
    }
    
    var translate = function (array, x, y, z) {
        var translatedArray = [];
        for (var i = 0; i < array.length; i++) {
            if (i % 3 === 0) {
                translatedArray.push(array[i] + x);
            } else if (i % 3 === 1) {
                translatedArray.push(array[i] + y);
            } else if (i % 3 === 2) {
                translatedArray.push(array[i] + z);
            }
        }

        return translatedArray;
    }

    var add = function (array, val) {
        var newArray = [];
        for (var i = 0; i < array.length; i++) {
            newArray.push(array[i] + val);
        }

        return newArray;
    }

    _Chunk.prototype.generate = function () {
        var vertices      = [];
        var vertexNormals = [];
        var textureCoords = [];        
        var vertexIndices = [];

        this.isEmpty = true;

        var numFaces = 0;
        for (var i = 0; i < _Chunk.xSize; i++) {
            for (var j = 0; j < _Chunk.ySize; j++) {
                for (var k = 0; k < _Chunk.zSize; k++) {
                    var cube = this.cubes[this.flattenCoordinates(i, j, k)]
                    if (! Cube.isActive(cube)) {
                        continue;
                    }

                    var worldX = this.xLocation * _Chunk.xSize + i;
                    var worldY = this.yLocation * _Chunk.ySize + j;
                    var worldZ = this.zLocation * _Chunk.zSize + k;

                    var front, back, top, bottom, right, left;

                    var neighbor;
                    if (k === _Chunk.zSize - 1) {
                        neighbor = this.world.getCube(worldX, worldY, worldZ+1);
                        front = !Cube.isActive(neighbor);
                    } else {
                        front = !Cube.isActive(this.cubes[this.flattenCoordinates(i, j, k+1)]);
                    }

                    if (k === 0) {
                        neighbor = this.world.getCube(worldX, worldY, worldZ-1);
                        back = !Cube.isActive(neighbor);
                    } else {
                        back = !Cube.isActive(this.cubes[this.flattenCoordinates(i, j, k-1)]);
                    }

                    if (j === _Chunk.ySize-1) {
                        neighbor = this.world.getCube(worldX, worldY+1, worldZ);
                        top = !Cube.isActive(neighbor);
                    } else {
                        top = !Cube.isActive(this.cubes[this.flattenCoordinates(i, j+1, k)]);
                    }

                    if (j === 0) {
                        neighbor = this.world.getCube(worldX, worldY-1, worldZ);
                        bottom = !Cube.isActive(neighbor);
                    } else {
                        bottom = !Cube.isActive(this.cubes[this.flattenCoordinates(i, j-1, k)]);
                    }


                    if (i === _Chunk.xSize - 1) {
                        neighbor = this.world.getCube(worldX+1, worldY, worldZ);
                        right = !Cube.isActive(neighbor);
                    } else {
                        right = !Cube.isActive(this.cubes[this.flattenCoordinates(i+1, j, k)]);
                    }

                    if (i === 0) {
                        neighbor = this.world.getCube(worldX-1, worldY, worldZ);
                        left = !Cube.isActive(neighbor);
                    } else {
                        left = !Cube.isActive(this.cubes[this.flattenCoordinates(i-1, j, k)]);
                    }
                    
                    if (front) { 
                        append(vertices, translate(frontVertices, i, j, k));
                        append(vertexNormals, frontVertexNormals);
                        append(textureCoords, Cube.getFrontTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }
                    
                    if (back) { 
                        append(vertices, translate(backVertices, i, j, k));
                        append(vertexNormals, backVertexNormals);
                        append(textureCoords, Cube.getBackTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }

                    if (top) { 
                        append(vertices, translate(topVertices, i, j, k));
                        append(vertexNormals, topVertexNormals);
                        append(textureCoords, Cube.getTopTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }

                    if (bottom) { 
                        append(vertices, translate(bottomVertices, i, j, k));
                        append(vertexNormals, bottomVertexNormals);
                        append(textureCoords, Cube.getBottomTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }

                    if (right) { 
                        append(vertices, translate(rightVertices, i, j, k));
                        append(vertexNormals, rightVertexNormals);
                        append(textureCoords, Cube.getRightTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }

                    if (left) { 
                        append(vertices, translate(leftVertices, i, j, k));
                        append(vertexNormals, leftVertexNormals);
                        append(textureCoords, Cube.getLeftTextureCoords(cube));
                        append(vertexIndices, add(singleFaceIndices, numFaces * 4));
                        numFaces++;
                    }

                    if (front || back || top || bottom || right || left) {
                        this.isEmpty = false;
                    }
                }
            }
        }

        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = numFaces * 4;

        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = numFaces * 4;

        this.vertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = numFaces * 4;

        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                      new Uint16Array(vertexIndices),
                      gl.STATIC_DRAW);
        this.vertexIndexBuffer.itemSize = 1;
        this.vertexIndexBuffer.numItems = numFaces * 6;
    }

    _Chunk.prototype.draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                               this.vertexPositionBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                               this.vertexNormalBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
                               this.vertexTextureCoordBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Cube.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.uniform1i(shaderProgram.useLightingUniform, lightingSingleton.lightingOn);
        if (lightingSingleton.lightingOn) {
            gl.uniform3f(
                shaderProgram.ambientColorUniform,
                lightingSingleton.ambientR,
                lightingSingleton.ambientG,
                lightingSingleton.ambientB
            );
            
            var lightingDirection = [
                lightingSingleton.lightDirectionX,
                lightingSingleton.lightDirectionY,
                lightingSingleton.lightDirectionZ,
            ];
            
            var adjustedLD = vec3.create();
            vec3.normalize(lightingDirection, adjustedLD);
            vec3.scale(adjustedLD, -1);
            gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
            
            gl.uniform3f(
                shaderProgram.directionalColorUniform,
                lightingSingleton.directionalR,
                lightingSingleton.directionalG,
                lightingSingleton.directionalB
            );
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems,
                        gl.UNSIGNED_SHORT, 0);
    }

    Chunk = _Chunk;
} ());