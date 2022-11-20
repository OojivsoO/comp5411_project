import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { MyMinecraftControls } from './src/MyMinecraftControls.js'
import { World } from './src/World.js' 
import { Vector3 } from 'three';

import waterFragShader from './shaders/water.frag.js';
import waterVertexShader from './shaders/water.vert.js';

let container, stats;

let camera, controls, scene, renderer, geometry, mesh, texture, material, selectedBlock, selectedPlane;
let sky, sun;

const worldWidth = 128, worldDepth = 128, worldHeight = 128;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;
const worldHalfHeight = worldHeight / 2;

const pxGeometry = new THREE.PlaneGeometry( 100, 100 );
const nxGeometry = new THREE.PlaneGeometry( 100, 100 );
const pyGeometry = new THREE.PlaneGeometry( 100, 100 );
const nyGeometry = new THREE.PlaneGeometry( 100, 100 );
const pzGeometry = new THREE.PlaneGeometry( 100, 100 );
const nzGeometry = new THREE.PlaneGeometry( 100, 100 );
const grassBlockTexture = new THREE.TextureLoader().load( 'textures/atlas.png' );
const grassBlockMaterial = new THREE.MeshStandardMaterial( { map: grassBlockTexture, side: THREE.FrontSide} ) ;
const matrix = new THREE.Matrix4();

const refractiveIndex = {
    "air": 1.00,
    "water": 1.33,
};

// demo of water block, to be replaced later
const waterGeometry = new THREE.BoxGeometry(100,100,100);

const clock = new THREE.Clock();

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    World.init(worldWidth, worldDepth, worldHeight);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.y = World.getY( worldHalfWidth, worldHalfDepth ) * 100 + 200;

    scene = new THREE.Scene();

    // add cube map
    initCubeMap(scene, 'textures/cubeMaps/');

    initGeo();

    grassBlockTexture.magFilter = THREE.NearestFilter;

    // init world blocks
    geometry = {};
    geometry["GrassBlock"] = worldToGeometry("GrassBlock");
    geometry["Water"]= worldToGeometry("Water");
    geometry["GrassBlock"].computeBoundingSphere();
    geometry["Water"].computeBoundingSphere();
    geometry["GrassBlock"].computeVertexNormals();

    // temp
    let waterMaterial = initWaterMaterial(scene);

    material = {};
    material["GrassBlock"] = grassBlockMaterial;
    material["Water"] = waterMaterial;

    mesh = {};
    mesh["GrassBlock"] = new THREE.Mesh( geometry["GrassBlock"], material["GrassBlock"] );
    scene.add( mesh["GrassBlock"] );

    mesh["Water"] = new THREE.Mesh( geometry["Water"], material["Water"] );
    scene.add( mesh["Water"] );

    // init selected block
    selectedBlock = {};
    selectedBlock.baseGeometry = new THREE.BoxGeometry(100,100,100);
    selectedBlock.geometry = selectedBlock.baseGeometry.clone()
    selectedBlock.material = new THREE.MeshBasicMaterial( {color: 0xffffff, transparent: true, opacity: 0} );
    selectedBlock.mesh = new THREE.Mesh( selectedBlock.geometry, selectedBlock.material );
    scene.add( selectedBlock.mesh );
    selectedPlane = {};
    selectedPlane.baseGeometry = new THREE.PlaneGeometry(100,100);
    selectedPlane.planeGeometry = {
        "px": selectedPlane.baseGeometry.clone().rotateY( Math.PI / 2 ).translate( 50, 0, 0 ),
        "nx": selectedPlane.baseGeometry.clone().rotateY( -Math.PI / 2 ).translate( -50, 0, 0 ),
        "py": selectedPlane.baseGeometry.clone().rotateX( - Math.PI / 2 ).translate( 0, 50, 0 ),
        "ny": selectedPlane.baseGeometry.clone().rotateX( Math.PI / 2 ).translate( 0, -50, 0 ),
        "pz": selectedPlane.baseGeometry.clone().translate( 0, 0, 50 ),
        "nz": selectedPlane.baseGeometry.clone().rotateY( Math.PI ).translate( 0, 0, - 50 )
    };
    selectedPlane.geometry = selectedPlane.planeGeometry.py;
    selectedPlane.material = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0} );
    selectedPlane.mesh = new THREE.Mesh( selectedPlane.geometry, selectedPlane.material );
    scene.add( selectedPlane.mesh );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // lighting
    const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.3 );
    scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.3 );
    let directionalLightSource = new Vector3(0,1,-1).normalize();
    let r = Math.sqrt(Math.pow(worldHalfWidth*100,2) + Math.pow(worldHalfDepth*100,2) + Math.pow(worldHalfHeight*100,2))
    directionalLightSource.multiplyScalar(r);
    directionalLight.position.set( directionalLightSource.x, directionalLightSource.y, directionalLightSource.z );
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0;
    directionalLight.shadow.camera.far = 2*r;
    directionalLight.shadow.camera.left = -r;
    directionalLight.shadow.camera.right = r;
    directionalLight.shadow.camera.top = r;
    directionalLight.shadow.camera.bottom = -r;
    // console.log(directionalLight.shadow.camera)
    scene.add( directionalLight );
    mesh['GrassBlock'].castShadow  = true;
    mesh['GrassBlock'].receiveShadow  = true;
    // scene.add( new THREE.CameraHelper( directionalLight.shadow.camera ) );

    // testing for sky
    // initSky();

    // connect controls
    controls = new MyMinecraftControls( camera, renderer.domElement, updateMeshCallback, updateSelectBlockCallback );
    window.addEventListener("keydown", (event) => {
        if (event.key === 'Escape'){
            if (controls.isLocked){
                controls.unlock();
            }
        }
    })
    container.onclick = ()=>{
        if (!controls.isLocked){
            controls.lock();
        }
    }
    // controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 2000;

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize );

}

