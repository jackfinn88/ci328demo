class Control {
    onUpdate(sprite) {

    }
}

class EntityFactory {
    constructor(spriteName) {
        var group = game.physics.add.group({
            defaultKey: spriteName
        });

        this.group = group;
    }

    spawnAsDrop(x, y, type) {
        var drop = this.group.get(x, y, type);
        if (drop) {
            drop.type = type;
            drop.body.allowGravity = true;
            drop.setBounce(0.5)

            // add collisions
            game.physics.world.enable(drop);
            game.physics.add.collider(groundLayer, drop);
            drop.body.setCollideWorldBounds(true);
        }

    }

    spawnAsBullet(x, y, velocity) {
        var bullet = this.group.get(x, y);

        if (bullet) {
            bullet.flipX = velocity ? true : false
            bullet.startX = x;
            bullet.startY = y;
            bullet.damage = world.player.weapon.damage;
            bullet.body.allowGravity = false;
            bullet.outOfBoundsKill = true;
            bullet.checkWorldBounds = true;
            bullet.setScale(0.5);
            bullet.body.setVelocityX(velocity ? -1000 : 1000, 0);
        }
    }

    spawnAsEnemy(x, y) {
        // decide which enemy to spawn
        var randomInt = (Math.random() > 0.5) ? 1 : 2;
        var enemyType = this.group.defaultKey + randomInt;

        var container = game.add.container(x, y);
        container.name = enemyType;
        container.setSize(60, 110);
        game.physics.world.enable(container);
        container.body.setCollideWorldBounds(true);

        this.setUpEntity(container);

        // create the enemy sprite
        var sprite = game.add.sprite(0, 0, enemyType);
        sprite.name = 'enemy';

        var weaponKey = user["game_level"] > 2 ? 'rifle' : user["game_level"] > 1 ? 'ak47' : 'smg';
        // add enemy weapon
        var weapon = enemyType + '_' + weaponKey;
        var rifle = game.add.sprite(10, 20, weapon);
        rifle.name = 'weapon';
        // set origin top-left
        rifle.originX = 0;
        rifle.originY = 0;

        // add sprites to container
        container.add(sprite);
        container.add(rifle);

        // add enemy control
        container.addControl(new EnemyControl(container));

        // add collision with ground layer
        game.physics.add.collider(groundLayer, container);

        game.physics.add.overlap(world.bulletFactory.group, container, onCollisionBulletEnemy, null, this);

        container.health = 100 + (user["difficulty"] * 20);

        // add enemy to group
        this.group.add(container);
    }

    entityHitBounds(entity, bound) {
        if (!entity.controls[0].isTurning) {
            entity.controls[0].hitBounds();
        }
    }

    setUpEntity(entity) {
        entity.controls = [];
        entity.addControl = (control) => { entity.controls.push(control); }
        entity.updateControls = () => { entity.controls.forEach(control => control.onUpdate(entity)); }
    }

    updateAllExists() {
        this.group.children.iterate(function (child) {
            if (child) {
                child.updateControls();
            }
        })
    }

    destroyAllExists() {
        this.group.children.iterate(function (child) {
            if (child) child.destroy();
        })
    }
}

class EnemyControl extends Control {
    constructor(enemy) {
        super();
        this.container = enemy;
        this.canShoot = true;
        this.isMovingRight = false;
        this.isTurning = false;
        this.toRightOfPlayer = false;
        this.facingPlayer = false;
        this.withinPlayerSightRangeX = false;
        this.withinPlayerSightRangeY = false;
        this.awareOfPlayer = false;
        this.awarenessTimeout;
        this.awarenessTimerSet = false;
        this.range = 100 + (50 * user["difficulty"]);
        this.awarenessCooldownDuration = 1000 * user["difficulty"];
        this.shootInterval = 800 / user["difficulty"];
        this.moveIncrement = 25 * user["difficulty"];
    }

