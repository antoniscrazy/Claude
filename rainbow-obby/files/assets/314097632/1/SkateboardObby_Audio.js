/*
 * SkateboardObby_Audio
 * All Skateboard sounds. Like SkateboardObby_Analytics it only listens to events and reads public fields of the other
 * scripts; nothing else calls it.
 *
 * All sounds at once: Master Volume below (0.5 = -6 dB). It covers this entity, the 3D obstacle and remote player voices, and
 * every other sound component in the scene except MusicPlayer (Player, GameManager, power-ups, bowling pins).
 *
 * To change a sound: select the "Audio" entity (scene root), Sound component, pick the slot named after the event,
 * change Asset / Volume / Pitch. Nothing else has to change. A new looped sound: keep the slot's Loop on, and set Start
 * Time / Duration when the file has padding (tools/skate_audio/convert.js). Slots with Overlap off are looped sounds.
 *
 *   roll         rolling loop (speed + rollback sets volume and pitch, silent in the air and on a rail)
 *   push         foot on the ground, very quiet
 *   ollie        pop of the board
 *   land1..3     landing, random, louder after a long fall
 *   trick        flip while in the air
 *   grind, slide loops on a rail (slide = Slide_* clips)
 *   vert         flying out of a ramp, bowl or halfpipe
 *   loopFx       entering a loop
 *   brake, bump  braking, hitting a wall / sticky ground (Stumble)
 *   boost        boost button and boost pads (played through the Player's "prize" slot)
 *   tramp        trampoline
 *   wind         while a fan pushes the player
 *   ring         ring +10 coins (played through a "ring" slot added to the Player)
 *   purchase, warning   shop purchase and warnings (played through the GameManager's slots; the shared files are almost silent)
 *   death        player shatters
 *   finishFly, finish   final jump takeoff, landing
 *   portal       restart / coming soon / worlds portal
 *   click        every UI button except the mobile controls
 *   panelOpen, panelClose   shop, worlds, VIP, pause menu, popups
 *   saw, fan, laser    3D loops of the nearest obstacles (Hazard Loops at once, stage chunk open only)
 *   crush, swing       3D one-shots of the nearest crushers / pendulums (Hazard Shots at once)
 * Bowling pins have their own Hit Sound attribute on Pins_Bowling. Coins and checkpoints stay on the Player's slots
 * collectCoin and checkpoint (Coin Volume, Checkpoint Volume below).
 *
 * Other scripts can play any slot of the Audio entity: app.fire('skate:sound', 'panelOpen'). A new panel gets click sounds
 * from its button components by itself; if it uses app.isMarketEnabled / isPopupEnabled it gets panelOpen / panelClose too,
 * otherwise it fires them with this event.
 *
 * Remote players: no loops except grind, only landing and grind, quiet and 3D, nearest Remote Voices players in range.
 * Ads mute everything through app.systems.sound.volume (Helpers watchRewarded / watchCommercial).
 * No allocations in update except when a sound starts.
 */
var SkateboardObbyAudio = pc.createScript('skateboardObbyAudio');

