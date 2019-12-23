let game;
let phaser;
let world;

let input;
let ui;
let audio;

let time;
///

var map;
var player;
var cursors;
var groundLayer, coinLayer;
var text;
var score = 0;

var user;
var weapons;
var media;

function init() {
    console.log("init()");
    var storedWeapons = localStorage.getItem('weapons');
    if (storedWeapons) {
        weapons = JSON.parse(storedWeapons);
        user = JSON.parse(localStorage.getItem('user'));
        if (!user.equipped) {
            user.equipped = 'pistol';
        }
    } else {
        getJSON('assets/weapons/weapon_list.json', (response) => {
            weapons = JSON.parse(response);
            user = JSON.parse(localStorage.getItem('user'));
            if (!user.equipped) {
                user.equipped = 'pistol';
            }
            localStorage.setItem('weapons', JSON.stringify(weapons));
        });
    }

    getJSON('assets/media_list.json', (response) => {
        media = JSON.parse(response);
        console.log(media);
    });

    main();
}

function main() {
    console.log("main()");

    var config = {
        type: Phaser.AUTO,
        parent: 'my-game',
        width: 800,
        height: 600,
        parent: 'game',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 1000 },
                debug: true
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

    this.weapons = weapons;

    // load media
    media["image"].forEach((image) => {
        this.load.image(image.key, image.path);
    });
    media["audio"].forEach((audio) => {
        this.load.audio(audio.key, audio.path);
    });
    media["spritesheet"].forEach((spritesheet) => {
        this.load.spritesheet(spritesheet.key, spritesheet.path, spritesheet.config);
    });
    media["atlas"].forEach((atlas) => {
        this.load.atlas(atlas.key, atlas.path, atlas.json);
    });

    var level = 'level02';
    var levelPath = 'assets/' + level + '.json';
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', levelPath);
}

/**
 * Initialize the game.
 * The assets have been loaded by this point.
 */
function create() {
    console.log("create()");

    // load the map 
    map = this.make.tilemap({ key: 'map' });

    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('terrain', 'tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('Platforms', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion(-1, true);

    // coin image used as tileset
    // var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    // coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    // coinLayer.setTileIndexCallback(17, collectCoin, game);
    // when the player overlaps with a tile with index 17, collectCoin 

    world = new World(game);
    input = new Input();
    ui = new UI();
    audio = new Audio();

    // add input keys - { stringRef, KeyCode, keydownCallback, keyupCallback }
    input.add('W', Phaser.Input.Keyboard.KeyCodes.W, function () { world.player.onUpKeydown(); }, function () { world.player.onUpKeyup(); });
    input.add('A', Phaser.Input.Keyboard.KeyCodes.A, function () { world.player.onLeftKeydown(); }, function () { world.player.idle(); });
    input.add('S', Phaser.Input.Keyboard.KeyCodes.S, function () { world.player.onDownKeydown(); }, function () { world.player.onDownKeyup(); });
    input.add('D', Phaser.Input.Keyboard.KeyCodes.D, function () { world.player.onRightKeydown(); }, function () { world.player.idle(); });
    input.add('SPACE', Phaser.Input.Keyboard.KeyCodes.SPACE, function () { world.player.startShooting(); }, function () { world.player.stopShooting(); });
    input.add('P', Phaser.Input.Keyboard.KeyCodes.P, function () { pauseGame(); }, undefined);
    input.add('R', Phaser.Input.Keyboard.KeyCodes.R, function () { world.player.reloadWeapon(); }, undefined);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, world.player.playerContainer);

    // will be called    
    // this.physics.add.overlap(world.player.sprite, coinLayer);

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(world.player.playerContainer, false, 1, 1, -200);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    initializeAnimations();
    initializeMapObjects();

    /**/
    pauseGameForInput();

    game.input.once('pointerdown', startGame);
    ///
}

function pauseGame() {
    game.paused = !game.paused;

    if (game.paused) {
        input.disable();
        ui.showPauseMenu();
    } else {
        input.enable();
        ui.hidePauseMenu();
    }
}

function pauseGameForInput() {
    console.log('pauseGameForInput');
    game.paused = true;

    input.disable();

    ui.showStartText();
}

function resumeGameFromInput() {
    console.log('resumeGameFromInput');
    ui.disableStartText();

    input.enable();

    game.paused = false;
}

