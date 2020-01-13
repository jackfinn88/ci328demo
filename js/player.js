class Player {
    constructor() {
        var container = game.add.container(0, (map.heightInPixels * 0.8));
        this.playerContainer = container;

        this.isFalling = false;
        this.fireRateTimer;
        this.isDead = false;
        this.health = 100;
        this.armor = user["difficulty"] > 1 ? user["difficulty"] > 2 ? 100 : 50 : 0;
        this.canClimb = false;
        this.reachedExit = false;

        this.weapon = game.weapons[user["equipped"]];

        this.lastFired = this.weapon.fireRate;

        // set size and physics
        this.playerContainer.setSize(60, 110);
        game.physics.world.enable(this.playerContainer);
        this.playerContainer.body.setCollideWorldBounds(true);
        this.playerContainer.setDepth(1);

        // create player sprite
        var playerSprite = game.add.sprite(0, 0, 'player');
        playerSprite.name = 'player';
        this.sprite = playerSprite;

        // create weapon sprite
        var weaponSprite = game.add.sprite(20, 26, this.weapon.name);
        weaponSprite.setOrigin(0.5)
        weaponSprite.name = this.weapon.name;
        this.weapon.sprite = weaponSprite;
        this.weapon.ammo = game.weapons[this.weapon.name].currentAmmo;
        this.weapon.clip = this.weapon.clipSize;
        this.weapon.isReloading = false;

        // add sprites to container
        this.playerContainer.add(this.sprite);
        this.playerContainer.add(weaponSprite);
    }

    translateX(positiveAxis) {
        this.playerContainer.body.setVelocityX(positiveAxis ? 200 : -200);

        // play left walk animation
        if (this.playerContainer.body.onFloor() || this.canClimb) {
            this.sprite.anims.play('walking', true);
        }

        // adjust weapon position
        this.playerContainer.getByName(this.weapon.name).x = positiveAxis ? 20 : -20;

        // flip the sprite to the left
        this.playerContainer.getByName('player').flipX = positiveAxis ? false : true;
        this.playerContainer.getByName(this.weapon.name).flipX = positiveAxis ? false : true;
    }

    translateY(positiveAxis) {
        if (world.player.canClimb) {
            world.player.playerContainer.body.setAllowGravity(false);
            this.playerContainer.body.setVelocityY(positiveAxis ? 200 : -200);
        } else {
            if (!positiveAxis) {
                world.player.playerContainer.body.setAllowGravity(true);
                if (this.playerContainer.body.onFloor()) {
                    this.sprite.anims.play('jump', true); // jump
                    audio.jump.play('', { 'volume': audio.volume.sfx });
                    this.playerContainer.body.setVelocityY(-400);
                }
            }
        }
    }

    onUpKeyup() {
        if (world.player.canClimb) {
            this.playerContainer.body.setVelocityY(0);
            // idle frame
            this.sprite.anims.play('idle', true);
        } else {
            this.idle();
        }
    }

    onDownKeyup() {
        if (world.player.canClimb) {
            this.playerContainer.body.setVelocityY(0);
        }
    }

    idle() {
        // wait to see if other buttons are still down
        setTimeout(() => {
            if (!input.keys['A'].isDown && !input.keys['D'].isDown) {
                // if not and player is down then stop moving
                if (this.playerContainer.body.onFloor() || this.canClimb) {
                    // idle frame
                    this.sprite.anims.play('idle', true);

                    this.playerContainer.body.setVelocityX(0);
                }
            }
        }, 50);
    }

    startShooting() {
        if (this.weapon.isReloading) {
            return;
        }
        // start looping
        this.fireRateTimer = requestAnimationFrame(() => { this.startShooting() });
        if (this.weapon.clip > 0) {
            if (this.lastFired < this.weapon.fireRate) {
                this.lastFired++;
            } else {
                this.lastFired = 0;
                var spawnOffset = { x: this.weapon.barrelOffset.x, y: this.weapon.barrelOffset.y };
                var recoilBounce = 3;
                if (this.playerContainer.getByName(this.weapon.name).flipX) {
                    spawnOffset.x = -this.weapon.barrelOffset.x;
                    recoilBounce = -recoilBounce;
                } else {
                    spawnOffset.x = this.weapon.barrelOffset.x;
                }
                // show recoil
                if (!this.weapon.sprite.anims.isPlaying) {
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
                        if (this.weapon.reloadAnim && !this.weapon.sprite.anims.isPlaying) {
                            this.weapon.sprite.anims.play(this.weapon.reloadAnim, false);
                        }
                    }, 50);
                    // fire bullet
                    world.spawnBullet(world.player.playerContainer.x + this.playerContainer.getByName(this.weapon.name).x + spawnOffset.x, world.player.playerContainer.y + this.playerContainer.getByName(this.weapon.name).y + spawnOffset.y, this.sprite.flipX ? true : false);
                    audio.shoot.play('', { 'volume': audio.volume.sfx });
                    this.weapon.clip--;
                    ui.updateText(ui.textTypes.AMMO, this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo));
                }
            }
        } else {
            if (!this.weapon.isReloading) {
                this.reloadWeapon();
            }
        }
    }

    reloadWeapon() {
        if (this.weapon.clip < this.weapon.clipSize) {
            if (!this.weapon.isReloading) {
                // flag boolean to prevent multiple calls
                this.weapon.isReloading = true;
                audio.reload.play('', { 'volume': audio.volume.sfx });

                // update ui
                var feedback = this.weapon.ammo > 0 ? 'Reloading...' : this.weapon.ammo < 0 ? 'Unlimited... ' : 'Empty...';
                ui.updateText(ui.textTypes.AMMO, feedback);
                setTimeout(() => {
                    if (this.weapon.ammo > this.weapon.clipSize) {
                        this.weapon.ammo -= (this.weapon.clipSize - this.weapon.clip);
                        this.weapon.clip = this.weapon.clipSize;
                    } else if (this.weapon.ammo > 0) {
                        this.weapon.clip = this.weapon.ammo;
                        this.weapon.ammo = 0;
                    } else {
                        audio.empty.play('', { 'volume': audio.volume.sfx });
                    }

                    // update ui
                    feedback = this.weapon.clip + '/' + this.weapon.ammo;
                    ui.updateText(ui.textTypes.AMMO, feedback);
                    this.weapon.isReloading = false;
                }, this.weapon.reloadDuration);
            }
        }
    }

    changeWeaponTo(weapon) {
        // update weapon object
        this.weapon = game.weapons[weapon];

        // remove old weapon from player container
        world.player.playerContainer.removeAt(1);

        // create new weapon sprite
        var weaponSprite = game.add.sprite(20, 26, this.weapon.name);
        weaponSprite.setOrigin(0.5)
        weaponSprite.name = this.weapon.name;

        // add to weapon obj and player container
        this.weapon.sprite = weaponSprite;
        this.weapon.ammo = game.weapons[this.weapon.name].currentAmmo;
        this.weapon.clip = this.weapon.clipSize;

        this.playerContainer.add(weaponSprite);

        // update ui with new weapon
        ui.updateText(ui.textTypes.AMMO, this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo));
    }

    stopShooting() {
        // stop looping
        cancelAnimationFrame(this.fireRateTimer);
        // finish out remaining cooldown from last shot
        setTimeout(() => {
            this.lastFired = this.fireRate;
        }, this.fireRate - this.lastFired);
    }

    onDeath() {
        this.isDead = true;
        pauseGame(true);
    }

    update() {
        // check if now on floor and was previously falling
        if (this.playerContainer.body.onFloor() && this.isFalling) {
            this.isFalling = false;

            // resume movement if any keys are down at time of landing
            if (input.keys['A'].isDown) {
                this.translateX(false);
            } else if (input.keys['D'].isDown) {
                this.translateX(true);
            } else {
                this.idle();
            }
        }

        if (this.playerContainer.body.velocity.y > 0) {
            this.isFalling = true;
        }
    }
}
