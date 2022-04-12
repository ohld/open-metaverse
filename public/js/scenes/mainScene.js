import Phaser from 'phaser';
import { initializeSocket } from '../socketController/socketController';
import { initMainMap, updatePlayerPosition, initKeysForController } from '../utils/utils';
import { createAnimationForPlayer } from "../anims/characterAnims";
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { sceneEvents } from '../Events/EventsCenter';
import { addJoysticIfAndroid } from '../utils/pluginJoystic';
import { addIframeGameAndMusicMachine } from '../utils/addIframeGameAndMusicMachine';
import { addPlayerOverlap } from '../utils/playerOverlap';
import { updateOtherPlayersPositions } from '../utils/updatePlayersPositions';
import { addFollowingUI } from '../utils/addFollowingUi';
import { addAudioTimer } from '../utils/addAudioTimer';
import { toggleMute } from '../utils/microphoneUtils';
import { addUpdateForMap, showMap } from '../MapBuilding/showMap';

/**
 * All peer connections
 */
let peers = {};

export class MainScene extends Phaser.Scene {

    constructor(stream) {
        super({ key: 'MainScene' });
    }

    init(data) {
        if (data.stream != false) {
            // local stream of user microphone
            this.localStream = data.stream;

            // DISABLE MICROPHONE AT FIRST
            for (let index in this.localStream.getAudioTracks()) {
                this.localStream.getAudioTracks()[index].enabled = false;
            }

            // ADD MORALIS FOR BLOCKCHAIN(IF EXIST)
            this.moralis = data.moralis;
        }
    }

    preload() {
        // INITIALIZE KEYS
        initKeysForController(this);

        // LOAD PLUGIN FOR VIRTUAL JOYSTICK
        this.load.plugin('rexvirtualjoystickplugin', VirtualJoystickPlugin);
    }
    create() {


        this.mapId = 1;

        // add main camera zoom
        this.cameras.main.setZoom(1.5);

        // fix problem with touching space
        var keyObj = this.input.keyboard.addKey('SPACE');  // Get key object
        keyObj.on('down', function (event) { });

        // add UI for each player (microphone, name, etc)
        this.playerUI = {};

        // Create Animations for heroes
        for (let i = 0; i < 50; i++) {
            createAnimationForPlayer(this.anims, i);
        }

        // Add Game Ui
        this.scene.run('game-ui');

        // initialize with id
        showMap(this, this.mapId);


        // Initialize socket for client - server application
        initializeSocket(this, peers);

        // add joystic if android
        addJoysticIfAndroid(this);

        // if user touch microphone on Game UI scene -> toggle microphone stream
        sceneEvents.on('toggleMute', () => {
            if (this.localStream) {
                toggleMute(this);
            };
        });

    }

    update(time, delta) {

        // animate tiles for main map
        this.animatedTiles.forEach(tile => tile.update(delta));

        if (this.player) {
            // update function for map
            addUpdateForMap(this, this.mapId);

            // update a position of player UI
            addFollowingUI(this);

            // update a player position
            updatePlayerPosition(this);

            // send player position to server after 25 ms
            sendPlayerPosition(this, time);
        }

        // update other players positions with interpolation
        if (this.otherPlayers) {
            updateOtherPlayersPositions(this, delta);
        }
    }

}



/**
 * Send player position to server
 * @param {this.player} player 
 */
function emitPlayerPosition(self) {
    var player = self.player;
    var socket = self.socket;
    // emit player movement
    var x = player.x;
    var y = player.y;
    var r = player.rotation;
    if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y || r !== player.oldPosition.rotation)) {
        socket.emit('playerMovement', { x: player.x, y: player.y, rotation: player.rotation });
    }
    // save old position data
    player.oldPosition = {
        x: player.x,
        y: player.y,
        rotation: player.rotation
    };
}

function sendPlayerPosition(self, time) {
    let currentTime = Math.floor(time / 25);
    if (currentTime != self.lastTime) {
        emitPlayerPosition(self);
    }
    self.lastTime = currentTime;
}
