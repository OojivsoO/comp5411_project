import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

class World{
    static worldWidth;
    static worldDepth;
    static worldHalfWidth;
    static worldHalfDepth;
    static heightData;
    static worldData;

    static init(worldWidth, worldDepth){
        World.worldWidth = worldWidth;
        World.worldDepth = worldDepth;
        World.worldHalfWidth = worldWidth / 2;
        World.worldHalfDepth = worldDepth / 2;
        World.heightData = World.generateHeight( worldWidth, worldDepth );
        World.worldData = World.generateWorld();
    }

        

    static generateHeight( width, height ) {

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
    
    static getY( x, z ) {
    
        return ( World.heightData[ x + z * World.worldWidth ] * 0.15 ) | 0;
    
    }

    static generateWorld(){
        const data = [];
        for ( let x = 0; x < World.worldWidth; x ++ ) {
            data.push([]);
            for ( let z = 0; z < World.worldDepth; z ++ ) {
                data[x].push([]);
                data[x][z].push(World.getY(x,z));
            }
        }
        return data;
    }
}

export { World };