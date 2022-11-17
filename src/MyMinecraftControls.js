import {
	Euler,
	EventDispatcher,
	Vector3,
} from 'three';

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

import { World } from './World.js'

class MyMinecraftControls extends EventDispatcher {

	constructor( camera, domElement, updateMeshCallback, updateSelectBlockCallback) {

        /**
         * Borrowed and modified from PointerLockControls.js
         * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/PointerLockControls.js
         */
		super();

        this.camera = camera;
		this.domElement = domElement;
		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		this.pointerSpeed = 1.0;

		const scope = this;

		function onMouseMove( event ) {

			if ( scope.isLocked === false ) return;

			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

			_euler.setFromQuaternion( camera.quaternion );

			_euler.y -= movementX * 0.002 * scope.pointerSpeed;
			_euler.x -= movementY * 0.002 * scope.pointerSpeed;

			_euler.x = Math.max( _PI_2 - scope.maxPolarAngle, Math.min( _PI_2 - scope.minPolarAngle, _euler.x ) );

			camera.quaternion.setFromEuler( _euler );

			scope.dispatchEvent( _changeEvent );

		}

		function onPointerlockChange() {

			if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

				scope.dispatchEvent( _lockEvent );

				scope.isLocked = true;

			} else {

				scope.dispatchEvent( _unlockEvent );

				scope.isLocked = false;

			}

		}

		function onPointerlockError() {

			console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

		}

		this.connect = function () {

			scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.disconnect = function () {

			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.getObject = function () { // retaining this method for backward compatibility

			return camera;

		};

		this.getDirection = function () {

			const direction = new Vector3( 0, 0, - 1 );

			return function ( v ) {

				return v.copy( direction ).applyQuaternion( camera.quaternion );

			};

		}();

		this.moveForward = function ( distance ) {

			// move forward parallel to the xz-plane
			// assumes camera.up is y-up

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			_vector.crossVectors( camera.up, _vector );

			camera.position.addScaledVector( _vector, distance );

		};

		this.moveRight = function ( distance ) {

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			camera.position.addScaledVector( _vector, distance );

		};

		this.lock = function () {

			this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

        /**
         * Borrowed and modified from FirstPersonControls.js
         * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/FirstPersonControls.js
         */
         this.enabled = true;

         this.movementSpeed = 1.0;

         this.moveForward = false;
         this.moveBackward = false;
         this.moveLeft = false;
         this.moveRight = false;
         this.moveUp = false;
         this.moveDown = false;

         this.onKeyDown = function ( event ) {
			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = true; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = true; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = true; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = true; break;

				case 'Space': this.moveUp = true; break;
				case 'ShiftLeft': this.moveDown = true; break;

			}

		};

		this.onKeyUp = function ( event ) {

			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = false; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = false; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = false; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = false; break;

				case 'Space': this.moveUp = false; break;
				case 'ShiftLeft': this.moveDown = false; break;

			}

		};

        this.update = function update( delta ) {
                if ( this.enabled === false ) return;

                const actualMoveSpeed = delta * this.movementSpeed;
				let prev_x = this.camera.position.x;
				let prev_z = this.camera.position.z;
				let camera_direction = new Vector3();
				this.camera.getWorldDirection(camera_direction);
				let camera_left_direction_2d = new Vector3(-camera_direction.z, 0, camera_direction.x);
				let horizontal_norm = Math.sqrt( Math.pow(camera_direction.x, 2) + Math.pow(camera_direction.z, 2) );
				let x_speed = 0;
				let z_speed = 0;

				if ( this.moveForward && this.isLocked && horizontal_norm > 0.01 ) {
                    z_speed += actualMoveSpeed/horizontal_norm*camera_direction.z;
					x_speed += actualMoveSpeed/horizontal_norm*camera_direction.x;
                }
				if ( this.moveBackward && this.isLocked && horizontal_norm > 0.01 ) {
                    z_speed -= actualMoveSpeed/horizontal_norm*camera_direction.z;
					x_speed -= actualMoveSpeed/horizontal_norm*camera_direction.x;
                }
				if ( this.moveLeft && this.isLocked && horizontal_norm > 0.01 ) {
					z_speed -= actualMoveSpeed/horizontal_norm*camera_left_direction_2d.z;
                    x_speed -= actualMoveSpeed/horizontal_norm*camera_left_direction_2d.x;
                }
				if ( this.moveRight && this.isLocked && horizontal_norm > 0.01 ) {
					z_speed += actualMoveSpeed/horizontal_norm*camera_left_direction_2d.z;
                    x_speed += actualMoveSpeed/horizontal_norm*camera_left_direction_2d.x;
                }
				x_speed = Math.min(x_speed, 1000);
				z_speed = Math.min(z_speed, 1000);

				this.camera.position.setX(prev_x+x_speed);
				this.camera.position.setZ(prev_z+z_speed);

                if (this.moveUp && this.isLocked){
                    let prev_y = this.camera.position.y;
                    this.camera.position.setY(prev_y + actualMoveSpeed);
                }
                if (this.moveDown && this.isLocked){
                    let prev_y = this.camera.position.y;
                    this.camera.position.setY(prev_y - actualMoveSpeed);
                }

				this.updateSelectBlock();
            }

        const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );
        window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

