/*
 * SkateboardObby_PlayerController
 * Skateboard controller for the Skateboard Obby mode.
 *
 * Controls
 *   W / Up (joystick forward) : push towards where the camera looks (board keeps turning to it)
 *   A / D  (joystick sideways): ride to the camera's left / right
 *   S / Down (joystick back)  : turn around (quick kick-turn) and ride back towards the camera
 *   Space  (JumpButton)       : ollie (trick when fast)
 *   Q      (BoostButton)      : boost (cooldown); only for VIP / BOSS VIP or while the Boost power-up lasts
 *   R      (ResetButton)      : reset to last checkpoint
 *
 * Everything else (death, respawn, checkpoints, pause menu, network sync)
 * follows the same flow as the other modes (based on ElectricObby_PlayerController).
 */
var SkateboardObbyPlayerController = pc.createScript('skateboardObbyPlayerController');

SkateboardObbyPlayerController.attributes.add("username", { type: "entity" });
SkateboardObbyPlayerController.attributes.add("body", { type: "entity" });
SkateboardObbyPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

// kept for compatibility with the shared player setup
SkateboardObbyPlayerController.attributes.add("moveSpeed", { type: "number", default: 8, title: "Walk Speed (carpet)" });
SkateboardObbyPlayerController.attributes.add("jumpHeight", { type: "number", default: 16, title: "Ollie Power" });
SkateboardObbyPlayerController.attributes.add("rotateSpeed", { type: "number", default: 3 });

// skate tuning
SkateboardObbyPlayerController.attributes.add("maxSpeed", { type: "number", default: 22, title: "Max Speed", description: "Top speed reachable by pushing (units/s)" });
SkateboardObbyPlayerController.attributes.add("acceleration", { type: "number", default: 12, title: "Push Acceleration" });
SkateboardObbyPlayerController.attributes.add("rollingFriction", { type: "number", default: 3.5, title: "Rolling Friction", description: "Speed lost per second while coasting" });
SkateboardObbyPlayerController.attributes.add("brakeDeceleration", { type: "number", default: 28, title: "Brake Deceleration" });
SkateboardObbyPlayerController.attributes.add("overspeedDeceleration", { type: "number", default: 7, title: "Overspeed Deceleration", description: "How fast speed falls back to max after a boost" });
SkateboardObbyPlayerController.attributes.add("slopeGravity", { type: "number", default: 18, title: "Slope Gravity", description: "Speed gained going downhill / lost going uphill" });
SkateboardObbyPlayerController.attributes.add("uphillGravity", { type: "number", default: 10, title: "Uphill Gravity", description: "Speed lost going uphill (Slope Gravity is used downhill and when rolling back). 9.8 = real gravity" });
SkateboardObbyPlayerController.attributes.add("rollBack", { type: "boolean", default: true, title: "Roll Back On Slopes", description: "When the speed runs out on a slope the board rolls back down (fakie) instead of sticking to it" });
SkateboardObbyPlayerController.attributes.add("impactIgnoresRedirect", { type: "boolean", default: true, title: "Impact: Ignore Redirect", description: "On the ground only a real loss of speed (a wall) slows the board; the direction change on curved ramps and mesh seams does not" });
SkateboardObbyPlayerController.attributes.add("lowSpeedGravity", { type: "number", default: 0.5, min: 0, max: 1, title: "Low Speed Air Gravity", description: "Extra Gravity multiplier at speed 0 (1 at Max Speed): slow jumps and drops float a bit longer" });
SkateboardObbyPlayerController.attributes.add("constantOllieHeight", { type: "boolean", default: true, title: "Constant Ollie Height", description: "The ollie reaches the same height at every speed (Ollie Power is the take-off speed at Max Speed)" });
SkateboardObbyPlayerController.attributes.add("flatHover", { type: "boolean", default: true, title: "Flat Ground Hover", description: "On (nearly) flat ground the capsule floats just above the surface instead of being pressed into it, so collider seams cannot kick it up (road jitter). Slopes keep the normal glue" });
SkateboardObbyPlayerController.attributes.add("rideHeight", { type: "number", default: 1.03, title: "Hover: Height", description: "Capsule center height over flat ground (x player scale). 1.0 = touching; below ~1.02 the seams kick again" });
SkateboardObbyPlayerController.attributes.add("flatHoverMaxSlope", { type: "number", default: 8, title: "Hover: Max Slope", description: "Ground steeper than this (degrees) uses the normal glue" });
SkateboardObbyPlayerController.attributes.add("hoverRampMaxSlope", { type: "number", default: 45, min: 0, max: 60, title: "Hover: Ramp Max Slope", description: "The hover also rides ramps up to this steep: pressed into a faceted curve the board hits every kink of its collider. 0 = flat ground only" });
SkateboardObbyPlayerController.attributes.add("flatHoverTime", { type: "number", default: 0.06, title: "Hover: Response Time", description: "Seconds to reach the hover height" });
SkateboardObbyPlayerController.attributes.add("flatHoverMaxDown", { type: "number", default: 4, title: "Hover: Max Down Speed" });
SkateboardObbyPlayerController.attributes.add("flatHoverMaxUp", { type: "number", default: 3, title: "Hover: Max Up Speed" });
SkateboardObbyPlayerController.attributes.add("hoverKeepsBoardDown", { type: "boolean", default: true, title: "Hover: Keep Board Down", description: "While hovering, the visual Body is lowered by the hover gap so the wheels stay on the ground" });
SkateboardObbyPlayerController.attributes.add("vertAir", { type: "boolean", default: true, title: "Vert Air", description: "Riding up a quarter pipe / bowl / halfpipe wall launches the board straight up past the coping and back into the same ramp (no flying onto the deck or into the wall)" });
SkateboardObbyPlayerController.attributes.add("vertMinSpeed", { type: "number", default: 10, title: "Vert: Min Speed", description: "Slower than this the board only goes up the wall and rolls back (fakie), no extra height / trick / turn" });
SkateboardObbyPlayerController.attributes.add("vertMinAngle", { type: "number", default: 35, title: "Vert: Min Wall Angle", description: "The ramp the board leaves must be at least this steep (deg)" });
SkateboardObbyPlayerController.attributes.add("vertHeight", { type: "number", default: 1, title: "Vert: Height", description: "Take-off speed straight up = board speed x this (the height grows with speed squared)" });
SkateboardObbyPlayerController.attributes.add("vertGravity", { type: "number", default: 0.75, min: 0, max: 1, title: "Vert: Air Gravity", description: "Extra Gravity multiplier during a vert air (lower = more hang time)" });
SkateboardObbyPlayerController.attributes.add("vertDriftIn", { type: "number", default: 1.5, title: "Vert: Drift In", description: "Speed back into the ramp during the air (m/s), so the board lands on the ramp, not on the coping" });
SkateboardObbyPlayerController.attributes.add("vertKeepAlong", { type: "number", default: 1, min: 0, max: 1, title: "Vert: Keep Along Coping", description: "How much of the speed along the coping is kept (less if the landing would be on the deck, e.g. in a round bowl)" });
SkateboardObbyPlayerController.attributes.add("vertTurnAround", { type: "boolean", default: true, title: "Vert: Turn Around", description: "The board turns in the air to face down the ramp (mirrored off the wall), so it lands riding forward" });
SkateboardObbyPlayerController.attributes.add("vertFakieAngle", { type: "number", default: 150, min: 0, max: 180, title: "Vert: Fakie Angle", description: "Straight-on airs (the board would turn more than this, deg) land fakie without turning; at an angle the board turns. The camera is never turned" });
SkateboardObbyPlayerController.attributes.add("vertTricks", { type: "string", default: "Trick_IndyGrab,Trick_NoseGrab,Trick_TailGrab", title: "Vert: Tricks", description: "Anim states played in the air, one at random (comma separated; 'all' = the ollie trick pool; empty = InAir)" });
SkateboardObbyPlayerController.attributes.add("vertAirControl", { type: "number", default: 8, min: 0, title: "Vert: Air Control", description: "Steering in a vert air with W/A/S/D / the joystick (camera-relative), m/s per second; 0 = off" });
SkateboardObbyPlayerController.attributes.add("vertAirControlMax", { type: "number", default: 5, min: 0, title: "Vert: Air Control Max", description: "The most speed (m/s) the air control adds to the flight" });
SkateboardObbyPlayerController.attributes.add("vertExit", { type: "boolean", default: true, title: "Vert: Exit To Deck", description: "Pushing out over the coping once the board is above the wall leaves the bowl / halfpipe and lands on the deck" });
SkateboardObbyPlayerController.attributes.add("vertOverTag", { type: "string", default: "RampOver", title: "Vert: Over Tag", description: "Collider tag of free-standing ramps: no vert air on them, the board jumps off them and lands on the ground ahead" });
SkateboardObbyPlayerController.attributes.add("vertOverAngle", { type: "number", default: 40, min: 0, max: 80, title: "Vert: Over Angle", description: "The take-off angle of a jump off a free-standing ramp, when that lands on flat ground" });
SkateboardObbyPlayerController.attributes.add("vertOverMaxAngle", { type: "number", default: 56, min: 0, max: 80, title: "Vert: Over Max Angle", description: "Steepest take-off to reach the ground across a gap; slower boards that would need more do not try" });
SkateboardObbyPlayerController.attributes.add("vertOverAssist", { type: "number", default: 1.15, min: 1, title: "Vert: Over Assist", description: "A board just short of the ground across a gap gets up to this times its speed for the jump" });
SkateboardObbyPlayerController.attributes.add("vertOverMinAngle", { type: "number", default: 12, min: 0, max: 80, title: "Vert: Over Min Angle", description: "Flattest take-off to stay on the ground before a gap" });
SkateboardObbyPlayerController.attributes.add("vertOverRange", { type: "number", default: 50, min: 5, title: "Vert: Over Range", description: "How far ahead (m) a jump off a free-standing ramp looks for ground" });
SkateboardObbyPlayerController.attributes.add("vertOverLand", { type: "number", default: 3, min: 0, title: "Vert: Over Landing", description: "A jump lands at least this many metres past the start of the ground" });
SkateboardObbyPlayerController.attributes.add("vertOverMargin", { type: "number", default: 6, min: 0, title: "Vert: Over Margin", description: "A jump lands at least this many metres before the ground ends" });
SkateboardObbyPlayerController.attributes.add("vertOverPop", { type: "number", default: 0.6, min: 0, title: "Vert: Over Pop", description: "A hop too slow to jump across goes up this part of the board speed" });
SkateboardObbyPlayerController.attributes.add("vertExitSpeed", { type: "number", default: 6, min: 0, title: "Vert: Exit Max Speed", description: "Most speed (m/s) out over the coping; a deck that needs more is not reached and the board stays in the ramp" });
SkateboardObbyPlayerController.attributes.add("vertWallCheck", { type: "number", default: 6, title: "Vert: Wall Check", description: "Distance (m) the wall must go on above the take-off point; a kicker / launch ramp lip has nothing there and is not a vert" });
SkateboardObbyPlayerController.attributes.add("groundLookAhead", { type: "boolean", default: true, title: "Ground: Look Ahead", description: "Riding onto a ramp / steeper surface, the board is lifted to where that surface will be next frame (otherwise the capsule can dip into the thin start of a ramp mesh and physics pushes it through)" });
SkateboardObbyPlayerController.attributes.add("groundAntiSink", { type: "boolean", default: true, title: "Ground: Anti Sink", description: "A board that has sunk into the ground under it (riding, on the ollie or landing) is put back on top" });
SkateboardObbyPlayerController.attributes.add("sweptGuard", { type: "boolean", default: true, title: "Ground: Swept Landing", description: "In the air the motion is checked ahead with a ray, so a fast landing cannot take the capsule through a thin ground collider (single-sheet slope)" });
SkateboardObbyPlayerController.attributes.add("maxGroundAngle", { type: "number", default: 65, min: 0, max: 90, title: "Max Ground Angle", description: "Surfaces steeper than this (degrees) are not ground: the board does not stick to walls / side faces. The loop is excluded" });
SkateboardObbyPlayerController.attributes.add("turnSpeedLow", { type: "number", default: 420, title: "Turn Speed (slow)", description: "deg/s when slow - turning gets wider as speed goes up" });
SkateboardObbyPlayerController.attributes.add("turnSpeedHigh", { type: "number", default: 210, title: "Turn Speed (fast)", description: "deg/s at max speed" });
SkateboardObbyPlayerController.attributes.add("sideTurnMultiplier", { type: "number", default: 1.4, title: "A/D Turn Multiplier", description: "Extra turn speed while A/D (joystick sideways) is held" });
SkateboardObbyPlayerController.attributes.add("quickTurnAngle", { type: "number", default: 100, title: "Quick Turn Angle", description: "If the wanted direction is more than this many degrees away, the board kick-turns fast" });
SkateboardObbyPlayerController.attributes.add("quickTurnSpeed", { type: "number", default: 720, title: "Quick Turn Speed", description: "deg/s of the kick-turn" });
SkateboardObbyPlayerController.attributes.add("quickTurnSpeedLoss", { type: "number", default: 3, title: "Quick Turn Speed Loss", description: "Fraction of speed lost per second while kick-turning" });
SkateboardObbyPlayerController.attributes.add("carveSpeedLoss", { type: "number", default: 6, title: "Carve Speed Loss", description: "Speed lost per second in sharp turns" });
SkateboardObbyPlayerController.attributes.add("airControl", { type: "number", default: 1, title: "Air Turn Control", description: "Turn speed in the air compared to the ground (1 = same)", min: 0, max: 2 });
SkateboardObbyPlayerController.attributes.add("airSteer", { type: "number", default: 5, title: "Air Steer", description: "How fast the movement direction follows the board in the air (higher = more control)" });
SkateboardObbyPlayerController.attributes.add("airAcceleration", { type: "number", default: 14, title: "Air Acceleration", description: "Lets you drift forward in the air, e.g. after a standing jump" });
SkateboardObbyPlayerController.attributes.add("airMaxSpeed", { type: "number", default: 10, title: "Air Max Speed", description: "Air acceleration only works below this speed" });
SkateboardObbyPlayerController.attributes.add("extraGravity", { type: "number", default: 30, title: "Extra Gravity" });
SkateboardObbyPlayerController.attributes.add("boostImpulse", { type: "number", default: 12, title: "Boost Impulse" });
SkateboardObbyPlayerController.attributes.add("boostMaxSpeed", { type: "number", default: 32, title: "Boost Max Speed" });
SkateboardObbyPlayerController.attributes.add("boostDuration", { type: "number", default: 1.5, title: "Boost Duration" });
SkateboardObbyPlayerController.attributes.add("boostCooldown", { type: "number", default: 4, title: "Boost Cooldown" });
SkateboardObbyPlayerController.attributes.add("speedDisplayMultiplier", { type: "number", default: 3, title: "HUD Speed Multiplier", description: "HUD shows speed * this value" });
SkateboardObbyPlayerController.attributes.add("cameraFollow", { type: "number", default: 0, title: "Camera Auto Follow", description: "How fast the camera swings behind the board (0 = off, the player steers with the camera)" });
SkateboardObbyPlayerController.attributes.add("turnAnimRate", { type: "number", default: 35, title: "Turn Anim Rate", description: "Turning faster than this (deg/s) switches from Push to the Carve blend (Move <-> Turn_L / Turn_R); stops below half of it" });
SkateboardObbyPlayerController.attributes.add("sideLean", { type: "number", default: 0.7, min: 0, max: 1, title: "A/D Lean", description: "Carve lean while A/D (joystick sideways) is held, 0..1 (1 = full Turn_L / Turn_R pose)" });
SkateboardObbyPlayerController.attributes.add("turnFullRate", { type: "number", default: 200, title: "Turn Full Lean Rate", description: "Turn rate (deg/s) that plays the full Turn_L / Turn_R pose; slower turns blend it with Move" });
SkateboardObbyPlayerController.attributes.add("leanAngle", { type: "number", default: 0, title: "Extra Code Lean", description: "Extra lean added by code on top of the Turn animations (0 = off, the animations do the lean)" });
SkateboardObbyPlayerController.attributes.add("deathHeight", { type: "number", default: 0, title: "Death Height", description: "Going below this Y starts the fall animation, then the character shatters (the only fall check)" });
SkateboardObbyPlayerController.attributes.add("fallAnimTime", { type: "number", default: 1.3, title: "Fall Anim Time", description: "Seconds of Ch_Fall before the character shatters" });
SkateboardObbyPlayerController.attributes.add("respawnGuardTime", { type: "number", default: 0.5, title: "Respawn Guard", description: "Seconds after a respawn in which deaths other than falling below Death Height (R / Reset, playerDie events) are ignored. Safety net only, it never blocks a real fall" });
SkateboardObbyPlayerController.attributes.add("shatterForce", { type: "number", default: 4, title: "Shatter Force" });
SkateboardObbyPlayerController.attributes.add("skidMinSpeed", { type: "number", default: 6, title: "Skid Min Speed", description: "Skid marks appear above this speed" });
SkateboardObbyPlayerController.attributes.add("skidTurnRate", { type: "number", default: 140, title: "Skid Turn Rate", description: "Turning faster than this (deg/s) leaves skid marks" });
SkateboardObbyPlayerController.attributes.add("skidLife", { type: "number", default: 3, title: "Skid Mark Life", description: "Seconds before a skid mark fades out" });
SkateboardObbyPlayerController.attributes.add("slipperyTurn", { type: "number", default: 0.15, title: "Slippery: Steering", description: "Turn speed on a slippery puddle (1 = normal)" });
SkateboardObbyPlayerController.attributes.add("slipperyPush", { type: "number", default: 0.25, title: "Slippery: Push", description: "Push power on a slippery puddle (1 = normal)" });
SkateboardObbyPlayerController.attributes.add("stickyMaxSpeed", { type: "number", default: 4, title: "Sticky: Max Speed" });
SkateboardObbyPlayerController.attributes.add("stickyDecel", { type: "number", default: 60, title: "Sticky: Slow Down", description: "How fast the goo takes the speed away (units/s per s)" });
SkateboardObbyPlayerController.attributes.add("stickyJump", { type: "number", default: 0.5, title: "Sticky: Ollie Power", description: "Ollie power in the goo (1 = normal)" });
SkateboardObbyPlayerController.attributes.add("grindMinSpeed", { type: "number", default: 9, title: "Grind: Min Speed" });
SkateboardObbyPlayerController.attributes.add("grindFriction", { type: "number", default: 1.5, title: "Grind: Friction", description: "Speed lost per second on the rail" });
SkateboardObbyPlayerController.attributes.add("loopGravity", { type: "number", default: 10, title: "Loop: Gravity", description: "Speed lost going up the loop (higher = needs more entry speed)" });
SkateboardObbyPlayerController.attributes.add("loopMinSpeed", { type: "number", default: 3, title: "Loop: Min Speed", description: "Below this speed in the loop the board slides back down" });

