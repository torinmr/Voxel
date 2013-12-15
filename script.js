"use strict";

var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch(e) {
        console.log(e);
    }
    if (!gl) {
        alert("Could not initialize WebGL. Sorry about that.");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (3 == k.nodeType) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if ("x-shader/x-fragment" == shaderScript.type) {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if ("x-shader/x-vertex" == shaderScript.type) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        alert("Problem with shader compilation.");
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl,  "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders.");
    }
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram,
                                                                   "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram,
                                                                  "uDirectionalColor");
}


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (0 == mvMatrixStack.length) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var worldSize = 20;
var world = new Array(worldSize*worldSize*worldSize);

function flattenCoordinates(x, y, z) {
    return z + worldSize*(y + worldSize*x);
}

function initWorldObjects() {
    for (var i=0; i < worldSize; i++) {
        for (var j=0; j < worldSize; j++) {
            for (var k=0; k < worldSize; k++) {
                world[flattenCoordinates(i, j, k)] = new Cube(true);
            }
        }
    }
}

var lightingSingleton = {};

function updateLighting() {
    lightingSingleton.lightingOn =
        document.getElementById("lighting").checked;

    lightingSingleton.ambientR =
        parseFloat(document.getElementById("ambientR").value);
    lightingSingleton.ambientG =
        parseFloat(document.getElementById("ambientG").value);
    lightingSingleton.ambientB =
        parseFloat(document.getElementById("ambientB").value);

    lightingSingleton.lightDirectionX =
        parseFloat(document.getElementById("lightDirectionX").value);
    lightingSingleton.lightDirectionY =
        parseFloat(document.getElementById("lightDirectionY").value);
    lightingSingleton.lightDirectionZ =
        parseFloat(document.getElementById("lightDirectionZ").value);

    lightingSingleton.directionalR =
        parseFloat(document.getElementById("directionalR").value);
    lightingSingleton.directionalG =
        parseFloat(document.getElementById("directionalG").value);
    lightingSingleton.directionalB =
        parseFloat(document.getElementById("directionalB").value);
}

var player = {};

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up perspective and movement matrices
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, pMatrix);

    mat4.identity(mvMatrix);
    mat4.rotate(mvMatrix, degToRad(-player.pitch), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(-player.yaw), [0, 1, 0]);
    mat4.translate(mvMatrix, [-player.x, -player.y, -player.z]);

    mvPushMatrix();
    for (var i=0; i < worldSize; i++) {
        mvPushMatrix();
        for (var j=0; j < worldSize; j++) {
            mvPushMatrix();
            for (var k=0; k < worldSize; k++) {
                var back = (k == worldSize-1) ||  !world[flattenCoordinates(i, j, k+1)].isActive;
                var front = (k == 0) || !world[flattenCoordinates(i, j, k-1)].isActive;
                var up = (j == worldSize-1) ||    !world[flattenCoordinates(i, j+1, k)].isActive;
                var down = (j == 0) || !world[flattenCoordinates(i, j-1, k)].isActive;
                var right = (i == worldSize-1) || !world[flattenCoordinates(i+1, j, k)].isActive;
                var left = (i == 0) || !world[flattenCoordinates(i-1, j, k)].isActive;

                if (! (back || front || up ||
                       down || right || left)) {
                    mat4.translate(mvMatrix, [0, 0, 1]);
                    continue;
                }

                world[flattenCoordinates(i, j, k)].draw();
                mat4.translate(mvMatrix, [0, 0, 1]);
            }
            mvPopMatrix();
            mat4.translate(mvMatrix, [0, 1, 0]);
        }
        mvPopMatrix();
        mat4.translate(mvMatrix, [1, 0, 0]);
    }
    mvPopMatrix();
}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (0 != lastTime) {
        var elapsed = timeNow - lastTime;
        document.getElementById("framerate").innerHTML = 1000/elapsed;
        // Animation code goes here.
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    updateLighting();
    handleKeys();
    drawScene();
    animate();
}

function webGLStart() {
    var canvas = document.getElementById("test01-canvas");
    initGL(canvas);
    initShaders();
    initCubes();
    initWorldObjects();
    initControls(canvas, player);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    tick();
}
