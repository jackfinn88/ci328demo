class Control {

    onUpdate(sprite) {

    }
}

class EntityFactory {
    constructor(spriteName) {
        console.log('entity constructor')
        var group = game.physics.add.group({
            defaultKey: spriteName
        });

        this.group = group;
        this.container;
    }

    spawnAsBullet(x, y, velocity) {
        console.log('spawn as bullet');

        //  Grab the first bullet we can from the pool
        var bullet = this.group.get(x, y);
        // console.log(this.group)
        if (bullet) {
            bullet.damage = world.player.weapon.damage;
            bullet.body.allowGravity = false;
            bullet.outOfBoundsKill = true;
            bullet.checkWorldBounds = true;
            bullet.setScale(0.5);
            // bullet.body.setVelocityX(world.player.sprite.flipX ? -world.player.weapon.velocity : world.player.weapon.velocity, 0);
            bullet.body.setVelocityX(velocity ? -1000 : 1000, 0);
        }

    }

    spawnAsEnemy(x, y, type) {
        // decide which enemy to spawn
        var randomInt = (Math.random() > 0.5) ? 1 : 2;
        var enemyType = this.group.defaultKey + randomInt;
        console.log(enemyType);

        var container = game.add.container(x, y);
        container.name = enemyType;
        container.setSize(60, 110);
        game.physics.world.enable(container);
        container.body.setCollideWorldBounds(true);

        this.setUpEntity(container);

        // create the enemy sprite
        var sprite = game.add.sprite(0, 0, enemyType);
        sprite.name = 'enemy';

        var wpn = 'smg';
        // add enemy weapon
        var weapon = enemyType + '_' + wpn;
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

        // set callback for being shot in the face
        /*game.physics.add.overlap(world.bulletFactory.group, container, function (event) {
            world.enemyFactory.test(event);
        });*/

        game.physics.add.overlap(world.bulletFactory.group, container, onCollisionBulletEnemy, null, this);

        container.health = 100;

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
            child.destroy();
        })
    }
}

class EnemyControl extends Control {
    constructor(enemy) {
        super();
        this.container = enemy;
        this.test = Math.round(Math.random()) > 0.5 ? 1 : 0;
        this.canShoot = true;
        this.shootInterval;
        this.isMovingRight = false;
        this.isTurning = false;
    }

    onUpdate() {
        if (!this.container.isDead) {
            if (!this.isTurning) {
                if (this.isMovingRight) {
                    this.right();
                } else {
                    this.left();
                }
            }
            // check against walls and reverse direction if necessary
            if (this.container.body.touching.right || this.container.body.blocked.right) {
                this.container.body.velocity.x = -50; // turn left
            }
            else if (this.container.body.touching.left || this.container.body.blocked.left) {
                this.container.body.velocity.x = 50; // turn right
            }

            if (Math.abs(world.player.playerContainer.x - this.container.x) < 200 && Math.abs(world.player.playerContainer.y - this.container.y) < 200) {
                // shoot player
                if (world.player.playerContainer.x < this.container.x) {
                    this.left();
                } else {
                    this.right();
                }

                this.idle();

                if (this.canShoot) {
                    world.spawnEnemyBullet(this.container.x + this.container.getByName('weapon').x, this.container.y + this.container.getByName('weapon').y, this.container.getByName('enemy').flipX ? true : false);
                    this.canShoot = false;
                    this.shootInterval = setTimeout(() => {
                        this.canShoot = true;
                    }, 800);
                }
                /*let spawnOffset = { x: this.weapon.barrelOffset.x, y: this.weapon.barrelOffset.y };
                if (this.container.getByName('weapon').flipX) {
                    spawnOffset.x = -this.weapon.barrelOffset.x;
                    recoilBounce = -recoilBounce;
                } else {
                    spawnOffset.x = this.weapon.barrelOffset.x;
                }*/
                // world.spawnBullet(this.container.x + this.container.getByName('weapon').x + spawnOffset.x, this.container.y + this.container.getByName('weapon').y + spawnOffset.y, this.container.getByName('enemy').flipX ? true : false);
                // world.spawnEnemyBullet(this.container.x + this.container.getByName('weapon').x, this.container.y + this.container.getByName('weapon').y, this.container.getByName('enemy').flipX ? true : false);
            }

        }
    }

