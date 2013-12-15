"use strict";

var handleKeys;

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var initControls = function (canvas, player) {
    player.x = 5.0;
    player.y = 5.0;
    player.z = 50.0;
    player.pitch = 0.0;
    player.yaw = 0.0;

    var handleKeysInternal = function () {
        var dvorak = document.getElementById("dvorak").checked;

        var left, right, forward, back, up, down;
        if (dvorak) {
            left    = 65;  // A
            right   = 69;  // E
            forward = 188; // ,
            back    = 79;  // O
            up      = 222; // '
            down    = 81;  // Q
        } else {
            left    = 65;  // A
            right   = 68;  // D
            forward = 87;  // W
            back    = 83;  // S
            up      = 81;  // Q
            down    = 90;  // Z
        }

        if (currentlyPressedKeys[up]) {
            player.y += 0.1;
        }
        if (currentlyPressedKeys[down]) {
            player.y -= 0.1;
        }

        var forwardSpeed = 0.3;
        var backSpeed = 0.3;
        var strafeSpeed = 0.2;
        var cy = Math.cos(degToRad(player.yaw));
        var cp = Math.cos(degToRad(player.pitch));
        var sy = Math.sin(degToRad(player.yaw));
        var sp = Math.sin(degToRad(player.pitch));

        var forward = currentlyPressedKeys[forward];
        var back = currentlyPressedKeys[back];
        var left = currentlyPressedKeys[left];
        var right = currentlyPressedKeys[right];
       
        var adjustment = 1;
        if ((forward || back) && (left || right)) {
            adjustment = 1/Math.sqrt(2);
        }
                                    

        if (forward && !back) {
            player.z -= forwardSpeed*cy*cp*adjustment;
            player.x -= forwardSpeed*sy*cp*adjustment;
            player.y += forwardSpeed*sp*adjustment;
        }

        if (back && !forward) {
            player.z += backSpeed*cy*cp*adjustment;
            player.x += backSpeed*sy*cp*adjustment;
            player.y -= backSpeed*sp*adjustment;
        }

        if (left && !right) {
            player.z += strafeSpeed*sy*adjustment;
            player.x -= strafeSpeed*cy*adjustment;
        }

        if (right && !left) {
            player.z -= strafeSpeed*sy*adjustment;
            player.x += strafeSpeed*cy*adjustment;
        }
    }

    handleKeys = handleKeysInternal;

    var currentlyPressedKeys = {};
    
    function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
    }
    
    function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
    }
    
    var lastMouseX = 0;
    var lastMouseY = 0;
    
    var handleMouseMove = function (event) {
        var movementX = event.movementX ||
            event.mozMovementX ||
            event.webkitMovementX ||
            0;
        var movementY = event.movementY ||
            event.mozMovementY ||
            event.webkitMovementY ||
            0;

        player.yaw -= movementX/10;
        player.pitch -= movementY/10;
    }

    var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    if (havePointerLock) {
        console.log("Have pointer lock.");

        var changeCallback = function () {
            if (document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas ||
                document.webkitPointerLockElement === canvas) {
                console.log("Pointer lock enabled!");
                document.addEventListener("mousemove", handleMouseMove, false);
            } else {
                console.log("Pointer lock disabled :(");
                document.removeEventListener("mousemove", handleMouseMove, false);
            }
        }

        document.addEventListener('pointerlockchange',
                                  changeCallback, false);
        document.addEventListener('mozpointerlockchange',
                                  changeCallback, false);
        document.addEventListener('webkitpointerlockchange',
                                  changeCallback, false);
    } else {
        console.log("Don't have pointer lock.");
    }

    var getPointerLock = function () {
        console.log("About to request pointer lock");

        canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();
    }
        /*    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp; */
    document.onmousedown = getPointerLock;
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}