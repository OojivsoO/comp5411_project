import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { MyMinecraftControls } from './src/MyMinecraftControls.js'
import { World } from './src/World.js' 
import { Vector3 } from 'three';

let container, stats;

let camera, controls, scene, renderer, world_block_geometry, world_water_geometry, mesh, texture, selectedBlock, selectedPlane;

const worldWidth = 128, worldDepth = 128, worldHeight = 128;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

const pxGeometry = new THREE.PlaneGeometry( 100, 100 );
const nxGeometry = new THREE.PlaneGeometry( 100, 100 );
const pyGeometry = new THREE.PlaneGeometry( 100, 100 );
const nyGeometry = new THREE.PlaneGeometry( 100, 100 );
const pzGeometry = new THREE.PlaneGeometry( 100, 100 );
const nzGeometry = new THREE.PlaneGeometry( 100, 100 );
const matrix = new THREE.Matrix4();

// demo of water block, to be replaced later
const waterGeometry = new THREE.BoxGeometry(100,100,100);
const waterMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff, transparent: true, opacity: 0.2} );

const clock = new THREE.Clock();

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    World.init(worldWidth, worldDepth, worldHeight);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.y = World.getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    initGeo();

    texture = new THREE.TextureLoader().load( 'textures/atlas.png' );
    texture.magFilter = THREE.NearestFilter;

    // init world blocks
    [world_block_geometry, world_water_geometry] = worldToGeometry()
    world_block_geometry.computeBoundingSphere();
    world_water_geometry.computeBoundingSphere();

    mesh = new THREE.Mesh( world_block_geometry, new THREE.MeshLambertMaterial( { map: texture, side: THREE.DoubleSide } ) );
    scene.add( mesh );

    mesh = new THREE.Mesh( world_water_geometry, waterMaterial );
    scene.add( mesh );

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

    // lighting
    const ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

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

    //

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

function worldToGeometry(){
    const world_block_geometries = [];
    const world_water_geometries = [];
    for ( let x = 0; x < worldWidth; x ++ ) {
        for ( let z = 0; z < worldDepth; z ++ ) {
            for (const y of World.worldData[x][z]){
                matrix.makeTranslation(
                    x * 100 - worldHalfWidth * 100,
                    y * 100,
                    z * 100 - worldHalfDepth * 100
                );

                const px = World.worldData[Math.min(x+1,worldWidth-1)][z].includes(y);
                const px_water = World.waterData[Math.min(x+1,worldWidth-1)][z].includes(y);
                const nx = World.worldData[Math.max(x-1,0)][z].includes(y);
                const nx_water = World.waterData[Math.max(x-1,0)][z].includes(y);
                const py = World.worldData[x][z].includes(y+1);
                const py_water = World.waterData[x][z].includes(y+1);
                const ny = World.worldData[x][z].includes(y-1);
                const pz = World.worldData[x][Math.min(z+1,worldDepth-1)].includes(y);
                const pz_water = World.waterData[x][Math.min(z+1,worldDepth-1)].includes(y);
                const nz = World.worldData[x][Math.max(z-1,0)].includes(y);
                const nz_water = World.waterData[x][Math.max(z-1,0)].includes(y);

                if (!px||x===worldWidth-1){
                    if (px_water){
                        world_block_geometries.push( nyGeometry.clone().rotateZ(Math.PI/2).applyMatrix4( matrix ) );
                    } else{
                        world_block_geometries.push( pxGeometry.clone().applyMatrix4( matrix ) );
                    }
                }

                if (!nx||x===0){
                    if (nx_water){
                        world_block_geometries.push( nyGeometry.clone().rotateZ(-Math.PI/2).applyMatrix4( matrix ) );
                    } else{
                        world_block_geometries.push( nxGeometry.clone().applyMatrix4( matrix ) );
                    }
                }

                if (!py && !py_water){
                    world_block_geometries.push( pyGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!py && py_water){
                    world_block_geometries.push( nyGeometry.clone().translate(0, 100, 0).applyMatrix4( matrix ) );
                }

                if (!ny){
                    world_block_geometries.push( nyGeometry.clone().applyMatrix4( matrix ) );
                }

                if (!pz||z===worldDepth-1){
                    if (pz_water){
                        world_block_geometries.push( nyGeometry.clone().rotateX(-Math.PI/2).applyMatrix4( matrix ) );
                    } else{
                        world_block_geometries.push( pzGeometry.clone().applyMatrix4( matrix ) );
                    }
                }

                if (!nz||z===0){
                    if (nz_water){
                        world_block_geometries.push( nyGeometry.clone().rotateX(Math.PI/2).applyMatrix4( matrix ) );
                    } else{
                        world_block_geometries.push( nzGeometry.clone().applyMatrix4( matrix ) );
                    }
                }
            }
        }
    }

    for ( let x = 0; x < worldWidth; x ++ ) {
        for ( let z = 0; z < worldDepth; z ++ ) {
            for (const y of World.waterData[x][z]){
                matrix.makeTranslation(
                    x * 100 - worldHalfWidth * 100,
                    y * 100,
                    z * 100 - worldHalfDepth * 100
                );
                world_water_geometries.push( waterGeometry.clone().applyMatrix4(matrix) );
            }
        }
    }


    return [BufferGeometryUtils.mergeBufferGeometries( world_block_geometries ),
            BufferGeometryUtils.mergeBufferGeometries( world_water_geometries )];
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

function updateSelectBlockCallback(block){
    console.log(`update block = ${JSON.stringify(block)}`)
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
        (blockId.x) * 100 - worldHalfWidth * 100,
        (blockId.y) * 100,
        (blockId.z) * 100 - worldHalfDepth * 100
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
    //selectedBlock.geometry = selectedBlock.baseGeometry.clone().applyMatrix4(matrix);
    //selectedBlock.geometry.attributes.position = new Vector3(blockId.x, blockId.y, blockId.z)
    //selectedBlock.geometry.attributes.position.needsUpdate = true;\
    // if (selectedBlock.coordinate){
    //     matrix.makeTranslation(
    //         (blockId.x - selectedBlock.coordinate.x) * 100,
    //         (blockId.y - selectedBlock.coordinate.y) * 100,
    //         (blockId.z - selectedBlock.coordinate.z) * 100
    //     );
    //     selectedBlock.geometry.applyMatrix4(matrix);
    //     selectedPlane.geometry.applyMatrix4(matrix);
    // } else{
    //     matrix.makeTranslation(
    //         blockId.x * 100 - worldHalfWidth * 100,
    //         blockId.y * 100,
    //         blockId.z * 100 - worldHalfDepth * 100
    //     );
    //     selectedBlock.geometry.applyMatrix4(matrix);
    //     selectedPlane.geometry.applyMatrix4(matrix);
    // }
    // selectedBlock.coordinate = blockId;
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