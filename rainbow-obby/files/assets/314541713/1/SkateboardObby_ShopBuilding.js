/*
 * SkateboardObby_ShopBuilding
 * Walking / riding up to the Shop building opens the Shop panel (SkateboardObby_Shop, app.skateShop).
 * - The entity sits in front of the building; the zone is a sphere (Radius) around it. Cheap distance test, no physics
 *   trigger, and only the local player counts (remote players have no controller of this kind).
 * - Opens once per walk-in: after the panel closes it opens again only when the player has left the zone.
 *   Opening it with M / the HUD button inside the zone counts too. Leave Margin stops a reopen at the very edge.
 * - Optional Model: the building mesh. Its render is switched on Model Delay seconds after the scene starts, so the FBX
 *   does not compete with the first load (same as the lobby portals).
 * Panel, camera lock, isMarketEnabled and the board stop all stay in SkateboardObby_Shop.setPanelVisible.
 */
var SkateboardObbyShopBuilding = pc.createScript('skateboardObbyShopBuilding');

SkateboardObbyShopBuilding.attributes.add('radius', { type: 'number', default: 3.5, title: 'Radius (m)' });
SkateboardObbyShopBuilding.attributes.add('leaveMargin', { type: 'number', default: 1, min: 0, title: 'Leave Margin (m)', description: 'The player has left the zone at Radius + this.' });
SkateboardObbyShopBuilding.attributes.add('model', { type: 'entity', title: 'Model', description: 'Optional building mesh (render), enabled after Model Delay.' });
SkateboardObbyShopBuilding.attributes.add('modelDelay', { type: 'number', default: 2, title: 'Model Delay (s)' });

SkateboardObbyShopBuilding.prototype.initialize = function () {
    this.armed = true;         // false from opening until the player leaves the zone
    this.modelTimer = this.model && !this.model.enabled ? Math.max(0, this.modelDelay) : -1;
};

SkateboardObbyShopBuilding.prototype.update = function (dt) {
    if (this.modelTimer >= 0) {
        this.modelTimer -= dt;
        if (this.modelTimer < 0 && this.model) this.model.enabled = true;
    }

    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied || this.app.inCutscene) return;
    const _reach = this.armed ? this.radius : this.radius + this.leaveMargin;
    if (pcs.entity.getPosition().distance(this.entity.getPosition()) > _reach) { this.armed = true; return; }

    const shop = this.app.skateShop;
    if (!shop) return;
    if (shop.panelOpen) { this.armed = false; return; }   // opened here or by M / the button: closing it here does not reopen it
    if (!this.armed) return;
    shop.setPanelVisible(true);                           // refuses while another panel, menu or ad is up = try again next frame
    if (!shop.panelOpen) return;
    this.armed = false;
    if (pcs.stop) pcs.stop();                             // the panel only cuts the input: the board would roll on into the building
};
