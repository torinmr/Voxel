"use strict";

var cubeSingleton = {};

function initCubes() {
    // Init the texture
    cubeSingleton.texture = gl.createTexture();
    cubeSingleton.texture.image = new Image();
    cubeSingleton.texture.image.onload = function() {
        handleLoadedTexture(cubeSingleton.texture);
    }
    cubeSingleton.texture.image.src = "assets/sand.png";

    // Init the buffers
    cubeSingleton.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexPositionBuffer);
    var vertices = [
        // Front face
        0.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        1.0, 1.0, 1.0,
        0.0, 1.0, 1.0,

        // Back face
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 0.0, 0.0,

        // Top face
        0.0,  1.0, 0.0,
        0.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, 0.0,

        // Bottom face
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0,  1.0,
        0.0, 0.0,  1.0,

        // Right face
        1.0, 0.0, 0.0,
        1.0,  1.0, 0.0,
        1.0,  1.0,  1.0,
        1.0, 0.0,  1.0,

        // Left face
        0.0, 0.0, 0.0,
        0.0, 0.0,  1.0,
        0.0,  1.0,  1.0,
        0.0,  1.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeSingleton.vertexPositionBuffer.itemSize = 3;
    cubeSingleton.vertexPositionBuffer.numItems = 24;

    cubeSingleton.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexNormalBuffer);
    var vertexNormals = [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        
        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeSingleton.vertexNormalBuffer.itemSize = 3;
    cubeSingleton.vertexNormalBuffer.numItems = 24;

    cubeSingleton.vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexTextureCoordBuffer);
    var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeSingleton.vertexTextureCoordBuffer.itemSize = 2;
    cubeSingleton.vertexTextureCoordBuffer.numItems = 24;
    
    cubeSingleton.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeSingleton.vertexIndexBuffer);
    var cubevertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23,  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(cubevertexIndices),
                  gl.STATIC_DRAW);
    cubeSingleton.vertexIndexBuffer.itemSize = 1;
    cubeSingleton.vertexIndexBuffer.numItems = 36;
}

function Cube(isActive) {
    this.isActive = isActive;
}

Cube.prototype.draw = function() {
    if (!this.isActive) {
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                           cubeSingleton.vertexPositionBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                           cubeSingleton.vertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeSingleton.vertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
                           cubeSingleton.vertexTextureCoordBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeSingleton.texture);
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
            lightingSingleton.lightDirectionZ
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
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeSingleton.vertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeSingleton.vertexIndexBuffer.numItems,
                    gl.UNSIGNED_SHORT, 0);
}