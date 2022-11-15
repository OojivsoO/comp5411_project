import {
	Euler,
	EventDispatcher,
	Vector3
} from 'three';

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class MyMinecraftControls extends EventDispatcher {

	constructor( camera, domElement, updateMeshCallback ) {

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
         this.activeLook = true;

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
				if ( this.moveForward && this.isLocked ) {
                    let prev_y = this.camera.position.y
                    this.camera.translateZ( - ( actualMoveSpeed ) );
                    this.camera.position.setY(prev_y)
                }
				if ( this.moveBackward && this.isLocked) {
                    let prev_y = this.camera.position.y
                    this.camera.translateZ( actualMoveSpeed );
                    this.camera.position.setY(prev_y)
                }
				if ( this.moveLeft && this.isLocked) {
                    let prev_y = this.camera.position.y
                    this.camera.translateX( - actualMoveSpeed );
                    this.camera.position.setY(prev_y)
                }
				if ( this.moveRight && this.isLocked) {
                    let prev_y = this.camera.position.y
                    this.camera.translateX( actualMoveSpeed );
                    this.camera.position.setY(prev_y)
                }
                if (this.moveUp && this.isLocked){
                    let prev_y = this.camera.position.y
                    this.camera.position.setY(prev_y + actualMoveSpeed)
                }
                if (this.moveDown && this.isLocked){
                    let prev_y = this.camera.position.y
                    this.camera.position.setY(prev_y - actualMoveSpeed)
                }
            }

        const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );
        window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

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