SkateboardObbyAudio.attributes.add('masterVolume', { type: 'number', default: 0.5, min: 0, max: 1, title: 'Master Volume', description: 'All Skateboard sounds. 0.5 = -6 dB, 0.7 = -3 dB, 1 = slot volumes as they are' });
SkateboardObbyAudio.attributes.add('rollPitchMin', { type: 'number', default: 0.8, title: 'Roll Pitch Min' });
SkateboardObbyAudio.attributes.add('rollPitchMax', { type: 'number', default: 1.2, title: 'Roll Pitch Max' });
SkateboardObbyAudio.attributes.add('rollVolumeMin', { type: 'number', default: 0.4, title: 'Roll Volume At Low Speed', description: '0..1 of the roll slot volume' });
SkateboardObbyAudio.attributes.add('rollBackVolume', { type: 'number', default: 0.6, title: 'Roll Volume Rolling Back', description: '0..1 of the normal volume' });
SkateboardObbyAudio.attributes.add('rollWobblePitch', { type: 'number', default: 0.012, title: 'Roll Wobble Pitch', description: 'Slow drift (+-) so the rolling loop never sounds exactly the same. 0 = off' });
SkateboardObbyAudio.attributes.add('rollWobbleVolume', { type: 'number', default: 0.06, title: 'Roll Wobble Volume', description: 'Slow drift (+-, 0..1 of the volume)' });
SkateboardObbyAudio.attributes.add('rollFadeIn', { type: 'number', default: 8, title: 'Roll Fade In (1/s)' });
SkateboardObbyAudio.attributes.add('rollFadeAir', { type: 'number', default: 16, title: 'Roll Fade In Air (1/s)' });
SkateboardObbyAudio.attributes.add('pitchRate', { type: 'number', default: 5, title: 'Pitch Smoothing (1/s)' });
SkateboardObbyAudio.attributes.add('pushInterval', { type: 'number', default: 0.9, title: 'Push Interval (s)' });
SkateboardObbyAudio.attributes.add('minAirTime', { type: 'number', default: 0.25, title: 'Landing Min Air Time (s)' });
SkateboardObbyAudio.attributes.add('landQuiet', { type: 'number', default: 0.5, title: 'Landing Volume Small Hop', description: '0..1 of the land slot volume' });
SkateboardObbyAudio.attributes.add('landFallSpeed', { type: 'number', default: 20, title: 'Landing Full Volume Fall Speed (m/s)' });
SkateboardObbyAudio.attributes.add('coinVolume', { type: 'number', default: 1, title: 'Coin Volume' });
SkateboardObbyAudio.attributes.add('checkpointVolume', { type: 'number', default: 0.4, title: 'Checkpoint Volume' });
SkateboardObbyAudio.attributes.add('remoteVoices', { type: 'number', default: 3, title: 'Remote Voices' });
SkateboardObbyAudio.attributes.add('remoteRange', { type: 'number', default: 40, title: 'Remote Range (m)' });
SkateboardObbyAudio.attributes.add('remoteVolume', { type: 'number', default: 0.5, title: 'Remote Volume', description: '0..1 of the slot volume' });
SkateboardObbyAudio.attributes.add('hazardLoops', { type: 'number', default: 2, title: 'Hazard Loops' });
SkateboardObbyAudio.attributes.add('hazardShots', { type: 'number', default: 2, title: 'Hazard Shots' });
SkateboardObbyAudio.attributes.add('hazardRange', { type: 'number', default: 30, title: 'Hazard Range (m)' });
SkateboardObbyAudio.attributes.add('laserRange', { type: 'number', default: 15, title: 'Laser Range (m)', description: 'Lasers are only heard this close (the other obstacles use Hazard Range)' });
SkateboardObbyAudio.attributes.add('crushSpeed', { type: 'number', default: 2.5, title: 'Crusher Hit Speed (m/s)', description: 'A crusher moving faster than this (and near its fastest speed so far, so the slow way back does not count) and then stopping = hit sound' });
SkateboardObbyAudio.attributes.add('swingSpeed', { type: 'number', default: 1.1, title: 'Swing Whoosh Speed (rad/s)' });

// obstacle kinds by the name of their Obs_ entity (first match)
SkateboardObbyAudio.HAZARD_KINDS = [
    { re: /Testere/, kind: 'saw', loop: true },
    { re: /Pervane/, kind: 'fan', loop: true },
    { re: /Lazer/, kind: 'laser', loop: true },
    { re: /Ezici|Piston|Kapanan_Duvar/, kind: 'crush', loop: false },
    { re: /Balta|Sallanan_Top|Cekic/, kind: 'swing', loop: false }
];
SkateboardObbyAudio.LOOP_KINDS = ['saw', 'fan', 'laser'];

