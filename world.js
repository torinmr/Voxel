"use strict";

var World;

(function () {
    var _World = function () {
        this.numChunksX = 32;
        this.numChunksY = 8;
        this.numChunksZ = 32;
        this.chunks = new Array(this.numChunksX*this.numChunksY*this.numChunksZ);

        // Make the chunks
        for (var i=0; i < this.numChunksX; i++) {
            for (var j=0; j < this.numChunksY; j++) {
                for (var k=0; k < this.numChunksZ; k++) {
                    this.chunks[this.flattenCoordinates(i, j, k)] = new Chunk(i, j, k, this);
                }
            }
        }

        // Generate the models for the chunks. This has to happen in a separate pass, since a chunk's
        // rendering may depend on other chunks.
        for (var i=0; i < this.numChunksX; i++) {
            for (var j=0; j < this.numChunksY; j++) {
                for (var k=0; k < this.numChunksZ; k++) {
                    this.chunks[this.flattenCoordinates(i, j, k)].generate();
                }
            }
        }

        this.player       = {};
        this.player.x     = 0.0;
        this.player.y     = 0.0;
        this.player.z     = 0.0;
        this.player.pitch = 0.0;
        this.player.yaw   = 0.0;
        this.player.reach = 20;
    }

    _World.prototype.getCube = function (x, y, z) {
        var x = Math.floor(x);
        var y = Math.floor(y);
        var z = Math.floor(z);
        var chunkX = Math.floor(x / Chunk.xSize);
        var cubeX = x - (chunkX * Chunk.xSize);
        var chunkY = Math.floor(y / Chunk.ySize);
        var cubeY = y - (chunkY * Chunk.ySize);
        var chunkZ = Math.floor(z / Chunk.zSize);
        var cubeZ = z - (chunkZ * Chunk.zSize);

        var chunk = this.chunks[this.flattenCoordinates(chunkX, chunkY, chunkZ)];
        if (chunk) {
            return chunk.cubes[chunk.flattenCoordinates(cubeX, cubeY, cubeZ)];
        } else {
            return Cube.newCube(true, "dirt");
        }
    }

    _World.prototype.setCube = function (x, y, z, cube) {
        var x = Math.floor(x);
        var y = Math.floor(y);
        var z = Math.floor(z);
        var chunkX = Math.floor(x / Chunk.xSize);
        var cubeX = x - (chunkX * Chunk.xSize);
        var chunkY = Math.floor(y / Chunk.ySize);
        var cubeY = y - (chunkY * Chunk.ySize);
        var chunkZ = Math.floor(z / Chunk.zSize);
        var cubeZ = z - (chunkZ * Chunk.zSize);

        var chunk = this.chunks[this.flattenCoordinates(chunkX, chunkY, chunkZ)];
        chunk.cubes[chunk.flattenCoordinates(cubeX, cubeY, cubeZ)] = cube;
        
        chunk.generate();

        // Check if we need to update neighboring chunks
        var otherChunk;
        if (cubeX === 0) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX-1, chunkY, chunkZ)];
        }
        if (cubeX === Chunk.xSize-1) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX+1, chunkY, chunkZ)];
        }
        if (otherChunk) {
            otherChunk.generate();
        }

        if (cubeY === 0) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX, chunkY-1, chunkZ)];
        }
        if (cubeY === Chunk.ySize-1) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX, chunkY+1, chunkZ)];
        }
        if (otherChunk) {
            otherChunk.generate();
        }

        if (cubeZ === 0) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX, chunkY, chunkZ-1)];
        }
        if (cubeZ === Chunk.zSize-1) {
            otherChunk = this.chunks[this.flattenCoordinates(chunkX, chunkY, chunkZ+1)];
        }
        if (otherChunk) {
            otherChunk.generate();
        }
    }

    _World.prototype.flattenCoordinates = function (x, y, z) {
        if (z < 0 || z >= this.numChunksZ ||
            y < 0 || y >= this.numChunksY ||
            x < 0 || x >= this.numChunksX) {
            return -1;
        } else {
            return z + this.numChunksZ*(y + this.numChunksY*x);
        }
    }

    _World.prototype.setPlayerPosition = function (x, y, z) {
        this.player.x = x;
        this.player.y = y;
        this.player.z = z;
    }

    _World.prototype.setPlayerOrientation = function (pitch, yaw) {
        this.player.pitch = pitch;
        this.player.yaw   = yaw;
    }
    
    _World.prototype.draw = function () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Set up perspective and movement matrices
        mat4.perspective(45, canvas.width / canvas.height, 0.1, 1000.0, pMatrix);

        mat4.rotate(pMatrix, degToRad(-this.player.pitch), [1, 0, 0]);
        mat4.rotate(pMatrix, degToRad(-this.player.yaw), [0, 1, 0]);
        mat4.translate(pMatrix, [-this.player.x, -this.player.y, -this.player.z]);

        mat4.identity(mvMatrix);
        for (var i=0; i < this.numChunksX; i++) {
            for (var j=0; j < this.numChunksY; j++) {
                for (var k=0; k < this.numChunksZ; k++) {
                    var chunk = this.chunks[this.flattenCoordinates(i, j, k)];
                    if (!chunk.isEmpty) {
                        mvPushMatrix();
                        mat4.translate(mvMatrix, [i*Chunk.xSize, j*Chunk.ySize, k*Chunk.zSize]);
                        chunk.draw();
                        mvPopMatrix();
                    }
                }
            }
        }
    }

    _World.moveToNextCube = function (pos, yaw, pitch) {
        var x = pos.x;
        var y = pos.y;
        var z = pos.z;

        var cy = Math.cos(degToRad(yaw));
        var cp = Math.cos(degToRad(pitch));
        var sy = Math.sin(degToRad(yaw));
        var sp = Math.sin(degToRad(pitch));

        var posZ = cy < 0;
        var posX = sy < 0;
        var posY = sp > 0;

        var distToZ;
        if (posZ) {
            distToZ = (z - Math.ceil(z)) / (cy*cp);
        } else {
            distToZ = (z - Math.floor(z)) / (cy*cp);
        }
        
        var distToX;
        if (posX) {
            distToX = (x - Math.ceil(x)) / (sy*cp);
        } else {
            distToX = (x - Math.floor(x)) / (sy*cp);
        }
        
        var distToY;
        if (posY) {
            distToY = (Math.ceil(y) - y) / sp;
        } else {
            distToY = (Math.floor(y) - y) / sp;
        }
        
        if (distToX != distToX) {
                distToX = Number.POSITIVE_INFINITY;
        }
        if (distToY != distToY) {
            distToY = Number.POSITIVE_INFINITY;
        }
        if (distToZ != distToZ) {
            distToZ = Number.POSITIVE_INFINITY;
        }
        
        var dist;
        if (distToZ <= distToX && distToZ <= distToY) {
            dist = distToZ;
        } else if (distToX <= distToZ && distToX <= distToY) {
            dist = distToX;
        } else {
            dist = distToY;
        }

        dist += .0001;
        
        z -= dist*cy*cp;
        x -= dist*sy*cp;
        y += dist*sp;

        return { x: x, y: y, z: z };
    }
    
    _World.prototype.deleteCube = function () {
        var pos = { x: this.player.x,
                    y: this.player.y,
                    z: this.player.z };
        
        for (var i = 0; i < this.player.reach; i++) {
            pos = _World.moveToNextCube(pos, this.player.yaw, this.player.pitch);
            
            if (Cube.isActive(this.getCube(pos.x, pos.y, pos.z))) {
                var newCube = Cube.newCube(false, "dirt");
                this.setCube(pos.x, pos.y, pos.z, newCube);
                return;
            }
        }
    }

    _World.prototype.placeCube = function (type) {
        var pos = { x: this.player.x,
                    y: this.player.y,
                    z: this.player.z };

        pos = _World.moveToNextCube(pos, this.player.yaw, this.player.pitch);

        pos = _World.moveToNextCube(pos, this.player.yaw, this.player.pitch);
        if (Cube.isActive(this.getCube(pos.x, pos.y, pos.z))) {
            return;
        } else {
            var prevPos = pos;
        }

        for (var i = 0; i < this.player.reach - 2; i++) {
            pos = _World.moveToNextCube(pos, this.player.yaw, this.player.pitch);
            if (Cube.isActive(this.getCube(pos.x, pos.y, pos.z))) {
                var newCube = Cube.newCube(true, type);
                this.setCube(prevPos.x, prevPos.y, prevPos.z, newCube);
                return;
            } else {
                var prevPos = pos;
            }
        }
    }
    
    World = _World;
} ());
