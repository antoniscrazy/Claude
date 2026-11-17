#ifdef PIXELSNAP
uniform vec4 uScreenSize;
#endif

#ifdef SCREENSPACE
uniform float projectionFlipY;
#endif

#define MAX_PRESS 24
uniform vec4 uPress[MAX_PRESS];
uniform float uRadius;
uniform float uDepth;
uniform vec2 uHeightRange;
uniform float uBendFactor;

varying vec3 vSquishSlope;

float squishDisplacementAt(vec2 xz) {
    float total = 0.0;
    for (int i = 0; i < MAX_PRESS; i++) {
        float s = uPress[i].w;
        float dist = distance(xz, uPress[i].xz);
        float f = 1.0 - smoothstep(0.0, uRadius, dist);
        f = f * f * (3.0 - 2.0 * f);
        total = max(total, f * s);
    }
    return total * uDepth;
}

vec4 evalWorldPosition(vec3 vertexPosition, mat4 modelMatrix) {

    vec3 localPos = getLocalPosition(vertexPosition);

    float h = clamp(
        (localPos.y - uHeightRange.x) / max(uHeightRange.y - uHeightRange.x, 0.0001),
        0.0, 1.0
    );
    float mask = mix(uBendFactor, 1.0, h * h);
    localPos.y -= squishDisplacementAt(localPos.xz) * mask;

    float eps = uRadius * 0.15;
    float gx = (squishDisplacementAt(localPos.xz + vec2(eps, 0.0)) - squishDisplacementAt(localPos.xz - vec2(eps, 0.0))) / (2.0 * eps);
    float gz = (squishDisplacementAt(localPos.xz + vec2(0.0, eps)) - squishDisplacementAt(localPos.xz - vec2(0.0, eps))) / (2.0 * eps);
    vSquishSlope = (modelMatrix * vec4(vec3(gx, 0.0, gz) * mask, 0.0)).xyz;

    #ifdef NINESLICED
        localPos.xz *= outerScale;
        vec2 positiveUnitOffset = clamp(vertexPosition.xz, vec2(0.0), vec2(1.0));
        vec2 negativeUnitOffset = clamp(-vertexPosition.xz, vec2(0.0), vec2(1.0));
        localPos.xz += (-positiveUnitOffset * innerOffset.xy + negativeUnitOffset * innerOffset.zw) * vertex_texCoord0.xy;
        vTiledUv = (localPos.xz - outerScale + innerOffset.xy) * -0.5 + 1.0;
        localPos.xz *= -0.5;
        localPos = localPos.xzy;
    #endif

    vec4 posW = modelMatrix * vec4(localPos, 1.0);

    #ifdef SCREENSPACE
        posW.zw = vec2(0.0, 1.0);
    #endif

    return posW;
}

vec4 getPosition() {

    dModelMatrix = getModelMatrix();

    vec4 posW = evalWorldPosition(vertex_position.xyz, dModelMatrix);
    dPositionW = posW.xyz;

    vec4 screenPos;
    #ifdef UV1LAYOUT
        screenPos = vec4(vertex_texCoord1.xy * 2.0 - 1.0, 0.5, 1);
        #ifdef WEBGPU
            screenPos.y *= -1.0;
        #endif
    #else
        #ifdef SCREENSPACE
            screenPos = posW;
            screenPos.y *= projectionFlipY;
        #else
            screenPos = matrix_viewProjection * posW;
        #endif

        #ifdef PIXELSNAP
            screenPos.xy = (screenPos.xy * 0.5) + 0.5;
            screenPos.xy *= uScreenSize.xy;
            screenPos.xy = floor(screenPos.xy);
            screenPos.xy *= uScreenSize.zw;
            screenPos.xy = (screenPos.xy * 2.0) - 1.0;
        #endif
    #endif

    return screenPos;
}

vec3 getWorldPosition() {
    return dPositionW;
}