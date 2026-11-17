mat3 dNormalMatrix;

vec3 getNormal() {
    dNormalMatrix = getNormalMatrix(dModelMatrix);
    vec3 localNormal = getLocalNormal(vertex_normal);

    // rotate the normal with its piece so lighting follows the tilt
    if (abs(dCrustAngle) > 0.0001) {
        localNormal = crustRotate(localNormal, dCrustAxis, dCrustAngle);
    }

    return normalize(dNormalMatrix * localNormal);
}