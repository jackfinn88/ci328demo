var debug;
var user;
var weapons;
var media;
var level;
var levelsData;
var loginForm;
var registerForm;
var errorUI;
var account;
var accounts;
var PHP_API_SERVER = 'https://jlf40.brighton.domains/ci301/app/api';

function init() {
    // check storage
    accounts = JSON.parse(localStorage.getItem('accounts'));
    if (!accounts) accounts = []; localStorage.setItem('accounts', JSON.stringify(accounts));
    account = JSON.parse(localStorage.getItem('account'));

    user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        updateDetails();
        getDataSources();
        changeToTab('main');
    }

    getForms();
}

function getForms() {
    loginForm = document.querySelector('#login-tab > div > div > form');
    registerForm = document.querySelector('#register-tab > div > div > form');
    errorUI = document.querySelector('#error');

    // add submit handlers
    loginForm.addEventListener('submit', function (e) { e.preventDefault(); submitLogin(e); });
    registerForm.addEventListener('submit', function (e) { e.preventDefault(); submitRegister(e); });
}

function submitLogin(event) {
    var form = event.target;

    // get inputs
    var user = form.elements["user"].value;
    var pass = form.elements["pass"].value;

    // clear inputs
    form.elements["user"].value = '';
    form.elements["pass"].value = '';

    // check validity
    if (!user) return displayError('noUser');
    if (!pass) return displayError('noPass');
    if (user.length < 6 || user.length > 16) return displayError('length');
    if (pass.length < 6 || pass.length > 16) return displayError('length');

    // proceed with valid data
    var record = {
        "user": user,
        "pass": pass,
    }
    postJSON(PHP_API_SERVER + '/read.php', function (r) { onVerifyUser(r); }, JSON.stringify(record));
}

function displayError(error) {
    // only show error if element is available
    if (errorUI.classList.contains('show')) return;

    switch (error) {
        case 'noUser': errorUI.textContent = 'No username found';
            break;
        case 'noPass': errorUI.textContent = 'No password found';
            break;
        case 'length': errorUI.textContent = 'Values must be between 6 and 16 characters';
            break;
        case 'confirm': errorUI.textContent = 'Passwords do not match';
            break;
        case 'verify': errorUI.textContent = 'Account not verified, try again';
            break;
        case 'update': errorUI.textContent = 'An update error occured, check connection';
            break;

        default: errorUI.textContent = 'An error has occured';
            break;
    }

    // show error message for limited time
    errorUI.classList.add('show');
    setTimeout(() => {
        errorUI.classList.remove('show');
        errorUI.textContent = '';
    }, 2500);
}

function submitRegister(event) {
    var form = event.target;
    // get inputs
    var user = form.elements["user"].value;
    var pass = form.elements["pass"].value;
    var confirm = form.elements["confirm"].value;

    // clear inputs
    form.elements["user"].value = '';
    form.elements["pass"].value = '';
    form.elements["confirm"].value = '';

    // check validity
    if (!user) return displayError('noUser');
    if (!pass) return displayError('noPass');
    if (user.length < 6 || user.length > 16) return displayError('length');
    if (pass.length < 6 || pass.length > 16) return displayError('length');
    if (user.confirm < 6 || user.confirm > 16) return displayError('length');

    // check passwords match
    if (pass !== confirm) return displayError('confirm');

    // proceed with valid data
    var record = {
        "user": user,
        "pass": pass,
        "ph_cash": 0,
        "ph_exp": 0,
        "ph_total_exp": 0,
        "ph_level": 1,
        "ph_completed": 0,
        "ph_failed": 0,
        "ph_game01_upgrade01_level": 0,
        "ph_game01_upgrade02_level": 0,
        "ph_game02_upgrade01_level": 0,
        "ph_game02_upgrade02_level": 0,
        "ph_game01_upgrade01_active": false,
        "ph_game01_upgrade02_active": false,
        "ph_game02_upgrade01_active": false,
        "ph_game02_upgrade02_active": false,
        "ph_game01_dual": false,
        "ph_game02_dual": false,
        "lto_equipped": "pistol",
        "lto_cash": 500,
        "lto_exp": 0,
        "lto_total_exp": 0,
        "lto_player_level": 1,
        "lto_player_next_level": 2000,
        "lto_game_level": 1,
        "lto_sfx": 5,
        "lto_music": 5,
        "lto_difficulty": 2
    }
    postJSON(PHP_API_SERVER + '/create.php', function (r) { onVerifyUser(r); }, JSON.stringify(record));
}

function onVerifyUser(response) {
    var dbAccount = JSON.parse(response);
    account = dbAccount;
    // store user
    if (dbAccount === null) {
        // show error
        displayError('verify');
    } else {
        // check if user account already exists on device storage
        localStorage.setItem('account', response);
        var idx = accounts.findIndex(account => account.id === dbAccount.id);
        var userAccount = {
            "user": dbAccount.user,
            "id": dbAccount.id,
            "equipped": dbAccount.lto_equipped,
            "money": dbAccount.lto_cash,
            "exp": dbAccount.lto_exp,
            "total-exp": dbAccount.lto_total_exp,
            "player_level": dbAccount.lto_player_level,
            "player_next_level": dbAccount.lto_player_next_level,
            "game_level": dbAccount.lto_game_level,
            "sfx": dbAccount.lto_sfx,
            "music": dbAccount.lto_music,
            "difficulty": dbAccount.lto_difficulty
        };
        if (idx > -1) {
            // account exists on device, use weapon data
            userAccount["weapons"] = accounts[idx]["weapons"];

            // update save data
            user = userAccount;
            accounts[idx] = userAccount;

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accounts', JSON.stringify(accounts));

            updateDetails();
            getDataSources();
            changeToTab('main');
        } else {
            // user exists but no account on device, so store
            getJSON('assets/weapons/weapon_list.json', (response) => {
                weapons = JSON.parse(response);
                userAccount["weapons"] = weapons;
                user = userAccount;
                accounts.push(userAccount);

                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('accounts', JSON.stringify(accounts));

                updateDetails();
                getDataSources();
                changeToTab('main');
            });
        }
    }
}