SkateboardObbyAudio.prototype.initialize = function () {
    this.sound = this.entity.sound;
    this._t = 0;
    this._scan = 0;
    this._air = 0;
    this._fall = 0;
    this._pushT = 0;
    this._lastDied = false;
    this._lastRide = null;
    this._lastVert = false;
    this._lastShot = '';
    this._lastBrake = false;
    this._bounce = false;
    this._windHit = false;
    this._panels = 0;
    this._cool = {};           // slot name -> time it may play again
    this._buttons = [];
    this.remotes = [];
    this.hazards = [];
    this.winds = [];
    this.portals = [];
    this.wportals = [];
    this.pins = [];
    this.remoteVoiceList = [];
    this.hazardLoopVoices = [];
    this.hazardShotVoices = [];
    this._landNames = ['land1', 'land2', 'land3'];

    this.rollLoop = this.makeLoop('roll');
    this.grindLoop = this.makeLoop('grind');
    this.slideLoop = this.makeLoop('slide');
    this.windLoop = this.makeLoop('wind');
    this.brakeLoop = this.makeLoop('brake');

    this.app.on('PlayerDied', this.onDied, this);
    this.app.on('Respawned', this.onRespawned, this);
    this.app.on('skate:finishJump', this.onFinishJump, this);
    this.app.on('skate:finished', this.onFinished, this);
    this.app.on('skate:restartCourse', this.onRestart, this);
    this.app.on('skate:sound', this.onSoundEvent, this);
    this.app.on('player:add', this.onPlayerAdd, this);
    this.app.on('player:remove', this.onPlayerRemove, this);

    this.app.systems.button.on('add', this.onButtonAdded, this);

    this.on('attr:masterVolume', this.applyMaster, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyAudio.prototype.postInitialize = function () {
    this.pcs = this.app.skateboardObbyPlayerController || null;
    if (this.pcs) {
        this.pcs.entity.on('jump', this.onOllie, this);
        this.setupPlayerSlots();
    }

    const scripts = this.app.root.findComponents('script');
    for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        if (s.skateboardObbyObstacle) this.addHazard(s.skateboardObbyObstacle);
        if (s.skateboardObbyWind) this.winds.push(s.skateboardObbyWind);
        if (s.skateboardObbyBowlingPins) this.pins.push(s.skateboardObbyBowlingPins);
        if (s.skateboardObbyFinishPortal) this.portals.push({ script: s.skateboardObbyFinishPortal, cool: 0 });
        if (s.skateboardObbyWorldsPortal) this.wportals.push({ script: s.skateboardObbyWorldsPortal, armed: true });
        // the ring reward plays this Player slot (set up in setupPlayerSlots)
        if (s.skateboardObbyRingRewards && this.pcs && this.pcs.entity.sound.slot('ring')) s.skateboardObbyRingRewards.sound = 'ring';
    }

    this._soundComps = this.app.root.findComponents('sound').filter(c => c.entity !== this.entity && c.entity.name !== 'MusicPlayer').map(c => ({ comp: c, base: c.volume }));
    this.applyMaster();

    const buttons = this.app.root.findComponents('button');
    for (let i = 0; i < buttons.length; i++) this.hookButton(buttons[i]);

    this.buildVoices();
};

// ---------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------

SkateboardObbyAudio.prototype.makeLoop = function (name) {
    const slot = this.sound.slot(name);
    return { slot: slot, base: slot ? slot.volume : 0, vol: 0, pitch: 1, wVol: -1, wPitch: -1, on: false, idle: 0 };
};

// The Player's sound component came from the template at volume 0.15 and 3D. It is the player's own sound: full volume,
// 2D, and every slot gets its real volume here (the scene values were multiplied by 0.15).
SkateboardObbyAudio.prototype.setupPlayerSlots = function () {
    const ps = this.pcs.entity.sound;
    if (!ps) return;
    ps.volume = 1;
    ps.positional = false;
    const set = function (name, vol) { const s = ps.slot(name); if (s) s.volume = vol; };
    // ollie and the trampoline both play "jump": this script plays them instead (ollie event, playerBounce)
    set('jump', 0);
    set('collectCoin', this.coinVolume);
    set('checkpoint', this.checkpointVolume);

    // boost button and boost pads play "prize"
    const boost = this.sound.slot('boost'), prize = ps.slot('prize');
    if (boost && prize) { prize.asset = boost.asset; prize.volume = boost.volume; prize.pitch = boost.pitch; }
    const ring = this.sound.slot('ring');
    if (ring && !ps.slot('ring')) ps.addSlot('ring', { asset: ring.asset, volume: ring.volume, pitch: ring.pitch, overlap: true });

    const gm = this.app.gameManager && this.app.gameManager.entity.sound;
    if (gm) {
        const names = ['purchase', 'warning'];
        for (let i = 0; i < names.length; i++) {
            const from = this.sound.slot(names[i]), to = gm.slot(names[i]);
            if (from && to) { to.asset = from.asset; to.volume = from.volume; to.pitch = from.pitch; }
        }
    }
};

SkateboardObbyAudio.prototype.addHazard = function (obs) {
    const name = obs.entity.name, kinds = SkateboardObbyAudio.HAZARD_KINDS;
    for (let i = 0; i < kinds.length; i++) {
        if (kinds[i].re.test(name)) {
            this.hazards.push({ obs: obs, entity: obs.entity, kind: kinds[i].kind, loop: kinds[i].loop, voice: null, dist: 1e9 });
            return;
        }
    }
};

SkateboardObbyAudio.prototype.copySlot = function (sound, name, loop, overlap) {
    const src = this.sound.slot(name);
    if (!src) return null;
    return sound.addSlot(name, { asset: src.asset, volume: src.volume, pitch: src.pitch, loop: loop, overlap: overlap, startTime: src.startTime, duration: src.duration, autoPlay: false });
};

SkateboardObbyAudio.prototype.makeVoice = function (name, range) {
    const e = new pc.Entity(name);
    this.entity.addChild(e);
    e.addComponent('sound', { positional: true, volume: this.masterVolume, pitch: 1, refDistance: 4, maxDistance: range, rollOffFactor: 1, distanceModel: 'linear' });
    return e;
};

SkateboardObbyAudio.prototype.buildVoices = function () {
    const kinds = SkateboardObbyAudio.LOOP_KINDS;
    for (let i = 0; i < this.hazardLoops; i++) {
        const e = this.makeVoice('HazardLoop_' + i, this.hazardRange);
        for (let k = 0; k < kinds.length; k++) this.copySlot(e.sound, kinds[k], true, false);
        this.hazardLoopVoices.push({ entity: e, target: null, slotName: '' });
    }
    for (let i = 0; i < this.hazardShots; i++) {
        const e = this.makeVoice('HazardShot_' + i, this.hazardRange);
        this.copySlot(e.sound, 'crush', false, true);
        this.copySlot(e.sound, 'swing', false, true);
        this.hazardShotVoices.push({ entity: e, target: null, lastPos: new pc.Vec3(), lastRot: new pc.Quat(), fresh: true, armed: false, peak: 0 });
    }
    for (let i = 0; i < this.remoteVoices; i++) {
        const e = this.makeVoice('RemoteVoice_' + i, this.remoteRange);
        for (let k = 0; k < this._landNames.length; k++) this.copySlot(e.sound, this._landNames[k], false, true);
        const g = this.copySlot(e.sound, 'grind', true, false);
        const s = this.copySlot(e.sound, 'slide', true, false);
        if (g) g.volume = g.volume * this.remoteVolume;
        if (s) s.volume = s.volume * this.remoteVolume;
        this.remoteVoiceList.push({ entity: e, target: null, grounded: true, air: 0, rail: '' });
    }
};

SkateboardObbyAudio.prototype.applyMaster = function () {
    const m = this.masterVolume;
    this.sound.volume = m;
    const comps = this._soundComps || [];
    for (let i = 0; i < comps.length; i++) comps[i].comp.volume = comps[i].base * m;
    const lists = [this.hazardLoopVoices, this.hazardShotVoices, this.remoteVoiceList];
    for (let l = 0; l < lists.length; l++) for (let i = 0; i < lists[l].length; i++) lists[l][i].entity.sound.volume = m;
    const pins = this.pins || [];
    for (let i = 0; i < pins.length; i++) if (pins[i].entity.sound) pins[i].entity.sound.volume = m;
};

// sound components other scripts add later (bowling pins, when their stage chunk opens)
SkateboardObbyAudio.prototype.applyLateSounds = function () {
    const pins = this.pins, m = this.masterVolume;
    for (let i = 0; i < pins.length; i++) {
        const s = pins[i].entity.sound;
        if (s && s.volume !== m) s.volume = m;
    }
};

// ---------------------------------------------------------------------------
// one-shots
// ---------------------------------------------------------------------------

// volMul: 0..1 of the slot volume. cool: seconds before this slot may play again.
SkateboardObbyAudio.prototype.shot = function (name, volMul, pitch, cool) {
    const slot = this.sound.slot(name);
    if (!slot) return null;
    if (cool > 0) {
        if (this._t < (this._cool[name] || 0)) return null;
        this._cool[name] = this._t + cool;
    }
    if (slot.instances.length >= 3) return null;
    const inst = slot.play();
    if (inst) {
        if (volMul !== undefined && volMul !== 1) inst.volume = slot.volume * volMul * this.sound.volume;
        if (pitch) inst.pitch = slot.pitch * pitch;
    }
    return inst;
};

SkateboardObbyAudio.prototype.onOllie = function () {
    if (!this.pcs || this.pcs.isDied) return;
    this.shot('ollie', 1, 0.95 + Math.random() * 0.1, 0.05);
};

SkateboardObbyAudio.prototype.onDied = function () {
    this.shot('death', 1, 1, 0.3);
};

SkateboardObbyAudio.prototype.onRespawned = function () {
    this._air = 0;
    this._fall = 0;
};

SkateboardObbyAudio.prototype.onFinishJump = function () {
    this.shot('finishFly', 1, 1, 0.5);
};

SkateboardObbyAudio.prototype.onFinished = function () {
    this.shot('finish', 1, 1, 1);
};

SkateboardObbyAudio.prototype.onRestart = function () {
    // SkateboardObby_FinishPortal also starts its cooldown now, updatePortals skips it
    this.shot('portal', 1, 1, 0.5);
};

SkateboardObbyAudio.prototype.onSoundEvent = function (name) {
    this.shot(name, 1, 1, 0.05);
};

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

SkateboardObbyAudio.prototype.onButtonAdded = function (entity, component) {
    this.hookButton(component);
};

SkateboardObbyAudio.prototype.hookButton = function (button) {
    if (!button || button._skateAudio) return;
    // mobile controls (joystick, jump, boost) have their own sounds
    let e = button.entity;
    while (e) {
        if (e.name === 'MobileControls') return;
        e = e.parent;
    }
    button._skateAudio = true;
    button.on('click', this.onButtonClick, this);
    this._buttons.push(button);
};

SkateboardObbyAudio.prototype.onButtonClick = function () {
    this.shot('click', 1, 1, 0.04);
};

SkateboardObbyAudio.prototype.updatePanels = function () {
    const a = this.app;
    const n = (a.isMarketEnabled ? 1 : 0) + (a.menuPanelEnabled ? 1 : 0) + (a.isPopupEnabled ? 1 : 0) + ((a.numpad && a.numpad.enabled) ? 1 : 0);
    if (n === this._panels) return;
    if (n > this._panels) this.shot('panelOpen', 1, 1, 0.08);
    else this.shot('panelClose', 1, 1, 0.08);
    this._panels = n;
};

// ---------------------------------------------------------------------------
// loops
// ---------------------------------------------------------------------------

// Smooth volume / pitch. A loop that stayed silent for a moment is stopped, one that plays is written only on change.
SkateboardObbyAudio.prototype.driveLoop = function (l, dt, target, pitch, rate) {
    if (!l.slot) return;
    l.vol += (target - l.vol) * (1 - Math.exp(-rate * dt));
    if (target <= 0 && l.vol < 0.004) l.vol = 0;
    if (!l.on) l.pitch = pitch;
    else l.pitch += (pitch - l.pitch) * (1 - Math.exp(-this.pitchRate * dt));

    if (l.vol > 0) {
        l.idle = 0;
        if (!l.on) {
            l.slot.volume = l.wVol = l.vol;
            l.slot.pitch = l.wPitch = l.pitch;
            l.slot.play();
            l.on = true;
            return;
        }
        if (Math.abs(l.vol - l.wVol) > 0.002) l.slot.volume = l.wVol = l.vol;
        if (Math.abs(l.pitch - l.wPitch) > 0.002) l.slot.pitch = l.wPitch = l.pitch;
    } else if (l.on) {
        if (l.wVol > 0) l.slot.volume = l.wVol = 0;
        l.idle += dt;
        if (l.idle > 0.6) {
            l.slot.stop();
            l.on = false;
        }
    }
};

SkateboardObbyAudio.prototype.updateLocal = function (dt) {
    const pcs = this.pcs, app = this.app;
    const alive = !pcs.isDied;
    const blocked = !alive || app.inCutscene || app.isWatchingAd;
    const ride = alive ? pcs._ride : null;
    const onRail = !!ride && ride.type === 'grind';
    const grounded = !!pcs.grounded;
    const speed = alive ? pcs.speed + (pcs._rollBack || 0) : 0;
    const max = Math.max(1, pcs.maxSpeed || 22);
    const t = pc.math.clamp(speed / max, 0, 1.3);

    // rolling: quiet and low when slow, louder and higher when fast; on a loop the board is still on the surface.
    // Stays on in a cutscene: the finish jump flies (not grounded), the rollout after it is real rolling.
    let rollTarget = 0;
    if (alive && !app.isWatchingAd && !onRail && (grounded || (ride && ride.type === 'loop')) && speed > 0.5) {
        const k = pc.math.clamp(t, 0, 1);
        rollTarget = this.rollLoop.base * (this.rollVolumeMin + (1 - this.rollVolumeMin) * k);
        if ((pcs._rollBack || 0) > 0.5) rollTarget *= this.rollBackVolume;
    }
    // two slow waves that never line up with each other or with the loop length
    const driftA = 0.5 * (Math.sin(this._t * 0.73) + Math.sin(this._t * 1.37 + 1.1)), driftB = 0.5 * (Math.sin(this._t * 0.51 + 2.3) + Math.sin(this._t * 1.13));
    rollTarget *= 1 + driftB * this.rollWobbleVolume;
    const rollPitch = (this.rollPitchMin + (this.rollPitchMax - this.rollPitchMin) * pc.math.clamp(t, 0, 1.15)) * (1 + driftA * this.rollWobblePitch);
    this.driveLoop(this.rollLoop, dt, rollTarget, rollPitch, rollTarget < this.rollLoop.vol ? this.rollFadeAir : this.rollFadeIn);

    // rail
    const slideNow = onRail && ride.anim && ride.anim.indexOf('Slide') === 0;
    const railPitch = 0.9 + 0.25 * pc.math.clamp(t, 0, 1);
    this.driveLoop(this.grindLoop, dt, onRail && !slideNow && !blocked ? this.grindLoop.base : 0, railPitch, 18);
    this.driveLoop(this.slideLoop, dt, onRail && slideNow && !blocked ? this.slideLoop.base : 0, railPitch, 18);

    if (ride !== this._lastRide) {
        if (ride && ride.type === 'loop') this.shot('loopFx', 1, 1, 0.5);
        this._lastRide = ride;
    }

    // wind: fans set _applied in update and clear it in postUpdate, so it is read in both (see postUpdate)
    this.driveLoop(this.windLoop, dt, this._windHit && !blocked ? this.windLoop.base : 0, 1, 6);
    this._windHit = false;

    // brake: plays once and fades when the key is released
    const braking = alive && !blocked && grounded && !!pcs.isBraking && speed > 5;
    if (braking && !this._lastBrake && this._t >= (this._cool.brake || 0)) {
        this._cool.brake = this._t + 0.8;
        const s = this.brakeLoop.slot;
        if (s) { this.brakeLoop.vol = this.brakeLoop.wVol = this.brakeLoop.base; s.volume = this.brakeLoop.base; s.play(); this.brakeLoop.on = true; this.brakeLoop.idle = 0; }
    }
    if (!braking && this.brakeLoop.on) this.driveLoop(this.brakeLoop, dt, 0, 1, 12);
    this._lastBrake = braking;

    // landing: 3 samples at random, louder after a long fall
    if (!grounded && !ride && alive) {
        this._air += dt;
        const rb = pcs.entity.rigidbody;
        if (rb && rb.linearVelocity.y < -this._fall) this._fall = -rb.linearVelocity.y;
    } else {
        if (this._air >= this.minAirTime && grounded && !ride && alive && !app.inCutscene) {
            const k = pc.math.clamp(this._fall / Math.max(1, this.landFallSpeed), 0, 1);
            this.shot(this._landNames[Math.floor(Math.random() * this._landNames.length)], this.landQuiet + (1 - this.landQuiet) * k, 0.95 + Math.random() * 0.1, 0.12);
        }
        this._air = 0;
        this._fall = 0;
    }

    // push: only while the Push clip plays
    if (alive && pcs._animState === 'Push' && grounded) {
        this._pushT -= dt;
        if (this._pushT <= 0) {
            this._pushT = this.pushInterval;
            this.shot('push', 1, 0.95 + Math.random() * 0.1, 0);
        }
    } else {
        this._pushT = 0.15;
    }

    // vert, trick, bump, from the states the controller already sets
    const vert = alive && !!pcs._vert;
    if (vert && !this._lastVert && pcs._vert.big) this.shot('vert', 1, 1, 0.4);
    this._lastVert = vert;

    const shotState = alive ? (pcs._oneShotTimer > 0 ? pcs._oneShotState : '') : '';
    if (shotState !== this._lastShot) {
        this._lastShot = shotState;
        if (shotState) {
            if (shotState === 'Stumble' || shotState === 'Slip') this.shot('bump', 1, 1, 0.5);
            else if (shotState.indexOf('Trick') === 0 && !vert) this.shot('trick', 1, 0.95 + Math.random() * 0.1, 0.1);
        }
    }

    // trampoline
    const bounce = app.playerBounce;
    const bouncing = !!bounce && bounce.curve > 0;
    if (bouncing && !this._bounce) this.shot('tramp', 1, 0.97 + Math.random() * 0.06, 0.2);
    this._bounce = bouncing;
};

SkateboardObbyAudio.prototype.readWind = function () {
    if (this._windHit) return;
    const list = this.winds;
    for (let i = 0; i < list.length; i++) {
        if (list[i]._applied) { this._windHit = true; return; }
    }
};

SkateboardObbyAudio.prototype.updatePortals = function () {
    const list = this.portals;
    for (let i = 0; i < list.length; i++) {
        const p = list[i], c = p.script._cool || 0;
        if (c > p.cool && p.cool <= 0 && p.script.kind !== 'restart') this.shot('portal', 1, 1, 0.5);
        p.cool = c;
    }
    const w = this.wportals;
    for (let i = 0; i < w.length; i++) {
        const armed = w[i].script.armed !== false;
        if (w[i].armed && !armed && w[i].script.entity.enabled && this.pcs && !this.pcs.isDied) this.shot('portal', 1, 1, 0.5);
        w[i].armed = armed;
    }
};

// ---------------------------------------------------------------------------
// 3D obstacle sounds
// ---------------------------------------------------------------------------

SkateboardObbyAudio.prototype.scanHazards = function () {
    const p = this.pcs.entity.getPosition(), r = this.hazardRange, rl = this.laserRange;
    const list = this.hazards, near = r * r, nearLaser = rl * rl;
    for (let i = 0; i < list.length; i++) {
        const h = list[i];
        h.dist = 1e9;
        if (!h.entity.enabled) continue;
        const q = h.entity.getPosition(), dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, d = dx * dx + dy * dy + dz * dz;
        if (d < (h.kind === 'laser' ? nearLaser : near)) h.dist = d;
    }
    this.applyLateSounds();
    this.assign(this.hazardLoopVoices, true);
    this.assign(this.hazardShotVoices, false);
};

// the nearest hazards of this type get the voices; a voice keeps its target while it is still among them
SkateboardObbyAudio.prototype.assign = function (voices, loop) {
    const list = this.hazards;
    for (let v = 0; v < voices.length; v++) {
        const voice = voices[v];
        if (voice.target && voice.target.dist >= 1e9) this.setVoiceTarget(voice, null, loop);
    }
    for (let v = 0; v < voices.length; v++) {
        const voice = voices[v];
        if (voice.target) continue;
        let best = null;
        for (let i = 0; i < list.length; i++) {
            const h = list[i];
            if (h.loop !== loop || h.voice || h.dist >= 1e9) continue;
            if (!best || h.dist < best.dist) best = h;
        }
        if (!best) break;
        this.setVoiceTarget(voice, best, loop);
    }
};

SkateboardObbyAudio.prototype.setVoiceTarget = function (voice, h, loop) {
    if (voice.target) voice.target.voice = null;
    voice.target = h;
    if (h) h.voice = voice;
    if (loop) {
        if (voice.slotName) { const s = voice.entity.sound.slot(voice.slotName); if (s) s.stop(); }
        voice.slotName = '';
        if (h) {
            voice.entity.setPosition(h.entity.getPosition());
            voice.entity.sound.maxDistance = h.kind === 'laser' ? this.laserRange : this.hazardRange;
            const s = voice.entity.sound.slot(h.kind);
            if (s) { s.play(); voice.slotName = h.kind; }
        }
    } else {
        voice.fresh = true;
        voice.armed = false;
        voice.peak = 0;
    }
};

SkateboardObbyAudio.prototype.updateHazards = function (dt) {
    const loops = this.hazardLoopVoices;
    for (let i = 0; i < loops.length; i++) {
        const v = loops[i];
        if (v.target) v.entity.setPosition(v.target.entity.getPosition());
    }

    if (!(dt > 0)) return;
    const shots = this.hazardShotVoices;
    for (let i = 0; i < shots.length; i++) {
        const v = shots[i], h = v.target;
        if (!h) continue;
        const pos = h.entity.getPosition(), rot = h.entity.getRotation();
        if (v.fresh) {
            v.lastPos.copy(pos);
            v.lastRot.copy(rot);
            v.fresh = false;
            continue;
        }
        if (h.kind === 'crush') {
            // moved fast, then stopped: the hit
            const speed = v.lastPos.distance(pos) / dt;
            if (speed > v.peak) v.peak = speed;
            if (speed > this.crushSpeed && speed > v.peak * 0.75) v.armed = true;
            else if (v.armed && speed < this.crushSpeed * 0.3) {
                v.armed = false;
                v.entity.setPosition(pos);
                const s = v.entity.sound.slot('crush');
                if (s) s.play();
            }
        } else {
            // whoosh once per pass, when the swing speeds up past the threshold
            const dot = Math.min(1, Math.abs(v.lastRot.x * rot.x + v.lastRot.y * rot.y + v.lastRot.z * rot.z + v.lastRot.w * rot.w));
            const w = 2 * Math.acos(dot) / dt;
            if (!v.armed && w > this.swingSpeed) {
                v.armed = true;
                v.entity.setPosition(pos);
                const s = v.entity.sound.slot('swing');
                if (s) s.play();
            } else if (v.armed && w < this.swingSpeed * 0.5) {
                v.armed = false;
            }
        }
        v.lastPos.copy(pos);
        v.lastRot.copy(rot);
    }
};

// ---------------------------------------------------------------------------
// remote players
// ---------------------------------------------------------------------------

SkateboardObbyAudio.prototype.onPlayerAdd = function (entity) {
    if (entity && this.remotes.indexOf(entity) < 0) this.remotes.push(entity);
};

SkateboardObbyAudio.prototype.onPlayerRemove = function () {
    // the argument is the room's player, not the entity; removed entities are dropped in scanRemotes
};

SkateboardObbyAudio.prototype.scanRemotes = function () {
    const list = this.remotes, voices = this.remoteVoiceList, p = this.pcs.entity.getPosition(), r2 = this.remoteRange * this.remoteRange;
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i]._destroyed || !list[i].script || !list[i].script.skateboardObbyOtherPlayerController) list.splice(i, 1);
    }
    // free voices whose player left or went out of range
    for (let v = 0; v < voices.length; v++) {
        const voice = voices[v], e = voice.target;
        if (!e) continue;
        const q = e._destroyed ? null : e.getPosition();
        if (!q || !e.enabled || (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) + (q.z - p.z) * (q.z - p.z) > r2) this.setRemoteVoice(voice, null);
    }
    for (let v = 0; v < voices.length; v++) {
        const voice = voices[v];
        if (voice.target) continue;
        let best = null, bestD = r2;
        for (let i = 0; i < list.length; i++) {
            const e = list[i];
            if (!e.enabled || e._skateVoice) continue;
            const q = e.getPosition(), d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) + (q.z - p.z) * (q.z - p.z);
            if (d < bestD) { bestD = d; best = e; }
        }
        if (!best) break;
        this.setRemoteVoice(voice, best);
    }
};

