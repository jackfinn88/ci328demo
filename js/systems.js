class Audio {
    constructor() {
        // slider range is increments of 10 - normalise for Phaser
        this.volume = {
            'sfx': user["sfx"] * 0.1,
            'music': user["music"] * 0.1
        }

        this.jump = game.sound.add('jump');
        this.shoot = game.sound.add('player_shoot');
        this.reload = game.sound.add('reload');
        this.empty = game.sound.add('empty');
        this.win = game.sound.add('win');
        this.gameOver = game.sound.add('game_over');
        this.playerDeath = game.sound.add('player_death');
        this.enemyDeath = game.sound.add('enemy_death');
        this.music = game.sound.add(level.data.music, true);
        this.music.play('', { 'volume': this.volume.music });
        this.music.loop = true;
    }
}

class Input {
    constructor() {
        this.keys = {};
        this.enabled = true;
    }

    add(key, keyCode, downAction, upAction) {
        this.keys[key] = game.input.keyboard.addKey(keyCode);
        var eventString;
        if (downAction) {
            eventString = 'keydown_' + key;
            game.input.keyboard.on(eventString, function (event) {
                if (this.enabled || key == 'P') {
                    downAction();
                }
            }, this);
        }
        if (upAction) {
            eventString = 'keyup_' + key;
            game.input.keyboard.on(eventString, function (event) {
                if (this.enabled) {
                    upAction();
                }
            }, this);
        }
    }

    toggle(active) {
        this.enabled = active;
    }
}

class UI {
    textTypes = {
        SCORE: 0,
        HEALTH: 1,
        ARMOR: 2,
        CASH: 3,
        AMMO: 4,
        OBJECTIVE: 5
    };

    constructor() {
        this.scoreText = game.add.text(game.cameras.main.width - 170, 10, 'Score: 0', {
            font: '20px Arial',
            fill: '#fff'
        });
        this.cashText = game.add.text(game.cameras.main.width - 170, 36, 'Cash: £0', {
            font: '20px Arial',
            fill: '#fff'
        });
        this.healthText = game.add.text(20, 10, 'Health: 0', {
            font: '20px Arial',
            fill: '#fff'
        });
        this.armorText = game.add.text(20, 36, 'Armor: 0', {
            font: '20px Arial',
            fill: '#fff'
        });
        this.ammoText = game.add.text(20, game.cameras.main.height - 100,
            game.weapons[world.player.weapon.name].displayName +
            ':\n' +
            game.weapons[world.player.weapon.name].clipSize +
            '/' +
            game.weapons[world.player.weapon.name].currentAmmo, {
            font: '20px Arial',
            fill: '#fff'
        });
        this.objectiveText = game.add.text(20, 80, level.data.objectiveText, {
            font: '20px Arial',
            fill: '#fff',
            align: 'center'
        });
        this.infoText = game.add.text(game.cameras.main.width - 170, 80, '', {
            font: '20px Arial',
            fill: '#fff'
        });

        this.scoreText.setScrollFactor(0);
        this.healthText.setScrollFactor(0);
        this.armorText.setScrollFactor(0);
        this.cashText.setScrollFactor(0);
        this.ammoText.setScrollFactor(0);
        this.objectiveText.setScrollFactor(0);
        this.infoText.setScrollFactor(0);

        this.scoreText.setDepth(1);
        this.healthText.setDepth(1);
        this.armorText.setDepth(1);
        this.cashText.setDepth(1);
        this.ammoText.setDepth(1);
        this.objectiveText.setDepth(1);
        this.infoText.setDepth(1);

        setTimeout(() => {
            this.objectiveText.visible = false;
            this.infoText.visible = false;
        }, 3000);

        this.gameMenu = document.querySelector('#game-menu');
    }

    updateText(textType, value) {
        switch (textType) {
            case this.textTypes.SCORE:
                this.scoreText.setText('Score: ' + value);
                break;
            case this.textTypes.HEALTH:
                this.healthText.setText('Health: ' + value);
                break;
            case this.textTypes.ARMOR:
                this.armorText.setText('Armor: ' + value);
                break;
            case this.textTypes.CASH:
                this.cashText.setText('Cash: £' + value);
                break;
            case this.textTypes.AMMO:
                this.ammoText.setText(game.weapons[world.player.weapon.name].displayName + ':\n' + value);
                break;
            case this.textTypes.OBJECTIVE:
                this.objectiveText.setText(value);
                this.objectiveText.visible = true;

                setTimeout(() => {
                    this.objectiveText.visible = false;
                }, 2500);
                break;

            default:
                this.infoText.setText(value);
                this.infoText.visible = true;

                setTimeout(() => {
                    this.infoText.visible = false;
                }, 2500);
                break;
        }
    }

    toggleMenuDisplay(visible) {
        this.gameMenu.style.display = visible ? 'block' : 'none';
    }

    updateMenuDisplay(gameOver) {
        var infoEl = this.gameMenu.querySelector('.info');
        var scoreEl = this.gameMenu.querySelector('.score');
        var cashEl = this.gameMenu.querySelector('.cash');
        var buttons = this.gameMenu.querySelector('.menu').children;

        if (gameOver) {
            if (world.player.isDead) {
                // lose
                infoEl.textContent = 'Game Over!';
                scoreEl.style.display = 'none';
                cashEl.style.display = 'none';
                buttons[0].textContent = 'Restart';
                buttons[1].textContent = 'Quit';
                buttons[0].onclick = restartGame;
                buttons[1].onclick = quitGame;
            } else {
                // win
                infoEl.textContent = 'Well done!';
                scoreEl.textContent = 'XP: ' + (game.score + level.data.expReward);
                scoreEl.style.display = 'block';
                cashEl.textContent = 'Earned: £' + level.data.cashReward;
                cashEl.style.display = 'block';
                buttons[0].textContent = 'Continue';
                buttons[1].textContent = 'Retry';
                buttons[0].onclick = quitGame;
                buttons[1].onclick = restartGame;
            }
        } else {
            // pause
            infoEl.textContent = 'Paused';
            scoreEl.textContent = 'Score: ' + game.score;
            scoreEl.style.display = 'block';
            cashEl.style.display = 'none';
            buttons[0].textContent = 'Resume';
            buttons[1].textContent = 'Quit';
            buttons[0].onclick = function () { pauseGame(false) };
            buttons[1].onclick = quitGame;
        }
    }
}
