var MeowModeDamageText = pc.createScript('meowModeDamageText');

MeowModeDamageText.prototype.initialize = function () {
    this.time = 1.5;
    const entity = this.entity;
    const textElement = entity.children[0].element;

    let startPos = entity.getLocalPosition().clone();
    let targetY = startPos.y + 0.5;

    // Position tween
    let pos = { y: startPos.y };

    this.app.tween(pos)
        .to({ y: targetY }, this.time, pc.SineOut)
        .onUpdate(() => {
            let current = entity.getLocalPosition();
            entity.setLocalPosition(current.x, pos.y, current.z);
        })
        .start();

    // Fade (text + outline)
    let fade = { opacity: 1 };

    this.app.tween(fade)
        .to({ opacity: 0 }, this.time, pc.Linear)
        .onUpdate(() => {
            textElement.opacity = fade.opacity;

            let outline = textElement.outlineColor;
            textElement.outlineColor = new pc.Color(
                outline.r,
                outline.g,
                outline.b,
                fade.opacity
            );
        })
        .onComplete(() => {
            entity.destroy();
        })
        .start();
};