SkateboardObbyAudio.prototype.setRemoteVoice = function (voice, e) {
    if (voice.target) voice.target._skateVoice = false;
    if (voice.rail) { const s = voice.entity.sound.slot(voice.rail); if (s) s.stop(); voice.rail = ''; }
    voice.target = e;
    if (!e) return;
    e._skateVoice = true;
    const c = e.script.skateboardObbyOtherPlayerController;
    voice.grounded = c.grounded !== false;
    voice.air = 0;
    voice.entity.setPosition(e.getPosition());
};

SkateboardObbyAudio.prototype.updateRemotes = function (dt) {
    const voices = this.remoteVoiceList;
    for (let v = 0; v < voices.length; v++) {
        const voice = voices[v], e = voice.target;
        if (!e) continue;
        if (e._destroyed || !e.script || !e.script.skateboardObbyOtherPlayerController) { this.setRemoteVoice(voice, null); continue; }
        const c = e.script.skateboardObbyOtherPlayerController;
        voice.entity.setPosition(e.getPosition());

        const grounded = c.grounded !== false;
        if (!grounded) voice.air += dt;
        else {
            if (!voice.grounded && voice.air >= this.minAirTime) {
                const name = this._landNames[Math.floor(Math.random() * this._landNames.length)];
                const s = voice.entity.sound.slot(name);
                if (s && s.instances.length < 2) {
                    const inst = s.play();
                    if (inst) inst.volume = s.volume * this.remoteVolume * voice.entity.sound.volume;
                }
            }
            voice.air = 0;
        }
        voice.grounded = grounded;

        // grind / slide from the server field "anim"
        const state = c._rideState || c._rideAnim || '';
        const rail = state.indexOf('Grind') === 0 ? 'grind' : (state.indexOf('Slide') === 0 ? 'slide' : '');
        if (rail !== voice.rail) {
            if (voice.rail) { const old = voice.entity.sound.slot(voice.rail); if (old) old.stop(); }
            if (rail) { const s = voice.entity.sound.slot(rail); if (s) s.play(); }
            voice.rail = rail;
        }
    }
};

