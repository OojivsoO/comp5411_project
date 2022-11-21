let waterVertexShader = `

varying vec2 uVu;
varying vec3 worldPosition;
varying vec3 camPosition;
varying vec3 N;

void main() {

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    N = normalize((modelMatrix * vec4(normal, 1.0)).xyz);
    camPosition = cameraPosition;
    uVu = uv;
}

`
export default waterVertexShader;