SkateboardObbyPlayerController.DEATH_FALL = "fall (below deathHeight)";
SkateboardObbyPlayerController.TRICKS = ["Trick_Kickflip", "Trick_TreFlip", "Trick_Shuvit360", "Trick_FS360", "Trick_IndyGrab",
    "Trick_Heelflip", "Trick_DoubleKickflip", "Trick_Hardflip", "Trick_LaserFlip", "Trick_NoseGrab", "Trick_TailGrab"];
// grind rail: one of these is picked at random each time the board lands on a rail
SkateboardObbyPlayerController.GRINDS = ["Grind", "Grind_5050", "Grind_5_0", "Grind_Nosegrind", "Grind_Crooked", "Grind_Feeble",
    "Grind_Smith", "Slide_Boardslide", "Slide_Noseslide", "Slide_Tailslide"];

/*
 * TEMPORARY animation fix.
 * Some skate clips were exported with the "BodyRig" bone (upper body root) rotated ~160-180 deg
 * relative to the model's rest pose (bone roll / rest pose mismatch in the export). In those clips the
 * upper body faces backwards or upside down. Until the clips are re-exported we rotate the BodyRig keys
 * back by a constant offset. The fix only touches clips whose first BodyRig key is far from the rest pose,
 * so it switches itself off automatically once the corrected animations are uploaded.
 */
var SkateboardObby_AnimFix = {
    REST: new pc.Quat().setFromEulerAngles(-91.1663, 171.315, 0.0026464),
    // constant local offsets found in the broken clips (q_fixed = q_broken * offset)
    OFFSETS: [
        new pc.Quat(0, -0.0201560201, 0.9900630297, 0.1391726924),   // JumpStart / InAir / JumpLand / Turn / tricks / Celebrate
        new pc.Quat(0.1391726632, -0.9902681279, 0, -0.0000228997),   // Move / Fall / Grind
        new pc.Quat(1, 0, 0, 0)                                         // Grind_* / Slide_* (2026-10-27 FBX): 180 deg about X
    ],
    angle: function (a, b) {
        return 2 * Math.acos(Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w))) * pc.math.RAD_TO_DEG;
    },
    // Height fix (same temporary idea), measured in game on the 2026-10-27 clips: feet on the deck, wheels on the
    // ground, trucks / deck on the rail top (the game puts the feet origin there). Per state:
    // [first Board key z, first Body.001 key z, Board down, skater (Body.001 + BodyRig) down (negative = up),
    //  optional: Board sideways, skater sideways (Armature x = across the rail),
    //  skater turn (deg about Armature z = up) around pivot x, y (so the feet stand along a turned board)], metres,
    // children of Armature.001 (local z = up). Only applied while the clip still has the measured first keys.
    HEIGHT: {
        Idle: [0.25, 1.413, 0, 0.17],              // feet 15 cm above the deck
        Move: [0.41, 1.257, 0.16, 0],              // board 16 cm above the ground
        Turn_L: [0.247, 1.235, 0, -0.035],
        Turn_R: [0.247, 1.207, 0, -0.035],
        Grind: [0.959, 1.955, 0.76, 0.76],         // rail clips: animated on a ~0.76 m rail
        Grind_5050: [0.959, 1.413, 0.76, 0.23],
        // grind / slide clips: the board turns under the skater but the legs do not (slides: feet across the board's width)
        Grind_5_0: [1.069, 2.047, 0.76, 0.74, 0, 0, -6.6, 0.032, 0.031],
        Grind_Nosegrind: [1.069, 1.413, 0.76, 0.17, 0, 0, 14.0, 0.044, -0.187],
        Grind_Crooked: [1.033, 1.413, 0.76, 0.32, 0.09, 0.09, 23.8, -0.310, 0.274],
        Grind_Feeble: [0.899, 1.744, 0.76, 0.71, -0.1, -0.1, 11.7, -0.384, 1.040],
        Grind_Smith: [0.878, 1.413, 0.76, 0.34, 0.1, 0.1, -10.1, 0.078, 0.323],
        Slide_Boardslide: [0.792, 1.413, 0.76, 0.39, 0, 0, 93.0, -0.001, 0.058],
        Slide_Noseslide: [0.672, 1.656, 0.63, 0.62, 0.95, 0.95, 88.4, 0.061, 0.164],   // skater + board were ~0.9 m beside the rail
        Slide_Tailslide: [0.672, 1.663, 0.64, 0.62, -0.85, 0, 97.3, 0.012, 0.008],     // board was 0.85 m beside the skater
        Finisher: [0.41, 1.413, 0.16, 0.16]                                    // finish jump trick: whole pose 16 cm above the ground
    },
    fixHeight: function (track, state) {
        const h = this.HEIGHT[state];
        if (!h || !track || track === pc.AnimTrack.EMPTY || track.__skateHeightFixed) return;
        track.__skateHeightFixed = true;
        const pos = function (bone) {
            return track.curves.find(c => {
                const path = c.paths[0];
                return path.entityPath[path.entityPath.length - 1] === bone && path.propertyPath[0] === "localPosition";
            });
        };
        const board = pos("Board"), hip = pos("Body.001"), rig = pos("BodyRig");
        if (!board || !hip || !rig) return;
        if (Math.abs(track.outputs[board.output].data[2] - h[0]) > 0.005 || Math.abs(track.outputs[hip.output].data[2] - h[1]) > 0.005) return;
        const move = function (c, axis, d) {
            const data = track.outputs[c.output].data;
            for (let k = axis; k < data.length; k += 3) data[k] += d;
        };
        const skater = function (axis, d) {
            move(hip, axis, d);
            if (rig.output !== hip.output) move(rig, axis, d);
        };
        if (h[2]) move(board, 2, -h[2]);
        if (h[3]) skater(2, -h[3]);
        if (h[4]) move(board, 0, h[4]);
        if (h[5]) skater(0, h[5]);
        if (h[6]) {
            const c = Math.cos(h[6] * pc.math.DEG_TO_RAD), s = Math.sin(h[6] * pc.math.DEG_TO_RAD);
            const turn = new pc.Quat().setFromAxisAngle(new pc.Vec3(0, 0, 1), h[6]);
            const q = new pc.Quat();
            const rot = function (bone) {
                return track.curves.find(cv => {
                    const path = cv.paths[0];
                    return path.entityPath[path.entityPath.length - 1] === bone && path.propertyPath[0] === "localRotation";
                });
            };
            const done = [];
            for (const [p, r] of [[hip, rot("Body.001")], [rig, rot("BodyRig")]]) {
                if (done.indexOf("p" + p.output) < 0) {
                    done.push("p" + p.output);
                    const d = track.outputs[p.output].data;
                    for (let k = 0; k < d.length; k += 3) {
                        const x = d[k] - h[7], y = d[k + 1] - h[8];
                        d[k] = h[7] + c * x - s * y;
                        d[k + 1] = h[8] + s * x + c * y;
                    }
                }
                if (r && done.indexOf("r" + r.output) < 0) {
                    done.push("r" + r.output);
                    const d = track.outputs[r.output].data;
                    for (let k = 0; k < d.length; k += 4) {
                        q.set(d[k], d[k + 1], d[k + 2], d[k + 3]).mul2(turn, q);
                        d[k] = q.x; d[k + 1] = q.y; d[k + 2] = q.z; d[k + 3] = q.w;
                    }
                }
            }
        }
        console.warn("[SkateboardObby] clip height fixed (board " + h[2] + " m, skater " + h[3] + " m" +
            (h[4] || h[5] ? ", sideways " + (h[4] || 0) + " / " + (h[5] || 0) + " m" : "") + (h[6] ? ", skater turned " + h[6] + " deg" : "") + "):", state);
    },
    apply: function (animComponent) {
        const layer = animComponent && animComponent.baseLayer;
        if (!layer || !layer._controller) return;
        const states = layer._controller._states;
        const q = new pc.Quat();
        for (const name in states) {
            const list = states[name]._animationList || [];
            for (let i = 0; i < list.length; i++) {
                const track = list[i].animTrack;
                if (!track || track.__skateBodyRigFixed) continue;
                track.__skateBodyRigFixed = true;
                const curve = track.curves.find(c => {
                    const path = c.paths[0];
                    return path.entityPath[path.entityPath.length - 1] === "BodyRig" && path.propertyPath[0] === "localRotation";
                });
                if (!curve) continue;
                const data = track.outputs[curve.output].data;
                q.set(data[0], data[1], data[2], data[3]);
                if (this.angle(q, this.REST) < 90) continue; // clip is fine
                // pick the offset that brings the first key back near the rest pose
                let best = null, bestAngle = 1e9;
                for (const off of this.OFFSETS) {
                    const a = this.angle(q.clone().mul(off), this.REST);
                    if (a < bestAngle) { bestAngle = a; best = off; }
                }
                if (!best || bestAngle > 60) continue;
                for (let k = 0; k < data.length; k += 4) {
                    q.set(data[k], data[k + 1], data[k + 2], data[k + 3]).mul(best);
                    data[k] = q.x; data[k + 1] = q.y; data[k + 2] = q.z; data[k + 3] = q.w;
                }
                console.warn("[SkateboardObby] fixed BodyRig rotation in clip:", name);
            }
        }
        // heights / sideways / turns after the BodyRig fix: a turned skater no longer matches the BodyRig test
        for (const name in states) {
            const list = states[name]._animationList || [];
            for (let i = 0; i < list.length; i++) this.fixHeight(list[i].animTrack, name);
        }
    }
};

/*
 * Shared by the local and remote skaters: which Turn clip to play.
 * dir: 1 = Turn_L, -1 = Turn_R, 0 = none. Starts above onRate deg/s, stops below half of it.
 */
var SkateboardObby_TurnDir = function (dir, rate, onRate, allowed) {
    if (!allowed) return 0;
    const off = onRate * 0.5;
    if (dir > 0 && rate >= off) return 1;
    if (dir < 0 && rate <= -off) return -1;
    if (rate > onRate) return 1;
    if (rate < -onRate) return -1;
    return 0;
};

/*
 * Finish jump trick ("Finisher" clip, 2026-10-28 FBX), shared by the local and remote skaters. The 5 s clip: crouch
 * 0-0.7 s, flip with the board 0.75-2.25 s, board held up 2.75-4.5 s, back in the riding pose at 5 s. It is stretched
 * to the flight time. Network: the "anim" field carries "Finisher_<flight time in tenths of a second>", so remote
 * players play it at the same speed (server unchanged).
 */
var SkateboardObby_Finisher = {
    STATE: "Finisher",
    // one-shots that may cut the finisher short (the landing, a death, a new finisher); the others are ignored while it
    // plays (Stumble from the scripted flight velocity, Slip, vert grabs)
    REPLACED_BY: ["Finisher", "Celebrate", "JumpLand", "Fall"],
    // clip length in seconds, 0 while the clip is not loaded
    length: function (layer) {
        const state = layer && layer._controller && layer._controller._findState(this.STATE);
        const a = state && state._animationList[0];
        return a && a.animTrack && a.animTrack !== pc.AnimTrack.EMPTY ? a.animTrack.duration : 0;
    },
    // right after the transition into the state: play the whole clip in duration seconds
    // (the engine takes the clip speed from the animation, not from the state)
    fit: function (layer, duration) {
        const length = this.length(layer);
        const clip = length > 0 && duration > 0 ? layer._controller._animEvaluator.findClip(this.STATE) : null;
        if (clip) clip.speed = pc.math.clamp(length / duration, 0.25, 4);
    },
    netName: function (duration) {
        return this.STATE + "_" + Math.max(1, Math.round(duration * 10));
    },
    // flight time from the network name, 0 if it is not a finisher
    netDuration: function (anim) {
        if (!anim || anim.indexOf(this.STATE + "_") !== 0) return 0;
        return (parseInt(anim.slice(this.STATE.length + 1), 10) || 0) / 10;
    }
};

/*
 * "Carve" blend tree, built at runtime from the Move / Turn_L / Turn_R clips of the anim component
 * (the editor state graph has no blend trees). The float parameter "turn" (-1..1) mixes them:
 * -1 = Turn_R, 0 = Move, +1 = Turn_L, so a small turn only leans a little.
 * Returns true when the state is ready (the clips may still be loading).
 */
var SkateboardObby_Carve = function (anim) {
    const layer = anim && anim.baseLayer;
    const C = layer && layer._controller;
    if (!C) return false;
    if (C._findState("Carve")) return true;
    const track = function (name) {
        const s = C._findState(name);
        const a = s && s._animationList[0];
        return a && a.animTrack && a.animTrack !== pc.AnimTrack.EMPTY ? a.animTrack : null;
    };
    const tMove = track("Move"), tL = track("Turn_L"), tR = track("Turn_R");
    if (!tMove || !tL || !tR) return false;
    if (!anim._parameters.turn) anim._parameters.turn = { type: pc.ANIM_PARAMETER_FLOAT, value: 0 };
    const AnimState = C._findState("Move").constructor;
    C._states.Carve = new AnimState(C, "Carve", 1, true, {
        type: pc.ANIM_BLEND_1D, parameter: "turn", syncAnimations: false,
        children: [{ name: "Turn_R", point: -1 }, { name: "Move", point: 0 }, { name: "Turn_L", point: 1 }]
    });
    C._stateNames.push("Carve");
    C.assignAnimation("Carve.Turn_R", tR);
    C.assignAnimation("Carve.Move", tMove);
    C.assignAnimation("Carve.Turn_L", tL);
    return true;
};

/*
 * Shatter: breaks the skinned skate character (and board) into physics pieces,
 * cut from its own mesh in its current pose, so the pieces keep the character's own textures
 * and appear exactly where the character is. One piece per bone (wheels stay with their truck);
 * all materials of a bone stay in the same piece (e.g. the face decal stays on the head).
 */
