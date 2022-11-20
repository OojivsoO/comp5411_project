let waterVertexShader = `

varying vec2 uVu;
varying vec3 worldPosition;
varying vec3 camPosition;
varying vec3 N;

void main() {

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // vertex normal
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    N = normalize((modelMatrix * vec4(normal, 1.0)).xyz);

    // ray of reflection
    //reflectedRay = reflect(worldPosition.xyz - cameraPosition, N);
    //reflectedRay.x = -reflectedRay.x;
    camPosition = cameraPosition;

    // uVu = (gl_Position.xy / gl_Position.w) / 2.0 + 0.5; // ndc as uv, 
    // // sounds good but looks strange as texture is 'sticked' to the screen - useful for effects like water droplets on camera
    uVu = uv;
}

`
export default waterVertexShader;