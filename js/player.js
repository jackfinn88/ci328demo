class Player {
    constructor() {
        const container = game.add.container(100, 1800);
        this.playerContainer = container;

        this.isFalling = false;
        this.fireRateTimer;
        this.isDead = false;
        this.pistolWeapon = {
            sprite: 'pistol',
            velocity: 1000,
            fireRate: 20,
            barrelOffset: { x: 50, y: -20 },
            damage: 20
        }
        this.rifleWeapon = {
            sprite: 'rifle',
            velocity: 1000,
            fireRate: 10,
            barrelOffset: { x: 50, y: -5 },
            damage: 40
        }
        this.weapon = this.rifleWeapon;

        this.lastFired = this.weapon.fireRate;


        // set size and physics
        this.playerContainer.setSize(80, 110)
        game.physics.world.enable(this.playerContainer);
        this.playerContainer.body.setCollideWorldBounds(true);

        // create player sprite
        const playerSprite = game.add.sprite(0, 0, 'player');
        playerSprite.name = 'player';
        this.sprite = playerSprite;

        // create weapon sprite
        const rifle = game.add.sprite(20, 26, this.weapon.sprite);
        rifle.setOrigin(0.5)
        rifle.name = this.weapon.sprite;

        // add sprites to container
        this.playerContainer.add(this.sprite);
        this.playerContainer.add(rifle);

        game.anims.create({
            key: 'rifle_move',
            frames: game.anims.generateFrameNames('rifle', { prefix: 'walk', start: 1, end: 12, zeroPad: 2 }),
            frameRate: 12,
            repeat: -1
        });
        game.anims.create({
            key: 'walking',
            frames: game.anims.generateFrameNames('player', { prefix: 'walk', start: 2, end: 5, zeroPad: 2 }),
            frameRate: 10,
            repeat: -1
        });
        // idle with only one frame, so repeat is not neaded
        game.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 'idle' }],
        });
        // jump with only one frame, so repeat is not neaded
        game.anims.create({
            key: 'jump',
            frames: [{ key: 'player', frame: 'jump' }],
        });
        // death with only one frame, so repeat is not neaded
        game.anims.create({
            key: 'death',
            frames: [{ key: 'player', frame: 'death' }],
        });
    }

    left() {
        this.playerContainer.body.setVelocityX(-200);

        // play left walk animation
        if (this.playerContainer.body.onFloor()) {
            this.sprite.anims.play('walking', true);
        }

        // adjust weapon position
        this.playerContainer.getByName(this.weapon.sprite).x = -20;

        // flip the sprite to the left
        this.playerContainer.getByName('player').flipX = true;
        this.playerContainer.getByName(this.weapon.sprite).flipX = true;
    }

    right() {
        this.playerContainer.body.setVelocityX(200);

        // play right walk animation
        if (this.playerContainer.body.onFloor()) {
            this.sprite.anims.play('walking', true);
        }

        // adjust weapon position
        this.playerContainer.getByName(this.weapon.sprite).x = 20;

        // flip the sprite to the right
        this.playerContainer.getByName('player').flipX = false;
        this.playerContainer.getByName(this.weapon.sprite).flipX = false;
    }

    up() {
        if (this.playerContainer.body.onFloor()) {

            this.sprite.anims.play('jump', true); // walk right
            this.playerContainer.body.setVelocityY(-500);
        }
    }

    idle() {
        // wait to see if other buttons are still down
        setTimeout(() => {
            if (!input.keys['A'].isDown && !input.keys['D'].isDown) {
                // if not and player is down then stop moving
                if (this.playerContainer.body.onFloor()) {
                    // idle frame
                    this.sprite.anims.play('idle', true);

                    this.playerContainer.body.setVelocityX(0);
                }
            }
        }, 50);
    }

    startShooting() {
        // start looping
        if (this.lastFired < this.weapon.fireRate) {
            this.lastFired++;
        } else {
            this.lastFired = 0;
            let spawnOffset = { x: this.weapon.barrelOffset.x, y: this.weapon.barrelOffset.y };
            if (this.playerContainer.getByName(this.weapon.sprite).flipX) {
                spawnOffset.x = -this.weapon.barrelOffset.x;
            } else {
                spawnOffset.x = this.weapon.barrelOffset.x;
            }
            world.player.playerContainer.list[1].y -= 3;
            setTimeout(() => {
                world.player.playerContainer.list[1].y += 3;
            }, 50);
            world.spawnBullet(world.player.playerContainer.x + this.playerContainer.getByName(this.weapon.sprite).x + spawnOffset.x, world.player.playerContainer.y + this.playerContainer.getByName(this.weapon.sprite).y + spawnOffset.y);
            audio.shoot.play();
        }
        this.fireRateTimer = requestAnimationFrame(() => { this.startShooting() });
    }

    stopShooting() {
        // stop looping
        cancelAnimationFrame(this.fireRateTimer);
        this.lastFired = this.weapon.fireRate;
    }

    playerHit(player, spike) {
        if (!world.player.isDead) {
            world.player.isDead = true;
            world.player.stopShooting();
            input.disable();
            world.player.sprite.anims.play('death', true);
            world.player.playerContainer.body.setVelocity(0, 0);

            world.player.playerContainer.setAlpha(0);
            this.tweens.add({
                targets: world.player.playerContainer,
                alpha: 1,
                duration: 100,
                ease: 'Linear',
                repeat: 5,
            });
            world.player.playerContainer.list[1].y += 10;
            setTimeout(() => {
                world.player.isDead = false;
                input.enable();
                world.player.sprite.anims.play('idle', true);
                world.player.playerContainer.setX(100);
                world.player.playerContainer.setY(1800);

                world.player.playerContainer.list[1].y -= 10;
            }, 1000);
        }
    }

    onDeath(callback) {
        //this.sprite.events.onKilled.add(callback);
    }

    update() {
        if (this.playerContainer.body.onFloor() && this.isFalling) {
            this.isFalling = false;
            if (input.keys['A'].isDown) {
                this.left();
            } else if (input.keys['D'].isDown) {
                this.right();
            } else {
                this.idle();
            }
        }
        if (this.playerContainer.body.velocity.y > 0) {
            this.isFalling = true;
        }
    }
}