// ---------------------------------------------------------------------------
// frame
// ---------------------------------------------------------------------------

SkateboardObbyAudio.prototype.update = function (dt) {
    if (!this.pcs) return;
    this._t += dt;
    this.readWind();
    this.updateLocal(dt);
    this.updatePanels();
    this.updatePortals();

    this._scan -= dt;
    if (this._scan <= 0) {
        this._scan = 0.25;
        this.scanHazards();
        this.scanRemotes();
    }
    this.updateHazards(dt);
    this.updateRemotes(dt);
};

SkateboardObbyAudio.prototype.postUpdate = function () {
    this.readWind();
};

SkateboardObbyAudio.prototype.onDestroy = function () {
    this.app.off('PlayerDied', this.onDied, this);
    this.app.off('Respawned', this.onRespawned, this);
    this.app.off('skate:finishJump', this.onFinishJump, this);
    this.app.off('skate:finished', this.onFinished, this);
    this.app.off('skate:restartCourse', this.onRestart, this);
    this.app.off('skate:sound', this.onSoundEvent, this);
    this.app.off('player:add', this.onPlayerAdd, this);
    this.app.off('player:remove', this.onPlayerRemove, this);
    this.app.systems.button.off('add', this.onButtonAdded, this);
    for (let i = 0; i < this._buttons.length; i++) {
        const b = this._buttons[i];
        if (b.entity && !b.entity._destroyed) b.off('click', this.onButtonClick, this);
        b._skateAudio = false;
    }
    if (this.pcs && this.pcs.entity && !this.pcs.entity._destroyed) this.pcs.entity.off('jump', this.onOllie, this);
    const list = this.remotes;
    for (let i = 0; i < list.length; i++) list[i]._skateVoice = false;
};