/*
function spawnEnemies() {
    console.log('spawnEnemies');
    if (world.numEnemies > 0)
        return;

    const x = Phaser.Math.Between(50, 150);

    // attempt to display a wave of 3 new enemies
    world.spawnEnemy(x, 1600);
    world.spawnEnemy(x + 110, 1600);
    world.spawnEnemy(x + 220, 1600);

    //audio.fly.play();
}
*/

function startGame() {
    if (!game.paused)
        return;

    console.log("startGame()");

    // game.time.addEvent({ delay: 4000, repeat: -1, callback: spawnEnemies });

    setScoreText(0);
    setAmmoText(world.player.weapon.clip + '/' + (world.player.weapon.ammo < 0 ? '--' : world.player.weapon.ammo));

    resumeGameFromInput();
}

function update() {
    // input.update();

    world.update();
}

function onCollisionPlayerEnemy(playerSprite, enemySprite) {
    playerSprite.entity.destroy();
    enemySprite.entity.destroy();
    audio.explode.play();
}

function onCollisionBulletEnemy(enemy, bullet) {
    bullet.destroy();

    // partially reduce damage based on distance from player to enemy
    var dist = distance(world.player.playerContainer, enemy);
    var reduction = dist > 500 ? 0.7 : dist > 300 ? 0.9 : 1;
    var damage = bullet.damage * reduction;

    // kill or reduce enemy health
    if (!enemy.isDead) {
        if ((enemy.health - damage) <= 0) {
            enemy.controls[0].onDeath();
        } else {
            enemy.health -= damage;
            console.log({ 'enemy_hp': enemy.health });
        }
    }
}

function onCollisionBulletPlayer(enemy, bullet) {
    console.log('player hit');
    /*
    bullet.destroy();

    // partially reduce damage based on distance from player to enemy
    var dist = distance(world.player.playerContainer, enemy);
    var damageReduction = dist > 500 ? 0.7 : dist > 300 ? 0.9 : 1;
    var damage = bullet.damage * damageReduction;
    console.log({ 'distance': dist, 'reduction': damageReduction, 'damage': damage });

    // kill or reduce enemy health
    if (!enemy.isDead) {
        if ((enemy.health - damage) <= 0) {
            enemy.controls[0].onDeath();
        } else {
            enemy.health -= damage;
            console.log({ 'enemy_hp': enemy.health });
        }
    }*/
}

function onCollisionPlayerLadder() {
    // set flag to only execute once on initial collision
    if (!world.player.playerContainer.canClimb) {
        world.player.playerContainer.canClimb = true;

        // periodically check player is still overlapping ladder
        checkOverlap(world.player.playerContainer, game.ladders, function () {
            // enable gravity if not
            world.player.playerContainer.body.setAllowGravity(true);
            world.player.playerContainer.canClimb = false;
        }, 100);
    }
}

// recursive function to check overlap between 2 objects at intervals - executes callback on separation
function checkOverlap(object1, object2, callback, interval) {
    setTimeout(() => {
        var overlapping = game.physics.overlap(object1, object2);
        if (!overlapping) {
            callback();
        } else {
            checkOverlap(object1, object2, callback, interval);
        }
    }, interval);
}

function setScoreText(value) {
    game.score = value;
    ui.updateScoreText(value);
}

function setAmmoText(value) {
    ui.updateAmmoText(value);
}

function gameOver() {
    console.log("gameOver()");

    world.cleanup();

    pauseGameForInput();
}

function quitGame() {
    window.location.href = 'index.html';
}

function distance(p, q) {
    var dx = p.x - q.x;
    var dy = p.y - q.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist;
}

function getJSON(path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
}