var SkateboardObby_Shatter = {
    // bones that are merged into another piece
    MERGE: { "Wheel_FL": "Truck_F", "Wheel_FR": "Truck_F", "Wheel_BL": "Truck_B", "Wheel_BR": "Truck_B", "BodyRig": "Body" },

    explode: function (app, skinRoot, options = {}) {
        const force = options.force != null ? options.force : 4;
        const inherit = options.velocity || new pc.Vec3();
        const lifetime = options.lifetime || 0;
        const container = new pc.Entity("SkateShatter");
        app.root.addChild(container);

        const renders = skinRoot.findComponents("render");
        const pieces = {};
        const v = new pc.Vec3(), tmp = new pc.Vec3(), nrm = new pc.Vec3();
        const center = new pc.Vec3(); let centerCount = 0;

        for (const render of renders) {
            if (!render.enabled || !render.entity.enabled) continue;
            for (const mi of render.meshInstances) {
                const skinInst = mi.skinInstance;
                const mesh = mi.mesh;
                const vcount = mesh.vertexBuffer.numVertices;
                const pos = new Float32Array(vcount * 3);
                const nor = new Float32Array(vcount * 3);
                const uv = new Float32Array(vcount * 2);
                const idx = [];
                mesh.getPositions(pos);
                const hasN = mesh.getNormals(nor) > 0;
                const hasUv = mesh.getUvs(0, uv) > 0;
                mesh.getIndices(idx);

                // vertex -> world (skinned) + owning piece name
                const world = new Float32Array(vcount * 3);
                const worldN = new Float32Array(vcount * 3);
                const owner = new Array(vcount);
                if (skinInst) {
                    const bi = new Float32Array(vcount * 4), bw = new Float32Array(vcount * 4);
                    mesh.getVertexStream(pc.SEMANTIC_BLENDINDICES, bi);
                    mesh.getVertexStream(pc.SEMANTIC_BLENDWEIGHT, bw);
                    const bones = skinInst.bones, ibp = skinInst.skin.inverseBindPose;
                    const mats = bones.map((b, i) => new pc.Mat4().mul2(b.getWorldTransform(), ibp[i]));
                    for (let i = 0; i < vcount; i++) {
                        v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
                        nrm.set(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]);
                        let px = 0, py = 0, pz = 0, nx = 0, ny = 0, nz = 0, best = -1, bestW = -1;
                        for (let k = 0; k < 4; k++) {
                            const w = bw[i * 4 + k]; if (w <= 0) continue;
                            const b = bi[i * 4 + k];
                            mats[b].transformPoint(v, tmp); px += tmp.x * w; py += tmp.y * w; pz += tmp.z * w;
                            mats[b].transformVector(nrm, tmp); nx += tmp.x * w; ny += tmp.y * w; nz += tmp.z * w;
                            if (w > bestW) { bestW = w; best = b; }
                        }
                        world[i * 3] = px; world[i * 3 + 1] = py; world[i * 3 + 2] = pz;
                        worldN[i * 3] = nx; worldN[i * 3 + 1] = ny; worldN[i * 3 + 2] = nz;
                        const name = best >= 0 ? bones[best].name : render.entity.name;
                        owner[i] = this.MERGE[name] || name;
                    }
                } else {
                    const m = mi.node.getWorldTransform();
                    for (let i = 0; i < vcount; i++) {
                        v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); m.transformPoint(v, tmp);
                        world[i * 3] = tmp.x; world[i * 3 + 1] = tmp.y; world[i * 3 + 2] = tmp.z;
                        nrm.set(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]); m.transformVector(nrm, tmp);
                        worldN[i * 3] = tmp.x; worldN[i * 3 + 1] = tmp.y; worldN[i * 3 + 2] = tmp.z;
                        owner[i] = render.entity.name;
                    }
                }

                // triangles -> pieces (by the owner of the first vertex), one sub mesh per material
                for (let t = 0; t < idx.length; t += 3) {
                    const pieceName = owner[idx[t]];
                    let piece = pieces[pieceName];
                    if (!piece) piece = pieces[pieceName] = { subs: new Map() };
                    let sub = piece.subs.get(mi);
                    if (!sub) { sub = { material: mi.material, remap: new Map(), pos: [], nor: [], uv: [], ind: [], hasN, hasUv }; piece.subs.set(mi, sub); }
                    for (let k = 0; k < 3; k++) {
                        const vi = idx[t + k];
                        let ni = sub.remap.get(vi);
                        if (ni === undefined) {
                            ni = sub.pos.length / 3; sub.remap.set(vi, ni);
                            sub.pos.push(world[vi * 3], world[vi * 3 + 1], world[vi * 3 + 2]);
                            sub.nor.push(worldN[vi * 3], worldN[vi * 3 + 1], worldN[vi * 3 + 2]);
                            sub.uv.push(uv[vi * 2], uv[vi * 2 + 1]);
                            center.x += world[vi * 3]; center.y += world[vi * 3 + 1]; center.z += world[vi * 3 + 2]; centerCount++;
                        }
                        sub.ind.push(ni);
                    }
                }
            }
        }
        if (centerCount > 0) center.mulScalar(1 / centerCount);

        const device = app.graphicsDevice;
        for (const name in pieces) {
            const subs = Array.from(pieces[name].subs.values());
            const min = new pc.Vec3(1e9, 1e9, 1e9), max = new pc.Vec3(-1e9, -1e9, -1e9);
            for (const sub of subs) {
                for (let i = 0; i < sub.pos.length; i += 3) {
                    min.x = Math.min(min.x, sub.pos[i]); min.y = Math.min(min.y, sub.pos[i + 1]); min.z = Math.min(min.z, sub.pos[i + 2]);
                    max.x = Math.max(max.x, sub.pos[i]); max.y = Math.max(max.y, sub.pos[i + 1]); max.z = Math.max(max.z, sub.pos[i + 2]);
                }
            }
            const mid = new pc.Vec3().add2(min, max).mulScalar(0.5);

            const meshInstances = subs.map((sub) => {
                for (let i = 0; i < sub.pos.length; i += 3) { sub.pos[i] -= mid.x; sub.pos[i + 1] -= mid.y; sub.pos[i + 2] -= mid.z; }
                const mesh = new pc.Mesh(device);
                mesh.setPositions(sub.pos);
                if (sub.hasN) mesh.setNormals(sub.nor);
                if (sub.hasUv) mesh.setUvs(0, sub.uv);
                mesh.setIndices(sub.ind);
                mesh.update();
                return new pc.MeshInstance(mesh, sub.material);
            });

            const e = new pc.Entity("Piece_" + name);
            container.addChild(e);
            e.setPosition(mid);
            e.addComponent("render", { meshInstances: meshInstances, castShadows: true });
            const half = new pc.Vec3().sub2(max, min).mulScalar(0.5);
            half.set(Math.max(half.x, 0.06), Math.max(half.y, 0.06), Math.max(half.z, 0.06));
            e.addComponent("collision", { type: "box", halfExtents: half });
            e.addComponent("rigidbody", { type: "dynamic", mass: 1, friction: 0.6, restitution: 0.25, linearDamping: 0.1, angularDamping: 0.2 });

            const dir = new pc.Vec3().sub2(mid, center);
            if (dir.lengthSq() < 0.0001) dir.set(0, 1, 0);
            dir.normalize();
            const vel = dir.mulScalar(force * pc.math.random(0.6, 1.2)).add(new pc.Vec3(0, force * 0.6, 0)).add(inherit);
            e.rigidbody.linearVelocity = vel;
            e.rigidbody.angularVelocity = new pc.Vec3(pc.math.random(-8, 8), pc.math.random(-8, 8), pc.math.random(-8, 8));
        }

        if (lifetime > 0) setTimeout(() => { if (!container._destroyed) container.destroy(); }, lifetime * 1000);
        return container;
    }
};

/*
 * Skid marks: dark fading strips left by the back wheels while drifting (sharp turns / kick-turns).
 */
