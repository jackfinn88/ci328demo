class Control {

    onUpdate(sprite) {

    }
}

class EntityFactory {
    constructor(spriteName) {
        const group = game.physics.add.group({
            defaultKey: spriteName
        });

        this.group = group;
    }

    spawnAsBullet(x, y) {
        if (!this.nextBulletTime) {
            this.nextBulletTime = 0;
        }

        //  To avoid them being allowed to fire too fast we set a time limit
        if (game.time.now > this.nextBulletTime) {

            const sprite = this.group.create(x-1, y-2)
            this.setUpEntity(sprite);
            
            sprite.setOrigin(0.5, 0.5);
            
            sprite.setVelocity(0, -250);
            this.nextBulletTime = game.time.now + 200;
        }
    }

    spawnAsEnemy(x, y) {
        const sprite = this.group.create(x, y + 30);
        
        this.setUpEntity(sprite);
        
        sprite.setVelocity(Phaser.Math.Between(35, 55), Phaser.Math.Between(45, 100));

        sprite.setOrigin(1.0, 1.0);

        sprite.addControl(new EnemyControl());
    }
    
    setUpEntity(sprite) {
        sprite.controls = [];
        sprite.addControl = (control) => { sprite.controls.push(control); }
        sprite.updateControls = () => { sprite.controls.forEach(control => control.onUpdate(sprite)); }
    }

    updateAllExists() {
        this.group.children.iterate(function (sprite) {
            if (sprite)
                sprite.updateControls();
        })
    }

    destroyAllExists() {
        this.group.children.iterate(function (sprite) {
            sprite.destroy();
        })
    }
}

class EnemyControl extends Control {

    onUpdate(sprite) {
        if (sprite.x + sprite.width + sprite.width >= phaser.config.width) {
            sprite.setVelocityX(-Phaser.Math.Between(35, 55));
        }
        
        if (sprite.x <= 0) {
            sprite.setVelocityX(Phaser.Math.Between(35, 55));
        }
        
        if (sprite.y > phaser.config.height + 40) {
            sprite.destroy();
            world.numEnemies--;
        }
    }
}

class World {
    constructor(game) {
        /*this.bg = game.add.image(0, 0, 'background_img');
        this.bg.setOrigin(0, 0);*/

        this.player = new Player();
        this.player.onDeath(gameOver);

        this.bulletFactory = new EntityFactory('bullet_img');
        this.enemyFactory = new EntityFactory('enemy_sp');
        
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

        this.enemyFactory.updateAllExists();
    }

    cleanup() {
        this.enemyFactory.destroyAllExists();
        this.bulletFactory.destroyAllExists();
    }
}
