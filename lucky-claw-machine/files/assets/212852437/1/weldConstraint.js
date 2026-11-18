//
// WeldConstraint
//
var WeldConstraint = pc.createScript('weldConstraint');

WeldConstraint.attributes.add('pivotA', {
    title: 'Pivot',
    description: 'Posición local de la restricción en esta entidad.',
    type: 'vec3',
    default: [0, 0, 0]
});
WeldConstraint.attributes.add('axisA', {
    title: 'Eje',
    description: 'Eje local de orientación para la restricción.',
    type: 'vec3',
    default: [0, 1, 0]
});
WeldConstraint.attributes.add('entityB', {
    title: 'Entidad Conectada',
    description: 'Segunda entidad conectada (opcional).',
    type: 'entity'
});
WeldConstraint.attributes.add('pivotB', {
    title: 'Pivote Conectado',
    description: 'Posición local en la entidad conectada.',
    type: 'vec3',
    default: [0, 0, 0]
});
WeldConstraint.attributes.add('axisB', {
    title: 'Eje Conectado',
    description: 'Eje local de orientación en la entidad conectada.',
    type: 'vec3',
    default: [0, 1, 0]
});
WeldConstraint.attributes.add('breakingThreshold', {
    title: 'Umbral de Ruptura',
    description: 'Impulso máximo para romper la restricción.',
    type: 'number',
    default: 3.4e+38
});
WeldConstraint.attributes.add('enableCollision', {
    title: 'Habilitar Colisión',
    description: 'Permitir colisión entre cuerpos conectados.',
    type: 'boolean',
    default: true
});
WeldConstraint.attributes.add('debugRender', {
    title: 'Depurar Renderizado',
    description: 'Mostrar representación visual de la restricción.',
    type: 'boolean',
    default: false
});
WeldConstraint.attributes.add('debugColor', {
    title: 'Color de Depuración',
    type: 'rgb',
    default: [1, 0, 0]
});

WeldConstraint.prototype.initialize = function() {
    this.createConstraint();

    this.on('attr', (name) => {
        if (name === 'pivotA' || name === 'axisA' || name === 'entityB' || name === 'pivotB' || name === 'axisB') {
            this.createConstraint();
        } else if (name === 'breakingThreshold') {
            if (this.constraint) {
                this.constraint.setBreakingImpulseThreshold(this.breakingThreshold);
                this.activate();
            }
        }
    });

    this.on('enable', this.createConstraint);
    this.on('disable', this.destroyConstraint);
    this.on('destroy', this.destroyConstraint);
};

WeldConstraint.prototype.createConstraint = function() {
    this.destroyConstraint();

    if (!this.entity.rigidbody) return;

    const bodyA = this.entity.rigidbody.body;
    const pivotA = new Ammo.btVector3(this.pivotA.x, this.pivotA.y, this.pivotA.z);
    const frameA = this.createFrame(this.axisA, pivotA);

    let bodyB = null;
    let frameB = null;
    if (this.entityB && this.entityB.rigidbody) {
        bodyB = this.entityB.rigidbody.body;
        const pivotB = new Ammo.btVector3(this.pivotB.x, this.pivotB.y, this.pivotB.z);
        frameB = this.createFrame(this.axisB, pivotB);
        this.constraint = new Ammo.btGeneric6DofConstraint(bodyA, bodyB, frameA, frameB, true);
    } else {
        this.constraint = new Ammo.btGeneric6DofConstraint(bodyA, frameA, true);
    }

    // Bloquear todos los movimientos y rotaciones
    this.constraint.setLinearLowerLimit(new Ammo.btVector3(0, 0, 0));
    this.constraint.setLinearUpperLimit(new Ammo.btVector3(0, 0, 0));
    this.constraint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
    this.constraint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));
    
    this.constraint.setBreakingImpulseThreshold(this.breakingThreshold);
    
    const dynamicsWorld = this.app.systems.rigidbody.dynamicsWorld;
    dynamicsWorld.addConstraint(this.constraint, !this.enableCollision);

    Ammo.destroy(frameA);
    if (frameB) Ammo.destroy(frameB);
    this.activate();
};

WeldConstraint.prototype.createFrame = function(axis, pivot) {
    const v1 = new pc.Vec3();
    const v2 = new pc.Vec3();
    getOrthogonalVectors(axis, v1, v2);

    const m = new pc.Mat4();
    m.set([
        axis.x, axis.y, axis.z, 0,
        v1.x, v1.y, v1.z, 0,
        v2.x, v2.y, v2.z, 0,
        0, 0, 0, 1
    ]);

    const q = new pc.Quat();
    q.setFromMat4(m);
    const quat = new Ammo.btQuaternion(q.x, q.y, q.z, q.w);
    return new Ammo.btTransform(quat, pivot);
};

WeldConstraint.prototype.destroyConstraint = function() {
    if (this.constraint) {
        const dynamicsWorld = this.app.systems.rigidbody.dynamicsWorld;
        dynamicsWorld.removeConstraint(this.constraint);
        Ammo.destroy(this.constraint);
        this.constraint = null;
    }
};

WeldConstraint.prototype.activate = function() {
    this.entity.rigidbody.activate();
    if (this.entityB && this.entityB.rigidbody) {
        this.entityB.rigidbody.activate();
    }
};

WeldConstraint.prototype.update = function(dt) {
    if (this.debugRender) {
        const posA = this.entity.getPosition();
        const pivotAWorld = new pc.Vec3();
        this.entity.getWorldTransform().transformPoint(this.pivotA, pivotAWorld);
        this.app.renderLine(posA, pivotAWorld, this.debugColor);
        
        if (this.entityB) {
            const posB = this.entityB.getPosition();
            this.app.renderLine(posB, pivotAWorld, this.debugColor);
        }
    }
};