var SkateboardObby_SkidMarks = function (app, options = {}) {
    this.app = app;
    this.life = options.life || 3;
    this.width = options.width || 0.12;
    this.alpha = options.alpha != null ? options.alpha : 0.55;
    this.max = options.max || 300;
    this.pool = [];
    this.next = 0;
    this._mid = new pc.Vec3();
    this._aim = new pc.Vec3();

    const mat = new pc.StandardMaterial();
    mat.diffuse.set(0, 0, 0);
    mat.useLighting = false;
    mat.opacity = this.alpha;
    mat.blendType = pc.BLEND_NORMAL;
    mat.depthWrite = false;
    mat.cull = pc.CULLFACE_NONE;
    mat.update();
    this.material = mat;

    const mesh = new pc.Mesh(app.graphicsDevice);
    mesh.setPositions([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5]);
    mesh.setNormals([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
    mesh.setIndices([0, 2, 1, 0, 3, 2]);
    mesh.update();
    this.mesh = mesh;

    this.root = new pc.Entity("SkidMarks");
    app.root.addChild(this.root);
};

SkateboardObby_SkidMarks.prototype.emit = function (from, to, normal) {
    const len = from.distance(to);
    if (len < 0.01) return;
    let mark = this.pool[this.next];
    if (!mark) {
        const e = new pc.Entity("Skid");
        const mi = new pc.MeshInstance(this.mesh, this.material);
        e.addComponent("render", { meshInstances: [mi], castShadows: false, receiveShadows: false });
        this.root.addChild(e);
        mark = this.pool[this.next] = { entity: e, mi: mi, age: 0 };
    }
    this.next = (this.next + 1) % this.max;

    const mid = this._mid.add2(from, to).mulScalar(0.5);
    mid.x += normal.x * 0.02;
    mid.y += normal.y * 0.02;
    mid.z += normal.z * 0.02;
    mark.entity.enabled = true;
    mark.entity.setPosition(mid);
    mark.entity.lookAt(this._aim.sub2(to, from).add(mid), normal);
    mark.entity.setLocalScale(this.width, 1, len + 0.1);
    mark.age = 0;
    mark.mi.setParameter("material_opacity", this.alpha);
};

SkateboardObby_SkidMarks.prototype.update = function (dt) {
    for (let i = 0; i < this.pool.length; i++) {
        const mark = this.pool[i];
        if (!mark || !mark.entity.enabled) continue;
        mark.age += dt;
        if (mark.age >= this.life) { mark.entity.enabled = false; continue; }
        mark.mi.setParameter("material_opacity", this.alpha * (1 - mark.age / this.life));
    }
};

SkateboardObby_SkidMarks.prototype.destroy = function () {
    this.root.destroy();
};

SkateboardObbyPlayerController.prototype.initialize = function () {
    this.app.skateboardObbyPlayerController = this;

    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.playerRendererEntity = this.body.findByName("Skin");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    this.confettiParticle = this.entity.findByName("ConfettiParticle").particlesystem;
    this.boostParticle = this.entity.findByName("Sparks");
    this.vipLabel = this.entity.findByName("VipLabel");
    this.usernameEntity = this.entity.findByName("Username");
    this.usernameColor = this.usernameEntity && this.usernameEntity.element ? this.usernameEntity.element.color.clone() : new pc.Color(1, 1, 1, 1);

    this.setCamera();

    // movement state
    this._contactNormal = new pc.Vec3(0, 1, 0);
    this._quatLerp = new pc.Quat();
    this._desiredVelocity = new pc.Vec3();
    this._carpetVelocity = new pc.Vec3();
    this._inputDir = new pc.Vec3();
    this._heading = new pc.Vec3(0, 0, 1);
    this._headingPlane = new pc.Vec3(0, 0, 1);
    this._tmpQuat = new pc.Quat();
    this._alignQuat = new pc.Quat();
    this._bodyQuat = new pc.Quat();
    this._desiredAngle = 0;

    this.headingDeg = 0;
    this.speed = 0;
    this._lastCommandedSpeed = 0;
    this._lastCmdDir = new pc.Vec3(0, 0, 1);
    this._surface = null;
    this._slipTimer = 0;
    this._ride = null;
    this._rideCooldown = 0;
    this.turnAmount = 0;
    this.lean = 0;
    this.isPushing = false;
    this.isBraking = false;
    this.grounded = false;
    this.maxLinearVelocity = this.maxSpeed;

    this._requestedJump = false;
    this._throttle = 0;
    this._steer = 0;
    this._side = 0;
    this._brakeKey = false;
    this._forceBrake = false;
    this._jumped = false;
    this._timeSinceLastJump = 10;
    this._timeSinceLastGrounded = 0;
    this._airTime = 0;

    this.boostTimer = 0;
    this.boostCooldownTimer = 0;
    this._lastCameraInputTime = -10;
    this._time = 0;

    this.app.skateSpeed = 0;
    this.app.skateBoost = { cooldown: 0, cooldownMax: this.boostCooldown, active: false };

    this._animComponent = this.body.anim;
    this.animLayer = this._animComponent.baseLayer;
    SkateboardObby_AnimFix.apply(this._animComponent);
    this._animState = null;
    this._oneShotState = null;
    this._oneShotTimer = 0;

    this.sendPositionInterval = setInterval(this.sendPosition.bind(this), 100);
    this.follower = this.entity.findByName("Follower");
    this.rayPoint = this.entity.findByName("RayPoint");
    this.rayGround = this.entity.findByName("RayGround");
    this.respawn();
    this.entityScale = 1;
    this.app.canJump = true;

    let body = this.entity.rigidbody.body;
    body.setCcdMotionThreshold(0.5);
    body.setCcdSweptSphereRadius(0.3);
    // the board should glide, the controller handles all friction
    this.entity.rigidbody.friction = 0;
    this.entity.rigidbody.restitution = 0;

    this.team = null;

    this.app.playerPush = {
        active: false,
        direction: new pc.Vec3(0, 0, 0),
        velocity: new pc.Vec3(0, 0, 0),
        power: 5,
        acceleration: 60,
        rampUpTime: 0.6,
        rampDownTime: 0.35,
        strength: 0,
    };

    this.app.playerBounce = {
        power: 20,
        canBounce: true,
        velocity: null,
        curve: 0,

        bounce: (direction = new pc.Vec3(0, 1, 0), power = 1, curveTime = .5) => {
            if (this.app.playerBounce.canBounce == false) return;
            this.app.playerBounce.canBounce = false;
            setTimeout(() => { this.app.playerBounce.canBounce = true; }, 250);

            this.app.playerBounce.velocity = direction.clone().mulScalar(power * this.app.playerBounce.power);
            this.app.playerBounce.curve = curveTime;
        },
    };

    // camera auto follow pauses while the player looks around
    this._onCameraInput = () => { this._lastCameraInputTime = this._time; };
    this.app.mouse.on("mousemove", this._onCameraInput, this);
    if (this.app.touch) { this.app.touch.on("touchmove", this._onCameraInput, this); }

    this.app.on("lockCamera", this.lockCamera, this);
    this.app.on("playerDie", this.died, this);
    this.app.on("resetGame", this.resetGame, this);
    this.app.on("teleportToCheckpoint", this.teleport, this);
    this.app.on("skate:boost", this.boost, this);
    this.app.on("skate:finisher", this.onFinisherEvent, this);

    // skid marks from the back wheels while drifting
    this.skid = new SkateboardObby_SkidMarks(this.app, { life: this.skidLife });
    this.skidWheels = ["Wheel_BL", "Wheel_BR"].map(n => this.body.findByName(n)).filter(w => !!w);
    this._skidLast = this.skidWheels.map(() => null);
    this.skidding = false;   // true while skidding (lets go 0.15 s late: the turn rate hovers around its threshold), "skate:skid" (true / false) fires when it changes
    this._skidHold = 0;

    this.on('destroy', () => {
        clearInterval(this.sendPositionInterval);
        this.app.mouse.off("mousemove", this._onCameraInput, this);
        if (this.app.touch) { this.app.touch.off("touchmove", this._onCameraInput, this); }
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("playerDie", this.died, this);
        this.app.off("resetGame", this.resetGame, this);
        this.app.off("teleportToCheckpoint", this.teleport, this);
        this.app.off("skate:boost", this.boost, this);
        this.app.off("skate:finisher", this.onFinisherEvent, this);
        if (this.skid) this.skid.destroy();
    }, this);
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.canMove = function () {
    return this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false &&
        this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled &&
        !(this.app.numpad && this.app.numpad.enabled) && !this.app.inCutscene && !this._falling;
};

SkateboardObbyPlayerController.prototype.wrapAngle = function (a) {
    a = a % 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return a;
};

SkateboardObbyPlayerController.prototype.moveTowards = function (current, target, maxDelta) {
    if (current < target) { return Math.min(target, current + maxDelta); }
    if (current > target) { return Math.max(target, current - maxDelta); }
    return current;
};

SkateboardObbyPlayerController.prototype.currentMaxSpeed = function () {
    return this.boostTimer > 0 ? this.boostMaxSpeed : this.maxSpeed;
};

SkateboardObbyPlayerController.prototype.stopMovement = function () {
    const kb = this.app.keyboard;
    if (kb) {
        kb._keymap = {};
        kb._lastmap = {};
        kb._pressed = {};
        kb._released = {};
    }
    this._inputDir.set(0, 0, 0);
    this._desiredVelocity.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);
    // only the input is cut (menus/pause): the board keeps its speed and rolls to a stop on its own
};

// brake the board to a stop (Slow anim + skid marks), e.g. on the VIP stand. Ends by itself below 0.5 m/s.
SkateboardObbyPlayerController.prototype.brakeToStop = function () {
    this._forceBrake = true;
};

// ---------------------------------------------------------------------------
// input
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.readInput = function () {
    this._throttle = 0;
    this._brakeKey = false;
    this._requestedJump = false;
    this._inputDir.set(0, 0, 0);
    this._carpetVelocity.set(0, 0, 0);
    this._sideInput = 0;

    if (!this.canMove()) return;

    // forward = where the camera looks; W/A/D (or the joystick) give a direction relative to it
    const camForward = this.camera.forward.clone();
    camForward.y = 0;
    camForward.normalize();
    const camRight = this.camera.right.clone();
    camRight.y = 0;
    camRight.normalize();

    let fwd = 0, side = 0;
    if (this.app.isMobile) {
        const joystick = window.touchJoypad.sticks['joystick0'];
        const jx = joystick.x || 0;
        const jy = joystick.y || 0;
        fwd = jy;
        side = jx;
        if (window.touchJoypad.buttons.isPressed('jumpButton')) this._requestedJump = true;
        if (window.touchJoypad.buttons.wasPressed('boostButton')) this.boost();
    } else {
        const kb = this.app.keyboard;
        if (kb.isPressed(pc.KEY_W) || kb.isPressed(pc.KEY_UP)) fwd += 1;
        if (kb.isPressed(pc.KEY_A) || kb.isPressed(pc.KEY_LEFT)) side -= 1;
        if (kb.isPressed(pc.KEY_D) || kb.isPressed(pc.KEY_RIGHT)) side += 1;
        if (kb.isPressed(pc.KEY_S) || kb.isPressed(pc.KEY_DOWN)) fwd -= 1;
        if (kb.isPressed(pc.KEY_SPACE)) this._requestedJump = true;
        if (kb.wasPressed(pc.KEY_Q)) this.boost();
    }

    if (!this._brakeKey) {
        this._inputDir.add(camForward.mulScalar(fwd)).add(camRight.mulScalar(side));
        if (this._inputDir.lengthSq() > 1) this._inputDir.normalize();
    }
    this._throttle = this._inputDir.length();
    this._side = Math.abs(side);
    this._sideInput = pc.math.clamp(side, -1, 1); // A = -1, D = +1 (joystick: analog)

    this._carpetVelocity.copy(this._inputDir);
    if (this._requestedJump) this._carpetVelocity.y += 1;

    if (this._throttle > 0 || this._brakeKey || this._requestedJump) this.sdkGamePlayStart();
};

// ---------------------------------------------------------------------------
// ground check
// ---------------------------------------------------------------------------

// a ray hit counts as ground only on a Ground-tagged surface that is not too steep (walls, side faces of ramps)
// the loop is ridden on its walls and ceiling, so its steep faces still count
SkateboardObbyPlayerController.prototype.isGroundHit = function (result) {
    if (!result || !result.entity.tags.has("Ground")) return false;
    if (result.normal.y >= Math.cos(this.maxGroundAngle * pc.math.DEG_TO_RAD)) return true;
    const it = result.entity.script && result.entity.script.skateboardObbyInteractable;
    return !!(it && it.kind === "loop");
};

SkateboardObbyPlayerController.prototype.checkGround = function () {
    const rayStart = this.entity.getPosition().clone();
    const rayEnd = this.rayGround.getPosition().clone();
    const box = 0.5 * this.entityScale;
    const results = [
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(box, 0, box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(box, 0, -box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-box, 0, box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-box, 0, -box)))
    ];

    this.grounded = false;
    for (let result of results) {
        if (this.isGroundHit(result) && !(this._vert && !this._vert.exit && result.point.y > this._vert.y0)) {
            this._contactNormal.copy(result.normal);
            this._groundEnt = result.entity;
            this.grounded = true;
            break;
        }
    }

    // ground height under the center ray (flat-ground hover)
    this._groundCenterY = this.isGroundHit(results[0]) ? results[0].point.y : null;

    // just jumped: ignore the ground for a moment so the ollie can leave it
    if (this._timeSinceLastJump < 0.2) this.grounded = false;

    if (this.grounded) {
        this._timeSinceLastGrounded = 0;
        if (this._timeSinceLastJump >= 0.3) this._jumped = false;
    } else {
        this._contactNormal.set(0, 1, 0);
    }
};

// ---------------------------------------------------------------------------
// skate movement
// ---------------------------------------------------------------------------

// air gravity: Extra Gravity scaled down at low speed (Low Speed Air Gravity at 0 .. 1 at Max Speed)
SkateboardObbyPlayerController.prototype.airGravityScale = function () {
    const t = pc.math.clamp(Math.abs(this.speed - (this._rollBack || 0)) / this.maxSpeed, 0, 1);
    return pc.math.lerp(this.lowSpeedGravity, 1, t);
};

// ollie take-off speed; with Constant Ollie Height the apex is the same at every speed
SkateboardObbyPlayerController.prototype.olliePower = function () {
    if (!this.constantOllieHeight) return this.jumpHeight;
    const g0 = Math.abs(this.app.systems.rigidbody.gravity.y);
    return this.jumpHeight * Math.sqrt((g0 + this.extraGravity * this.airGravityScale()) / (g0 + this.extraGravity));
};

// flat-ground hover: lower the visual Body by the hover gap so the wheels stay on the ground (eased, back to rest in the air / on slopes)
// the surface is ridden with the hover (not pressed into it)
SkateboardObbyPlayerController.prototype.isHoverSurface = function (ny) {
    return this.flatHover && ny >= Math.cos(Math.max(this.flatHoverMaxSlope, this.hoverRampMaxSlope || 0) * pc.math.DEG_TO_RAD);
};

SkateboardObbyPlayerController.prototype.updateHoverVisual = function (dt) {
    if (!this.body) return;
    if (this._bodyBaseY == null) this._bodyBaseY = this.body.getLocalPosition().y;
    const s = this.entity.getLocalScale().y || 1;
    let gap = 0;
    if (this.hoverKeepsBoardDown && this.grounded && this._groundCenterY != null && this.isHoverSurface(this._contactNormal.y)) {
        gap = pc.math.clamp(this.entity.getPosition().y - this._groundCenterY - s - (this.rideCentreHeight(this._contactNormal.y) - this.rideCentreHeight(1)), 0, 0.1 * s);
    }
    const lp = this.body.getLocalPosition();
    const y = lp.y + (this._bodyBaseY - gap / s - lp.y) * Math.min(1, dt / 0.06);
    if (Math.abs(y - lp.y) > 0.0001) this.body.setLocalPosition(lp.x, y, lp.z);
};

// capsule centre height above a surface with normal y = ny (the bottom sphere touching it)
SkateboardObbyPlayerController.prototype.rideCentreHeight = function (ny) {
    const s = this.entity.getLocalScale().y || 1, col = this.entity.collision;
    const r = col.radius * s;
    return col.height / 2 * s - r + r / Math.max(ny, 0.5);
};

// ground safety: the board has sunk into the ground under it -> put it back on top (keeps the speed, no downward speed)
// returns true when it moved the board
SkateboardObbyPlayerController.prototype.liftOutOfGround = function () {
    const p = this.entity.getPosition(), hh = this.entity.collision.height / 2 * (this.entity.getLocalScale().y || 1);
    const h = this.app.systems.rigidbody.raycastFirst(this._gA.set(p.x, p.y + hh, p.z), this._gB.set(p.x, p.y - 2 * hh, p.z), this._groundOnly);
    if (!h || !this.isGroundHit(h)) return;
    const sink = h.point.y + this.rideCentreHeight(h.normal.y) - p.y;
    if (sink >= 0.9) return;
    if (sink <= 0.03) {
        // just jumped and a contact from below took the ollie (wrong-side contact at a thin ramp start): give it back
        const w = this.entity.rigidbody.linearVelocity;
        if (this.grounded || this._timeSinceLastJump >= 0.3 || sink < -0.3 || this._desiredVelocity.y < w.y + 3) return;
        this.entity.rigidbody.linearVelocity = this._gV.set(w.x, this._desiredVelocity.y, w.z);
        return true;
    }
    const v = this._gV.copy(this.entity.rigidbody.linearVelocity);
    if (this.grounded) {
        if (v.y < 0) v.y = 0;
    } else {
        // an ollie pushed down by a wrong-side contact gets its speed back
        if (this._timeSinceLastJump < 0.3 && this._desiredVelocity.y > v.y) v.y = this._desiredVelocity.y;
        // in the air only the motion into the surface goes (the landing still takes the speed along it)
        const vn = v.dot(h.normal);
        if (vn < 0) v.sub(this._gB.copy(h.normal).mulScalar(vn));
    }
    // a flight over a free-standing ramp goes on
    const over = this._vert && this._vert.over ? this._vert : null, arm = this._rampArm;
    this.teleportBody(this._gB.set(p.x, p.y + sink, p.z), false);
    if (over) this._vert = over;
    this._rampArm = arm;
    this.entity.rigidbody.linearVelocity = v;
    return true;
};

// ground safety: where the board will be next frame the surface changes and is higher -> lift it onto it
SkateboardObbyPlayerController.prototype.lookAheadGround = function (desired, dt) {
    const p = this.entity.getPosition(), hh = this.entity.collision.height / 2 * (this.entity.getLocalScale().y || 1);
    const x = p.x + desired.x * dt, z = p.z + desired.z * dt;
    const h = this.app.systems.rigidbody.raycastFirst(this._gA.set(x, p.y + hh, z), this._gB.set(x, p.y - 2 * hh, z), this._groundOnly);
    if (!h || !this.isGroundHit(h)) return;
    // only where the surface changes; on an even slope the glue keeps pressing as before
    if (h.normal.dot(this._contactNormal) > 0.9995 && h.normal.dot(this._vertN) > 0.9995) return;
    const gap = this.isHoverSurface(h.normal.y) ? this.rideHeight * (this.entity.getLocalScale().y || 1) - this.rideCentreHeight(1) : 0;
    const vy = (h.point.y + this.rideCentreHeight(h.normal.y) + gap - p.y) / dt;
    if (vy > desired.y && vy - desired.y < 8) desired.y = vy;
};

// swept landing guard: a ray from the body's bottom sphere along this frame's motion (+ one physics step); a ground surface
// that the capsule would go deeper into than a normal contact cuts the motion into it (the capsule arrives touching it)
SkateboardObbyPlayerController.prototype.sweepGuard = function (desired, dt) {
    const speed = desired.length();
    const T = dt + this.app.systems.rigidbody.fixedTimeStep;   // physics may run one step more than dt this frame
    if (speed * T < 0.25) return;
    if (!this._swA) {
        this._swA = new pc.Vec3(); this._swB = new pc.Vec3(); this._swN = new pc.Vec3();
        this._swOpt = { filterCollisionGroup: pc.BODYGROUP_DYNAMIC, filterCollisionMask: pc.BODYGROUP_STATIC | pc.BODYGROUP_KINEMATIC };
    }
    const s = this.entity.getLocalScale().y || 1, col = this.entity.collision;
    const r = col.radius * s;
    // the body itself, not the entity (the entity shows the interpolated pose, up to one physics step behind)
    const o = this.entity.rigidbody.body.getWorldTransform().getOrigin();
    const a = this._swA.set(o.x(), o.y() - (col.height / 2 * s - r), o.z());
    const k = (speed * T + r) / speed;
    const h = this.app.systems.rigidbody.raycastFirst(a, this._swB.set(a.x + desired.x * k, a.y + desired.y * k, a.z + desired.z * k), this._swOpt);
    if (!h) return;
    const n = this._swN.copy(h.normal);
    if (n.dot(desired) > 0) n.mulScalar(-1);
    if (!h.entity.tags.has("Ground") || n.y < Math.cos(this.maxGroundAngle * pc.math.DEG_TO_RAD)) return;
    const into = -n.dot(desired) * T;                   // motion into the surface
    const room = (a.x - h.point.x) * n.x + (a.y - h.point.y) * n.y + (a.z - h.point.z) * n.z - r;  // gap to it
    if (into <= room + 0.15) return;                    // a normal contact copes with a little penetration
    desired.add(n.mulScalar((into - Math.max(room, 0) - 0.03) / T));
};

// vert air take-off: called on the frame the board leaves a steep ramp going up
// free-standing ramps (collider tagged Vert: Over Tag): no vert air, the board jumps off the top with its own speed and lands on the
// ground ahead. Without ground ahead it comes back down the ramp like a vert air.
SkateboardObbyPlayerController.prototype.isOverRamp = function () {
    const e = this._groundEnt;
    return !!(this.vertOverTag && e && e.tags && e.tags.has(this.vertOverTag));
};

// leaving the ramp (lip, its flat top or an ollie), going up it
SkateboardObbyPlayerController.prototype.armRampOver = function (vel, ollie, hop) {
    // out of speed at the lip: it rolls back down the ramp
    if (!hop && !ollie && this.speed < 4) return;
    const n = this._vertN, ent = this._groundEnt;
    // the direction of travel, roughly up the ramp (on its flat top there is no slope to compare with)
    const hs = Math.sqrt(vel.x * vel.x + vel.z * vel.z), yaw = this.headingDeg * pc.math.DEG_TO_RAD;
    const ox = hs > 2 ? vel.x / hs : Math.sin(yaw), oz = hs > 2 ? vel.z / hs : Math.cos(yaw);
    const rb = this.app.systems.rigidbody, p = this.entity.getPosition(), s = this.entity.getLocalScale().y || 1;
    const bottom = p.y - this.entity.collision.height / 2 * s;
    // the top of the ramp ahead
    let top = -Infinity;
    for (let d = -3; d <= 8; d += 0.5) {
        const x = p.x + ox * d, z = p.z + oz * d;
        const h = rb.raycastFirst(this._vertA.set(x, p.y + 10, z), this._vertB.set(x, bottom - 1, z), this._groundOnly);
        if (h && h.entity === ent && h.point.y > top) top = h.point.y;
    }
    if (top === -Infinity) return;
    // going down it, unless that is over the crest
    if (n.y < 0.995 && ox * n.x + oz * n.z > 0.2 && top - bottom > 0.5) return;
    // rolling off a low part of it: not going over
    if (hop ? top - bottom > 1.2 : vel.y < 0.5 && top - bottom > 0.3) return;
    const big = Math.max(this.speed, vel.length()) >= this.vertMinSpeed;
    // at the lip, slow: still enough to get over it
    if (top - bottom < 1.2) {
        const g = Math.abs(rb.gravity.y) + this.extraGravity * this.airGravityScale() * (big ? this.vertGravity : 1);
        vel.y = Math.max(vel.y, Math.sqrt(2 * g * (Math.max(top - bottom, 0) + 0.4)));
    }
    this._rampArm = { top: top, big: big, t: 0, ent: ent, ollie: !!ollie };
};

// in the air after leaving the ramp: above it, jump to the ground ahead
SkateboardObbyPlayerController.prototype.updateRampOver = function (vel, dt) {
    const a = this._rampArm, p = this.entity.getPosition(), s = this.entity.getLocalScale().y || 1;
    a.t += dt;
    if (a.t > 2) { this._rampArm = null; return; }
    const bottom = p.y - this.entity.collision.height / 2 * s;
    if (bottom < a.top + 0.05) {
        // below the top: only once it has rolled off the back of the ramp (in front of it, thrown off its foot: still to come)
        const h = this.app.systems.rigidbody.raycastFirst(this._vertA.set(p.x, p.y + 1, p.z), this._vertB.set(p.x, bottom - 8, p.z), this._groundOnly);
        if (h && h.entity === a.ent) a.on = true;
        if (!a.on || (h && h.entity === a.ent)) return;
    }
    // where the board points (the physics velocity is bent upwards by the curve of the ramp)
    const yaw = this.headingDeg * pc.math.DEG_TO_RAD, ox = Math.sin(yaw), oz = Math.cos(yaw);
    this._vertO.set(ox, 0, oz);
    if (!this.vertClearOfWall()) return;
    if (bottom < a.top + 0.05) {
        // beside the ramp: the jump would push the board into it (and it would squeeze the board upwards)
        const r = this.entity.collision.radius * s, rb = this.app.systems.rigidbody;
        for (let i = -1; i <= 1; i += 2) {
            const x = p.x + oz * r * i, z = p.z - ox * r * i;
            const h = rb.raycastFirst(this._vertA.set(x, bottom + 0.3, z), this._vertB.set(x + ox * 4, bottom + 0.3, z + oz * 4));
            if (h && h.entity === a.ent) return;
        }
    }
    const u = this.rampOverJump(vel, a);
    this._rampArm = null;
    this._timeSinceLastJump = 0;     // leaving the top of the ramp, its surface is not a landing
    this._vert = { big: a.big, t: 0, T: 1, spin: 0, rate: 0, y0: p.y - 0.5 * s, exit: u > 0, narrow: false, cx: 0, cz: 0, u: u, ax: 0, az: 0, over: true, vy: vel.y };
    if (a.big && !a.ollie) this.playVertTrick(u > 0 ? this._rampFlight : 0.6);
};

// the jump off a free-standing ramp: sets the take-off speed once (vel.y, returns the speed along _vertO, 0 = no ground ahead: back onto
// the ramp); gravity does the rest, so it does not depend on the frame rate. The board keeps its speed and lands where that takes it:
// the natural jump (Vert: Over Angle) if that comes down on flat ground long enough to land on, else steeper to the ground beyond the gap
// (up to Vert: Over Max Angle), else flatter to the ground before it. Too slow for all of those: a short hop onto the nearest ground.
SkateboardObbyPlayerController.prototype.rampOverJump = function (vel, a) {
    const p = this.entity.getPosition(), s = this.entity.getLocalScale().y || 1, col = this.entity.collision, o = this._vertO;
    const rb = this.app.systems.rigidbody, bottom = p.y - col.height / 2 * s;
    const segs = [];
    let seg = null;
    for (let d = 1; d <= this.vertOverRange; d++) {
        const x = p.x + o.x * d, z = p.z + o.z * d;
        const h = rb.raycastFirst(this._vertA.set(x, p.y + 0.5, z), this._vertB.set(x, bottom - 25, z), this._groundOnly);
        if (h && h.entity !== a.ent && h.normal.y >= 0.9) {
            if (seg && Math.abs(h.point.y - seg.y) < 0.3) {
                seg.d1 = d;
                seg.y = h.point.y;
            } else {
                seg = { d0: d, d1: d, y: h.point.y };
                segs.push(seg);
            }
        } else seg = null;
    }
    if (!segs.length) return 0;

    const g = Math.abs(rb.gravity.y) + this.extraGravity * this.airGravityScale() * (a.big ? this.vertGravity : 1);
    const L = Math.max(this.speed, 1), centre = this.rideCentreHeight(1);
    const flight = (vy, sg) => {
        const up = Math.max(0, vy);
        return (up + Math.sqrt(up * up + 2 * g * Math.max(0, p.y - sg.y - centre))) / g;
    };
    const toLand = (d, sg, u) => { const t = d / u; return g * t / 2 - (p.y - sg.y - centre) / t; };
    const fits = (sg) => sg.d1 - sg.d0 >= Math.max(this.vertOverLand + this.vertOverMargin, L * 0.4);
    const go = (vy, d, u) => { vel.y = vy; this._rampFlight = d / u; return u; };

    // the natural jump comes down at segs[k] or in the gap before it
    const vyN = L * Math.tan(this.vertOverAngle * pc.math.DEG_TO_RAD);
    let k = 0, far = L * flight(vyN, segs[0]);
    while (k < segs.length - 1 && far > segs[k].d1) {
        k++;
        far = L * flight(vyN, segs[k]);
    }
    const tanMax = Math.tan(this.vertOverMaxAngle * pc.math.DEG_TO_RAD), tanMin = Math.tan(this.vertOverMinAngle * pc.math.DEG_TO_RAD);
    for (let i = k; i < segs.length; i++) {
        const sg = segs[i];
        if (!fits(sg)) continue;
        const d = pc.math.clamp(far, sg.d0 + this.vertOverLand, sg.d1 - this.vertOverMargin), vy = toLand(d, sg, L);
        if (d === far) return go(vyN, d, L);
        if (vy <= L * tanMax && vy >= L * tanMin) return go(vy, d, L);
        // just short of it: a little more speed than the board had
        const u = L * this.vertOverAssist, vu = toLand(d, sg, u);
        if (vy > L * tanMax && vu <= u * tanMax) return go(vu, d, u);
    }
    for (let i = Math.min(k, segs.length) - 1; i >= 0; i--) {
        const sg = segs[i];
        if (!fits(sg)) continue;
        const d = sg.d1 - this.vertOverMargin, vy = toLand(d, sg, L);
        if (vy >= L * tanMin) return go(vy, d, L);
        // a little too fast for this ground
        const t = flight(L * tanMin, sg);
        if (d / t >= L * 0.6) {
            vel.y = L * tanMin;
            this._rampFlight = t;
            return d / t;
        }
    }

    // too slow to jump across: onto the nearest ground this speed still gets to
    vel.y = Math.max(vel.y * 0.5, L * this.vertOverPop);
    const spot = (sg) => Math.min(sg.d0 + this.vertOverLand, (sg.d0 + sg.d1) / 2);
    let sg = segs[0];
    for (let i = segs.length - 1; i > 0; i--) {
        if (segs[i].d1 - segs[i].d0 >= 4 && spot(segs[i]) / flight(vel.y, segs[i]) <= L) {
            sg = segs[i];
            break;
        }
    }
    this._rampFlight = flight(vel.y, sg);
    return Math.max(Math.min(L, spot(sg) / Math.max(this._rampFlight, 0.15)), 1);
};

SkateboardObbyPlayerController.prototype.playVertTrick = function (T) {
    let trick = null;
    if (this.vertTricks && this.animLayer) {
        const list = this.vertTricks === "all" ? SkateboardObbyPlayerController.TRICKS : this.vertTricks.split(",");
        const name = list[Math.floor(Math.random() * list.length)].trim();
        if (this.animLayer.states.indexOf(name) >= 0) trick = name;
    }
    this.playOneShot(trick || "InAir", T, 0.15);
};

SkateboardObbyPlayerController.prototype.tryVertLaunch = function (vel) {
    if (this.isOverRamp()) {
        this.armRampOver(vel, false);
        return;
    }
    const n = this._vertN;
    if (vel.y < -1 || n.y > Math.cos(this.vertMinAngle * pc.math.DEG_TO_RAD)) return;
    // o = horizontal direction into the wall
    const o = this._vertO.set(-n.x, 0, -n.z);
    if (o.lengthSq() < 0.0001) return;
    o.normalize();
    // the board was going up towards the wall (the physics velocity may already be bent straight up by the wall)
    const vo = vel.x * o.x + vel.z * o.z;
    if (vo < 0.5 && this._lastCmdDir.x * o.x + this._lastCmdDir.z * o.z < 0.2) return;

    // only when the wall goes on above (quarter pipe / bowl / halfpipe), not off the lip of a kicker or launch ramp:
    // a ray up the slope of the ramp just left must hit a steep face
    const rb = this.app.systems.rigidbody;
    const p = this.entity.getPosition();
    const vl = vel.length();
    const s = this.entity.getLocalScale().y || 1;
    const from = this._vertB.copy(n).mulScalar(-0.8 * s).add(p);
    const up = this._vertA.set(-n.x * n.y, 1 - n.y * n.y, -n.z * n.y).normalize();
    const wall = rb.raycastFirst(from, up.mulScalar(this.vertWallCheck).add(from));
    if (!wall || wall.entity === this.entity || wall.normal.y > 0.8) return;

    // the board speed (the physics velocity is already eaten by the wall on this frame)
    const L = Math.max(this.speed - (this._rollBack || 0), vl);
    const big = L >= this.vertMinSpeed && vel.y > 1;
    const vy = big ? Math.max(vel.y, L * this.vertHeight) : vel.y;
    const g = Math.abs(rb.gravity.y) + this.extraGravity * this.airGravityScale() * (big ? this.vertGravity : 1);
    const T = Math.max(0.2, 2 * vy / g);

    // keep the speed along the coping (less of it if that would land on the deck, e.g. in a round bowl), drift a little back in
    const c = this._vertC.set(vel.x - o.x * vo, 0, vel.z - o.z * vo).mulScalar(this.vertKeepAlong);
    let k = 1;
    for (let i = 0; i < 3; i++) {
        const lx = p.x + (c.x * k - o.x * this.vertDriftIn) * T, lz = p.z + (c.z * k - o.z * this.vertDriftIn) * T;
        // a wall on the way (the side of a bowl corner)
        if (k > 0 && rb.raycastFirst(p, this._vertA.set(lx, p.y, lz))) { k = i === 0 ? 0.5 : 0; continue; }
        let top = null;
        const hits = rb.raycastAll(this._vertA.set(lx, p.y + 2, lz), this._vertB.set(lx, p.y - 30, lz));
        for (let j = 0; j < hits.length; j++) {
            if (hits[j].entity !== this.entity && (top === null || hits[j].point.y > top)) top = hits[j].point.y;
        }
        if (top !== null && top < p.y - 0.5) break;
        k = i === 0 ? 0.5 : 0;
    }
    c.mulScalar(k);
    c.x -= o.x * this.vertDriftIn;
    c.z -= o.z * this.vertDriftIn;

    const v = { big: big, t: 0, T: T, spin: 0, rate: 0, y0: p.y - 0.5 * s, exit: false, narrow: false, cx: 0, cz: 0, u: 0, ax: 0, az: 0 };
    if (big) {
        if (this.vertTurnAround) {
            // mirror the board direction off the wall: straight up = 180, at an angle = the same angle back down
            const yaw = this.headingDeg * pc.math.DEG_TO_RAD, hx = Math.sin(yaw), hz = Math.cos(yaw), d = hx * o.x + hz * o.z;
            v.spin = this.wrapAngle(Math.atan2(hx - 2 * d * o.x, hz - 2 * d * o.z) * pc.math.RAD_TO_DEG - this.headingDeg);
            if (Math.abs(v.spin) > 175) v.spin = (this._sideInput || 0) < 0 ? -180 : 180;
            // straight on: land fakie, the board keeps facing the wall the camera looks at
            if (Math.abs(v.spin) > this.vertFakieAngle) v.spin = 0;
            v.rate = v.spin / Math.max(0.2, T * 0.8);
        }
        // board speed now runs the other way (down the ramp after the turn)
        this.speed = Math.min(L, this.currentMaxSpeed());
        this._rollBack = 0;

        let trick = null;
        if (this.vertTricks && this.animLayer) {
            const list = this.vertTricks === "all" ? SkateboardObbyPlayerController.TRICKS : this.vertTricks.split(",");
            const name = list[Math.floor(Math.random() * list.length)].trim();
            if (this.animLayer.states.indexOf(name) >= 0) trick = name;
        }
        this.playOneShot(trick || "InAir", T, 0.15);
    }
    this._vertVy = vy;
    this._vert = v;
};

// vert air flight: the board turns (the camera is left to the player)
SkateboardObbyPlayerController.prototype.updateVert = function (dt) {
    const v = this._vert;
    v.t += dt;
    if (v.t > 4) { this._vert = null; return; }
    if (v.spin !== 0) {
        let step = v.rate * dt;
        if (Math.abs(step) > Math.abs(v.spin)) step = v.spin;
        v.spin -= step;
        if (Math.abs(v.spin) < 0.01) v.spin = 0;
        this.headingDeg = this.wrapAngle(this.headingDeg + step);
    }
    if (v.exit) {
        const w = this.entity.rigidbody.linearVelocity;
        if (w.x * w.x + w.z * w.z > 1) {
            const d = this.wrapAngle(Math.atan2(w.x, w.z) * pc.math.RAD_TO_DEG - this.headingDeg);
            this.headingDeg = this.wrapAngle(this.headingDeg + pc.math.clamp(d, -540 * dt, 540 * dt));
        }
    }
};

// vert exit: the bottom of the board is above the wall (nothing steep right in front of it towards the deck)
SkateboardObbyPlayerController.prototype.vertClearOfWall = function () {
    const p = this.entity.getPosition(), s = this.entity.getLocalScale().y || 1, col = this.entity.collision, o = this._vertO;
    const y = p.y - col.height / 2 * s + 0.15;
    const h = this.app.systems.rigidbody.raycastFirst(this._vertA.set(p.x, y, p.z), this._vertB.set(p.x + o.x * (col.radius * s + 0.8), y, p.z + o.z * (col.radius * s + 0.8)));
    return !h || h.entity === this.entity || h.normal.y > 0.8;
};

// vert exit: outward speed (m/s) that lands the board on the deck behind the coping, 0 = no deck within reach.
// The deck is looked for where the board will come down (with its speed along the coping); it must be flat Ground, below the
// board, above the take-off point. A deck that ends within 5 m (a lip) is marked narrow: the board stops on it.
SkateboardObbyPlayerController.prototype.vertExitSpeedTo = function (desired) {
    const p = this.entity.getPosition(), s = this.entity.getLocalScale().y || 1, col = this.entity.collision, o = this._vertO, v = this._vert;
    const rb = this.app.systems.rigidbody;
    const bottom = p.y - col.height / 2 * s;
    const ao = desired.x * o.x + desired.z * o.z, ax = desired.x - o.x * ao, az = desired.z - o.z * ao;
    const g = Math.abs(rb.gravity.y) + this.extraGravity * this.airGravityScale() * (v.big ? this.vertGravity : 1);
    const scan = (t, want) => {
        let d0 = null, d1 = null, dy = null;
        for (let d = 0.5; d <= 5; d += 0.5) {
            const x = p.x + o.x * d + ax * t, z = p.z + o.z * d + az * t;
            const h = rb.raycastFirst(this._vertA.set(x, p.y + 0.5, z), this._vertB.set(x, bottom - 6, z));
            const ok = h && h.entity !== this.entity && h.entity.tags.has("Ground") && h.normal.y >= 0.9 &&
                h.point.y <= bottom - 0.4 && h.point.y > v.y0 + 0.3 && Math.abs(h.point.y - (dy === null ? (want === null ? h.point.y : want) : dy)) < 0.3;
            if (ok) {
                if (d0 === null) { d0 = d; dy = h.point.y; }
                d1 = d;
            } else if (d0 !== null) break;
        }
        return d0 === null ? null : { d0: d0, d1: d1, dy: dy };
    };
    const a = scan(0, null);
    if (!a) return 0;
    const drop = Math.max(0, p.y - (a.dy + this.rideCentreHeight(1)));
    const t = (desired.y + Math.sqrt(desired.y * desired.y + 2 * g * drop)) / g;
    const b = scan(t, a.dy);
    if (!b) return 0;
    const u = Math.min(b.d0 + 0.8, (b.d0 + b.d1) / 2 + 0.25) / Math.max(t, 0.15);
    if (u > this.vertExitSpeed) return 0;
    v.narrow = b.d1 < 5;
    return Math.max(u, 1);
};

SkateboardObbyPlayerController.prototype.skateMovement = function (dt) {
    const rb = this.entity.rigidbody;
    const vel = rb.linearVelocity.clone();
    const wasGrounded = this.grounded;
    if (!this._lastCmdVel) { this._lastCmdVel = new pc.Vec3(); this._impTmp = new pc.Vec3(); }
    if (!this._vertN) { this._vertN = new pc.Vec3(); this._vertO = new pc.Vec3(); this._vertC = new pc.Vec3(); this._vertA = new pc.Vec3(); this._vertB = new pc.Vec3(); }
    this._vertN.copy(this._contactNormal);
    if (!this._gA) { this._gA = new pc.Vec3(); this._gB = new pc.Vec3(); this._gV = new pc.Vec3(); this._groundOnly = { filterTags: ["Ground"] }; }
    // sunk into the ground under it (pushed into / through a thin ramp start, on the ollie or landing): put it back on top
    if (this.groundAntiSink && !this._ride && this.app.playerBounce.curve <= 0 && this.liftOutOfGround() && !wasGrounded) vel.copy(rb.linearVelocity);

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;

    // --- wall / obstacle impact: if physics stopped us, lose the speed
    // (compared with the speed we asked for last frame, so a boost this frame is not cancelled)
    // speed written from outside (stop, respawn, boost, rides) cancels the roll-back
    if (this.speed !== this._speedOut || this._lastCommandedSpeed !== this._cmdOut) this._rollBack = 0;
    if (this._lastCommandedSpeed > 1) {
        let along = vel.dot(this._lastCmdDir);
        // curved ramps / mesh seams only turn the velocity: on the ground only a real loss of speed (a wall) counts
        if (this.impactIgnoresRedirect && wasGrounded && along > 0) {
            along = Math.max(along, vel.length());
            // pushed back by a rideable slope (a ramp, not a wall): keep the speed, the board follows the ramp
            const push = this._impTmp.copy(vel).sub(this._lastCmdVel);
            if (push.lengthSq() > 0.01 && push.normalize().y >= Math.cos(this.maxGroundAngle * pc.math.DEG_TO_RAD)) along = this._lastCommandedSpeed;
            // climbing a ramp into a steeper part (the curve / kinks of a quarter pipe, bowl or halfpipe; the capsule touches
            // the part above and is pushed back mostly upwards) is not a wall hit
            if (this.vertAir && ((this._lastCmdDir.y > 0.3 && this._vertN.y < Math.cos(this.vertMinAngle * pc.math.DEG_TO_RAD)) ||
                (this._lastCmdDir.y > 0.05 && push.y > 0.3))) along = this._lastCommandedSpeed;
        }
        // on a free-standing ramp nothing stops the board (kinks of its collider), it goes over the top
        if (this._rampArm || (this._vert && this._vert.over) || ((wasGrounded || this._airTime < 0.3) && this.isOverRamp())) along = this._lastCommandedSpeed;
        if (along < this._lastCommandedSpeed - 0.5) {
            const lost = this._lastCommandedSpeed - Math.max(along, 0);
            if (lost > this.maxSpeed * 0.55 && this._timeSinceLastJump > 0.3) {
                this.playOneShot("Stumble", 0.6);
            }
            if (this._rollBack > 0) this._rollBack = Math.max(0, this._rollBack - lost);
            else this.speed = Math.max(0, this.speed - lost);
        }
    }

    this.checkGround();

    // wedged under the lip of a free-standing ramp, pushing: hop over it
    if (this.grounded && this._throttle > 0.1 && vel.x * vel.x + vel.z * vel.z < 4 && this.isOverRamp()) {
        this._rampWedge = (this._rampWedge || 0) + dt;
        if (this._rampWedge > 0.1) {
            this._rampWedge = 0;
            this.armRampOver(vel, false, true);
            if (this._rampArm) {
                this.grounded = false;
                this._timeSinceLastJump = 0;
            }
        }
    } else this._rampWedge = 0;

    if (this.grounded && !wasGrounded && this._airTime > 0.25) {
        this.onLanded();
    }
    // landing on a slope after a real flight: carry the velocity along the slope (falling back onto a quarter pipe rolls back down)
    if (this.rollBack && this.grounded && !wasGrounded && (this._airTime > 0.25 || this._vert) && (this._contactNormal.y < 0.98 || this._vert)) {
        const n = this._contactNormal, yaw = this.headingDeg * pc.math.DEG_TO_RAD;
        const hx = Math.sin(yaw), hz = Math.cos(yaw), d = hx * n.x + hz * n.z;
        const px = hx - n.x * d, py = -n.y * d, pz = hz - n.z * d, pl = Math.sqrt(px * px + py * py + pz * pz) || 1;
        const v = pc.math.clamp((vel.x * px + vel.y * py + vel.z * pz) / pl, -this.currentMaxSpeed(), this.currentMaxSpeed());
        this.speed = Math.max(0, v);
        this._rollBack = Math.max(0, -v);
    }
    this._airTime = this.grounded ? 0 : this._airTime + dt;

    // vert air: leaving a quarter pipe / bowl / halfpipe wall upwards
    if (this._vert && this._vert.exit && this.grounded && this._contactNormal.y > 0.6) {
        let hx = vel.x, hz = vel.z;
        if (this._vert.narrow) {
            const o = this._vertO, d = hx * o.x + hz * o.z;
            hx -= o.x * d;
            hz -= o.z * d;
            const l = Math.sqrt(hx * hx + hz * hz);
            if (l < 0.5) {
                hx = -o.z;
                hz = o.x;
                const yaw = this.headingDeg * pc.math.DEG_TO_RAD;
                if (Math.sin(yaw) * hx + Math.cos(yaw) * hz < 0) { hx = -hx; hz = -hz; }
            } else { hx /= l; hz /= l; }
            hx *= 0.01;
            hz *= 0.01;
        }
        const hs = Math.sqrt(hx * hx + hz * hz);
        if (hs > 0.005) this.headingDeg = this.wrapAngle(Math.atan2(hx, hz) * pc.math.RAD_TO_DEG);
        this.speed = Math.min(hs, this.currentMaxSpeed());
        this._rollBack = 0;
    }
    if (this._vert && (this.grounded || this._ride)) this._vert = null;
    if (!this._vert && this.vertAir && wasGrounded && !this.grounded && !this._ride) this.tryVertLaunch(vel);
    // thrown off a kink of a free-standing ramp and going up its steep part (no ground contact to leave from)
    if (!this._vert && !this._rampArm && this.vertAir && !this.grounded && !this._ride && vel.y > 2 && this._airTime < 0.5 && this.isOverRamp()) this.armRampOver(vel, false);
    if (this._rampArm) {
        if (this.grounded || this._ride) this._rampArm = null;
        else if (!this._vert) this.updateRampOver(vel, dt);
    }
    if (this._vert) this.updateVert(dt);

    // --- steering: the board keeps turning towards the input direction (camera forward for W)
    this.isPushing = false;
    this.isBraking = false;
    let turnStep = 0;
    this._lastTurnStep = 0;
    const speedT = pc.math.clamp(this.speed / this.maxSpeed, 0, 1);
    this._steer = 0;

    if (this._throttle > 0.1 && !this._vert) {
        const inputYaw = Math.atan2(this._inputDir.x, this._inputDir.z) * pc.math.RAD_TO_DEG;
        let delta = this.wrapAngle(inputYaw - this.headingDeg);

        // turn speed depends on speed: tight when slow, wider when fast; A/D makes it sharper
        let turnRate = this.speed < 1 ? 540 : pc.math.lerp(this.turnSpeedLow, this.turnSpeedHigh, Math.sqrt(speedT));
        if (this._side > 0.1) turnRate *= pc.math.lerp(1, this.sideTurnMultiplier, this._side);

        // big direction change (e.g. S = come back towards the camera): quick kick-turn instead of a wide arc
        if (!this.grounded) turnRate *= this.airControl;
        if (Math.abs(delta) > this.quickTurnAngle) {
            if (this.grounded && this._rollBack > 0) {
                // rolling back and turning around: the board flips to face the way it is rolling
                this.headingDeg = this.wrapAngle(this.headingDeg + 180);
                delta = this.wrapAngle(delta - 180);
                this.speed = this._rollBack;
                this._rollBack = 0;
            } else if (this.grounded) {
                turnRate = Math.max(turnRate, this.quickTurnSpeed);
                this.speed = Math.max(0, this.speed - this.speed * this.quickTurnSpeedLoss * dt);
                this.isBraking = this.speed > 0.5;
            } else {
                // in the air the board can still swing around quickly
                turnRate = Math.max(turnRate, this.quickTurnSpeed * 0.6 * this.airControl);
            }
        }
        if (this._surface === "slippery" && this.grounded) turnRate *= this.slipperyTurn;
        turnStep = pc.math.clamp(delta, -turnRate * dt, turnRate * dt);
        this.headingDeg = this.wrapAngle(this.headingDeg + turnStep);
        this._lastTurnStep = turnStep;
        this._steer = Math.abs(delta) > 3 ? Math.sign(delta) : 0;

        // sharp carves cost some speed
        if (this.grounded && Math.abs(delta) > 30 && speedT > 0.3) {
            this.speed = Math.max(0, this.speed - this.carveSpeedLoss * Math.min(1, Math.abs(delta) / 90) * dt);
        }

        // push only while roughly facing the target direction, otherwise it is a carve
        const forwardFactor = Math.max(0, Math.cos(this.wrapAngle(inputYaw - this.headingDeg) * pc.math.DEG_TO_RAD));
        if (this.grounded && forwardFactor > 0.3) {
            this.isPushing = true;
            if (this._rollBack > 0) {
                // pushing while rolling back first stops the roll, the rest pushes forward
                // (otherwise a tiny roll-back from slope gravity on almost flat ground eats every push and the board never starts)
                const left = this._rollBack - this.acceleration * this._throttle * forwardFactor * dt;
                this._rollBack = Math.max(0, left);
                if (left < 0) this.speed = Math.min(this.speed - left, this.currentMaxSpeed());
            } else if (this.speed < this.currentMaxSpeed()) {
                // pushing gets harder near top speed
                let accel = this.acceleration * (1 - 0.6 * speedT) * this._throttle * forwardFactor;
                if (this._surface === "slippery") accel *= this.slipperyPush;
                this.speed = Math.min(this.speed + accel * dt, this.currentMaxSpeed());
            }
        } else if (!this.grounded && this._jumped && this.airAcceleration > 0 && this.speed < this.airMaxSpeed) {
            // light air acceleration: you can still drift forward after a standing jump
            this.speed = Math.min(this.airMaxSpeed, this.speed + this.airAcceleration * this._throttle * Math.max(forwardFactor, 0.3) * dt);
        }
    }

    if (this._brakeKey) this.isBraking = this.speed > 0.5;
    if (this._forceBrake) {
        if (this.speed > 0.5) this.isBraking = true;
        else this._forceBrake = false;
    }
    const inputMag = this._throttle;

    // turn amount for lean & animations (-1..1)
    const targetTurn = (this.speed > 0.5 && dt > 0) ? pc.math.clamp(turnStep / (Math.max(this.turnSpeedHigh, 1) * dt), -1, 1) : 0;
    this.turnAmount = pc.math.lerp(this.turnAmount, targetTurn, Math.min(1, 10 * dt));

    // --- speed changes
    if (this.grounded) {
        if (this.isBraking) {
            this.speed = Math.max(0, this.speed - this.brakeDeceleration * dt);
        } else if (!this.isPushing && this._surface !== "slippery") {
            this.speed = Math.max(0, this.speed - this.rollingFriction * dt);
        }
        if (this._rollBack > 0 && !this.isPushing) {
            this._rollBack = Math.max(0, this._rollBack - (this._brakeKey ? this.brakeDeceleration : this.rollingFriction) * dt);
        }
        if (this.speed > this.currentMaxSpeed()) {
            this.speed = Math.max(this.currentMaxSpeed(), this.speed - this.overspeedDeceleration * dt);
        }
        // sticky goo holds the board back
        if (this._surface === "sticky" && this.speed > this.stickyMaxSpeed) {
            this.speed = Math.max(this.stickyMaxSpeed, this.speed - this.stickyDecel * dt);
        }
    }

    // heading vectors
    const yawRad = this.headingDeg * pc.math.DEG_TO_RAD;
    this._heading.set(Math.sin(yawRad), 0, Math.cos(yawRad));
    const n = this._contactNormal;
    this._headingPlane.copy(this._heading).sub(n.clone().mulScalar(this._heading.dot(n)));
    if (this._headingPlane.lengthSq() < 0.0001) this._headingPlane.copy(this._heading);
    this._headingPlane.normalize();

    // slopes: downhill speeds up, uphill slows down
    if (this.grounded) {
        // signed speed along the board (< 0 = rolling back); uphill costs Uphill Gravity, downhill gains Slope Gravity
        let v = this.speed - (this._rollBack || 0);
        const g = v * this._headingPlane.y > 0 ? this.uphillGravity : this.slopeGravity;
        v -= g * this._headingPlane.y * dt;
        if (!this.rollBack) v = Math.max(0, v);
        this.speed = Math.max(0, v);
        this._rollBack = Math.max(0, -v);
    }
    if (this.speed < 0.05 && inputMag < 0.1) this.speed = 0;

    // --- build velocity
    const desired = this._desiredVelocity;
    if (this.grounded) {
        desired.copy(this._headingPlane).mulScalar(this.speed - (this._rollBack || 0));
        if (this._groundCenterY != null && this.isHoverSurface(n.y)) {
            // hold the capsule just above the surface instead of pressing it in (seams and collider kinks can't kick it up)
            const h = this.entity.getPosition().y - this._groundCenterY;
            const target = this.rideHeight * this.entity.getLocalScale().y + this.rideCentreHeight(n.y) - this.rideCentreHeight(1);
            desired.y += pc.math.clamp((target - h) / this.flatHoverTime, -this.flatHoverMaxDown, this.flatHoverMaxUp) + Math.abs(this.app.systems.rigidbody.gravity.y) * dt;
        } else {
            // keep the board glued to the surface
            desired.add(n.clone().mulScalar(-2));
        }
    } else if (this._vert) {
        // vert air: the take-off sets the velocity (along the coping + a little back into the ramp), then physics flies it;
        // it is never pushed into the wall (pressing into the steep facets can take the capsule through the mesh)
        if (this._vertVy != null) {
            desired.set(this._vertC.x, this._vertVy, this._vertC.z);
            this._vertVy = null;
        } else {
            desired.copy(vel);
            const v = this._vert, o = this._vertO;
            // air control: W/A/S/D / joystick steer the flight (camera-relative), at most Air Control Max on top of the take-off speed
            if (this.vertAirControl > 0 && this._throttle > 0.1 && !v.exit) {
                const a = this.vertAirControl * dt, m = this.vertAirControlMax;
                let cx = v.cx + this._inputDir.x * a, cz = v.cz + this._inputDir.z * a;
                const l = Math.sqrt(cx * cx + cz * cz);
                if (l > m) { cx *= m / l; cz *= m / l; }
                desired.x += cx - v.cx;
                desired.z += cz - v.cz;
                v.cx = cx;
                v.cz = cz;
            }
            // pushing out over the coping once the board is above the wall: leave the ramp if a deck can be reached
            if (!v.exit && this.vertExit && this._throttle > 0.1 && this._inputDir.x * o.x + this._inputDir.z * o.z > 0.35 * this._throttle && this.vertClearOfWall()) {
                const u = this.vertExitSpeedTo(desired);
                if (u > 0) {
                    const d = desired.x * o.x + desired.z * o.z;
                    v.exit = true;
                    v.spin = 0;
                    v.u = u;
                    v.ax = desired.x - o.x * d;
                    v.az = desired.z - o.z * d;
                }
            }
            if (v.exit) {
                // flying to the deck: outward and along-coping speed fixed, so it lands where it was aimed
                desired.x = v.ax + o.x * v.u;
                desired.z = v.az + o.z * v.u;
                // a jump off a free-standing ramp: nothing the board brushes on the way adds to it
                if (v.over && desired.y > v.vy) desired.y = v.vy;
            } else {
                // still in the ramp: never pushed into the wall (the control keeps no speed towards it either)
                const co = v.cx * o.x + v.cz * o.z;
                if (co > 0) { v.cx -= o.x * co; v.cz -= o.z * co; }
                const d = desired.x * o.x + desired.z * o.z + this.vertDriftIn;
                if (d > 0) { desired.x -= o.x * d; desired.z -= o.z * d; }
            }
        }
    } else {
        // in the air the movement direction swings smoothly towards the board direction (air steering)
        const target = this._heading.clone().mulScalar(this.speed - (this._rollBack || 0));
        const cur = new pc.Vec3(vel.x, 0, vel.z);
        cur.lerp(cur, target, Math.min(1, this.airSteer * dt));
        desired.set(cur.x, vel.y, cur.z);
    }

    // --- ollie
    const canJump = this._requestedJump && this._timeSinceLastGrounded <= 0.15 && !this._jumped &&
        !this.app.playerItemManager.jetpack.enabled && !this.app.playerPush.active &&
        this.app.playerBounce.curve <= 0 && this.app.canJump;

    if (this.entity.jumpPlatform || canJump) {
        this._jumped = true;
        this._vert = null;
        this.entity.jumpPlatform = false;
        this._timeSinceLastJump = 0;
        this.grounded = false;
        desired.copy(this._heading).mulScalar(this.speed - (this._rollBack || 0));
        desired.y = this.olliePower() * (this._surface === "sticky" ? this.stickyJump : 1);
        this.entity.sound.play("jump");
        this.onJump();
        if (canJump && this.vertAir && this.isOverRamp()) this.armRampOver(desired, true);
    }

    // extra gravity
    if (!this.grounded && !this.app.playerItemManager.jetpack.using) {
        desired.y -= this.extraGravity * this.airGravityScale() * (this._vert && this._vert.big ? this.vertGravity : 1) * dt;
    }

    // riding onto a different surface next frame (flat -> ramp, ramp -> steeper part): be on top of it then
    // (not rolling back: on a steep part the glue pushes the board into the slope and this would keep lifting it up the ramp)
    if (this.groundLookAhead && this.grounded && this.app.playerBounce.curve <= 0 && !(this._rollBack > 0)) this.lookAheadGround(desired, dt);
    // fast landing: don't let this frame's motion take the capsule through a thin ground collider
    if (this.sweptGuard && !this.grounded) this.sweepGuard(desired, dt);

    rb.linearVelocity = desired;
    if (this.grounded) {
        const vs = this.speed - (this._rollBack || 0);
        this._lastCmdDir.copy(this._headingPlane);
        if (vs < 0) this._lastCmdDir.mulScalar(-1);
        this._lastCommandedSpeed = Math.abs(vs);
    } else {
        this._lastCmdDir.set(desired.x, 0, desired.z);
        this._lastCommandedSpeed = this._lastCmdDir.length();
        if (this._lastCommandedSpeed > 0.001) this._lastCmdDir.mulScalar(1 / this._lastCommandedSpeed);
    }

    this._speedOut = this.speed;
    this._cmdOut = this._lastCommandedSpeed;
    this._lastCmdVel.copy(this._lastCmdDir).mulScalar(this._lastCommandedSpeed);
    this.updateHoverVisual(dt);

    this.applyPlayerPush(dt);

    if (this.app.playerBounce.curve > 0) {
        const curve = this.app.playerBounce.curve;
        rb.linearVelocity = new pc.Vec3(
            this.app.playerBounce.velocity.x * curve + rb.linearVelocity.x,
            this.app.playerBounce.velocity.y * curve,
            this.app.playerBounce.velocity.z * curve + rb.linearVelocity.z,
        );
        this.app.playerBounce.curve = Math.max(this.app.playerBounce.curve - dt, 0);
    }
};

// legacy free movement, used only while the flying carpet item is active
SkateboardObbyPlayerController.prototype.carpetMovement = function (dt) {
    const scaler = 15;
    this._carpetVelocity.set(this._carpetVelocity.x * scaler, this._carpetVelocity.y * scaler + dt * 19.6, this._carpetVelocity.z * scaler);
    this.entity.rigidbody.linearVelocity = this._carpetVelocity;
    this.speed = 0;
    if (this._inputDir.lengthSq() > 0.01) {
        this.headingDeg = Math.atan2(this._inputDir.x, this._inputDir.z) * pc.math.RAD_TO_DEG;
    }
};

SkateboardObbyPlayerController.prototype.applyPlayerPush = function (dt) {
    let push = this.app.playerPush;

    if (!push.active && push.strength <= 0 && push.velocity.lengthSq() === 0) { return; }

    if (push.active) {
        push.strength = push.rampUpTime > 0 ? Math.min(push.strength + dt / push.rampUpTime, 1) : 1;
    } else {
        push.strength = push.rampDownTime > 0 ? Math.max(push.strength - dt / push.rampDownTime, 0) : 0;
    }

    let eased = push.strength * push.strength * (3 - 2 * push.strength);
    let step = push.acceleration * dt;
    let velocity = this.entity.rigidbody.linearVelocity;
    let targetX = push.direction.x * push.power * eased;
    let targetY = push.direction.y * push.power * eased;
    let targetZ = push.direction.z * push.power * eased;

    push.velocity.x = this.moveTowards(push.velocity.x, targetX, step);
    push.velocity.z = this.moveTowards(push.velocity.z, targetZ, step);

    let velocityY = velocity.y;

    if (push.direction.y > 0 && velocityY < targetY) {
        velocityY = Math.min(targetY, velocityY + step);
    } else if (push.direction.y < 0 && velocityY > targetY) {
        velocityY = Math.max(targetY, velocityY - step);
    }

    this.entity.rigidbody.linearVelocity = new pc.Vec3(
        velocity.x + push.velocity.x,
        velocityY,
        velocity.z + push.velocity.z
    );
};

// ---------------------------------------------------------------------------
// boost
// ---------------------------------------------------------------------------

// VIP / BOSS VIP or the Boost power-up (SkateboardObby_VipManager.canBoost). No VipManager in the scene = always open.
SkateboardObbyPlayerController.prototype.canUseBoost = function () {
    return !this.app.vipManager || this.app.vipManager.canBoost();
};

SkateboardObbyPlayerController.prototype.boost = function () {
    if (this.isDied || !this.canMove()) return;
    if (!this.canUseBoost()) {
        this.app.fire("Boost:Locked");   // warning + VIP offer (VipManager)
        return;
    }
    if (this.boostCooldownTimer > 0) return;

    this.boostTimer = this.boostDuration;
    this.boostCooldownTimer = this.boostCooldown;
    this.speed = Math.min(this.speed + this.boostImpulse, this.boostMaxSpeed);
    this.app.targetFov = 72;
    if (this.boostParticle) this.boostParticle.enabled = true;
    if (this.entity.sound.slot("prize")) this.entity.sound.play("prize");
    this.app.fire("skate:boosted");
    this.sdkGamePlayStart();
};

SkateboardObbyPlayerController.prototype.updateBoost = function (dt) {
    if (this.boostTimer > 0) {
        this.boostTimer -= dt;
        if (this.boostTimer <= 0) {
            this.boostTimer = 0;
            this.app.targetFov = 60;
            if (this.boostParticle) this.boostParticle.enabled = false;
        }
    }
    if (this.boostCooldownTimer > 0) this.boostCooldownTimer = Math.max(0, this.boostCooldownTimer - dt);

    this.app.skateBoost.cooldown = this.boostCooldownTimer;
    this.app.skateBoost.cooldownMax = this.boostCooldown;
    this.app.skateBoost.active = this.boostTimer > 0;
};

// ---------------------------------------------------------------------------
// visuals: body rotation, lean, camera follow
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.updateBody = function (dt) {
    if (this.app.isEdit) return;
    if (this._ride && this._ride.type === "loop" && this._ride.up) {
        this.setBodyFrame(this._ride.fwd, this._ride.up);
        return;
    }

    const speedT = pc.math.clamp(this.speed / this.maxSpeed, 0, 1);
    // lean follows the real turn rate (deg/s): full lean from 120 deg/s, needs some speed
    const turnRate = dt > 0 ? (this._lastTurnStep || 0) / dt : 0;
    const targetLean = (this._ride || this.isDied || !this.grounded) ? 0 :
        -pc.math.clamp(turnRate / 120, -1, 1) * this.leanAngle * pc.math.clamp(this.speed / 8, 0, 1);
    this.lean = pc.math.lerp(this.lean, targetLean, Math.min(1, 10 * dt));

    // yaw + lean
    // the lean is applied on the rig in postUpdate (deck + character), not on the whole body, so the wheels stay flat
    this._tmpQuat.setFromEulerAngles(0, this.headingDeg, 0);

    // align to the ground normal while grounded
    const up = this.grounded ? this._contactNormal : pc.Vec3.UP;
    const axis = new pc.Vec3().cross(pc.Vec3.UP, up);
    const dot = pc.math.clamp(pc.Vec3.UP.dot(up), -1, 1);
    if (axis.lengthSq() > 0.000001) {
        this._alignQuat.setFromAxisAngle(axis.normalize(), Math.acos(dot) * pc.math.RAD_TO_DEG);
    } else {
        this._alignQuat.set(0, 0, 0, 1);
    }

    this._bodyQuat.mul2(this._alignQuat, this._tmpQuat);
    this._quatLerp.slerp(this._quatLerp, this._bodyQuat, Math.min(1, 12 * dt));
    this.body.setRotation(this._quatLerp);
    this.rayPoint.setRotation(new pc.Quat().setFromEulerAngles(0, this.headingDeg, 0));
};

// runs after the anim component
SkateboardObbyPlayerController.prototype.postUpdate = function (dt) {
    this.applyLean();
    // after the physics step and the animation: the wheels are where they will be drawn this frame
    this.updateSkid(dt);
};

/*
 * Turn lean on the rig: the whole skeleton (deck + character) rolls around the board's long axis,
 * pivoting at the deck, then the trucks (with their wheels) are put back where they were,
 * so the wheels stay flat on the ground while the deck and the rider tilt into the turn.
 */
SkateboardObbyPlayerController.prototype.applyLean = function () {
    if (Math.abs(this.lean) < 0.05 || this.isDied || this._ride) return;
    if (!this._leanRig) {
        const skin = this.playerRendererEntity;
        this._leanRig = {
            root: skin ? skin.findByName("Armature.001") : null,
            board: skin ? skin.findByName("Board") : null,
            trucks: skin ? ["Truck_F", "Truck_B"].map(n => skin.findByName(n)).filter(t => !!t) : []
        };
    }
    const rig = this._leanRig;
    if (!rig.root || !rig.board) return;

    const truckPos = rig.trucks.map(t => t.getPosition().clone());
    const truckRot = rig.trucks.map(t => t.getRotation().clone());

    const axis = this.body.getWorldTransform().transformVector(pc.Vec3.BACK, new pc.Vec3()).normalize(); // body +Z = riding direction
    const q = new pc.Quat().setFromAxisAngle(axis, this.lean);
    const pivot = rig.board.getPosition().clone();
    const rootPos = rig.root.getPosition().clone().sub(pivot);
    rig.root.setPosition(q.transformVector(rootPos).add(pivot));
    rig.root.setRotation(new pc.Quat().mul2(q, rig.root.getRotation()));

    for (let i = 0; i < rig.trucks.length; i++) {
        rig.trucks[i].setPosition(truckPos[i]);
        rig.trucks[i].setRotation(truckRot[i]);
    }
};

SkateboardObbyPlayerController.prototype.updateCameraFollow = function (dt) {
    if (this.cameraFollow <= 0 || !this.cameraScript || !this.cameraScript.eulers) return;
    if (this.speed < 1.5 || this.isDied) return;
    if (this._time - this._lastCameraInputTime < 0.8) return;

    const eulers = this.cameraScript.eulers;
    const diff = this.wrapAngle(this.headingDeg - eulers.x);
    const speedT = pc.math.clamp(this.speed / this.maxSpeed, 0, 1);
    eulers.x += diff * Math.min(1, this.cameraFollow * (0.3 + 0.7 * speedT) * dt);
    if (eulers.x < 0) eulers.x += 360;
    eulers.x %= 360;
};

// ---------------------------------------------------------------------------
// animations (code driven, see SkateboardObby_Animator anim state graph)
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.setAnimState = function (state, blend = 0.15) {
    if (this._animState === state || !this.animLayer) return;
    this._animState = state;
    this.animLayer.transition(state, blend);
};

SkateboardObbyPlayerController.prototype.playOneShot = function (state, duration, blend = 0.1) {
    if (this._oneShotTimer > 0 && this._oneShotState === SkateboardObby_Finisher.STATE &&
        SkateboardObby_Finisher.REPLACED_BY.indexOf(state) < 0) return;
    this._oneShotState = state;
    this._oneShotTimer = duration;
    this._animState = null;
    this.setAnimState(state, blend);
};

/*
 * Finish jump trick (see SkateboardObby_Finisher). duration = flight time in seconds (0 / missing = the clip's own
 * 5 s): the whole clip plays in that time and the state is held until the landing (playOneShot("Celebrate", ...)
 * or the next landing replaces it). Same as app.fire("skate:finisher", duration); app.fire("skate:finisher", 0)
 * stops it. Returns false when the clip is not loaded (the player stays in InAir).
 */
SkateboardObbyPlayerController.prototype.playFinisher = function (duration, blend = 0.2) {
    if (this.isDied || !this.animLayer) return false;
    SkateboardObby_AnimFix.apply(this._animComponent);   // height fix even if the clip loaded late (once per clip)
    const length = SkateboardObby_Finisher.length(this.animLayer);
    if (!length) return false;
    const d = duration > 0 ? duration : length;
    // held a little longer than the flight: the clip ends in the riding pose, the landing call takes over
    this.playOneShot(SkateboardObby_Finisher.STATE, d + 0.3, blend);
    SkateboardObby_Finisher.fit(this.animLayer, d);
    this._finisherNet = SkateboardObby_Finisher.netName(d);
    return true;
};

SkateboardObbyPlayerController.prototype.stopFinisher = function () {
    if (this._oneShotState !== SkateboardObby_Finisher.STATE) return;
    this._oneShotTimer = 0;
    this._oneShotState = null;
};

SkateboardObbyPlayerController.prototype.onFinisherEvent = function (duration) {
    if (duration === false || duration === 0) this.stopFinisher();
    else this.playFinisher(typeof duration === "number" ? duration : 0);
};

// fromRide: jumping off a grind / slide; the board turns back from across the rail, so blend slower
SkateboardObbyPlayerController.prototype.onJump = function (fromRide) {
    const speedT = this.speed / this.maxSpeed;
    if (speedT > 0.7 || this.boostTimer > 0) {
        const tricks = SkateboardObbyPlayerController.TRICKS;
        this.playOneShot(tricks[Math.floor(Math.random() * tricks.length)], 0.85, fromRide ? 0.2 : 0.08);
    } else {
        this.playOneShot("JumpStart", 0.4, fromRide ? 0.2 : 0.05);
    }
    this.entity.fire('jump');
};

SkateboardObbyPlayerController.prototype.onLanded = function () {
    // the finish jump starts Celebrate on its landing frame, at 30 FPS one frame before the ground is found
    if (this._oneShotTimer > 0 && this._oneShotState === "Celebrate") return;
    if (this._oneShotState && this._oneShotState.indexOf("Trick") === 0) {
        this._oneShotTimer = 0;
    }
    this.playOneShot("JumpLand", this.speed > 4 ? 0.3 : 0.6, 0.05);
};

// Turn_L / Turn_R direction from the real turn rate, with hysteresis so the clips do not flicker
SkateboardObbyPlayerController.prototype.updateTurnDir = function (dt) {
    const rate = dt > 0 ? (this._lastTurnStep || 0) / dt : 0;
    this._turnRateSmooth = pc.math.lerp(this._turnRateSmooth || 0, rate, Math.min(1, 10 * dt));
    const allowed = this.grounded && this.speed > 3 && !this._ride;
    this._turnDir = SkateboardObby_TurnDir(this._turnDir || 0, this._turnRateSmooth, this.turnAnimRate, allowed);

    // how strong the Carve blend leans: small turns stay close to Move, hard turns reach Turn_L / Turn_R
    let target = allowed ? pc.math.clamp(this._turnRateSmooth / Math.max(this.turnFullRate, 1), -1, 1) : 0;

    // A / D (joystick sideways) = steering: lean the whole time the key is held, not only while the board swings round
    const steer = allowed ? -(this._sideInput || 0) * this.sideLean : 0; // D -> Turn_R (-), A -> Turn_L (+)
    if (Math.abs(steer) > 0.05) {
        if (Math.abs(steer) > Math.abs(target)) target = steer;
        this._turnDir = steer > 0 ? 1 : -1;
    }
    this._turnBlend = pc.math.lerp(this._turnBlend || 0, target, Math.min(1, 6 * dt));
    if (this._animComponent && this._animComponent._parameters && this._animComponent._parameters.turn) {
        this._animComponent.setFloat("turn", this._turnBlend);
    }
};

SkateboardObbyPlayerController.prototype.updateAnimations = function (dt) {
    if (this.isDied) return;
    this.updateTurnDir(dt);

    if (this._ride) {
        if (this._oneShotTimer > 0) { this._oneShotTimer -= dt; if (this._oneShotTimer > 0) return; this._oneShotState = null; }
        // grind / slide clips turn the board (and skater) across the rail: blend in slower
        this.setAnimState(this._ride.type === "grind" ? (this._ride.anim || "Grind") : "Move", this._ride.type === "grind" ? 0.2 : 0.1);
        return;
    }

    if (this._oneShotTimer > 0) {
        this._oneShotTimer -= dt;
        if (this._oneShotTimer > 0) return;
        this._oneShotState = null;
    }

    if (this.app.playerItemManager && this.app.playerItemManager.flyingCarpet.enabled) {
        this.setAnimState("Idle");
        return;
    }

    if (!this.grounded && this._airTime > 0.1) {
        this.setAnimState("InAir", 0.2);
    } else if (this.speed + (this._rollBack || 0) < 0.6 && !this.isPushing) {
        // rolling back (fakie) is not standing still: it falls through to Move
        this.setAnimState("Idle", 0.25);
    } else if (this.isBraking) {
        this.setAnimState("Slow", 0.15);
    } else if (this._turnDir !== 0) {
        // turning wins over pushing: Carve blends Move with Turn_L / Turn_R by how hard we turn
        if (SkateboardObby_Carve(this._animComponent)) this.setAnimState("Carve", 0.2);
        else this.setAnimState(this._turnDir > 0 ? "Turn_L" : "Turn_R", 0.2);
    } else if (this.isPushing && this.speed < this.currentMaxSpeed() * 0.97) {
        this.setAnimState("Push", 0.15);
    } else {
        // Carve with turn ~0 is Move, and it keeps easing out of a turn smoothly
        this.setAnimState(SkateboardObby_Carve(this._animComponent) ? "Carve" : "Move", 0.2);
    }
};

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.update = function (dt) {
    this._time += dt;
    // anim clips can finish loading after initialize; the fix is cheap and runs once per clip
    if (this._time < 3) SkateboardObby_AnimFix.apply(this._animComponent);

    if (this.app.keyboard.wasPressed(pc.KEY_R) && this.requestReset()) return;

    // switch from touch to keyboard controls if a key is used
    if (this.app.isMobile && (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)
        || this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)
        || this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)
        || this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN))) {
        this.app.isMobile = false;
        this.networkManager.mobileControls.enabled = this.app.isMobile;
        this.cameraScript.enabled = false;
        this.setCamera();
    }

    if (this.isDied) {
        this.speed = 0;
        this.app.skateSpeed = 0;
        return;
    }

    this.readInput();
    this.updateBoost(dt);

    if (this.app.playerItemManager && this.app.playerItemManager.flyingCarpet.enabled) {
        this.endRide(false);
        this.carpetMovement(dt);
    } else if (!this.updateRide(dt)) {
        this.updateSurface(dt);
        this.skateMovement(dt);
        this.checkRideStart(dt);
    }

    this.updateBody(dt);
    this.updateCameraFollow(dt);
    this.updateAnimations(dt);
    this.syncNetAnim();

    // rolling back counts too (the HUD shows how fast the board moves)
    this.app.skateSpeed = Math.round((this.speed + (this._rollBack || 0)) * this.speedDisplayMultiplier);

    this.updateFall(dt);
};

