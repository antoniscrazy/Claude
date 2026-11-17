#ifdef PIXELSNAP
uniform vec4 uScreenSize;
#endif

#ifdef SCREENSPACE
uniform float projectionFlipY;
#endif

attribute vec4 vertex_color; // baked piece pivot (normalized inside mesh AABB)

#define MAX_PRESS 24
uniform vec4 uPress[MAX_PRESS];
uniform float uRadius;
uniform float uDepth;
uniform vec2 uHeightRange;
uniform float uBendFactor;
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;
uniform float uTiltAmount;
uniform float uSpreadAmount;
uniform float uRadialSpread;
uniform float uSinkAmount;

// shared with the normal chunk (transformVS is included first)
vec3 dCrustAxis;
float dCrustAngle;

float crustDisplacementAt(vec2 xz) {
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

vec3 crustRotate(vec3 p, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

vec4 evalWorldPosition(vec3 vertexPosition, mat4 modelMatrix) {

    vec3 localPos = getLocalPosition(vertexPosition);

    vec3 pivot = mix(uBoundsMin, uBoundsMax, vertex_color.rgb);
    vec3 offset = localPos - pivot;

    float h = clamp(
        (pivot.y - uHeightRange.x) / max(uHeightRange.y - uHeightRange.x, 0.0001),
        0.0, 1.0
    );
    float mask = mix(uBendFactor, 1.0, h * h);
    float d = crustDisplacementAt(pivot.xz) * mask;

    float eps = uRadius * 0.15;
    float gx = (crustDisplacementAt(pivot.xz + vec2(eps, 0.0)) - crustDisplacementAt(pivot.xz - vec2(eps, 0.0))) / (2.0 * eps);
    float gz = (crustDisplacementAt(pivot.xz + vec2(0.0, eps)) - crustDisplacementAt(pivot.xz - vec2(0.0, eps))) / (2.0 * eps);

    vec3 slopeNormal = normalize(vec3(gx, 1.0, gz));
    vec3 axis = cross(vec3(0.0, 1.0, 0.0), slopeNormal);
    float axisLen = length(axis);

    dCrustAxis = vec3(0.0, 1.0, 0.0);
    dCrustAngle = 0.0;

    if (axisLen > 0.0001) {
        dCrustAxis = axis / axisLen;
        dCrustAngle = asin(clamp(axisLen, 0.0, 1.0)) * uTiltAmount;
        offset = crustRotate(offset, dCrustAxis, dCrustAngle);
    }

    localPos = pivot + offset;
    localPos.y -= d * uSinkAmount;
    localPos.xz -= vec2(gx, gz) * uSpreadAmount;

    if (uRadialSpread > 0.0001) {
        float best = 0.0;
        vec2 pushDir = vec2(0.0);
        for (int i = 0; i < MAX_PRESS; i++) {
            float s = uPress[i].w;
            float dist = distance(pivot.xz, uPress[i].xz);
            float f = 1.0 - smoothstep(0.0, uRadius, dist);
            f = f * f * (3.0 - 2.0 * f);
            float infl = f * s;
            if (infl > best) {
                best = infl;
                pushDir = (dist > 0.0001) ? (pivot.xz - uPress[i].xz) / dist : vec2(0.0);
            }
        }
        localPos.xz += pushDir * best * uRadialSpread;
    }

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
