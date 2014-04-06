"use strict";

var gl;
var canvas;
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

var lightingSingleton = {};
var sunAngle = 90;
function updateLighting() {
    lightingSingleton.lightingOn =
        document.getElementById("lighting").checked;

    lightingSingleton.ambientR = 0.2;
    lightingSingleton.ambientG = 0.2;
    lightingSingleton.ambientB = 0.2;

    sunAngle = (sunAngle + 0.3) % 360 ;
    
    lightingSingleton.lightDirectionX = Math.sin(degToRad(sunAngle));
    lightingSingleton.lightDirectionY = -Math.cos(degToRad(sunAngle));
    lightingSingleton.lightDirectionZ = Math.sin(degToRad(sunAngle));

    lightingSingleton.directionalR = 0.4 + 0.05*Math.abs(Math.sin(degToRad(sunAngle)));
    lightingSingleton.directionalG = 0.4 - 0.05*Math.abs(Math.sin(degToRad(sunAngle)));
    lightingSingleton.directionalB = 0.4 - 0.05*Math.abs(Math.sin(degToRad(sunAngle)));

    if (sunAngle > 75 && sunAngle <= 105) {
        lightingSingleton.directionalR *= (105 - sunAngle) / 30;
        lightingSingleton.directionalG *= (105 - sunAngle) / 30;
        lightingSingleton.directionalB *= (105 - sunAngle) / 30;
    } else if (sunAngle > 265 && sunAngle <= 285) {
        lightingSingleton.directionalR *= (sunAngle - 265) / 30;
        lightingSingleton.directionalG *= (sunAngle - 265) / 30;
        lightingSingleton.directionalB *= (sunAngle - 265) / 30;
    } else if (sunAngle > 105 && sunAngle <= 265) {
        lightingSingleton.directionalR = 0.0;
        lightingSingleton.directionalG = 0.0;
        lightingSingleton.directionalB = 0.0;
    }
}

var world;

function tick() {
    requestAnimFrame(tick);
    updateLighting();
    handleKeys();
    world.draw();
}

function webGLStart() {
    canvas = document.getElementById("gamecanvas");
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    initGL(canvas);
    initShaders();
    initCubes();

    world = new World();
    world.setPlayerPosition(50.0, 64.0, 50.0);
    world.setPlayerOrientation(0.0, 0.0);
    
    initControls(canvas);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
