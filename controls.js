"use strict";

var handleKeys;

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var initControls = function (canvas, player) {
    player.x = 20.0;
    player.y = 12.0;
    player.z = 20.0;
    player.pitch = 0.0;
    player.yaw = 0.0;

    var dvorak = false;
    var handleKeysInternal = function () {
        var verticalSpeed = 0.4;
        var forwardSpeed = 0.8;
        var backSpeed = 0.8;
        var strafeSpeed = 0.5;

        var left, right, forward, back, up, down, switchLayout;

        var cy = Math.cos(degToRad(player.yaw));
        var cp = Math.cos(degToRad(player.pitch));
        var sy = Math.sin(degToRad(player.yaw));
        var sp = Math.sin(degToRad(player.pitch));

        if (dvorak) {
            left         = currentlyPressedKeys[65];  // A
            right        = currentlyPressedKeys[69];  // E
            forward      = currentlyPressedKeys[188]; // ,
            back         = currentlyPressedKeys[79];  // O
            up           = currentlyPressedKeys[222]; // '
            down         = currentlyPressedKeys[81];  // Q
        } else {
            left         = currentlyPressedKeys[65];  // A
            right        = currentlyPressedKeys[68];  // D
            forward      = currentlyPressedKeys[87];  // W
            back         = currentlyPressedKeys[83];  // S
            up           = currentlyPressedKeys[81];  // Q
            down         = currentlyPressedKeys[88];  // X
        }
        
        if (up) {
            player.y += verticalSpeed;
        }
        if (down) {
            player.y -= verticalSpeed;
        }
       
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
        console.log(event.keyCode);
        currentlyPressedKeys[event.keyCode] = true;

        if (event.keyCode === 48) { // number 0
            console.log("Switching keyboard layout!");
            dvorak = ! dvorak;
            console.log("dvorak now = " + dvorak);
        }

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

    var handleResize = function() {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        console.log("Resize!: h=" + canvas.height + ", w=" + canvas.width);

    }

    window.onresize = handleResize;

    var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    if (havePointerLock) {
        console.log("Have pointer lock.");

        var fullscreenChangeCallback = function() {
            if (document.fullscreenElement === canvas ||
                document.mozFullscreenElement === canvas ||
                document.webkitFullscreenElement === canvas) {
                console.log("Fullscreen acquired, about to request pointer lock");

                canvas.width = screen.width;
                canvas.height = screen.height;
                canvas.requestPointerLock = canvas.requestPointerLock ||
                    canvas.mozRequestPointerLock ||
                    canvas.webkitRequestPointerLock;
                canvas.requestPointerLock();
            } else {
                console.log("Fullscreen exited, exiting pointer lock.");
                handleResize();
                document.exitPointerLock = document.exitPointerLock ||
                    document.mozExitPointerLock ||
                    document.webkitExitPointerLock;
                document.exitPointerLock();
            }
        }

        var pointerLockChangeCallback = function () {
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

        document.addEventListener('fullscreenchange',
                                  fullscreenChangeCallback, false);
        document.addEventListener('mozfullscreenchange',
                                  fullscreenChangeCallback, false);
        document.addEventListener('webkitfullscreenchange',
                                  fullscreenChangeCallback, false);
            
        document.addEventListener('pointerlockchange',
                                  pointerLockChangeCallback, false);
        document.addEventListener('mozpointerlockchange',
                                  pointerLockChangeCallback, false);
        document.addEventListener('webkitpointerlockchange',
                                  pointerLockChangeCallback, false);
    } else {
        console.log("Don't have pointer lock.");
    }

    document.onmousedown = function () {
        if (document.fullscreenElement !== canvas &&
            document.mozFullscreenElement !== canvas &&
            document.webkitFullscreenElement !== canvas) {
            
            console.log("About to request fullscreen");
            canvas.requestFullscreen = canvas.requestFullscreen ||
                canvas.mozRequestFullscreen ||
                canvas.webkitRequestFullscreen;
            canvas.requestFullscreen();
        }
    }

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}