// ---------------------------------------------------------------------------
// falling: Ch_Fall plays while dropping into the void, then the character shatters where it is
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.updateFall = function (dt) {
    if (this.isDied) return;

    if (this._falling) {
        this._fallTimer -= dt;
        if (this._fallTimer <= 0) {
            this._falling = false;
            this.canDie = true;
            this._deathReason = SkateboardObbyPlayerController.DEATH_FALL;
            this.died();
        }
        return;
    }

    // only a fixed height counts as falling (no guessing from raycasts / air time)
    if (this.entity.getPosition().y < this.deathHeight) this.startFall();
};

SkateboardObbyPlayerController.prototype.updateSkid = function (dt) {
    if (!this.skid) return;
    this.skid.update(dt);

    const turnRate = dt > 0 ? Math.abs(this._lastTurnStep || 0) / dt : 0;
    const drifting = this.grounded && !this.isDied && this.speed > this.skidMinSpeed &&
        (turnRate > this.skidTurnRate || this.isBraking);
    this._skidHold = drifting ? 0.15 : (this.grounded && !this.isDied ? Math.max(0, this._skidHold - dt) : 0);
    if ((this._skidHold > 0) !== this.skidding) {
        this.skidding = this._skidHold > 0;
        this.app.fire("skate:skid", this.skidding);
    }

    const n = this._contactNormal;
    for (let i = 0; i < this.skidWheels.length; i++) {
        if (!drifting) { this._skidLast[i] = null; continue; }
        const wp = this.skidWheels[i].getPosition();
        this._gA.copy(n).mulScalar(0.4).add(wp);
        this._gB.copy(n).mulScalar(-1).add(wp);
        const hit = this.app.systems.rigidbody.raycastFirst(this._gA, this._gB, this._groundOnly);
        if (!hit) { this._skidLast[i] = null; continue; }
        const last = this._skidLast[i];
        if (!last) { this._skidLast[i] = hit.point.clone(); continue; }
        if (hit.point.distance(last) > 0.1) {
            this.skid.emit(last, hit.point, hit.normal);
            last.copy(hit.point);
        }
    }
};

