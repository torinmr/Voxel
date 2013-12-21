"use strict";

var handleKeys;

var initControls = function (canvas) {
    world.player.x = 20.0;
    world.player.y = 12.0;
    world.player.z = 20.0;
    world.player.pitch = 0.0;
    world.player.yaw = 0.0;

    var dvorak = true;
    var handleKeysInternal = function () {
        var verticalSpeed = 0.4;
        var forwardSpeed = 0.8;
        var backSpeed = 0.8;
        var strafeSpeed = 0.5;

        var left, right, forward, back, up, down, run;

        var cy = Math.cos(degToRad(world.player.yaw));
        var cp = Math.cos(degToRad(world.player.pitch));
        var sy = Math.sin(degToRad(world.player.yaw));
        var sp = Math.sin(degToRad(world.player.pitch));

        if (dvorak) {
            left         = currentlyPressedKeys[65];  // A
            right        = currentlyPressedKeys[69];  // E
            forward      = currentlyPressedKeys[188]; // ,
            back         = currentlyPressedKeys[79];  // O
            up           = currentlyPressedKeys[222]; // '
            down         = currentlyPressedKeys[81];  // Q
            run          = currentlyPressedKeys[16];  // SHIFT
        } else {
            left         = currentlyPressedKeys[65];  // A
            right        = currentlyPressedKeys[68];  // D
            forward      = currentlyPressedKeys[87];  // W
            back         = currentlyPressedKeys[83];  // S
            up           = currentlyPressedKeys[81];  // Q
            down         = currentlyPressedKeys[88];  // X
            run          = currentlyPressedKeys[16];  // SHIFT
        }
        
        if (run) {
            verticalSpeed *= 10;
            forwardSpeed *= 10;
            backSpeed *= 10;
            strafeSpeed *= 10;
        }
        if (up) {
            world.player.y += verticalSpeed;
        }
        if (down) {
            world.player.y -= verticalSpeed;
        }
       
        var adjustment = 1;
        if ((forward || back) && (left || right)) {
            adjustment = 1/Math.sqrt(2);
        }
                                    

        if (forward && !back) {
            world.player.z -= forwardSpeed*cy*cp*adjustment;
            world.player.x -= forwardSpeed*sy*cp*adjustment;
            world.player.y += forwardSpeed*sp*adjustment;
        }

        if (back && !forward) {
            world.player.z += backSpeed*cy*cp*adjustment;
            world.player.x += backSpeed*sy*cp*adjustment;
            world.player.y -= backSpeed*sp*adjustment;
        }

        if (left && !right) {
            world.player.z += strafeSpeed*sy*adjustment;
            world.player.x -= strafeSpeed*cy*adjustment;
        }

        if (right && !left) {
            world.player.z -= strafeSpeed*sy*adjustment;
            world.player.x += strafeSpeed*cy*adjustment;
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

        world.player.yaw -= movementX/15;
        world.player.pitch -= movementY/15;
        if (world.player.pitch > 90) {
            world.player.pitch = 90;
        } else if (world.player.pitch < -90) {
            world.player.pitch = -90;
        }
    }

    var handleMouseDown = function (event) {
        if (document.fullscreenElement !== canvas &&
            document.mozFullscreenElement !== canvas &&
            document.webkitFullscreenElement !== canvas) {
            
            console.log("About to request fullscreen");
            canvas.requestFullscreen = canvas.requestFullscreen ||
                canvas.mozRequestFullscreen ||
                canvas.webkitRequestFullscreen;
            canvas.requestFullscreen();
        }
            
        if (event.button === 0) {
            world.deleteCube();
        } else if (event.button === 2) {
            world.placeCube("dirt");
        }
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

    document.onmousedown = handleMouseDown;

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
}