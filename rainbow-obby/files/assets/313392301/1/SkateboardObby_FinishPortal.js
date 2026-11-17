/*
 * SkateboardObby_FinishPortal
 * Portals on the finish island. The entity sits in the portal opening; the zone is a sphere (Radius) around it.
 *   restart     - progress is reset (checkpoint -1, all flags red) and the player goes back to the lobby
 *   comingSoon  - next world is not ready: shows the message (the portal stays closed)
 *   worlds      - next world is ready: opens the Worlds panel (GO is there). Once per walk-in, like
 *                 SkateboardObby_WorldsPortal: not again while the player stays in the door.
 *                 While that world is locked: shows its Locked Text from the panel (the portal stays closed).
 * Cheap distance test per frame, no physics trigger. Message repeats at most every Cooldown seconds.
 */
var SkateboardObbyFinishPortal = pc.createScript('skateboardObbyFinishPortal');

SkateboardObbyFinishPortal.attributes.add('kind', { type: 'string', default: 'restart', title: 'Kind', enum: [{ 'Restart (back to lobby)': 'restart' }, { 'Coming Soon': 'comingSoon' }, { 'Open Worlds Panel': 'worlds' }] });
SkateboardObbyFinishPortal.attributes.add('radius', { type: 'number', default: 3, title: 'Radius (m)' });
SkateboardObbyFinishPortal.attributes.add('message', { type: 'string', default: 'Back to the start!', title: 'Message' });
SkateboardObbyFinishPortal.attributes.add('cooldown', { type: 'number', default: 3, title: 'Cooldown (s)' });

SkateboardObbyFinishPortal.prototype.initialize = function () {
    this._cool = 0;
    this._armed = true;   // kind worlds: false from opening until the player leaves the zone
};

SkateboardObbyFinishPortal.prototype.updateWorlds = function (pcs, d) {
    if (d > this.radius) { this._armed = true; return; }
    const panel = this.app.skateWorldsPanel;
    if (!panel) return;
    if (panel.isOpen) { this._armed = false; return; }   // opened here or by G / the button: closing it in the door does not reopen it
    if (!this._armed || (Date.now() - panel.closedAt) / 1000 < this.cooldown) return;
    const next = panel.nextWorld();
    if (next && !panel.isUnlocked(next)) {
        this._cool = this.cooldown;
        const text = next.comingSoon ? panel.soonMessage : next.lockedText;
        this.app.fire('WarningTextController:setWarning', text || this.message, null, new pc.Color(1, 0.85, 0.2, 1));
        return;
    }
    if (!panel.open()) return;   // panel busy (shop, menu...) = try again next frame
    this._armed = false;
    this._cool = this.cooldown;
    if (pcs.stop) pcs.stop();
};

SkateboardObbyFinishPortal.prototype.update = function (dt) {
    if (this._cool > 0) { this._cool -= dt; return; }
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied || this.app.inCutscene) return;
    const d = pcs.entity.getPosition().distance(this.entity.getPosition());
    if (this.kind === 'worlds') { this.updateWorlds(pcs, d); return; }
    if (d > this.radius) return;
    this._cool = this.cooldown;

    if (this.kind === 'restart') {
        this.app.fire('skate:restartCourse');
        pcs.resetGame();            // checkpoint -1 + resetStage (flags back to red)
        pcs.teleport();             // no checkpoint saved -> lobby spawn
        this.app.fire('WarningTextController:setWarning', this.message, null, new pc.Color(0.4, 1, 0.4, 1));
    } else {
        this.app.fire('WarningTextController:setWarning', this.message, null, new pc.Color(1, 0.85, 0.2, 1));
    }
};