// ---------------------------------------------------------------------------
// interactables (SkateboardObby_Interactable): slippery puddle, sticky goo, grind rail, loop
// ---------------------------------------------------------------------------

// slippery / sticky ground under the board
SkateboardObbyPlayerController.prototype.updateSurface = function (dt) {
    let surface = null;
    const list = this.app.skateInteractables;
    if (list && list.length) {
        const feet = this.body.getPosition();
        const lp = new pc.Vec3();
        for (const it of list) {
            if (it.kind !== "slippery" && it.kind !== "sticky") continue;
            if (!it.entity.enabled) continue;
            it.toLocal(feet, lp);
            const s = it.localScale();
            const min = it.localAabb.getMin(), max = it.localAabb.getMax();
            const insetX = (max.x - min.x) * 0.06, insetZ = (max.z - min.z) * 0.06;
            if (lp.x < min.x + insetX || lp.x > max.x - insetX) continue;
            if (lp.z < min.z + insetZ || lp.z > max.z - insetZ) continue;
            if (lp.y < min.y - 0.6 / s || lp.y > max.y + 0.6 / s) continue;
            surface = it.kind;
            if (surface === "sticky") break;
        }
    }

    // the board keeps sliding for a moment after leaving the puddle
    if (surface === "slippery") this._slipTimer = 0.35;
    else if (this._slipTimer > 0) {
        this._slipTimer -= dt;
        if (!surface) surface = "slippery";
    }

    if (surface !== this._surface) {
        if (surface === "slippery" && this._surface !== "slippery" && this.speed > 6) this.playOneShot("Slip", 0.9, 0.08);
        if (surface === "sticky" && this.speed > 9) this.playOneShot("Stumble", 0.6, 0.08);
        this._surface = surface;
    }
};

