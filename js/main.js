let game;
let phaser;
let world;

let input;
let ui;
let audio;
///

var map;
var player;
var cursors;
var groundLayer, coinLayer;
var text;
var score = 0;

function main() {
    console.log("main()");

    var config = {
        type: Phaser.AUTO,
        parent: 'my-game',
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 500},
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    phaser = new Phaser.Game(config);
}

/**
 * The first thing to be called.
 * Loads assets.
 */
function preload() {
    console.log("preload()");

    game = this;
    game.score = 0;

    this.load.image('background_img', 'assets/gameBg.png');
    this.load.image('bullet_img', 'assets/bullet.png');
    this.load.atlasXML('playerShip_sp', 'assets/playerShipSprite.png', 'assets/playerShipSprite.xml');
    this.load.atlasXML('enemy_sp', 'assets/enemy512x512x16.png', 'assets/enemy512x512x16.xml');
    this.load.audio('intro', 'assets/audio/start.mp3');
    this.load.audio('bg', 'assets/audio/start.mp3');
    //this.load.audio('bg', 'assets/audio/ufo_Theme.mp3');
    this.load.audio('explode', 'assets/audio/explode.mp3');
    this.load.audio('fly', 'assets/audio/fly.mp3');
    this.load.audio('shoot', 'assets/audio/shoot.mp3');
    ///
    
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // tiles in spritesheet 
    this.load.spritesheet('tiles', 'assets/tiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', 'assets/coinGold.png');
    // player animations
    this.load.atlas('player', 'assets/player.png', 'assets/player.json');
}

/**
 * Initialize the game.
 * The assets have been loaded by this point.
 */
function create() {
    console.log("create()");

    // load the map 
    map = this.make.tilemap({key: 'map'});

    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // coin image used as tileset
    var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    coinLayer.setTileIndexCallback(17, collectCoin, game);
    // when the player overlaps with a tile with index 17, collectCoin 
    

    world = new World(game);

    input = new Input();
    ui = new UI();
    audio = new Audio();

    input.add(Phaser.Input.Keyboard.KeyCodes.A, function() { world.player.left(); });
    input.add(Phaser.Input.Keyboard.KeyCodes.D, function() { world.player.right(); });
    input.add(Phaser.Input.Keyboard.KeyCodes.W, function() { world.player.up(); });
    input.add(Phaser.Input.Keyboard.KeyCodes.SPACE, function() {
        world.spawnBullet(world.player.sprite.x, world.player.sprite.y);
        audio.shoot.play();
    });
    

    this.physics.add.overlap(world.bulletFactory.group, world.enemyFactory.group, onCollisionBulletEnemy);
    
    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;
    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, world.player.sprite);
    // will be called    
    this.physics.add.overlap(world.player.sprite, coinLayer);

    console.log(this.camera)
    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(world.player.sprite);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });
/**/
    pauseGameForInput();
    
    game.input.on('pointerdown', startGame);
    ///

    
}

function pauseGameForInput() {
    console.log('pauseGameForInput');
    game.paused = true;

    ui.showStartText();
}

function resumeGameFromInput() {
    console.log('resumeGameFromInput');
    ui.disableStartText();

    game.paused = false;
}

function spawnEnemies() {
    console.log('spawnEnemies');
    if (world.numEnemies > 0)
        return;
    
    const x = Phaser.Math.Between(50, 150);

    // attempt to display a wave of 3 new enemies
    /*world.spawnEnemy(x, -50);
    world.spawnEnemy(170, -50);
    world.spawnEnemy(340 - x, -50);*/

    //audio.fly.play();
}

function startGame() {
    if (!game.paused)
        return;
    
    console.log("startGame()");

    game.time.addEvent({ delay: 4000, repeat: -1, callback: spawnEnemies });
    
    setScore(0);

    resumeGameFromInput();
}

function update() {
    input.update();

    world.update();
}

function onCollisionPlayerEnemy(playerSprite, enemySprite) {
    playerSprite.entity.destroy();
    enemySprite.entity.destroy();
    audio.explode.play();
}

function onCollisionBulletEnemy(bulletSprite, enemySprite) {
    bulletSprite.destroy();
    enemySprite.destroy();
    audio.explode.play();

    world.numEnemies--;
    setScore(game.score + 20);
}

function setScore(value) {
    game.score = value;
    ui.updateScoreText(value);
}

function gameOver() {
    console.log("gameOver()");

    world.cleanup();

    pauseGameForInput();
}

///

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    console.log("collectCoin");
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    setScore(game.score + 20);

    return false;
}