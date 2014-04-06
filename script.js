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

var lightingSingleton = {
    daytimeAmbientR: 0.475,
    daytimeAmbientG: 0.5,
    daytimeAmbientB: 0.55,

    nighttimeAmbientR: 0.15,
    nighttimeAmbientG: 0.2,
    nighttimeAmbientB: 0.25,

    sunsetSunriseR: 1.0,
    sunsetSunriseG: .7,
    sunsetSunriseB: .5,

    sunlightR: 1.1,
    sunlightG: 1.1,
    sunlightB: 0.9,

    // Night/Day cycle information.
    // Everything is measured in hours, with 0 being midnight and 23 being 11 pm.
    // Fractional values are acceptable.
    timeOfDay: 3,
    dawnStart: 3,
    dayStart: 8,
    duskStart: 16,
    nightStart: 21,
};

function updateLighting() {
    var l = lightingSingleton;

    l.lightingOn =
        document.getElementById("lighting").checked;

    l.timeOfDay = (l.timeOfDay + 0.02) % 24;

    var angleOfSun = Math.PI*(l.timeOfDay - l.dawnStart) / (l.nightStart - l.dawnStart);
    
    l.lightDirectionX = -Math.cos(angleOfSun);
    l.lightDirectionY = -Math.sin(angleOfSun);
    l.lightDirectionZ = -Math.cos(angleOfSun);

    // The night condition implicitly assumes that night includes timeOfDay == 0
    // (i.e. midnight). Probably should fix sometime.
    if (l.timeOfDay > l.nightStart || l.timeOfDay <= l.dawnStart) {
        // Night
        l.directionalR = 0.0;
        l.directionalG = 0.0;
        l.directionalB = 0.0;

        l.ambientR = l.nighttimeAmbientR;
        l.ambientG = l.nighttimeAmbientG;
        l.ambientB = l.nighttimeAmbientB;
    }
    else if (l.timeOfDay > l.dawnStart && l.timeOfDay <= l.dayStart) {
        // Dawn
        var dawnProgress = (l.timeOfDay - l.dawnStart) / (l.dayStart - l.dawnStart);

        if (dawnProgress < 0.5) {
            l.directionalR = l.sunsetSunriseR * 2 * dawnProgress;
            l.directionalG = l.sunsetSunriseG * 2 * dawnProgress;
            l.directionalB = l.sunsetSunriseB * 2 * dawnProgress;
        } else {
            l.directionalR = l.sunsetSunriseR * 2 * (1 - dawnProgress)
                + l.sunlightR * 2 * (dawnProgress - 0.5);
            l.directionalG = l.sunsetSunriseG * 2 * (1 - dawnProgress)
                + l.sunlightG * 2 * (dawnProgress - 0.5);
            l.directionalB = l.sunsetSunriseB * 2 * (1 - dawnProgress)
                + l.sunlightB * 2 * (dawnProgress - 0.5);
        }

        l.ambientR = dawnProgress * l.daytimeAmbientR
            + (1 - dawnProgress) * l.nighttimeAmbientR;
        l.ambientG = dawnProgress * l.daytimeAmbientG
            + (1 - dawnProgress) * l.nighttimeAmbientG;
        l.ambientB = dawnProgress * l.daytimeAmbientB
            + (1 - dawnProgress) * l.nighttimeAmbientB;
    }
    else if (l.timeOfDay > l.dayStart && l.timeOfDay <= l.duskStart) {
        // Day
        l.directionalR = l.sunlightR;
        l.directionalG = l.sunlightG;
        l.directionalB = l.sunlightB;

        l.ambientR = l.daytimeAmbientR;
        l.ambientG = l.daytimeAmbientG;
        l.ambientB = l.daytimeAmbientB;        
    }
    else if (l.timeOfDay > l.duskStart && l.timeOfDay <= l.nightStart) {
        // Dusk
        var duskProgress = (l.timeOfDay - l.duskStart) / (l.nightStart - l.duskStart);

        if (duskProgress < 0.5) {
            l.directionalR = l.sunlightR * 2 * (0.5 - duskProgress)
                + l.sunsetSunriseR * 2 * duskProgress;
            l.directionalG = l.sunlightG * 2 * (0.5 - duskProgress)
                + l.sunsetSunriseG * 2 * duskProgress;
            l.directionalB = l.sunlightB * 2 * (0.5 - duskProgress)
                + l.sunsetSunriseB * 2 * duskProgress;
        } else {
            l.directionalR = l.sunsetSunriseR * 2 * (1 - duskProgress);
            l.directionalG = l.sunsetSunriseG * 2 * (1 - duskProgress);
            l.directionalB = l.sunsetSunriseB * 2 * (1 - duskProgress);
        }
        
        l.ambientR = duskProgress * l.nighttimeAmbientR
            + (1 - duskProgress) * l.daytimeAmbientR;
        l.ambientG = duskProgress * l.nighttimeAmbientG
            + (1 - duskProgress) * l.daytimeAmbientG;
        l.ambientB = duskProgress * l.nighttimeAmbientB
            + (1 - duskProgress) * l.daytimeAmbientB;
    } else {
        console.log("Error in day/night cycle!");
    }
//    console.log(l.timeOfDay);
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
