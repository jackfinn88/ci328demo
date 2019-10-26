class Player {
    constructor() {
        const playerSprite = game.physics.add.sprite(phaser.config.width / 2, phaser.config.height - 50, 'playerShip_sp');
        playerSprite.setOrigin(0.5, 0.5);
        playerSprite.setCollideWorldBounds(true);

        this.sprite = playerSprite;
    }

    left() {
        this.sprite.x -= 5;
    }

    right() {
        this.sprite.x += 5;
    }

    onDeath(callback) {
        //this.sprite.events.onKilled.add(callback);
    }
}