SkateboardObbyPlayerController.prototype.checkRideStart = function (dt) {
    if (this._rideCooldown > 0) { this._rideCooldown -= dt; return; }
    const list = this.app.skateInteractables;
    if (!list || !list.length || this.isDied || this._falling) return;
    const feet = this.body.getPosition();
    const vel = this.entity.rigidbody.linearVelocity;
    for (const it of list) {
        if (!it.entity.enabled) continue;
        if (it.kind === "grind" && this.tryStartGrind(it, feet, vel)) return;
        if (it.kind === "loop" && this.tryStartLoop(it, feet, vel)) return;
    }
};

// random grind / slide clip for this rail ("Grind" if the state graph does not have it)
SkateboardObbyPlayerController.prototype.pickGrindAnim = function () {
    const list = SkateboardObbyPlayerController.GRINDS;
    const name = list[Math.floor(Math.random() * list.length)];
    return this.animLayer && this.animLayer.states.indexOf(name) >= 0 ? name : "Grind";
};

SkateboardObbyPlayerController.prototype.beginRide = function (ride) {
    this._ride = ride;
    if (ride.type === "grind") ride.anim = this.pickGrindAnim();
    ride.feetOffset = this.entity.getPosition().clone().sub(this.body.getPosition());
    ride.jumpArmed = !this._requestedJump;
    this._oneShotTimer = 0;
    this._oneShotState = null;
    this._animState = null;
    this._surface = null;
    this._slipTimer = 0;
};

// grind rail: catch the player when he comes down onto the bar (ollie onto it)
SkateboardObbyPlayerController.prototype.tryStartGrind = function (it, feet, vel) {
    if (this.grounded) return false;
    if (vel.y > 4) return false;
    const s = it.localScale();
    const lp = it.toLocal(feet);
    const min = it.localAabb.getMin(), max = it.localAabb.getMax();
    if (Math.abs(lp.x) > 0.6 / s) return false;
    if (lp.y < it.railHeight - 0.35 / s || lp.y > it.railHeight + 1.0 / s) return false;
    if (lp.z < min.z + 0.2 / s || lp.z > max.z - 0.2 / s) return false;

    const railDir = it.dirToWorld(new pc.Vec3(0, 0, 1));
    const h = new pc.Vec3(vel.x, 0, vel.z);
    const hs = h.length();
    let along = h.dot(railDir);
    let sign;
    if (hs > 1.5) {
        if (Math.abs(along) / hs < 0.35) return false; // crossing the rail, not landing on it
        sign = along >= 0 ? 1 : -1;
    } else {
        sign = this._heading.dot(railDir) >= 0 ? 1 : -1;
    }
    this.beginRide({ type: "grind", it: it, s: lp.z, sign: sign, v: Math.max(Math.abs(along), this.speed * 0.8, this.grindMinSpeed) });
    return true;
};

// loop: ride into the bottom of the loop (towards local -Z)
SkateboardObbyPlayerController.prototype.tryStartLoop = function (it, feet, vel) {
    const s = it.localScale();
    const lp = it.toLocal(feet);
    if (Math.abs(lp.x - it.loopEntryX) > it.loopLaneHalfWidth + 0.5 / s) return false;
    if (lp.z < -0.5 / s || lp.z > 0.8 / s) return false;
    if (lp.y < -0.5 / s || lp.y > 1.0 / s) return false;
    const lv = it.dirToLocal(vel).normalize();
    const hs = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hs < 1 || lv.z > -0.5) return false;
    this.beginRide({
        type: "loop", it: it, p: 0, dir: 1,
        v0: Math.max(hs, this.speed),
        xOff: pc.math.clamp(lp.x - it.loopEntryX, -it.loopLaneHalfWidth, it.loopLaneHalfWidth)
    });
    return true;
};

// returns true while a ride (grind / loop) controls the player
SkateboardObbyPlayerController.prototype.updateRide = function (dt) {
    const r = this._ride;
    if (!r) return false;
    if (this.isDied || !r.it || !r.it.entity || !r.it.entity.enabled) { this.endRide(false); return false; }
    if (!this._requestedJump) r.jumpArmed = true;
    if (this.boostTimer > 0 && r.v != null) r.v = Math.max(r.v, this.speed);

    if (r.type === "grind") this.updateGrind(r, dt);
    else this.updateLoop(r, dt);

    if (!this._ride) return true;
    this.grounded = true;
    this._airTime = 0;
    this._timeSinceLastGrounded = 0;
    return true;
};

SkateboardObbyPlayerController.prototype.updateGrind = function (r, dt) {
    const it = r.it, s = it.localScale();
    const min = it.localAabb.getMin(), max = it.localAabb.getMax();
    r.v = Math.max(this.grindMinSpeed * 0.6, r.v - this.grindFriction * dt);
    r.s += r.sign * r.v * dt / s;
    const dir = it.dirToWorld(new pc.Vec3(0, 0, r.sign));
    r.fwd = dir;

    if (this._requestedJump && r.jumpArmed && this.canMove()) { this.endRide(true); return; }
    if (r.s < min.z || r.s > max.z) { this.endRide(false); return; }

    const feet = it.toWorld(new pc.Vec3(0, it.railHeight, r.s));
    const rb = this.entity.rigidbody;
    rb.teleport(feet.add(r.feetOffset));
    rb.linearVelocity = dir.clone().mulScalar(r.v);

    this.speed = r.v;
    this.headingDeg = Math.atan2(dir.x, dir.z) * pc.math.RAD_TO_DEG;
    this._heading.set(dir.x, 0, dir.z).normalize();
    this._contactNormal.set(0, 1, 0);
    this.turnAmount = 0;
};

