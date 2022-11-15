import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { MyMinecraftControls } from './src/MyMinecraftControls.js'
import { World } from './src/World.js' 

let container, stats;

let camera, controls, scene, renderer, world, geometry, mesh, texture;

const worldWidth = 128, worldDepth = 128;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

const pxGeometry = new THREE.PlaneGeometry( 100, 100 );
const nxGeometry = new THREE.PlaneGeometry( 100, 100 );
const pyGeometry = new THREE.PlaneGeometry( 100, 100 );
const nyGeometry = new THREE.PlaneGeometry( 100, 100 );
const pzGeometry = new THREE.PlaneGeometry( 100, 100 );
const nzGeometry = new THREE.PlaneGeometry( 100, 100 );
const matrix = new THREE.Matrix4();

const clock = new THREE.Clock();

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    World.init(worldWidth, worldDepth);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.y = World.getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    initGeo();

    texture = new THREE.TextureLoader().load( 'textures/atlas.png' );
    texture.magFilter = THREE.NearestFilter;

    //
    geometry = worldToGeometry()
    geometry.computeBoundingSphere();

    mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture, side: THREE.DoubleSide } ) );
    scene.add( mesh );

    const ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    controls = new MyMinecraftControls( camera, renderer.domElement, updateMeshCallback );
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
    controls.movementSpeed = 1000;

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize );

}

function initGeo(){
    pxGeometry.attributes.uv.array[ 1 ] = 0.5;
    pxGeometry.attributes.uv.array[ 3 ] = 0.5;
    pxGeometry.rotateY( Math.PI / 2 );
    pxGeometry.translate( 50, 0, 0 );

    nxGeometry.attributes.uv.array[ 1 ] = 0.5;
    nxGeometry.attributes.uv.array[ 3 ] = 0.5;
    nxGeometry.rotateY( - Math.PI / 2 );
    nxGeometry.translate( - 50, 0, 0 );

    pyGeometry.attributes.uv.array[ 5 ] = 0.5;
    pyGeometry.attributes.uv.array[ 7 ] = 0.5;
    pyGeometry.rotateX( - Math.PI / 2 );
    pyGeometry.translate( 0, 50, 0 );

    nyGeometry.attributes.uv.array[ 5 ] = 0.5;
    nyGeometry.attributes.uv.array[ 7 ] = 0.5;
    nyGeometry.rotateX( Math.PI / 2 );
    nyGeometry.translate( 0, - 50, 0 );

    pzGeometry.attributes.uv.array[ 1 ] = 0.5;
    pzGeometry.attributes.uv.array[ 3 ] = 0.5;
    pzGeometry.translate( 0, 0, 50 );

    nzGeometry.attributes.uv.array[ 1 ] = 0.5;
    nzGeometry.attributes.uv.array[ 3 ] = 0.5;
    nzGeometry.rotateY( Math.PI );
    nzGeometry.translate( 0, 0, - 50 );
}

function worldToGeometry(){
    const geometries = [];
    for ( let x = 0; x < worldWidth; x ++ ) {
        for ( let z = 0; z < worldDepth; z ++ ) {
            for (const y of World.worldData[x][z]){
                matrix.makeTranslation(
                    x * 100 - worldHalfWidth * 100,
                    y * 100,
                    z * 100 - worldHalfDepth * 100
                );

                const px = World.worldData[Math.min(x+1,worldWidth-1)][z].includes(y);
                const nx = World.worldData[Math.max(x-1,0)][z].includes(y);
                const py = World.worldData[x][z].includes(y+1);
                const ny = World.worldData[x][z].includes(y-1);
                const pz = World.worldData[x][Math.min(z+1,worldDepth-1)].includes(y);
                const nz = World.worldData[x][Math.max(z-1,0)].includes(y);

                if (!px||x===worldWidth-1){
                    geometries.push( pxGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!nx||x===0){
                    geometries.push( nxGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!py){
                    geometries.push( pyGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!ny){
                    geometries.push( nyGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!pz||z===worldDepth-1){
                    geometries.push( pzGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!nz||z===0){
                    geometries.push( nzGeometry.clone().applyMatrix4( matrix ) );
                }
            }
        }
    }


    return geometry = BufferGeometryUtils.mergeBufferGeometries( geometries );
}

function updateMeshCallback(){
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    geometry = worldToGeometry();
    geometry.computeBoundingSphere();

    mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture, side: THREE.DoubleSide } ) );
    scene.add( mesh );
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

}

function render() {

    controls.update( clock.getDelta() );
    renderer.render( scene, camera );

}