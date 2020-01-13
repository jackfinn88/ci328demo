var debug;
var user;
var weapons;
var media;
var level;
var levelsData;

function init() {
    user = localStorage.getItem('user');
    weapons = localStorage.getItem('weapons');
    if (!user) {
        // create new user
        localStorage.setItem('user', JSON.stringify({ "equipped": "pistol", "money": 500, "exp": 0, "total-exp": 0, "player_level": 1, "player_next_level": 2000, "game_level": 01, "sfx": 10, "music": 10, "difficulty": 2 }));
        getJSON('assets/weapons/weapon_list.json', (response) => {
            weapons = JSON.parse(response);
            localStorage.setItem('weapons', JSON.stringify(weapons));
            init();
        });
        return;
    } else {
        user = JSON.parse(user);
        weapons = JSON.parse(weapons);
    }

    getJSON('assets/media_list.json', (response) => {
        media = JSON.parse(response);
    });

    getJSON('assets/levels/level_data.json', (response) => {
        levelsData = JSON.parse(response);
        Object.keys(levelsData).forEach((key) => {
            if (levelsData[key].id == user["game_level"]) {
                level = levelsData[key];
            }
        })
    });

    var urlParams = new URLSearchParams(window.location.search);
    debug = urlParams.has('debug');
    document.querySelector('#resources').style.display = debug ? 'block' : 'none';
}

function changeToTab(nextTab) {
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        var currentDisplayStyle = window.getComputedStyle(tab).getPropertyValue('display');
        if (currentDisplayStyle === 'block') {
            tab.style.setProperty('display', 'none');
        } else if (nextTab + '-tab' === (tab.getAttribute('id'))) {
            tab.style.display = 'block';
        }
    });
}

function loadLevel(levelSelected) {
    var user = JSON.parse(localStorage.getItem('user'));
    user["game_level"] = levelSelected;
    localStorage.setItem('user', JSON.stringify(user));

    level = levelsData[levelSelected];

    main();
    changeToTab('game');
}

function onLevelClick() {
    initializeLevelSelect();
    changeToTab('level')
}

function onInventoryClick() {
    initializeInventory();
    changeToTab('inventory')
}

function onSettingsClick() {
    updateSettings();
    changeToTab('settings');
}

function updateSettings() {
    var user = JSON.parse(localStorage.getItem('user'));
    var options = document.querySelector('#settings-tab').querySelectorAll('.option');
    options.forEach((option) => {
        if (option.name === 'difficulty') {
            var inputs = option.querySelectorAll('input[name="' + option.name + '"]');
            inputs.forEach((input) => {
                if (input.value == user["difficulty"]) {
                    input.checked = true;
                }
            });
        } else {
            option.querySelector('input[name="' + option.name + '"]').value = user[option.name];
        }
    });
}

function saveSettings(element) {
    element.setAttribute('disabled', true);
    element.textContent = 'SAVING';
    user = JSON.parse(localStorage.getItem('user'));
    var options = element.parentElement.parentElement.querySelectorAll('.option');
    options.forEach((option) => {
        if (option.name === 'difficulty') {
            user["difficulty"] = parseInt(option.querySelector('input[name="' + option.name + '"]:checked').value, 10);
        } else {
            user[option.name] = parseInt(option.querySelector('input[name="' + option.name + '"]').value, 10);
        }
    });
    localStorage.setItem('user', JSON.stringify(user));

    setTimeout(() => {
        element.removeAttribute('disabled');
        element.textContent = 'SAVE';
    }, 1000);
}

function initializeLevelSelect() {
    var buttons = document.querySelector('.level-buttons').querySelectorAll('button');
    buttons.forEach((button, idx) => {
        if (user["player_level"] >= (idx + 1)) {
            button.textContent = 'LEVEL ' + (idx + 1);
            button.removeAttribute('disabled');
        } else {
            button.textContent = 'LOCKED';
            button.setAttribute('disabled', true);
        }
    })
}

function getJSON(path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == "200") {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
}