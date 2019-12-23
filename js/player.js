class Player {
    constructor() {
        var container = game.add.container(100, 1800);
        this.playerContainer = container;

        this.isFalling = false;
        this.fireRateTimer;
        this.isDead = false;

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

    onLeftKeydown() {
        this.playerContainer.body.setVelocityX(-200);

        // play left walk animation
        if (this.playerContainer.body.onFloor() || this.playerContainer.canClimb) {
            this.sprite.anims.play('walking', true);
        }

        // adjust weapon position
        this.playerContainer.getByName(this.weapon.name).x = -20;

        // flip the sprite to the left
        this.playerContainer.getByName('player').flipX = true;
        this.playerContainer.getByName(this.weapon.name).flipX = true;
    }

    onRightKeydown() {
        this.playerContainer.body.setVelocityX(200);

        // play right walk animation
        if (this.playerContainer.body.onFloor() || this.playerContainer.canClimb) {
            this.sprite.anims.play('walking', true);
        }

        // adjust weapon position
        this.playerContainer.getByName(this.weapon.name).x = 20;

        // flip the sprite to the right
        this.playerContainer.getByName('player').flipX = false;
        this.playerContainer.getByName(this.weapon.name).flipX = false;
    }

    onUpKeydown() {
        if (world.player.playerContainer.canClimb) {
            world.player.playerContainer.body.setAllowGravity(false);
            this.playerContainer.body.setVelocityY(-200);
        } else {
            world.player.playerContainer.body.setAllowGravity(true);
            if (this.playerContainer.body.onFloor()) {
                this.sprite.anims.play('jump', true); // jump
                this.playerContainer.body.setVelocityY(-350);
            }
        }
    }

    onUpKeyup() {
        if (world.player.playerContainer.canClimb) {
            this.playerContainer.body.setVelocityY(0);
            // idle frame
            this.sprite.anims.play('idle', true);
        } else {
            this.idle();
        }
    }

    onDownKeydown() {
        if (world.player.playerContainer.canClimb) {
            world.player.playerContainer.body.setAllowGravity(false);
            this.playerContainer.body.setVelocityY(200);
        }
        /*else {
            world.player.playerContainer.body.setAllowGravity(true);
            if (this.playerContainer.body.onFloor()) {
                this.sprite.anims.play('jump', true); // jump
                this.playerContainer.body.setVelocityY(-600);
            }
        }*/
    }

    onDownKeyup() {
        if (world.player.playerContainer.canClimb) {
            this.playerContainer.body.setVelocityY(0);
        }
    }

    idle() {
        // wait to see if other buttons are still down
        setTimeout(() => {
            if (!input.keys['A'].isDown && !input.keys['D'].isDown) {
                // if not and player is down then stop moving
                if (this.playerContainer.body.onFloor() || this.playerContainer.canClimb) {
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
                let spawnOffset = { x: this.weapon.barrelOffset.x, y: this.weapon.barrelOffset.y };
                let recoilBounce = 3;
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
                    audio.shoot.play();
                    this.weapon.clip--;
                    setAmmoText(this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo));
                }
            }
        } else {
            if (!this.weapon.isReloading) {
                this.reloadWeapon();

                /*// flag boolean to prevent multiple calls
                this.weapon.isReloading = true;

                // update ui
                var feedback = this.weapon.ammo > 0 ? 'Reloading...' : this.weapon.ammo < 0 ? 'Unlimited... ' : 'Empty...';
                setAmmoText(feedback);
                setTimeout(() => {
                    if (this.weapon.ammo > this.weapon.clipSize) {
                        this.weapon.clip = this.weapon.clipSize;
                        this.weapon.ammo -= this.weapon.clipSize;
                    } else if (this.weapon.ammo > 0) {
                        this.weapon.clip = this.weapon.ammo;
                        this.weapon.ammo = 0;
                    } else if (this.weapon.ammo < 0) {
                        // weapon is pistol/unlimited ammo
                        this.weapon.clip = this.weapon.clipSize;
                    } else {
                        // weapon is empty - switch to pistol
                        this.changeWeaponTo('pistol');
                    }

                    // update ui
                    feedback = this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo);
                    setAmmoText(feedback);
                    this.weapon.isReloading = false;
                }, this.weapon.reloadDuration);*/
            }
        }
    }

    reloadWeapon() {
        if (this.weapon.clip < this.weapon.clipSize) {
            if (!this.weapon.isReloading) {
                // flag boolean to prevent multiple calls
                this.weapon.isReloading = true;

                // update ui
                var feedback = this.weapon.ammo > 0 ? 'Reloading...' : this.weapon.ammo < 0 ? 'Unlimited... ' : 'Empty...';
                setAmmoText(feedback);
                setTimeout(() => {
                    if (this.weapon.ammo > this.weapon.clipSize) {
                        this.weapon.ammo -= (this.weapon.clipSize - this.weapon.clip);
                        this.weapon.clip = this.weapon.clipSize;
                    } else if (this.weapon.ammo > 0) {
                        this.weapon.clip = this.weapon.ammo;
                        this.weapon.ammo = 0;
                    } else if (this.weapon.ammo < 0) {
                        // weapon is pistol/unlimited ammo
                        this.weapon.clip = this.weapon.clipSize;
                    } else {
                        // weapon is empty - switch to pistol
                        this.changeWeaponTo('pistol');
                    }

                    // update ui
                    feedback = this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo);
                    setAmmoText(feedback);
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
        setAmmoText(this.weapon.clip + '/' + (this.weapon.ammo < 0 ? '--' : this.weapon.ammo));
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
        // check if now on floor and was previously falling
        if (this.playerContainer.body.onFloor() && this.isFalling) {
            console.log('landed');
            this.isFalling = false;

            // act if any keys are down at time of landing
            if (input.keys['A'].isDown) {
                this.onLeftKeydown();
            } else if (input.keys['D'].isDown) {
                this.onRightKeydown();
            } else {
                this.idle();
            }
        }

        if (this.playerContainer.body.velocity.y > 0) {
            this.isFalling = true;
        }
    }
}
