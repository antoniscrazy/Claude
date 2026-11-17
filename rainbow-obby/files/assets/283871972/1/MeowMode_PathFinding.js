var Pathfinding = pc.createScript('pathfinding');

// Script attributes for path root and spider
Pathfinding.attributes.add('pathRoot', { type: 'entity' });
Pathfinding.attributes.add('spider', { type: 'entity' });
Pathfinding.attributes.add('player', { type: 'entity' });
Pathfinding.attributes.add('moveSpeed', { type: 'number', default: 2 });
Pathfinding.attributes.add('rotationSpeed', { type: 'number', default: 0.1 });
Pathfinding.attributes.add('raycastDistance', { type: 'number', default: 2 }); // Distance for raycasting
Pathfinding.attributes.add('waypointType', { type: "string", default: "waypoint" });

// Initialize code called once per entity
Pathfinding.prototype.initialize = function () {
    console.log("waypoint");

/*     this.footstepSounds = [
        this.entity.sound.slot("footstep0"),
        this.entity.sound.slot("footstep1"),
        this.entity.sound.slot("footstep2")
    ];
    this.spider.anim.on('footstep', () => {
        this.footstepSounds[Math.floor(pc.math.random(0, 3))].play();
    }); */
    this.isSpiderIdle = false;
    this.currentWaypointIndex = null;
    this.spiderQuatLerp = new pc.Quat();
    this.spiderSurfaceEuler = new pc.Vec3();
    this.tempPos = new pc.Vec3();
    this.spiderDesiredAngle = 0;
    this.canSpiderAttack = true;
    this.isPlayerInAttackRange = false;
    this.spiderAnim = this.spider.anim;
    this.spiderRayPoint = this.spider.findByName("RayPoint");
    
    if (this.waypointType == "waypoint")
        this.waypoints = waypoints;
    else {
        this.waypoints = waypoints2;
    }

   
    //this.waypoints = this.generateWaypoints();
    //console.log(this.waypoints);

    this.nearestWaypointToPlayer = this.findNearestWaypointToPlayer().id;
    this.findPath(5, this.nearestWaypointToPlayer);
    this.findNearestWaypointToPlayerInterval = setInterval(() => {
        this.currentWaypointIndex = this.shortestPath.length;
        this.nearestWaypointToPlayer = this.findNearestWaypointToPlayer().id;
        this.findPath(this.targetWaypoint.id, this.nearestWaypointToPlayer);
    }, 1000);


    this.on('destroy', function () {
        clearInterval(this.findNearestWaypointToPlayerInterval);
        clearTimeout(this.spiderAttackTimeout);
    }, this);
};

// Find the nearest waypoint to the player
Pathfinding.prototype.findNearestWaypointToPlayer = function () {
    let playerPos = this.player.getPosition();
    let nearestWaypoint = null;
    let shortestDistance = Infinity;

    // Check each waypoint and find the one closest to the player
    this.waypoints.forEach(waypoint => {
        this.tempPos.set(waypoint.position.x, waypoint.position.y, waypoint.position.z);
        let distance = this.tempPos.distance(playerPos);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestWaypoint = waypoint;
        }
    });

    return nearestWaypoint;
};

Pathfinding.prototype.findPath = function (startPointIndex, targetPointIndex) {
    // Get shortest path
    let startId = startPointIndex;
    let endId = targetPointIndex; // Example target
    this.shortestPath = dijkstra(startId, endId, this.waypoints);
    // Set initial target waypoint
    this.currentWaypointIndex = 0;
    this.targetWaypoint = this.waypoints[this.shortestPath[this.currentWaypointIndex]];
    // Initialize lerp progress
    this.lerpProgress = 0;
};

// Update function called every frame
Pathfinding.prototype.update = function (dt) {
    if (this.currentWaypointIndex < this.shortestPath.length) {
        this.moveToNextWaypoint(dt);
        if (this.shortestPath.length > 1) {
            this.spiderAnim.setBoolean("isRunning", true);
        }
    } else { //reached target point
        this.spiderAnim.setBoolean("isRunning", false);
    }

    // Rotate the spider towards the next waypoint
    this.tempPos.set(this.targetWaypoint.position.x, this.targetWaypoint.position.y, this.targetWaypoint.position.z);
    this.rotateTowardsTarget(dt, this.tempPos, this.targetWaypoint.rotation);
};


// Move spider to the next waypoint
Pathfinding.prototype.moveToNextWaypoint = function (dt) {
    //spider playera yakinsa nodelari takip etmek yerine saldir
    if (this.isPlayerInAttackRange) {
        return;
    }
    // Get current and next waypoint positions
    let currentPos = this.spider.getPosition();
    this.tempPos.set(this.targetWaypoint.position.x, this.targetWaypoint.position.y, this.targetWaypoint.position.z);
    let targetPos = this.tempPos;

    // Calculate the direction and distance to the target
    let direction = targetPos.clone().sub(currentPos).normalize();
    let distanceToTarget = currentPos.distance(targetPos);

    // Move towards the target at a consistent speed
    let movementStep = this.moveSpeed * dt; // Calculate the distance to move this frame

    // If the spider is close to the target, clamp the movement to avoid overshooting
    if (movementStep >= distanceToTarget) {
        this.spider.setPosition(targetPos); // Snap to the target position
        this.currentWaypointIndex++;
        if (this.currentWaypointIndex < this.shortestPath.length) {
            this.targetWaypoint = this.waypoints[this.shortestPath[this.currentWaypointIndex]];
        } else {
            this.lerpProgress = 0; // End of path
        }
    } else {
        // Move the spider towards the target
        let newPos = currentPos.clone().add(direction.scale(movementStep));
        this.spider.setPosition(newPos);
    }
};