		/**
         * My codes, building and destroying blocks
         */
		this.selectedBlock = {"blockId": null, "face": null};
		this.updateSelectBlock = function (){
			let camDir = new Vector3();
			let camPos = new Vector3();
			camera.getWorldDirection(camDir);
			camera.getWorldPosition(camPos);
			const maxCoorDist = 1000;
			const maxBlockDist = 5;
			const signX = camDir.x>=0; const signY = camDir.y>=0; const signZ = camDir.z>=0;
			const cameraBlockId = World.worldCoorToBlockId(camPos);

			let candidates = [];
			for (let i=1; i<=maxBlockDist; i++){
				let x_plane_coor = (signX) ? (cameraBlockId.x+i)*100 - World.worldHalfWidth*100 - 50 : (cameraBlockId.x-i)*100 - World.worldHalfWidth*100 + 50;
				candidates.push(World.originAndDirToBlockId(camPos, camDir, {"x":x_plane_coor}));
				let y_plane_coor = (signY) ? (cameraBlockId.y+i)*100 - 50 : (cameraBlockId.y-i)*100 + 50;
				candidates.push(World.originAndDirToBlockId(camPos, camDir, {"y":y_plane_coor}));
				let z_plane_coor = (signZ) ? (cameraBlockId.z+i)*100 - World.worldHalfDepth*100 - 50 : (cameraBlockId.z-i)*100 - World.worldHalfDepth*100 + 50;
				candidates.push(World.originAndDirToBlockId(camPos, camDir, {"z":z_plane_coor}));
			}

			// console.log(candidates)
			candidates = candidates.filter((elem)=>elem!=null)
			candidates = candidates.filter((elem)=>{
				let adjBlockId = Object.assign({}, elem.blockId)
				switch (elem.face){
					case 'px':
						adjBlockId.x += 1;
						break;
					case 'nx':
						adjBlockId.x -= 1;
						break;
					case 'py':
						adjBlockId.y += 1;
						break;
					case 'ny':
						adjBlockId.y -= 1;
						break;
					case 'pz':
						adjBlockId.z += 1;
						break;
					case 'nz':
						adjBlockId.z -= 1;
						break;
				}

				// if (World.isBlock(elem.blockId)){
				// 	 console.log(`blockId = ${JSON.stringify(elem.blockId)}, isBlock = ${World.isBlock(elem.blockId)}, 
				// 	elem.dist = ${elem.dist}, elem.face = ${elem.face}, elem.temp = ${JSON.stringify(elem.temp)}, 
				// 	elem.coor = ${JSON.stringify(elem.coor)}, adjBlock is block = ${World.isBlock(adjBlockId)}`)
				// }
				return World.isBlock(elem.blockId) && elem.dist<=maxCoorDist && !World.isBlock(adjBlockId);
			})
			candidates.sort((a,b)=>{
				return a.dist<b.dist;
			})

			//console.log(candidates)

			if (candidates.length==0){
				this.selectedBlock.blockId = null;
				this.selectedBlock.face = null;
				updateSelectBlockCallback({"blockId": null, "face": null});
			} else{
				let selected = candidates[0];
				// console.log(`selected = ${JSON.stringify(selected)}`)
				if(
					this.selectedBlock.blockId === null 
					|| selected.blockId.x!==this.selectedBlock.blockId.x 
					|| selected.blockId.y!==this.selectedBlock.blockId.y
					|| selected.blockId.z!==this.selectedBlock.blockId.z
					|| selected.face!==this.selectedBlock.face){
						this.selectedBlock.blockId = selected.blockId;
						this.selectedBlock.face = selected.face;
						updateSelectBlockCallback({"blockId": selected.blockId, "face": selected.face});
				} else{
					return;
				}
			}
		};
		this.onPointerDown = function ( event ) {
			if ( this.domElement !== document ) {
				this.domElement.focus();
			}

			if ( this.isLocked ) {
				switch ( event.button ) {
					case 0: // left click
						
						break;
					case 2: // right click
						
						break;
				}

			}

			this.mouseDragOn = true;

		};
		 const _onPointerDown = this.onPointerDown.bind( this );
		 this.domElement.addEventListener( 'pointerdown', _onPointerDown );

        /**
         * Combined function
         */
        this.dispose = function () {

			this.disconnect();
			window.removeEventListener( 'keydown', _onKeyDown );
			window.removeEventListener( 'keyup', _onKeyUp );
		};
	}

}

export { MyMinecraftControls };