    onUpdate() {
        if (!game.paused) {
            if (!this.container.isDead) {
                var withinPlayerSightRangeX, withinPlayerSightRangeY, toRightOfPlayer, facingPlayer;

                // if already aware of player - calculate position and range
                if (this.awareOfPlayer) {
                    toRightOfPlayer = world.player.playerContainer.x < this.container.x;
                    facingPlayer = (toRightOfPlayer && !this.isMovingRight) || (!toRightOfPlayer && this.isMovingRight);
                    // face player to shoot
                    if (!facingPlayer) {
                        if (toRightOfPlayer) {
                            this.translateX(false);
                        } else {
                            this.translateX(true);
                        }
                    }
                    // shoot if within range
                    var distanceFromPlayer = Math.abs(world.player.playerContainer.x - this.container.x);
                    if (distanceFromPlayer <= this.range) {
                        // halt movement
                        this.idle();
                        // can only shoot at intervals
                        if (this.canShoot) {
                            world.spawnEnemyBullet(this.container.x + this.container.getByName('weapon').x, this.container.y + this.container.getByName('weapon').y, toRightOfPlayer ? true : false);
                            this.canShoot = false;
                            setTimeout(() => {
                                this.canShoot = true;
                            }, this.shootInterval);
                        }
                    } else {
                        // get closer if out of range
                        if (toRightOfPlayer) {
                            this.translateX(false);
                        } else {
                            this.translateX(true);
                        }
                    }

                    // check if player can be seen
                    withinPlayerSightRangeX = Math.abs(world.player.playerContainer.x - this.container.x) < this.range;
                    withinPlayerSightRangeY = Math.abs(world.player.playerContainer.y - this.container.y) < this.range / 4; // 1/4 of horizontal sight

                    if (!withinPlayerSightRangeY || !withinPlayerSightRangeX) {
                        // out of sight range - begin cooldown
                        if (!this.awarenessTimerSet) {
                            this.awarenessTimerSet = true;
                            this.awarenessTimeout = setTimeout(() => {
                                // no longer aware
                                this.awareOfPlayer = false;
                                this.awarenessTimerSet = false;
                                if (!this.isTurning && !this.container.isDead) {
                                    if (this.isMovingRight) {
                                        this.translateX(true);
                                    } else {
                                        this.translateX(false);
                                    }
                                }
                            }, this.awarenessCooldownDuration);
                        }
                    }
                } else {
                    // continue to patrol
                    if (!this.isTurning) {
                        if (this.isMovingRight) {
                            this.translateX(true);
                        } else {
                            this.translateX(false);
                        }
                    }

                    // check if player can be seen
                    withinPlayerSightRangeX = Math.abs(world.player.playerContainer.x - this.container.x) < this.range;
                    withinPlayerSightRangeY = Math.abs(world.player.playerContainer.y - this.container.y) < this.range / 4;
                    toRightOfPlayer = world.player.playerContainer.x < this.container.x;
                    facingPlayer = (toRightOfPlayer && !this.isMovingRight) || (!toRightOfPlayer && this.isMovingRight);

                    this.awareOfPlayer = withinPlayerSightRangeY ? withinPlayerSightRangeX && facingPlayer : false;
                }
            }
        } else {
            this.idle();
        }
    }

    hitBounds() {
        // set flag to only execute once on initial collision
        this.isTurning = true;

        // stop and turn
        this.container.body.setVelocity(0, 0);
        if (this.isMovingRight) {
            this.translateX(false);
        } else {
            this.translateX(true);
        }

        // reset flag after delay
        setTimeout(() => {
            this.isTurning = false;
        }, 500);
    }

    onDeath() {
        // stop movement show animation
        this.container.getByName('enemy').anims.play(this.container.name + '_death', true);
        this.container.isDead = true;
        this.container.body.setVelocity(0, 0);

        // add flicker effect to sprite
        this.container.setAlpha(0);
        game.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 100,
            ease: 'Linear',
            repeat: 5,
        });
        // lower weapon with animation
        this.container.list[1].y += 10;

        setTimeout(() => {
            this.container.destroy();
            audio.explode.play('', { 'volume': audio.volume.sfx });

            game.score += level.killReward;
            ui.updateText(ui.textTypes.SCORE, game.score);

            // generate player item drop
            var rand = Math.random();
            if (rand > 0.3) {
                var randomDrop = rand > 0.7 ? 'cash' : 'ammo';
                world.playerDropsFactory.spawnAsDrop(this.container.x, this.container.y, randomDrop);
            }
        }, 500);
    }

    translateX(positiveAxis) {
        this.container.body.setVelocityX(positiveAxis ? this.moveIncrement : -this.moveIncrement);

        // play walk animation
        if (this.container.body.onFloor()) {
            this.container.getByName('enemy').anims.play(this.container.name + '_walking', true);
        }

        // adjust weapon position
        this.container.getByName('weapon').x = positiveAxis ? 16 : -16;

        // flip sprites
        this.container.getByName('enemy').flipX = positiveAxis ? false : true;
        this.container.getByName('weapon').flipX = positiveAxis ? false : true;
        this.isMovingRight = positiveAxis ? true : false;
    }

    idle() {
        if (this.container.body.onFloor()) {
            // idle frame
            if (!this.container.isDead) this.container.getByName('enemy').anims.play(this.container.name + '_idle', true);

            this.container.body.setVelocityX(0);
        }
    }
}

class World {
    constructor(game) {
        this.bulletFactory = new EntityFactory('bullet');
        this.enemyFactory = new EntityFactory('enemy');
        this.enemyBulletFactory = new EntityFactory('bullet');
        this.playerDropsFactory = new EntityFactory('ammo');

        this.player = new Player();

        game.physics.add.overlap(this.playerDropsFactory.group, this.player.playerContainer, onCollisionPlayerDrop, null, this);
        game.physics.add.overlap(this.enemyBulletFactory.group, this.player.playerContainer, onCollisionBulletPlayer, null, this);
    }

    spawnEnemy(x, y) {
        this.enemyFactory.spawnAsEnemy(x, y);
    }

    spawnBullet(x, y, velocity) {
        this.bulletFactory.spawnAsBullet(x, y, velocity);
    }

    spawnEnemyBullet(x, y, velocity) {
        this.enemyBulletFactory.spawnAsBullet(x, y, velocity);
    }

    update() {
        this.player.update();
        this.enemyFactory.updateAllExists();
    }

    cleanup() {
        this.enemyFactory.destroyAllExists();
        this.bulletFactory.destroyAllExists();
        this.enemyBulletFactory.destroyAllExists();
        this.playerDropsFactory.destroyAllExists();

        // destroy input manager and colliders
        audio.music.stop();
        game.input.destroy();
        game.physics.world.colliders.destroy();
    }
}
