import { addAnimationForMap } from "../AnimatedTile";

export function addMap2(self) {
    const mapNight = self.make.tilemap({ key: 'map-night-home' });
    // add tileset image
    const tilesetNight = mapNight.addTilesetImage('TilemapNight', 'tiles-night');

    mapNight.createStaticLayer('floor', tilesetNight);
    mapNight.createStaticLayer('next-floor', tilesetNight);
    mapNight.createStaticLayer('objects', tilesetNight);
    mapNight.createStaticLayer('next-objects', tilesetNight);
    self.wallsLayer = mapNight.createStaticLayer('walls', tilesetNight);
    self.wallsLayer.setCollisionByProperty({ collides: true })//.renderDebug(debugGraphics, debugConfig);

    addAnimationForMap(self, mapNight, tilesetNight);

    // fix player position
    self.playerAddX = 100;
    self.playerAddY = -700;
}

// add physics when player added to map
export function addPhysicsForMap2(self) {
    self.physics.add.collider(self.player, self.wallsLayer);
}


export function addUpdateForMap2(self) {
    
}