/*
 * SkateboardObby_WorldsPortal
 * Walking / riding into a Worlds portal opens the Worlds panel (SkateboardObby_WorldsPanel, app.skateWorldsPanel).
 * - The entity sits in the portal's door; the zone is a sphere (Radius) around it. Cheap distance test, no physics trigger.
 * - Opens once per walk-in: after the panel closes it opens again only when the player has left the zone and
 *   Cooldown seconds have passed (standing / rolling in the door does not reopen it).
 * - Stop On Open: the board stops in the door when the panel opens (menus otherwise only cut the input and the
 *   board rolls on, see PlayerController.stopMovement).
 * - Optional Model: the portal mesh. Its render is switched on Model Delay seconds after the scene starts, so a model
 *   from a lazy pack (lobby copy of the finish portal) does not compete with the first load. Extra Models are switched
 *   on with it (other lobby props from the same pack: leaderboard, Next World portal).
 */
var SkateboardObbyWorldsPortal = pc.createScript('skateboardObbyWorldsPortal');

SkateboardObbyWorldsPortal.attributes.add('radius', { type: 'number', default: 3.5, title: 'Radius (m)' });
SkateboardObbyWorldsPortal.attributes.add('cooldown', { type: 'number', default: 3, title: 'Cooldown (s)', description: 'After the panel closes, the portal waits this long (and for the player to step out) before it opens it again.' });
SkateboardObbyWorldsPortal.attributes.add('stopOnOpen', { type: 'boolean', default: true, title: 'Stop On Open', description: 'Stop the board in the door when the panel opens.' });
SkateboardObbyWorldsPortal.attributes.add('model', { type: 'entity', title: 'Model', description: 'Optional portal mesh (render), enabled after Model Delay.' });
SkateboardObbyWorldsPortal.attributes.add('modelDelay', { type: 'number', default: 0, title: 'Model Delay (s)' });
SkateboardObbyWorldsPortal.attributes.add('extraModels', { type: 'entity', array: true, title: 'Extra Models', description: 'Switched on together with Model (after Model Delay).' });

SkateboardObbyWorldsPortal.prototype.initialize = function () {
    this.armed = true;         // false from opening until the player leaves the zone
    this.modelTimer = this.model && !this.model.enabled ? Math.max(0, this.modelDelay) : -1;
};

SkateboardObbyWorldsPortal.prototype.update = function (dt) {
    if (this.modelTimer >= 0) {
        this.modelTimer -= dt;
        if (this.modelTimer < 0) {
            if (this.model) this.model.enabled = true;
            const _extra = this.extraModels || [];
            for (let i = 0; i < _extra.length; i++) if (_extra[i]) _extra[i].enabled = true;
        }
    }

    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied || this.app.inCutscene) return;
    const _inside = pcs.entity.getPosition().distance(this.entity.getPosition()) <= this.radius;
    if (!_inside) { this.armed = true; return; }

    const panel = this.app.skateWorldsPanel;
    if (!panel) return;
    if (panel.isOpen) { this.armed = false; return; }   // opened here or by G / the button: closing it in the door does not reopen it
    if (!this.armed) return;
    if ((Date.now() - panel.closedAt) / 1000 < this.cooldown) return;
    if (!panel.open()) return;   // panel busy (shop, menu...) = try again next frame
    this.armed = false;
    if (this.stopOnOpen && pcs.stop) pcs.stop();
};