function initializeMapObjects() {
    game.ladders = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    game.enemyWalls = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    game.spikes = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });

    // add ladders
    var ladderObjects = map.getObjectLayer('Ladders')['objects'];
    ladderObjects.forEach(ladderObject => {
        var ladder = game.ladders.create(ladderObject.x, ladderObject.y - ladderObject.height, 'ladder').setOrigin(0, 0);
        ladder.body.setSize(ladder.width, ladder.height).setOffset(ladder.width * 0.5, ladder.height * 0.5);
    });

    // add walls to bounce enemies
    var enemyWalls = map.getObjectLayer('InvisibleWalls')['objects'];
    enemyWalls.forEach(enemyWall => {
        var wall = game.enemyWalls.create(enemyWall.x, enemyWall.y - enemyWall.height, 'invisible_wall', null, false).setOrigin(0, 0);
        wall.body.setSize(wall.width, wall.height).setOffset(wall.width * 0.5, wall.height * 0.5);
    });

    // add spikes
    var spikeObjects = map.getObjectLayer('Spikes')['objects'];
    spikeObjects.forEach(spikeObject => {
        var spike = game.spikes.create(spikeObject.x, spikeObject.y - spikeObject.height, 'spike').setOrigin(0, 0);
        spike.body.setSize(spike.width * 0.8, spike.height * 0.4).setOffset(spike.width * 0.6, spike.height * 1.1);
    });

    // spawn enemies at locations
    var enemyLocations = map.getObjectLayer('Enemies')['objects'];
    enemyLocations.forEach(location => {
        world.spawnEnemy(location.x + location.width * 0.5, location.y - location.height);
    });

    // colliders
    game.physics.add.collider(world.player.playerContainer, game.spikes, world.player.playerHit, null, this);
    game.physics.add.collider(world.player.playerContainer, game.ladders, onCollisionPlayerLadder, null, this).overlapOnly = true;
    game.physics.add.collider(world.enemyFactory.group, game.enemyWalls, world.enemyFactory.entityHitBounds, null, this);
}

function initializeAnimations() {
    // player
    game.anims.create({
        key: 'walking',
        frames: game.anims.generateFrameNames('player', { prefix: 'walk', start: 2, end: 5, zeroPad: 2 }),
        frameRate: 10,
        repeat: -1
    });
    game.anims.create({
        key: 'shotgun_reload',
        frames: game.anims.generateFrameNames('shotgun', { prefix: 'reload', start: 1, end: 10, zeroPad: 2 }),
        frameRate: 10,
    });
    game.anims.create({
        key: 'idle',
        frames: [{ key: 'player', frame: 'idle' }],
    });
    game.anims.create({
        key: 'jump',
        frames: [{ key: 'player', frame: 'jump' }],
    });
    game.anims.create({
        key: 'death',
        frames: [{ key: 'player', frame: 'death' }],
    });

    // enemy1
    game.anims.create({
        key: 'enemy1_walking',
        frames: game.anims.generateFrameNames('enemy1', { prefix: 'walk', start: 2, end: 5, zeroPad: 2 }),
        frameRate: 10,
        repeat: -1
    });
    game.anims.create({
        key: 'enemy1_shotgun_reload',
        frames: game.anims.generateFrameNames('enemy1' + '_shotgun', { prefix: 'reload', start: 1, end: 10, zeroPad: 2 }),
        frameRate: 10,
    });
    game.anims.create({
        key: 'enemy1_idle',
        frames: [{ key: 'enemy1', frame: 'idle' }],
    });
    game.anims.create({
        key: 'enemy1_jump',
        frames: [{ key: 'enemy1', frame: 'jump' }],
    });
    game.anims.create({
        key: 'enemy1_death',
        frames: [{ key: 'enemy1', frame: 'death' }],
    });

    // enemy2
    game.anims.create({
        key: 'enemy2_walking',
        frames: game.anims.generateFrameNames('enemy2', { prefix: 'walk', start: 2, end: 5, zeroPad: 2 }),
        frameRate: 10,
        repeat: -1
    });
    game.anims.create({
        key: 'enemy2_shotgun_reload',
        frames: game.anims.generateFrameNames('enemy2' + '_shotgun', { prefix: 'reload', start: 1, end: 10, zeroPad: 2 }),
        frameRate: 10,
    });
    game.anims.create({
        key: 'enemy2_idle',
        frames: [{ key: 'enemy2', frame: 'idle' }],
    });
    game.anims.create({
        key: 'enemy2_jump',
        frames: [{ key: 'enemy2', frame: 'jump' }],
    });
    game.anims.create({
        key: 'enemy2_death',
        frames: [{ key: 'enemy2', frame: 'death' }],
    });
}

///

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    console.log("collectCoin");
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    setScoreText(game.score + 20);

    return false;
}