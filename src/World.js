import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

class World{
    static worldWidth; // x
    static worldDepth; // z
    static worldHeight; // y
    static worldHalfWidth;
    static worldHalfDepth;
    static worldHalfHeight;
    static heightData;
    static worldData; // 3D array of existance of blocks: [x][z] -> [y|y-coor of blocks in this vertical pilar of space]
    static waterData; // 3D array of existance of water: [x][z] -> [y|y-coor of water blocks in this vertical pilar of space]
    static seaLevel ;

    static init(worldWidth, worldDepth, worldHeight){
        World.worldWidth = worldWidth;
        World.worldDepth = worldDepth;
        World.worldHeight = worldHeight;
        World.worldHalfWidth = worldWidth / 2;
        World.worldHalfDepth = worldDepth / 2;
        World.worldHalfHeight = worldHeight / 2;
        World.heightData = World.generateHeight( worldWidth, worldDepth );
        [World.worldData, World.waterData] = World.generateWorld();
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
        const block_data = [];
        const water_data = [];
        let lowest = Infinity;
        for ( let x = 0; x < World.worldWidth; x ++ ) {
            block_data.push([]);
            water_data.push([]);
            for ( let z = 0; z < World.worldDepth; z ++ ) {
                block_data[x].push([]);
                block_data[x][z].push(World.getY(x,z));
                lowest = (World.getY(x,z)<lowest)? World.getY(x,z): lowest;

                water_data[x].push([]);
            }
        }

        World.seaLevel = lowest+4;
        for ( let x = 0; x < World.worldWidth; x ++ ) {
            for ( let z = 0; z < World.worldDepth; z ++ ) {
                for ( let i=World.getY(x,z)+1 ; i<World.seaLevel; i++){
                    water_data[x][z].push(i);
                }
            }
        }
        return [block_data, water_data];
    }

    static isBlock(blockId){
        if (blockId.x>=World.worldWidth||blockId.x<0
            ||blockId.y>=World.worldHalfHeight||blockId.y<-World.worldHalfHeight
            ||blockId.z>=World.worldDepth||blockId.z<0){
                return false;
            }
        return World.worldData[blockId.x][blockId.z].includes(blockId.y)
    }

    static isInWorldBoundary(vec3){
        if (vec3.x>World.worldHalfWidth*100 || vec3.x<-World.worldHalfWidth*100) return false;
        if (vec3.y>World.worldHalfHeight*100 || vec3.y<-World.worldHalfHeight*100) return false;
        if (vec3.z>World.worldHalfDepth*100 || vec3.z<-World.worldHalfDepth*100) return false;
        return true;
    }

    static distBetweenTwoWorldCoor(coor_1, coor_2){
        return Math.sqrt(Math.pow((coor_1.x-coor_2.x),2) + Math.pow((coor_1.y-coor_2.y),2) + Math.pow((coor_1.z-coor_2.z),2))
    }

    static worldCoorToBlockId(vec3){
        let x = Math.floor((vec3.x + World.worldHalfWidth * 100) / 100);
        let y = Math.floor((vec3.y) / 100);
        let z = Math.floor((vec3.z + World.worldHalfWidth * 100) / 100);
        return {"x":x, "y":y, "z":z}
    }

    static blockIdToWorldCoor(blockId){ // return center coor of the block
        let x = blockId.x * 100 - World.worldHalfWidth * 100 + 50;
        let y = blockId.y * 100 + 50;
        let z = blockId.z * 100 - World.worldHalfDepth * 100 + 50;
        return {"x":x, "y":y, "z":z}
    }

    static originAndDirToBlockId(origin, dir, plane_coor){
        let x = plane_coor.x? plane_coor.x:null;
        let y = plane_coor.y? plane_coor.y:null;
        let z = plane_coor.z? plane_coor.z:null;
        const signX = dir.x>=0; const signY = dir.y>=0; const signZ = dir.z>=0;
        if(x){
            let time = (x-origin.x) / dir.x;
            if(isNaN(time)){
                return null;
            }
            let y_coor = origin.y + time * dir.y;
            let z_coor = origin.z + time * dir.z;
            let dist = World.distBetweenTwoWorldCoor(origin, {"x":x, "y":y_coor, "z":z_coor});
            if (signX){
                if(World.isInWorldBoundary({"x":x+50, "y":y_coor, "z":z_coor})){
                    return {"blockId": World.worldCoorToBlockId({"x":x+50, "y":y_coor, "z":z_coor}), "dist":dist, "face": "nx"};
                } else {
                    return null;
                }
            } else{
                if(World.isInWorldBoundary({"x":x-50, "y":y_coor, "z":z_coor})){
                    return {"blockId": World.worldCoorToBlockId({"x":x-50, "y":y_coor, "z":z_coor}), "dist":dist, "face": "px"};
                } else {
                    return null;
                }
            }
        } else if (y){
            let time = (y-origin.y) / dir.y;
            if(isNaN(time)){
                return null;
            }
            let x_coor = origin.x + time * dir.x;
            let z_coor = origin.z + time * dir.z;
            let dist = World.distBetweenTwoWorldCoor(origin, {"x":x_coor, "y":y, "z":z_coor});
            if (signY){
                if(World.isInWorldBoundary({"x":x_coor, "y":y+50, "z":z_coor})){
                    return {"blockId": World.worldCoorToBlockId({"x":x_coor, "y":y+50, "z":z_coor}), "dist":dist, "face": "ny"};
                } else {
                    return null;
                }
            } else{
                if(World.isInWorldBoundary({"x":x_coor, "y":y-50, "z":z_coor})){
                    return {"blockId": World.worldCoorToBlockId({"x":x_coor, "y":y-50, "z":z_coor}), "dist":dist, "face": "py"};
                } else {
                    return null;
                }
            }
        } else if (z){
            let time = (z-origin.z) / dir.z;
            if(isNaN(time)){
                return null;
            }
            let x_coor = origin.x + time * dir.x;
            let y_coor = origin.y + time * dir.y;
            let dist = World.distBetweenTwoWorldCoor(origin, {"x":x_coor, "y":y_coor, "z":z})
            if (signZ){
                if(World.isInWorldBoundary({"x":x_coor, "y":y_coor, "z":z+50})){
                    return {"blockId": World.worldCoorToBlockId({"x":x_coor, "y":y_coor, "z":z+50}), "dist":dist, "face": "nz"};
                } else {
                    return null;
                }
            } else{
                if(World.isInWorldBoundary({"x":x_coor, "y":y_coor, "z":z-50})){
                    return {"blockId": World.worldCoorToBlockId({"x":x_coor, "y":y_coor, "z":z-50}), "dist":dist, "face": "pz"};
                } else {
                    return null;
                }
            }
        }
    }

    static destroyBlock(blockId){

    }

    static createBlick(blockId){

    }
}

export { World };