function initGeo(){
    pxGeometry.attributes.uv.array[0] = 0;
    pxGeometry.attributes.uv.array[1] = 2/3;
    pxGeometry.attributes.uv.array[2] = 1;
    pxGeometry.attributes.uv.array[3] = 2/3;
    pxGeometry.attributes.uv.array[4] = 0;
    pxGeometry.attributes.uv.array[5] = 1/3;
    pxGeometry.attributes.uv.array[6] = 1;
    pxGeometry.attributes.uv.array[7] = 1/3;
    pxGeometry.rotateY( Math.PI / 2 );
    pxGeometry.translate( 50, 0, 0 );

    nxGeometry.attributes.uv.array[0] = 0;
    nxGeometry.attributes.uv.array[1] = 2/3;
    nxGeometry.attributes.uv.array[2] = 1;
    nxGeometry.attributes.uv.array[3] = 2/3;
    nxGeometry.attributes.uv.array[4] = 0;
    nxGeometry.attributes.uv.array[5] = 1/3;
    nxGeometry.attributes.uv.array[6] = 1;
    nxGeometry.attributes.uv.array[7] = 1/3;
    nxGeometry.rotateY( - Math.PI / 2 );
    nxGeometry.translate( - 50, 0, 0 );

    pyGeometry.attributes.uv.array[0] = 0;
    pyGeometry.attributes.uv.array[1] = 1;
    pyGeometry.attributes.uv.array[2] = 1;
    pyGeometry.attributes.uv.array[3] = 1;
    pyGeometry.attributes.uv.array[4] = 0;
    pyGeometry.attributes.uv.array[5] = 2/3;
    pyGeometry.attributes.uv.array[6] = 1;
    pyGeometry.attributes.uv.array[7] = 2/3;
    pyGeometry.rotateX( - Math.PI / 2 );
    pyGeometry.translate( 0, 50, 0 );

    nyGeometry.attributes.uv.array[0] = 0;
    nyGeometry.attributes.uv.array[1] = 1/3;
    nyGeometry.attributes.uv.array[2] = 1;
    nyGeometry.attributes.uv.array[3] = 1/3;
    nyGeometry.attributes.uv.array[4] = 0;
    nyGeometry.attributes.uv.array[5] = 0;
    nyGeometry.attributes.uv.array[6] = 1;
    nyGeometry.attributes.uv.array[7] = 0;
    nyGeometry.rotateX( Math.PI / 2 );
    nyGeometry.translate( 0, - 50, 0 );

    pzGeometry.attributes.uv.array[0] = 0;
    pzGeometry.attributes.uv.array[1] = 2/3;
    pzGeometry.attributes.uv.array[2] = 1;
    pzGeometry.attributes.uv.array[3] = 2/3;
    pzGeometry.attributes.uv.array[4] = 0;
    pzGeometry.attributes.uv.array[5] = 1/3;
    pzGeometry.attributes.uv.array[6] = 1;
    pzGeometry.attributes.uv.array[7] = 1/3;
    pzGeometry.translate( 0, 0, 50 );

    nzGeometry.attributes.uv.array[0] = 0;
    nzGeometry.attributes.uv.array[1] = 2/3;
    nzGeometry.attributes.uv.array[2] = 1;
    nzGeometry.attributes.uv.array[3] = 2/3;
    nzGeometry.attributes.uv.array[4] = 0;
    nzGeometry.attributes.uv.array[5] = 1/3;
    nzGeometry.attributes.uv.array[6] = 1;
    nzGeometry.attributes.uv.array[7] = 1/3;
    nzGeometry.rotateY( Math.PI );
    nzGeometry.translate( 0, 0, - 50 );
}