function onLogoutClick() {
    user = null;
    account = null;
    localStorage.removeItem('user');
    localStorage.removeItem('account');

    setTimeout(() => {
        changeToTab('login');
    }, 800);
}

function onDeleteClick() {
    let header = 'Delete Account';
    let message = 'Are you sure you want to delete your account?\nNote: This will also invalidate your account for use in PortHub.';

    var confirmDelete = confirm(header + '\n' + message);
    if (confirmDelete == true) {
        this.deleteAccount();
    }
}

function deleteAccount() {
    postJSON(PHP_API_SERVER + `/delete.php/?id=${user.id}`, function () { removeDeviceAccount(); }, null);
}

function removeDeviceAccount() {
    // remove from device accounts
    var idx = accounts.findIndex(account => account.id === user.id);
    accounts.splice(idx, 1);
    localStorage.setItem('accounts', JSON.stringify(accounts));

    this.onLogoutClick();
}

function getDataSources() {
    getJSON('assets/media_list.json', (response) => {
        media = JSON.parse(response);
    });

    getJSON('assets/levels/level_data.json', (response) => {
        levelsData = JSON.parse(response);
        /*Object.keys(levelsData).forEach((key) => {
            if (levelsData[key].id == user["game_level"]) {
                level = levelsData[key];
            }
        });*/
    });

    var urlParams = new URLSearchParams(window.location.search);
    debug = urlParams.has('debug');
    document.querySelector('#resources').style.display = debug ? 'block' : 'none';
}

function changeToTab(nextTab) {
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        var currentDisplayStyle = window.getComputedStyle(tab).getPropertyValue('display');
        if (currentDisplayStyle === 'block' && nextTab !== tab.getAttribute('id')) {
            tab.style.setProperty('display', 'none');
        } else if (nextTab + '-tab' === (tab.getAttribute('id'))) {
            tab.style.display = 'block';
        }
    });
}

function loadLevel(levelSelected) {
    // var user = JSON.parse(localStorage.getItem('user'));
    // user["game_level"] = Math.max(user["game_level"], levelSelected);
    // localStorage.setItem('user', JSON.stringify(user));

    // updateRecord();

    // level = levelsData[levelSelected];
    level = { id: levelSelected, data: levelsData[levelSelected] };

    main();
    changeToTab('game');
}

function onHomeClick() {
    initializeLevelSelect();
    changeToTab('main')
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

    updateRecord();

    setTimeout(() => {
        element.removeAttribute('disabled');
        element.textContent = 'SAVE SETTINGS';
    }, 1000);
}

function updateRecord() {
    // update db
    var record = {
        "id": account["id"],
        "user": account["user"],
        "pass": account["pass"],
        "ph_cash": account["ph_cash"],
        "ph_exp": account["ph_exp"],
        "ph_total_exp": account["ph_total_exp"],
        "ph_level": account["ph_level"],
        "ph_completed": account["ph_completed"],
        "ph_failed": account["ph_failed"],
        "ph_game01_upgrade01_level": account["ph_game01_upgrade01_level"],
        "ph_game01_upgrade02_level": account["ph_game01_upgrade02_level"],
        "ph_game02_upgrade01_level": account["ph_game02_upgrade01_level"],
        "ph_game02_upgrade02_level": account["ph_game02_upgrade02_level"],
        "ph_game01_upgrade01_active": account["ph_game01_upgrade01_active"],
        "ph_game01_upgrade02_active": account["ph_game01_upgrade02_active"],
        "ph_game02_upgrade01_active": account["ph_game02_upgrade01_active"],
        "ph_game02_upgrade02_active": account["ph_game02_upgrade02_active"],
        "ph_game01_dual": account["ph_game01_dual"],
        "ph_game02_dual": account["ph_game02_dual"],
        "lto_equipped": user["equipped"],
        "lto_cash": user["money"],
        "lto_exp": user["exp"],
        "lto_total_exp": user["total_exp"],
        "lto_player_level": user["player_level"],
        "lto_player_next_level": user["player_next_level"],
        "lto_game_level": user["game_level"],
        "lto_sfx": user["sfx"],
        "lto_music": user["music"],
        "lto_difficulty": user["difficulty"]
    }
    putJSON(PHP_API_SERVER + '/update.php', undefined, JSON.stringify(record));
}

function initializeLevelSelect() {
    var lastUnlockedLevel = parseInt(user["game_level"], 10);
    var buttons = document.querySelector('.level-buttons').querySelectorAll('button');
    buttons.forEach((button, idx) => {
        if (lastUnlockedLevel >= (idx + 1)) {
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

function postJSON(path, callback, data) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('POST', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && (xhr.status == "200" || "201")) {
            if (callback) callback(xhr.responseText);
        } else if (xhr.status == "422") {
            displayError('update');
        }
    };
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}

function putJSON(path, callback, data) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('PUT', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && (xhr.status == "200" || "204")) {
            if (callback) callback();
        } else if (xhr.status == "422") {
            displayError('update');
        }
    };
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}