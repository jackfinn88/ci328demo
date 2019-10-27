class Audio {
    constructor() {
        this.intro = game.sound.add('intro');
        //this.intro.play();
        this.bg = game.sound.add('bg', true);
        //this.bg.play();
        this.explode = game.sound.add('explode');
        this.fly = game.sound.add('fly');
        this.shoot = game.sound.add('shoot');
    }
}

class Input {
    constructor() {
        this.keyMap = new Map();
    }

    add(key, action) {
        this.keyMap.set(game.input.keyboard.addKey(key), action);
    }

    update() {
        for (const [key, action] of this.keyMap.entries()) {
            if (key.isDown) {
                action();
            }
        }
    }
}

class UI {
    constructor() {
        this.startGameText = game.add.text(phaser.config.width / 2, phaser.config.height / 2, 'Click to Start', {
            font: '30px Arial',
            fill: '#fff'
        });
        this.startGameText.setOrigin(0.5, 0.5);

        this.scoreText = game.add.text(10, 10, 'Score: 0', {
            font: '34px Arial',
            fill: '#fff'
        });

        this.scoreText.setScrollFactor(0);
    }

    updateScoreText(newScore) {
        this.scoreText.setText('Score: ' + newScore);
    }

    showStartText() {
        this.startGameText.visible = true;
    }

    disableStartText() {
        this.startGameText.visible = false;
    }
}