SkateboardObbyPlayerController.prototype.updateLoop = function (r, dt) {
    const it = r.it, s = it.localScale();
    const R = it.loopRadius;              // local units, board on the track
    const Rw = R * s;                     // world units
    const pr = r.p * pc.math.DEG_TO_RAD;
    const h = Rw * (1 - Math.cos(pr));
    const v = Math.sqrt(Math.max(r.v0 * r.v0 - 2 * this.loopGravity * h, 0));
    if (r.dir > 0 && v < this.loopMinSpeed) r.dir = -1; // too slow: slide back down
    const vv = Math.max(v, this.loopMinSpeed);
    r.v = vv;
    r.p += r.dir * (vv / Rw) * pc.math.RAD_TO_DEG * dt;

    if (r.p >= 360) { r.p = 360; this.placeOnLoop(r); this.endRide(false); return; }
    if (r.p <= 0 && r.dir < 0) { r.p = 0; this.placeOnLoop(r); this.endRide(false); return; }
    this.placeOnLoop(r);
    this.speed = vv;
};

SkateboardObbyPlayerController.prototype.placeOnLoop = function (r) {
    const it = r.it;
    const R = it.loopRadius, pr = r.p * pc.math.DEG_TO_RAD;
    const x = it.loopEntryX + r.xOff + it.loopDrift * (r.p / 360);
    const feetLocal = new pc.Vec3(x, it.loopCenterY - R * Math.cos(pr), -R * Math.sin(pr));
    const upLocal = new pc.Vec3(0, Math.cos(pr), Math.sin(pr));
    const fwdLocal = new pc.Vec3(it.loopDrift / (2 * Math.PI), R * Math.sin(pr), -R * Math.cos(pr)).mulScalar(r.dir);

    const feet = it.toWorld(feetLocal);
    r.up = it.dirToWorld(upLocal);
    r.fwd = it.dirToWorld(fwdLocal);
    const rb = this.entity.rigidbody;
    rb.teleport(feet.add(r.up.clone().mulScalar(r.feetOffset.length())));
    rb.linearVelocity = r.fwd.clone().mulScalar(r.v || 0);
    this._contactNormal.copy(r.up);
};

SkateboardObbyPlayerController.prototype.endRide = function (jump) {
    const r = this._ride;
    if (!r) return;
    this._ride = null;
    this._rideCooldown = 0.35;
    const v = r.v || this.speed;
    const dir = (r.fwd || this._heading).clone(); dir.y = 0;
    if (dir.lengthSq() < 0.0001) dir.copy(this._heading);
    dir.normalize();

    this.speed = v;
    this.headingDeg = Math.atan2(dir.x, dir.z) * pc.math.RAD_TO_DEG;
    this._heading.copy(dir);
    this._contactNormal.set(0, 1, 0);
    this._animState = null;

    const vel = dir.clone().mulScalar(v);
    if (jump) {
        vel.y = this.jumpHeight;
        this._jumped = true;
        this._timeSinceLastJump = 0;
        this.grounded = false;
        if (this.entity.sound.slot("jump")) this.entity.sound.play("jump");
        this.onJump(true);
    } else if (r.type === "grind") {
        vel.y = 2;
        this.grounded = false;
    }
    this.entity.rigidbody.linearVelocity = vel;
    this._lastCmdDir.copy(dir);
    this._lastCommandedSpeed = v;
};

// rotate the board/character so that +Z = fwd and +Y = up (used upside down in the loop)
SkateboardObbyPlayerController.prototype.setBodyFrame = function (fwd, up) {
    const z = fwd.clone().normalize();
    const x = new pc.Vec3().cross(up, z).normalize();
    const y = new pc.Vec3().cross(z, x);
    const m = new pc.Mat4();
    const d = m.data;
    d[0] = x.x; d[1] = x.y; d[2] = x.z;
    d[4] = y.x; d[5] = y.y; d[6] = y.z;
    d[8] = z.x; d[9] = z.y; d[10] = z.z;
    const q = new pc.Quat().setFromMat4(m);
    this._quatLerp.copy(q);
    this.body.setRotation(q);
};

SkateboardObbyPlayerController.prototype.startFall = function () {
    if (this._falling || this.isDied) return;
    this._falling = true;
    this._fallTimer = this.fallAnimTime;
    this.boostTimer = 0;
    this.app.targetFov = 60;
    if (this.boostParticle) this.boostParticle.enabled = false;
    this.playOneShot("Fall", this.fallAnimTime + 5, 0.1);
};

SkateboardObbyPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};

//Only gets y euler angle between -180, 180
SkateboardObbyPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

// ---------------------------------------------------------------------------
// network
// ---------------------------------------------------------------------------

// one-shots the other players cannot work out from the movement: finish landing, death fall, slippery / sticky ground
SkateboardObbyPlayerController.NET_ONE_SHOTS = { Celebrate: true, Fall: true, Slip: true, Stumble: true };

// trick / grind clip for the other players (server field "anim", "" = normal riding); sent only when it changes
SkateboardObbyPlayerController.prototype.syncNetAnim = function () {
    const room = this.networkManager && this.networkManager.room;
    if (!room || !room.connection || room.connection.isOpen === false) return;
    if (this._netAnimRoom !== room) {
        const me = room.state && room.state.players ? room.state.players.get(room.sessionId) : null;
        if (!me) return;
        this._netAnimRoom = room;
        this._netAnimOk = "anim" in me;   // old server: no field
        this._netAnim = "";
    }
    if (!this._netAnimOk) return;
    let anim = "";
    if (this._ride && this._ride.type === "grind") anim = this._ride.anim || "Grind";
    else if (this._oneShotTimer > 0 && this._oneShotState && this._oneShotState.indexOf("Trick") === 0) anim = this._oneShotState;
    else if (this._oneShotTimer > 0 && this._oneShotState === SkateboardObby_Finisher.STATE) anim = this._finisherNet || SkateboardObby_Finisher.STATE;
    else if (this._oneShotTimer > 0 && SkateboardObbyPlayerController.NET_ONE_SHOTS[this._oneShotState] === true) anim = this._oneShotState;
    else if (this.boostTimer > 0) anim = "Boost";   // not a clip: remote players show the boost sparks
    if (anim === this._netAnim) return;
    this._netAnim = anim;
    room.send("Client:SetAnim", { anim: anim });
};

SkateboardObbyPlayerController.prototype.sendPosition = function () {
    if (this.networkManager.room == null || this.networkManager.room.connection.isOpen === false) return;
    const euler = this.body.getEulerAngles();
    // flat-ground hover: send the lowered visual height so the remote board sits on the ground too
    const hoverDrop = this._bodyBaseY != null ? (this.body.getLocalPosition().y - this._bodyBaseY) * (this.entity.getLocalScale().y || 1) : 0;

    // standing still: nothing to send (a new room after a lost connection always gets one)
    const pos = this.entity.getPosition();
    const sent = this._netSent || (this._netSent = {});
    if (sent.room === this.networkManager.room && sent.grounded === this.grounded && sent.pushing === this.isPushing &&
        Math.abs(sent.x - pos.x) < 0.002 && Math.abs(sent.y - pos.y - hoverDrop) < 0.01 && Math.abs(sent.z - pos.z) < 0.002 &&
        Math.abs(sent.rx - euler.x) < 0.5 && Math.abs(sent.ry - euler.y) < 0.5 && Math.abs(sent.rz - euler.z) < 0.5) return;
    sent.room = this.networkManager.room;
    sent.grounded = this.grounded;
    sent.pushing = this.isPushing;
    sent.x = pos.x; sent.y = pos.y + hoverDrop; sent.z = pos.z;
    sent.rx = euler.x; sent.ry = euler.y; sent.rz = euler.z;

    this.networkManager.room.send("Client:Movement", {
        x: pos.x,
        y: pos.y + hoverDrop,
        z: pos.z,

        rotationX: euler.x,
        rotationY: euler.y,
        rotationZ: euler.z,

        grounded: this.grounded,
        isWalking: this.isPushing,
        isClimbing: false,
        isOnLadder: false,
    });
};

// ---------------------------------------------------------------------------
// camera
// ---------------------------------------------------------------------------

SkateboardObbyPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.camera.script.skateboardObbyCameraController.enabled = false;
        this.cameraScript = this.camera.script.skateboardObbyMobileCameraController;
    } else {
        this.camera.script.skateboardObbyMobileCameraController.enabled = false;
        this.cameraScript = this.camera.script.skateboardObbyCameraController;
    }

    this.cameraScript.enabled = true;
    this.cameraScript.resetCamera();
};

SkateboardObbyPlayerController.prototype.lockCamera = function (state = false) {
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
};

// ---------------------------------------------------------------------------
// death / respawn / checkpoints
// ---------------------------------------------------------------------------

// R / Reset button: kill + respawn at the checkpoint.
// Presses while reset cannot work (falling, dead, just respawned) keep it locked a bit longer,
// so spamming R during a fall does not kill the player again right after respawning.
SkateboardObbyPlayerController.prototype.requestReset = function () {
    const now = this._time || 0;
    const blocked = !this.canMove() || this.canDie === false || now < (this._resetBlockUntil || 0);
    if (blocked) {
        this._resetBlockUntil = Math.max(this._resetBlockUntil || 0, now + 0.6);
        return false;
    }
    this._resetBlockUntil = now + 0.6;
    this._deathReason = "reset (R / Reset button)";
    this.app.fire("playerDie");
    return true;
};

SkateboardObbyPlayerController.prototype.died = function () {
    const cause = this._deathReason || "playerDie event";
    this._deathReason = null;
    if (this.isDied || this.canDie == false) return;

    // safety net: in the first respawnGuardTime seconds after a respawn only a real fall can kill
    // (the re-death bug itself was fixed in teleportBody, this only guards against unknown causes)
    if (cause !== SkateboardObbyPlayerController.DEATH_FALL && (this._time || 0) < (this._respawnGuardUntil || 0)) {
        return;
    }

    this._ride = null;
    if (this.app.gameplayStarted === true) {
        PokiSDK.gameplayStop();
        this.app.gameplayStarted = false;
    }

    this.app.fire("MarketClose");

    // shatter the character (own mesh, own texture, current pose) right where it is
    const carry = this._heading.clone().mulScalar(Math.min(this.speed, 10) * 0.3);
    try {
        this.spawnedDeadBody = SkateboardObby_Shatter.explode(this.app, this.playerRendererEntity, { force: this.shatterForce, velocity: carry });
    } catch (e) {
        console.warn("[SkateboardObby] shatter failed, using DeadPlayer template", e);
        let deadPlayerEntity = this.deadPlayer.resource.instantiate();
        let playerPos = this.entity.getPosition().clone();
        this.app.root.addChild(deadPlayerEntity);
        deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
        deadPlayerEntity.setRotation(this.body.getRotation().clone());
        let deadPlayerEntityBody = deadPlayerEntity.children[0];
        deadPlayerEntityBody.enabled = true;
        this.spawnedDeadBody = deadPlayerEntity;
    }
    this.playerRendererEntity.enabled = false;
    this.overHeadGroup.enabled = false;
    this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.isDied = true;
    this.app.isDied = true;
    this.speed = 0;
    this.boostTimer = 0;
    this.app.targetFov = 60;
    if (this.boostParticle) this.boostParticle.enabled = false;

    this.networkManager.diedEffect();
    this.entity.collision.enabled = false;
    this.entity.rigidbody.type = "kinematic";
    if (this.networkManager.room)
        this.networkManager.room.send("Client:Died", {});
    this.lockCamera(true);

    this.app.fire("PlayerDied");
};

SkateboardObbyPlayerController.prototype.respawn = function (vipRespawn = false) {
    // short guard against non-fall deaths, in game time (replaces the old 1 s setTimeout on canDie)
    this.canDie = true;
    this._respawnGuardUntil = (this._time || 0) + this.respawnGuardTime;
    this.body.setRotation(new pc.Quat());

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.isDied = false;
    this.app.isDied = false;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    this.spawnedDeadBody = null;
    this._falling = false;
    this._ride = null;
    this._surface = null;
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic";
    this.speed = 0;
    this._lastCommandedSpeed = 0;
    this.boostTimer = 0;
    this._oneShotTimer = 0;
    this._animState = null;
    this.teleportToSavedSpawn();
    this._resetBlockUntil = this._time + 1.0;
    this._respawnTime = this._time;

    setTimeout(() => { this.cameraScript.reset(); this.faceSpawnCamera(); }, 100);
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:Respawn", {});
    }
    this.lockCamera(false);

    if (this.app.playerItemManager && this.app.playerItemManager.playerData && this.app.playerItemManager.playerData.testID) {
        this.app.fire("Respawned", this.app.playerItemManager.playerData.testID);
    } else {
        this.app.fire("Respawned");
    }
};

SkateboardObbyPlayerController.prototype.stop = function () {
    this.speed = 0;
    this._lastCommandedSpeed = 0;
    this._desiredVelocity = new pc.Vec3(0, 0, 0);
    this.entity.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
    this.entity.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);

    setTimeout(() => {
        this.speed = 0;
        this.entity.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
        this.entity.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);
    }, 50);
};

SkateboardObbyPlayerController.prototype.getCheckpointSpawn = function () {
    if (this.app.checkpoint == null || this.app.checkpoint < 0) { return null; }

    let _checkpointRoot = this.app.root.findByName("Checkpoints");
    if (!_checkpointRoot) { return null; }

    let _checkpoint = _checkpointRoot.children[this.app.checkpoint];
    if (!_checkpoint) { return null; }

    // the checkpoint script turns its SpawnPoint towards the next checkpoint first (spawnFacing "next")
    const _checkpointScript = _checkpoint.script && _checkpoint.script.skateboardObbyCheckpoint;
    if (_checkpointScript && _checkpointScript.getSpawnPoint) { return _checkpointScript.getSpawnPoint(); }
    return _checkpoint.findByName("SpawnPoint");
};

/*
 * Moves the player's physics body so that the move sticks at every frame rate.
 * rigidbody.teleport() only sets Ammo's world transform. The engine would also reset the body's
 * interpolation transform, but this project's Ammo build has no setInterpolationWorldTransform, so the
 * body's motion state keeps the OLD position. On a frame where physics runs no fixed sub-step (common
 * above 60 fps) Ammo then writes that old position back to the entity. After a respawn the old position
 * was the death spot below deathHeight: updateFall started a new fall and the player died again 1.3 s
 * later while standing on the spawn ("explodes again after respawning", 2026-10-14).
 */
SkateboardObbyPlayerController.prototype.teleportBody = function (position, resetVelocity) {
    const rb = this.entity.rigidbody;
    this._vert = null;
    this._rampArm = null;
    rb.teleport(position);
    if (resetVelocity) {
        rb.linearVelocity = pc.Vec3.ZERO;
        rb.angularVelocity = pc.Vec3.ZERO;
    }
    const nb = rb.body;
    if (!nb || !nb.setCenterOfMassTransform) return;
    const t = nb.getWorldTransform();
    nb.setCenterOfMassTransform(t);   // also resets Ammo's interpolation transform + velocities
    const ms = nb.getMotionState();
    if (ms) ms.setWorldTransform(t);
};

SkateboardObbyPlayerController.prototype.teleportToSavedSpawn = function () {
    let _checkpointSpawn = this.getCheckpointSpawn();
    if (_checkpointSpawn) {
        this.teleportBody(_checkpointSpawn.getPosition(), true);
        this.faceSpawn(_checkpointSpawn);
        return;
    }

    let _spawn = this.app.root.findByName("LobbySpawnPoint");
    if (_spawn) {
        this.teleportBody(_spawn.getPosition(), true);
        this.faceSpawn(_spawn);
    }
};

SkateboardObbyPlayerController.prototype.faceSpawn = function (_spawn) {
    this.spawnYaw = this.getYaw(_spawn.getRotation());
    this.headingDeg = this.spawnYaw;
    this._quatLerp.setFromEulerAngles(0, this.spawnYaw, 0);
    this.body.setRotation(this._quatLerp);
    this.rayPoint.setRotation(this._quatLerp);
    this.faceSpawnCamera();
};

SkateboardObbyPlayerController.prototype.faceSpawnCamera = function () {
    if (this.spawnYaw == null || !this.cameraScript || !this.cameraScript.eulers) return;
    this.cameraScript.eulers.x = (this.spawnYaw + 360) % 360;
};

SkateboardObbyPlayerController.prototype.teleport = function () {
    this.stop();
    this.teleportToSavedSpawn();
};

SkateboardObbyPlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {
    this.teleportBody(_position, false);
    if (_rotation != null) { this.headingDeg = _rotation; }
};

SkateboardObbyPlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(-1);
    this.app.fire("resetStage");
};

SkateboardObbyPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float;
    this.entityScale = _float;
    this._desiredVelocity = new pc.Vec3();
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
};

// skin / board ids: SkateboardObby_Cosmetics (0 default, 1 VIP, 2 BOSS VIP). PlayerItemManager applies the local ones itself.
SkateboardObbyPlayerController.prototype.setSkin = function (_int) {
    const _items = this.app.playerItemManager;
    SkateboardObby_Cosmetics.apply(this.app, _items ? _items.database : null, this.entity, "skin", _int);
};

SkateboardObbyPlayerController.prototype.setBoard = function (_int) {
    const _items = this.app.playerItemManager;
    SkateboardObby_Cosmetics.apply(this.app, _items ? _items.database : null, this.entity, "board", _int);
};

// [VIP] / [BOSS VIP] over the head + username color (VipManager, only when the level changes)
SkateboardObbyPlayerController.prototype.setVip = function (_level, _name, _color) {
    if (this.vipLabel && this.vipLabel.element) {
        this.vipLabel.enabled = _level > 0;
        if (_level > 0) {
            this.vipLabel.element.text = "[" + _name + "]";
            this.vipLabel.element.color = _color;
        }
    }
    if (this.usernameEntity && this.usernameEntity.element) {
        this.usernameEntity.element.color = _level > 0 ? _color : this.usernameColor;
    }
};

SkateboardObbyPlayerController.prototype.setActiveHandItem = function (newHandItem) {

};