function initCubeMap(scene, cubeMapDir) {
    scene.background = new THREE.CubeTextureLoader()
	.setPath( cubeMapDir )
	.load( [
		'posx.jpg',
		'negx.jpg',
		'posy.jpg',
		'negy.jpg',
		'posz.jpg',
		'negz.jpg'
	] );
}

function initWaterMaterial(scene) {
    return new THREE.ShaderMaterial(
        {
            uniforms: {
                time: { value: 1.0 },
                eta: { value: refractiveIndex["air"] / refractiveIndex["water"] }, // unused
                envMap: { value: scene.background },
                normalMap: { value: new THREE.TextureLoader().load( 'textures/normalmap.png' ) },
                waterTex: { value: new THREE.TextureLoader().load( 'textures/water3.png' ) },
                flowMap: { value: new THREE.TextureLoader().load( 'textures/flowmap.jpg' ) }
            },
            vertexShader: waterVertexShader,
            fragmentShader: waterFragShader,
        }
    );
}

function initSky(){
    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 2.5,
        rayleigh: 0.647,
        mieCoefficient: 0.008,
        mieDirectionalG: 0.125,
        elevation: 10,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render( scene, camera );

}

function worldToGeometry(type){
    if (type === "GrassBlock"){
        const world_block_geometries = [];
        for ( let x = 0; x < worldWidth; x ++ ) {
            for ( let z = 0; z < worldDepth; z ++ ) {
                for (const y of World.worldGrassBlockData[x][z]){
                    matrix.makeTranslation(
                        x * 100 - worldHalfWidth * 100 + 50,
                        y * 100 + 50,
                        z * 100 - worldHalfDepth * 100 + 50
                    );
    
                    const px = World.worldGrassBlockData[Math.min(x+1,worldWidth-1)][z].includes(y);
                    const px_water = World.worldWaterData[Math.min(x+1,worldWidth-1)][z].includes(y);
                    const nx = World.worldGrassBlockData[Math.max(x-1,0)][z].includes(y);
                    const nx_water = World.worldWaterData[Math.max(x-1,0)][z].includes(y);
                    const py = World.worldGrassBlockData[x][z].includes(y+1);
                    const py_water = World.worldWaterData[x][z].includes(y+1);
                    const py_block = World.worldBlockData[x][z].includes(y+1);
                    const ny = World.worldGrassBlockData[x][z].includes(y-1);
                    const pz = World.worldGrassBlockData[x][Math.min(z+1,worldDepth-1)].includes(y);
                    const pz_water = World.worldWaterData[x][Math.min(z+1,worldDepth-1)].includes(y);
                    const nz = World.worldGrassBlockData[x][Math.max(z-1,0)].includes(y);
                    const nz_water = World.worldWaterData[x][Math.max(z-1,0)].includes(y);
    
                    if (!px||x===worldWidth-1){
                        if (px_water||py_block){
                            world_block_geometries.push( nyGeometry.clone().rotateZ(Math.PI/2).applyMatrix4( matrix ) );
                        } else{
                            world_block_geometries.push( pxGeometry.clone().applyMatrix4( matrix ) );
                        }
                    }
    
                    if (!nx||x===0){
                        if (nx_water||py_block){
                            world_block_geometries.push( nyGeometry.clone().rotateZ(-Math.PI/2).applyMatrix4( matrix ) );
                        } else{
                            world_block_geometries.push( nxGeometry.clone().applyMatrix4( matrix ) );
                        }
                    }
    
                    if (!py && !py_water){
                        world_block_geometries.push( pyGeometry.clone().applyMatrix4( matrix ) );
                    }
    
                    if (!py && py_water){
                        world_block_geometries.push( nyGeometry.clone().rotateZ(-Math.PI).applyMatrix4( matrix ) );
                    }
    
                    if (!ny){
                        world_block_geometries.push( nyGeometry.clone().applyMatrix4( matrix ) );
                    }
    
                    if (!pz||z===worldDepth-1){
                        if (pz_water||py_block){
                            world_block_geometries.push( nyGeometry.clone().rotateX(-Math.PI/2).applyMatrix4( matrix ) );
                        } else{
                            world_block_geometries.push( pzGeometry.clone().applyMatrix4( matrix ) );
                        }
                    }
    
                    if (!nz||z===0){
                        if (nz_water||py_block){
                            world_block_geometries.push( nyGeometry.clone().rotateX(Math.PI/2).applyMatrix4( matrix ) );
                        } else{
                            world_block_geometries.push( nzGeometry.clone().applyMatrix4( matrix ) );
                        }
                    }
                }
            }
        }
        return BufferGeometryUtils.mergeBufferGeometries( world_block_geometries );
    } else if (type === "Water"){
        const world_water_geometries = [];
        for ( let x = 0; x < worldWidth; x ++ ) {
            for ( let z = 0; z < worldDepth; z ++ ) {
                for (const y of World.worldWaterData[x][z]){
                    matrix.makeTranslation(
                        x * 100 - worldHalfWidth * 100 + 50,
                        y * 100 + 50,
                        z * 100 - worldHalfDepth * 100 + 50
                    );
                    world_water_geometries.push( waterGeometry.clone().applyMatrix4(matrix) );
                }
            }
        }
        return BufferGeometryUtils.mergeBufferGeometries( world_water_geometries );
    }
}

