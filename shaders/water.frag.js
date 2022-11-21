let waterFragShader = `

uniform float time;
uniform float n_air;
uniform float n_water;
uniform samplerCube envMap;
uniform sampler2D waterTex;
uniform sampler2D normalMap;

varying vec2 uVu;
varying vec3 worldPosition;
varying vec3 camPosition;
varying vec3 N;

const vec3 lightDir = normalize(vec3(0.2, -1.0, 0.3));
const float ambient = 0.3;

// https://stackoverflow.com/questions/5255806/how-to-calculate-tangent-and-binormal/5257471
mat3 computeTBNMatrix(vec3 pw_i, vec2 tc_i) {
    // compute derivations of the world position
    vec3 p_dx = dFdx(pw_i);
    vec3 p_dy = dFdy(pw_i);
    // compute derivations of the texture coordinate
    vec2 tc_dx = dFdx(tc_i);
    vec2 tc_dy = dFdy(tc_i);
    // compute initial tangent and bi-tangent
    vec3 t = normalize( tc_dy.y * p_dx - tc_dx.y * p_dy );
    vec3 b = normalize( tc_dy.x * p_dx - tc_dx.x * p_dy ); // sign inversion
    // get new tangent from a given mesh normal
    vec3 n = normalize(N);
    vec3 x = cross(n, t);
    t = cross(x, n);
    t = normalize(t);
    // get updated bi-tangent
    x = cross(b, n);
    b = cross(n, x);
    b = normalize(b);
    return mat3(t, b, n);
}

void main() {

    // normal map
    mat3 TBN = computeTBNMatrix(worldPosition, uVu);
    vec4 normalColor = texture2D(normalMap, mod(uVu - time, 1.0));
    vec3 normalMap_normal = normalize(TBN * (normalColor.xyz * 2.0 - 1.0));
    
    // reflection to cube map
    vec3 reflectedRay = reflect(worldPosition.xyz - camPosition, normalMap_normal);
    reflectedRay.x = -reflectedRay.x;
    vec4 reflectedColour = vec4(textureCube(envMap, reflectedRay).rgb, 1.0) * 0.7;
    
    // add one more layer of reflection without normal map to make it look better
    reflectedRay = reflect(worldPosition.xyz - camPosition, N);
    reflectedRay.x = -reflectedRay.x;
    reflectedColour += vec4(textureCube(envMap, reflectedRay).rgb, 1.0) * 0.3;

    // refraction
    vec3 refractedRay = refract(worldPosition.xyz - camPosition, normalMap_normal, n_air/n_water);
    refractedRay.x = -refractedRay.x;
    vec4 refractedColour = vec4(textureCube(envMap, refractedRay).rgb, 1.0);

    // Fresnel equation
    float fresnelR0 = pow((n_air - n_water) / (n_air + n_water), 2.0);
    float incidentDot = max(0.0, 1.0 - dot(normalMap_normal, normalize(camPosition - worldPosition.xyz)));
    float reflectionCoefficient = fresnelR0 + (1.0 - fresnelR0) * pow(incidentDot, 5.0);
    vec4 outputColour = reflectionCoefficient * reflectedColour + (1.0 - reflectionCoefficient) * refractedColour;
    // gl_FragColor = outputColour; // looks not as good as reflectedColour
    gl_FragColor = reflectedColour;

    // water texture
    vec4 waterTex = texture2D(waterTex, uVu);
    gl_FragColor += waterTex;

    /*
    // flow map
    vec2 flowBase = texture2D(flowMap, uVu).rg * 2.0 - 1.0;
    float cycleOffset = 0.5;

    float phase0 = cycleOffset * 0.5 + 0.5;
    float phase1 = cycleOffset * 0.5 + 1.0;
    */
}

`
export default waterFragShader;