let game;
let phaser;
let world;

let input;
let ui;
let audio;

function main() {
    console.log("main()");

    var config = {
        type: Phaser.AUTO,
        parent: 'my-game',
        width: 400,
        height: 500,
        physics: {
            default: 'arcade',
            arcade: {
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
}

/**
 * Initialize the game.
 * The assets have been loaded by this point.
 */
function create() {
    console.log("create()");

    world = new World(game);

    input = new Input();
    ui = new UI();
    audio = new Audio();

    input.add(Phaser.Input.Keyboard.KeyCodes.A, function() { world.player.left(); });
    input.add(Phaser.Input.Keyboard.KeyCodes.D, function() { world.player.right(); });
    input.add(Phaser.Input.Keyboard.KeyCodes.SPACE, function() {
        world.spawnBullet(world.player.sprite.x, world.player.sprite.y);
        audio.shoot.play();
    });

    this.physics.add.overlap(world.bulletFactory.group, world.enemyFactory.group, onCollisionBulletEnemy);
    
    pauseGameForInput();
    
    game.input.on('pointerdown', startGame);
}

function pauseGameForInput() {
    game.paused = true;

    ui.showStartText();
}

function resumeGameFromInput() {
    ui.disableStartText();

    game.paused = false;
}

function spawnEnemies() {
    if (world.numEnemies > 0)
        return;
    
    const x = Phaser.Math.Between(50, 150);

    // attempt to display a wave of 3 new enemies
    world.spawnEnemy(x, -50);
    world.spawnEnemy(170, -50);
    world.spawnEnemy(340 - x, -50);

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