function updateMeshCallback(type){
    scene.remove(mesh[type]);
    geometry[type].dispose();
    geometry[type] = worldToGeometry(type);
    geometry[type].computeBoundingSphere();

    mesh[type] = new THREE.Mesh( geometry[type], material[type] );
    scene.add(mesh[type]);
    if(type==="GrassBlock"){
        mesh['GrassBlock'].castShadow  = true;
        mesh['GrassBlock'].receiveShadow  = true;
    }
}

function updateSelectBlockCallback(block){
    // console.log(`update block = ${JSON.stringify(block)}`)
    let blockId = block.blockId;
    let blockFace = block.face;
    if (blockId===null||blockFace===null){
        selectedBlock.material.opacity = 0;
        selectedPlane.material.opacity = 0;
        selectedBlock.selecting = false;
        return;
    }
    selectedBlock.selecting = true;

    selectedPlane.material.opacity = 0.6;
    selectedBlock.material.opacity = 0.5;
    matrix.makeTranslation(
        (blockId.x) * 100 - worldHalfWidth * 100 + 50,
        (blockId.y) * 100 + 50,
        (blockId.z) * 100 - worldHalfDepth * 100 + 50
    );

    scene.remove(selectedBlock.mesh);
    selectedBlock.geometry.dispose();
    selectedBlock.geometry = selectedBlock.baseGeometry.clone().applyMatrix4(matrix);
    selectedBlock.mesh = new THREE.Mesh( selectedBlock.geometry, selectedBlock.material );
    scene.add(selectedBlock.mesh);

    scene.remove(selectedPlane.mesh);
    selectedPlane.geometry.dispose();
    selectedPlane.geometry = selectedPlane.planeGeometry[blockFace].clone().applyMatrix4(matrix);
    selectedPlane.mesh = new THREE.Mesh( selectedPlane.geometry, selectedPlane.material );
    scene.add(selectedPlane.mesh);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    //controls.handleResize();

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

    mesh["Water"].material.uniforms.time.value += 0.005;

}

function render() {

    controls.update( clock.getDelta() );
    renderer.render( scene, camera );

}