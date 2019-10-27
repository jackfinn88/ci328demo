class Player {
    constructor() {
        /*const playerSprite = game.physics.add.sprite(phaser.config.width / 2, phaser.config.height - 50, 'playerShip_sp');
        playerSprite.setOrigin(0.5, 0.5);
        playerSprite.setCollideWorldBounds(true);

        this.sprite = playerSprite;*/

        ///

        // create the player sprite    
        const playerSprite = game.physics.add.sprite(200, 200, 'player');
        playerSprite.setBounce(0.2); // our player will bounce from items
        playerSprite.setCollideWorldBounds(true); // don't go out of the map    
        
        // small fix to our player images, we resize the physics body object slightly
        playerSprite.body.setSize(playerSprite.width, playerSprite.height-8);
        
        this.sprite = playerSprite;
    }

    left() {
        console.log('left');
        // this.sprite.body.setVelocityX(-200);
        this.sprite.x -= 5;
        this.sprite.anims.play('walk', true); // walk left
        this.sprite.flipX = true; // flip the sprite to the left
    }

    right() {
        console.log('right');
        // this.sprite.body.setVelocityX(200);
        this.sprite.x += 5;
        this.sprite.anims.play('walk', true); // walk left
        this.sprite.flipX = false; // flip the sprite to the left
    }

    up() {
        console.log('up');
        if (this.sprite.body.onFloor())
        {
            this.sprite.body.setVelocityY(-500);        
        }
    }

    onDeath(callback) {
        //this.sprite.events.onKilled.add(callback);
    }
}