// Rotate spider
Pathfinding.prototype.rotateTowardsTarget = function (dt, targetPos, targetRot) {
    // Get direction vector to the target
    const currentPos = this.spider.getPosition();
    const targetDirection = targetPos.clone().sub(currentPos.clone()).normalize();
    // Calculate horizontal direction for yaw
    const horizontalDirection = new pc.Vec3(targetDirection.x, 0, targetDirection.z).normalize();
    // Calculate the distance between current and target positions (XZ plane)
    const horizontalDistance = Math.sqrt(Math.pow(targetPos.x - currentPos.x, 2) + Math.pow(targetPos.z - currentPos.z, 2));
    // Check if there is significant horizontal movement to calculate yaw
    let yaw;
    if (horizontalDistance > 0) {  // Threshold to avoid division by zero or negligible movement
        yaw = Math.atan2(horizontalDirection.x, horizontalDirection.z) * pc.math.RAD_TO_DEG;
        yaw -= targetRot.y + targetRot.x;
    } else {
        // If there's no horizontal movement, keep the last known yaw
        yaw = this.spiderDesiredAngle;  // Fallback to previous yaw or 0
    }
    // Calculate Pitch (rotation around X-axis, vertical angle)
    const pitch = Math.asin(-targetDirection.y) * pc.math.RAD_TO_DEG + targetRot.x;
    // Create the quaternion with the new rotations (yaw and pitch)
    const targetQuat = new pc.Quat().setFromEulerAngles(pitch, yaw, 0);
    // Smoothly interpolate (slerp) towards the target rotation
    this.spiderQuatLerp = new pc.Quat().slerp(this.spiderQuatLerp, targetQuat, this.rotationSpeed * dt);
    // Apply the new rotation to the spider
    this.spider.setRotation(this.spiderQuatLerp);
    // Store the current yaw for future reference
    this.spiderDesiredAngle = yaw;
    // Apply the new rotation to the spider
    this.spider.setRotation(this.spiderQuatLerp);
    // Store the current yaw for future reference
    this.spiderDesiredAngle = yaw;
};


// Function to generate waypoints from the hierarchy
Pathfinding.prototype.generateWaypoints = function () {
    let waypoints = [];

    // Iterate through each node (e.g., Node_0, Node_1, Node_2)
    this.pathRoot.children.forEach((node) => {
        if (node.name.startsWith("Node_")) {
            let nodeId = parseInt(node.name.split('_')[1]); // Extract node ID from name

            // Create a waypoint object for the node
            let waypoint = {
                id: nodeId,
                position: node.getPosition().clone(),
                rotation: node.getLocalEulerAngles().clone(),
                neighbors: []
            };

            // Iterate through each neighbor entity under the node
            node.children.forEach((neighborEntity) => {
                if (neighborEntity.name.startsWith("Neighbor_")) {
                    let neighborId = parseInt(neighborEntity.name.split('_')[1]); // Extract neighbor ID from name

                    // Calculate the weight (distance) to the neighbor
                    let neighborNode = this.pathRoot.findByName("Node_" + neighborId);
                    if (neighborNode) {
                        let distance = node.getPosition().distance(neighborNode.getPosition());

                        // Add neighbor to the waypoint's neighbors list
                        waypoint.neighbors.push({
                            id: neighborId,
                            weight: distance
                        });
                    }

                }
            });

            // Add the waypoint to the waypoints array
            waypoints.push(waypoint);
        }
    });

    return waypoints;
};

// Dijkstra's Algorithm
function dijkstra(startId, endId, waypoints) {
    let distances = {};
    let previous = {};
    let unvisited = [];

    waypoints.forEach((waypoint) => {
        distances[waypoint.id] = Infinity;
        previous[waypoint.id] = null;
        unvisited.push(waypoint.id);
    });

    distances[startId] = 0;

    while (unvisited.length > 0) {
        let currentNodeId = unvisited.reduce((minNodeId, nodeId) => {
            return distances[nodeId] < distances[minNodeId] ? nodeId : minNodeId;
        }, unvisited[0]);

        if (currentNodeId === endId) break;

        unvisited = unvisited.filter(nodeId => nodeId !== currentNodeId);

        let currentNode = waypoints.find(waypoint => waypoint.id === currentNodeId);
        currentNode.neighbors.forEach(neighbor => {
            let alt = distances[currentNodeId] + neighbor.weight;
            if (alt < distances[neighbor.id]) {
                distances[neighbor.id] = alt;
                previous[neighbor.id] = currentNodeId;
            }
        });
    }

    let path = [];
    let current = endId;
    while (previous[current] !== null) {
        path.unshift(current);
        current = previous[current];
    }
    path.unshift(startId);

    return path;
}



