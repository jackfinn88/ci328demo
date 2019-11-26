class Control {

    onUpdate(sprite) {

    }
}

class EntityFactory {
    constructor(spriteName) {
        console.log('entity constructor')
        const group = game.physics.add.group({
            defaultKey: spriteName
        });

        this.group = group;
        this.container;
        /*if (this.group.defaultKey === 'bullet_img') {
            this.group.createMultiple({ 'key': this.group.defaultKey, 'repeat': 29 });

            this.group.children.each(function (bullet) {
                console.log(bullet)
                // bullet.anchor.x = 0.5;
                // bullet.anchor.x = 1;
                bullet.allowGravity = true;// gravity.y = 0;
                console.log(bullet.body)
                // bullet.body.gravity.x = 0;
                bullet.setOrigin(0.5, 0.5);
                const velocity = 650;
                // bullet.setVelocity(game.player.sprite.flipX ? -velocity : velocity, 0);
                bullet.outOfBoundsKill = true;
                bullet.checkWorldBounds = true;
            }, this);
        }*/
        /*console.log('oop', Phaser.Weapon.KILL_WORLD_BOUNDS)

        this.weapon = game.add.weapon(30, 'bullet_img');
        weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;

        //  Because our bullet is drawn facing up, we need to offset its rotation:
        weapon.bulletAngleOffset = 90;

        //  The speed at which the bullet is fired
        weapon.bulletSpeed = 400;

        //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
        weapon.fireRate = 60;*/
    }

    spawnAsBullet(x, y) {
        /*if (!this.nextBulletTime) {
            this.nextBulletTime = 0;
        }

        //  To avoid them being allowed to fire too fast we set a time limit
        if (game.time.now > this.nextBulletTime) {

            const sprite = this.group.create(x - 1, y - 2);

            this.setUpEntity(sprite);
            sprite.body.allowGravity = false;// gravity.y = 0;
            // sprite.body.gravity.x = 0;
            sprite.setOrigin(0.5, 0.5);
            const velocity = 650;
            sprite.setVelocity(world.player.sprite.flipX ? -velocity : velocity, 0);
            this.nextBulletTime = game.time.now + 200;
        }*/

        console.log('spawn as bullet')

        //  Grab the first bullet we can from the pool
        const bullet = this.group.get(x, y);
        // console.log(this.group)
        if (bullet) {
            bullet.damage = world.player.weapon.damage;
            bullet.body.allowGravity = false;
            bullet.outOfBoundsKill = true;
            bullet.checkWorldBounds = true;
            bullet.body.setVelocityX(world.player.sprite.flipX ? -world.player.weapon.velocity : world.player.weapon.velocity, 0);
        }

    }

    spawnAsEnemy(x, y, type) {
        const container = game.add.container(x, y);
        container.setSize(80, 110);
        game.physics.world.enable(container);
        container.body.setCollideWorldBounds(true);

        this.setUpEntity(container);

        // create the enemy sprite
        const sprite = game.add.sprite(0, 0, this.group.defaultKey);
        sprite.name = this.group.defaultKey;
        // add enemy weapon
        const weapon = type == 1 ? 'rifle' : type == 2 ? 'rifle' : 'rifle';
        const rifle = game.add.sprite(20, 26, weapon);
        rifle.name = weapon;
        // set origin top-left
        rifle.originX = 0;
        rifle.originY = 0;

        // add sprites to container
        container.add(sprite);
        container.add(rifle);

        // add enemy control
        container.addControl(new EnemyControl());

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

    setUpEntity(entity) {
        entity.controls = [];
        entity.addControl = (control) => { entity.controls.push(control); }
        entity.updateControls = () => { entity.controls.forEach(control => control.onUpdate(entity)); }
        /*sprite.controls = [];
        sprite.addControl = (control) => { sprite.controls.push(control); }
        sprite.updateControls = () => { sprite.controls.forEach(control => control.onUpdate(sprite)); }*/
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
    onHit(enemy, projectile) {
        console.log('enemy shot');
        enemy.destroy();
        projectile.destroy();
    }

    onUpdate(container) {
        // container.x += 1;
        /*if (sprite.x + sprite.width + sprite.width >= phaser.config.width) {
            sprite.setVelocityX(-Phaser.Math.Between(35, 55));
        }

        if (sprite.x <= 0) {
            sprite.setVelocityX(Phaser.Math.Between(35, 55));
        }

        if (sprite.y > phaser.config.height + 40) {
            sprite.destroy();
            world.numEnemies--;
        }*/
    }
}

class World {
    constructor(game) {
        /*this.bg = game.add.image(0, 0, 'background_img');
        this.bg.setOrigin(0, 0);*/

        this.player = new Player();
        this.player.onDeath(gameOver);

        this.bulletFactory = new EntityFactory('bullet_img');
        this.enemyFactory = new EntityFactory('player');

        this.numEnemies = 0;
    }

    spawnEnemy(x, y) {
        this.enemyFactory.spawnAsEnemy(x, y);
        this.numEnemies++;
    }

    spawnBullet(x, y) {
        this.bulletFactory.spawnAsBullet(x, y);
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

        const playerPosition = (world.player.playerContainer.x / game.physics.world.bounds.width) * 5000;
        // game.backgroundBg.x = -((playerPosition * 1.1) + world.player.playerContainer.x);
        // game.backgroundFar.x = -((playerPosition * 1.4) + world.player.playerContainer.x);
        // game.backgroundMid.x = -((playerPosition * 1.6) + world.player.playerContainer.x);
        // game.backgroundFront.x = -((playerPosition * 2) + world.player.playerContainer.x);
        /*game.backgroundBg.x = world.player.playerContainer.x + game.textures.get('background_bg').source[0].width * 1.1;
        game.backgroundFar.x = world.player.playerContainer.x + game.textures.get('background_back').source[0].width * 1.4;
        game.backgroundMid.x = world.player.playerContainer.x + game.textures.get('background_mid').source[0].width * 1.6;
        game.backgroundFront.x = world.player.playerContainer.x + game.textures.get('background_front').source[0].width * 2;;*/
    }

    cleanup() {
        this.enemyFactory.destroyAllExists();
        this.bulletFactory.destroyAllExists();
    }
}
