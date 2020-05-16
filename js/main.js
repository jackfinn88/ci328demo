var game;
var phaser;
var world;

var input;
var ui;
var audio;

var map;
var groundLayer;
var score = 0;

var objectiveComplete = false;

function main() {
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
                debug: debug
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
    game = this;
    game.score = 0;

    this.weapons = user["weapons"];

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

    // map made with Tiled in JSON format
    // this.load.tilemapTiledJSON('map', level.tilemap);
    this.load.tilemapTiledJSON('map', level.data.tilemap);
}

/**
 * Initialize the game.
 * The assets have been loaded by this point.
 */
function create() {
    // load the map 
    map = this.make.tilemap({ key: 'map' });

    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('terrain', 'tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('Platforms', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion(-1, true);

    world = new World(game);
    input = new Input();
    ui = new UI();
    audio = new Audio();

    // audio.setVolume(0.1);
    ui.updateText(ui.textTypes.HEALTH, this.health);

    // add input keys - { stringRef, KeyCode, keydownCallback, keyupCallback }
    input.add('W', Phaser.Input.Keyboard.KeyCodes.W, function () { world.player.translateY(false); }, function () { world.player.onUpKeyup(); });
    input.add('A', Phaser.Input.Keyboard.KeyCodes.A, function () { world.player.translateX(false); }, function () { world.player.idle(); });
    input.add('S', Phaser.Input.Keyboard.KeyCodes.S, function () { world.player.translateY(true); }, function () { world.player.onDownKeyup(); });
    input.add('D', Phaser.Input.Keyboard.KeyCodes.D, function () { world.player.translateX(true); }, function () { world.player.idle(); });
    input.add('SPACE', Phaser.Input.Keyboard.KeyCodes.SPACE, function () { world.player.startShooting(); }, function () { world.player.stopShooting(); });
    input.add('P', Phaser.Input.Keyboard.KeyCodes.P, function () { pauseGame(false); }, undefined);
    input.add('R', Phaser.Input.Keyboard.KeyCodes.R, function () { world.player.reloadWeapon(); }, undefined);
    // input.add('Q', Phaser.Input.Keyboard.KeyCodes.Q, function () { testWin(); }, undefined);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // player & bullets will collide with ground tiles 
    this.physics.add.collider(groundLayer, world.player.playerContainer);
    this.physics.add.collider(groundLayer, world.bulletFactory.group, (bullet) => { bullet.destroy(); }, null, this);
    this.physics.add.collider(groundLayer, world.enemyBulletFactory.group, (bullet) => { bullet.destroy(); }, null, this);

    // set camera bounds & follow player
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(world.player.playerContainer, true, 0.05, 0.05);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor(level.data.background);

    initializeAnimations();
    initializeMapObjects();

    ui.updateMenuDisplay(false);
    updateUI();
}

function testWin() {
    levelComplete();
}

function pauseGame(gameOver) {
    if (!gameOver) {
        if (world.player.isDead || (world.player.reachedExit && game.objectiveComplete)) return;
    }
    // halt player
    world.player.sprite.anims.play('idle', true);
    world.player.playerContainer.body.setVelocity(0, 0);

    game.paused = !game.paused;

    input.toggle(!game.paused);
    ui.updateMenuDisplay(gameOver);
    ui.toggleMenuDisplay(game.paused);
}

function updateUI() {
    ui.updateText(ui.textTypes.SCORE, game.score);
    ui.updateText(ui.textTypes.HEALTH, world.player.health);
    ui.updateText(ui.textTypes.ARMOR, world.player.armor);
    ui.updateText(ui.textTypes.CASH, user["money"]);
    ui.updateText(ui.textTypes.AMMO, world.player.weapon.clip + '/' + world.player.weapon.currentAmmo);
}

function update() {
    world.update();
}

// COLLISION HANDLING
function onCollisionBulletPlatform(platform, bullet) {
    bullet.destroy();
}

function onCollisionBulletEnemy(enemy, bullet) {
    bullet.destroy();

    // partially reduce damage based on distance from player to enemy
    var dist = distance({ 'x': bullet.startX, 'y': bullet.startY }, enemy);
    var reduction = dist > 500 ? 0.7 : dist > 300 ? 0.9 : 1;
    var damage = bullet.damage * reduction;

    // kill or reduce enemy health
    if (enemy.isDead) {
        return;
    } else {
        enemy.controls[0].awareOfPlayer = true;
        if ((enemy.health - damage) <= 0) {
            enemy.controls[0].onDeath();
        } else {
            enemy.health -= damage;
        }
    }
}

function onCollisionPlayerDrop(player, drop) {
    var increment;
    if (drop.type === 'ammo') {
        increment = world.player.weapon.clipSize;
        world.player.weapon.currentAmmo += increment;

        // update save data
        let idx = accounts.findIndex(account => account.id === user.id);
        accounts[idx] = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accounts', JSON.stringify(accounts));

        ui.updateText(ui.textTypes.AMMO, world.player.weapon.clip + '/' + world.player.weapon.currentAmmo);
    } else if (drop.type === 'cash') {
        // increase reward if playing hard
        var max = 20 + (user["difficulty"] * 10);

        // generate random monetary reward between 10 and max
        increment = Math.floor(Math.random() * (max - 10 + 1) + 10)
        user["money"] = parseInt(user["money"], 10) + increment;

        localStorage.setItem('user', JSON.stringify(user));
        let idx = accounts.findIndex(account => account.id === user.id);
        accounts[idx] = user;
        localStorage.setItem('accounts', JSON.stringify(accounts));

        updateRecord();

        ui.updateText(ui.textTypes.CASH, user["money"]);
    }

    ui.updateText(null, '+' + increment + ' ' + drop.type);
    drop.destroy();
}

function onCollisionBulletPlayer(player, bullet) {
    bullet.destroy();

    // partially reduce damage based on distance from player to enemy
    var dist = distance({ 'x': bullet.startX, 'y': bullet.startY }, player);
    var damageReduction = dist > 500 ? 0.7 : dist > 300 ? 0.9 : 1;
    var damage = bullet.damage * damageReduction;

    // kill or reduce enemy health
    if (!world.player.isDead) {
        var armorAfterDamage, healthAfterDamage;
        if (world.player.armor > 0) {
            armorAfterDamage = world.player.armor - damage;
            if (armorAfterDamage <= 0) {
                var damageToArmor = (damage - Math.abs(armorAfterDamage));
                var damageToHealth = (damage - damageToArmor);
                world.player.armor -= damageToArmor;
                healthAfterDamage = (world.player.health - damageToHealth);
                if (healthAfterDamage <= 0) {
                    world.player.health -= (damageToHealth - Math.abs(healthAfterDamage));
                    world.player.onDeath();
                } else {
                    world.player.health -= damageToHealth;
                }
            } else {
                world.player.armor -= damage;
            }
        } else {
            healthAfterDamage = world.player.health - damage;
            if (healthAfterDamage <= 0) {
                world.player.health -= (damage - Math.abs(healthAfterDamage));
                world.player.onDeath();
            } else {
                world.player.health -= damage;
            }
        }
        updateUI();
    }
}

function onCollisionPlayerLadder() {
    // set flag to only execute once on initial collision
    if (!world.player.canClimb) {
        world.player.canClimb = true;

        // periodically check player is still overlapping ladder
        checkOverlap(world.player.playerContainer, game.ladders, function () {
            // enable gravity if not
            world.player.playerContainer.body.setAllowGravity(true);
            world.player.canClimb = false;
        });
    }
}

function onCollisionPlayerObjective(player, item) {
    ui.updateText(ui.textTypes.OBJECTIVE, level.data.hintText);
    game.objectiveComplete = true;

    item.destroy();
}

function onCollisionPlayerExit() {
    // set flag to only execute once on initial collision
    if (!world.player.reachedExit) {
        world.player.reachedExit = true;

        if (game.objectiveComplete) {
            // end game
            levelComplete();
        } else {
            ui.updateText(ui.textTypes.OBJECTIVE, level.data.objectiveText);
        }

        // periodically check player is still overlapping exit
        checkOverlap(world.player, game.exit, function () {
            if (!game.objectiveComplete) {
                world.player.reachedExit = false;
            }
        });
    }
}

function levelComplete() {
    // parse user data 
    var userMoney = parseInt(user["money"], 10);
    var userExp = parseInt(user["exp"], 10);
    var userTotalExp = parseInt(user["total-exp"], 10);
    var gameLevel = parseInt(user["game-level"], 10);

    // save rewards
    user["money"] = userMoney + level.data.cashReward;
    user["exp"] = userExp + (game.score + level.data.expReward);
    user["total-exp"] = userTotalExp + (game.score + level.data.expReward);

    // check if level increases
    var userNextLevel = parseInt(user["player_next_level"], 10);
    if (user["exp"] >= userNextLevel) {
        levelUp();
    }

    // unlock next level
    var nextLevelId = level.id + 1;
    user["game_level"] = Math.max(user["game_level"], nextLevelId);

    let idx = accounts.findIndex(account => account.id === user.id);
    accounts[idx] = user;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accounts', JSON.stringify(accounts));

    updateRecord();

    audio.win.play('', { 'volume': audio.volume.sfx });

    pauseGame(true);
}

function levelUp() {
    // parse user data 
    var userExp = parseInt(user["exp"], 10);
    var userLevel = parseInt(user["player_level"], 10);
    var userNextLevel = parseInt(user["player_next_level"], 10);

    user["exp"] = (userExp - userNextLevel);
    user["player_level"] = userLevel + 1;
    // increase threshold value by 20% for next level
    user["player_next_level"] = userNextLevel + Math.ceil((userNextLevel * 0.2) / 100) * 100;

    let idx = accounts.findIndex(account => account.id === user.id);
    accounts[idx] = user;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accounts', JSON.stringify(accounts));

    updateRecord();

    // check if remaining exp can still level up
    if (user["exp"] >= user["player_next_level"]) {
        requestAnimationFrame(() => {
            levelUp();
        });
    }
}

// recursive function to check overlap between 2 objects each frame - executes callback on separation
function checkOverlap(object1, object2, callback) {
    requestAnimationFrame(() => {
        var overlapping = game.physics.overlap(object1, object2);
        if (!overlapping) {
            callback();
        } else {
            checkOverlap(object1, object2, callback);
        }
    });
}

function restartGame() {
    destroyGame();
    setTimeout(() => {
        input.toggle(true);
        main();
    }, 500);
}

function destroyGame() {
    world.player.unloadWeapon();
    world.cleanup();

    // remove canvas
    var wrapper = document.querySelector('#game-wrapper');
    wrapper.querySelector('#game').remove();
    var newGameEl = document.createElement('div');
    newGameEl.setAttribute('id', 'game');
    wrapper.prepend(newGameEl);
    ui.toggleMenuDisplay();

}

function quitGame() {
    destroyGame();
    onLevelClick();
}

function distance(p, q) {
    var dx = p.x - q.x;
    var dy = p.y - q.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist;
}

function initializeMapObjects() {
    game.ladders = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    game.objectives = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    game.exits = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    game.enemyWalls = game.physics.add.group({
        allowGravity: false,
        immovable: true
    });

    // add ladders
    var ladderLayer = map.getObjectLayer('Ladders');
    if (ladderLayer) {
        var ladderObjects = ladderLayer['objects'];
        ladderObjects.forEach(ladderObject => {
            var ladder = game.ladders.create(ladderObject.x, ladderObject.y - ladderObject.height, 'ladder').setOrigin(0, 0);
            ladder.body.setSize(ladder.width, ladder.height).setOffset(ladder.width * 0.5, ladder.height * 0.5);
        });
    }

    // add exit
    var exitLayer = map.getObjectLayer('Exit');
    if (exitLayer) {
        var exitObjects = exitLayer['objects'];
        exitObjects.forEach(exitObject => {
            var exit = game.exits.create(exitObject.x, exitObject.y - exitObject.height, 'level_exit').setOrigin(0, 0);
            exit.body.setSize(exit.width, exit.height).setOffset(exit.width * 0.5, exit.height * 0.5);
        });
    }

    // add objective to map
    var objectiveLayer = map.getObjectLayer('Objectives');
    if (objectiveLayer) {
        var objectiveObjects = objectiveLayer['objects'];
        objectiveObjects.forEach(objectiveObject => {
            var objective = game.objectives.create(objectiveObject.x, objectiveObject.y - objectiveObject.height, level.data.objectiveItem).setOrigin(0, 0);
            objective.body.setSize(objective.width, objective.height).setOffset(objective.width * 0.5, objective.height * 0.5);
        });
    }

    // add walls to bounce enemies
    var enemyWallsLayer = map.getObjectLayer('InvisibleWalls');
    if (enemyWallsLayer) {
        var enemyWalls = enemyWallsLayer['objects'];
        enemyWalls.forEach(enemyWall => {
            var wall = game.enemyWalls.create(enemyWall.x, enemyWall.y - enemyWall.height, 'invisible_wall', null, false).setOrigin(0, 0);
            wall.body.setSize(wall.width, wall.height).setOffset(wall.width * 0.5, wall.height * 0.5);
        });
    }

    // move player to level spawn location
    var playerLocationsLayer = map.getObjectLayer('Player');
    if (playerLocationsLayer) {
        var playerLocations = playerLocationsLayer['objects'];
        playerLocations.forEach(location => {
            world.player.playerContainer.setPosition(location.x, location.y);
        });
    }

    // spawn enemies at locations
    var enemyLocationsLayer = map.getObjectLayer('Enemies');
    if (enemyWallsLayer) {
        var enemyLocations = enemyLocationsLayer['objects'];
        enemyLocations.forEach(location => {
            world.spawnEnemy(location.x + location.width * 0.5, location.y - location.height);
        });
    }

    // colliders
    game.physics.add.collider(world.player.playerContainer, game.spikes, world.player.playerHit, null, this);
    game.physics.add.collider(world.player.playerContainer, game.ladders, onCollisionPlayerLadder, null, this).overlapOnly = true;
    game.physics.add.collider(world.player.playerContainer, game.objectives, onCollisionPlayerObjective, null, this).overlapOnly = true;
    game.physics.add.collider(world.player.playerContainer, game.exits, onCollisionPlayerExit, null, this).overlapOnly = true;
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