    hitBounds() {
        this.isTurning = true;
        this.container.body.setVelocity(0, 0);
        console.log(this.container);
        if (this.isMovingRight) {
            console.log('moving right, go left');
            this.left();
        } else {
            console.log('moving left, go right');
            this.right();
        }
        setTimeout(() => {
            this.isTurning = false;
        }, 500);
    }

    onDeath() {
        this.container.isDead = true;
        this.container.getByName('enemy').anims.play(this.container.name + '_death', true);
        this.container.body.setVelocity(0, 0);

        this.container.setAlpha(0);
        game.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 100,
            ease: 'Linear',
            repeat: 5,
        });
        this.container.list[1].y += 10;

        setTimeout(() => {
            this.container.destroy();
            audio.explode.play();

            world.numEnemies--;
            setScoreText(game.score + 20);
            console.log('kill');
        }, 800);
    }

    left() {
        this.container.body.setVelocityX(-50);

        // play left walk animation
        if (this.container.body.onFloor()) {
            // this.container.list[0].anims.play(this.container.list[0].name + '_walking', true);
            this.container.getByName('enemy').anims.play(this.container.name + '_walking', true);
        }

        // adjust weapon position
        this.container.getByName('weapon').x = -16;

        // flip the sprite to the left
        this.container.getByName('enemy').flipX = true;
        this.container.getByName('weapon').flipX = true;
        this.isMovingRight = false;
    }

    right() {
        this.container.body.setVelocityX(50);

        // play left walk animation
        if (this.container.body.onFloor()) {
            this.container.getByName('enemy').anims.play(this.container.name + '_walking', true);
        }

        // adjust weapon position
        this.container.getByName('weapon').x = 16;

        // flip the sprite to the left
        this.container.getByName('enemy').flipX = false;
        this.container.getByName('weapon').flipX = false;
        this.isMovingRight = true;
    }

    idle() {
        // if not and player is down then stop moving
        if (this.container.body.onFloor()) {
            // idle frame
            this.container.getByName('enemy').anims.play(this.container.name + '_idle', true);

            this.container.body.setVelocityX(0);
        }
    }
}

class World {
    constructor(game) {
        /*this.bg = game.add.image(0, 0, 'background_img');
        this.bg.setOrigin(0, 0);*/

        this.player = new Player();
        this.player.onDeath(gameOver);

        this.bulletFactory = new EntityFactory('bullet');
        this.enemyFactory = new EntityFactory('enemy');
        this.enemyBulletFactory = new EntityFactory('bullet');

        game.physics.add.overlap(this.enemyBulletFactory.group, this.player.playerContainer, onCollisionBulletPlayer, null, this);

        this.numEnemies = 0;
    }

    spawnEnemy(x, y) {
        this.enemyFactory.spawnAsEnemy(x, y);
        this.numEnemies++;
    }

    spawnBullet(x, y, velocity) {
        this.bulletFactory.spawnAsBullet(x, y, velocity);
    }

    spawnEnemyBullet(x, y, velocity) {
        // this.enemyBulletFactory.spawnAsBullet(x, y, velocity);
    }

    update() {
        /*
        //  Scroll the background, reset it when it reaches the bottom
        this.bg.y += 2;

        if (this.bg.y >= 0) {
            this.bg.y = -phaser.config.height;
        }*/

        this.player.update();
        this.enemyFactory.updateAllExists();
    }

    cleanup() {
        this.enemyFactory.destroyAllExists();
        this.bulletFactory.destroyAllExists();
    }
}
