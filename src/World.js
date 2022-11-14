import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

class World{

    constructor(worldWidth, worldDepth){
        this.worldWidth = worldWidth;
        this.worldDepth = worldDepth;
        this.worldHalfWidth = worldWidth / 2;
        this.worldHalfDepth = worldDepth / 2;
        this.data = generateHeight( worldWidth, worldDepth );
    }

        

    generateHeight( width, height ) {

        const data = [], perlin = new ImprovedNoise(),
            size = width * height, z = Math.random() * 100;
    
        let quality = 2;
    
        for ( let j = 0; j < 4; j ++ ) {
    
            if ( j === 0 ) for ( let i = 0; i < size; i ++ ) data[ i ] = 0;
    
            for ( let i = 0; i < size; i ++ ) {
    
                const x = i % width, y = ( i / width ) | 0;
                data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;
    
    
            }
    
            quality *= 4;
    
        }
    
        return data;
    
    }
    
    getY( x, z ) {
    
        return ( this.data[ x + z * worldWidth ] * 0.15 ) | 0;
    
    }
}

export { World };