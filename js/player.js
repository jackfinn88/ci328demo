class Player {
    constructor() {
        const container = game.add.container(100, 1800);
        this.playerContainer = container;

        this.isFalling = false;
        this.fireRateTimer;
        this.isDead = false;

        const weapons = Object.keys(game.weapons);
        weapons.forEach((weapon) => {
            if (game.weapons[weapon].equipped) {
                this.weapon = game.weapons[weapon];
            }
        })

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
        this.weapon.obj = rifle;
        this.weapon.ammo = 60;
        this.weapon.clip = this.weapon.clipSize;

        // add sprites to container
        this.playerContainer.add(this.sprite);
        this.playerContainer.add(rifle);

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
        if (this.weapon.ammo > 0) {
            // start looping
            this.fireRateTimer = requestAnimationFrame(() => { this.startShooting() });
            if (this.weapon.clip > 0) {
                if (this.lastFired < this.weapon.fireRate) {
                    this.lastFired++;
                } else {
                    this.lastFired = 0;
                    let spawnOffset = { x: this.weapon.barrelOffset.x, y: this.weapon.barrelOffset.y };
                    let recoilBounce;
                    if (this.playerContainer.getByName(this.weapon.sprite).flipX) {
                        spawnOffset.x = -this.weapon.barrelOffset.x;
                        recoilBounce = -3;
                    } else {
                        spawnOffset.x = this.weapon.barrelOffset.x;
                        recoilBounce = 3;
                    }
                    // show recoil
                    if (!this.weapon.obj.anims.isPlaying) {
                        if (this.weapon.recoilX) {
                            world.player.playerContainer.list[1].x -= recoilBounce;
                        } else {
                            world.player.playerContainer.list[1].y -= Math.abs(recoilBounce); // vertical always bounces up
                        }
                        setTimeout(() => {
                            if (this.weapon.recoilX) {
                                world.player.playerContainer.list[1].x += recoilBounce;
                            } else {
                                world.player.playerContainer.list[1].y += Math.abs(recoilBounce);
                            }
                            if (this.weapon.reloadAnim && !this.weapon.obj.anims.isPlaying) {
                                this.weapon.obj.anims.play(this.weapon.reloadAnim, false);
                            }
                        }, 50);
                        // fire bullet
                        world.spawnBullet(world.player.playerContainer.x + this.playerContainer.getByName(this.weapon.sprite).x + spawnOffset.x, world.player.playerContainer.y + this.playerContainer.getByName(this.weapon.sprite).y + spawnOffset.y);
                        audio.shoot.play();
                        this.weapon.clip--;
                        this.weapon.ammo--;
                        setAmmo(this.weapon.clip + '/' + this.weapon.ammo);
                    }
                }
            } else {
                setAmmo(this.weapon.clip + '/' + this.weapon.ammo + ' Reloading...');
                setTimeout(() => {
                    this.weapon.clip = this.weapon.ammo > this.weapon.clipSize ? this.weapon.clipSize : this.weapon.ammo > 0 ? this.weapon.ammo : 0;
                    setAmmo(this.weapon.clip + '/' + this.weapon.ammo);
                }, this.weapon.reloadDuration);
            }
        }
    }

    stopShooting() {
        // stop looping
        cancelAnimationFrame(this.fireRateTimer);
        // finish out remaining cooldown from last shot
        setTimeout(() => {
            this.lastFired = this.fireRate;
        }, this.fireRate - this.lastFired);
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
