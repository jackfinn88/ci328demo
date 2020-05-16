
var weaponKeys;
var gridEl, levelEl, moneyEl;
var equipped;
var inputGroup = [];
var purchaseWeaponGroup = [];
var purchaseAmmoGroup = [];

function initializeInventory() {
    user = JSON.parse(localStorage.getItem('user'));
    accounts = JSON.parse(localStorage.getItem('accounts'));
    account = JSON.parse(localStorage.getItem('account'));
    weapons = user["weapons"];
    weaponKeys = Object.keys(weapons);

    createList();
    loadResources();
    updateDetails();
}

// debug
function updateLevel(event) {
    var level = parseInt(event.target.previousSibling.value, 10);
    if (level >= 0) {
        user["player_level"] = level;
        levelEl.textContent = user["player_level"];

        purchaseWeaponGroup.forEach((button, idx) => {
            if (!weapons[weaponKeys[idx]].purchased) {
                if (user["player_level"] >= parseInt(weapons[weaponKeys[idx]].unlocksAt, 10)) {
                    button.textContent = 'Buy for $' + weapons[weaponKeys[idx]].price;
                    if (user["money"] >= weapons[weaponKeys[idx]].price) {
                        button.removeAttribute('disabled');
                    }
                } else {
                    button.textContent = 'Unlocks level ' + weapons[weaponKeys[idx]].unlocksAt;
                    button.setAttribute('disabled', true);
                }
            }
        });

        // update save data
        var idx = accounts.findIndex(account => account.id === user.id);
        accounts[idx] = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accounts', JSON.stringify(accounts));

        updateRecord();

        updateDetails();
    }
}

// debug
function updateMoney(event) {
    var money = parseInt(event.target.previousSibling.value, 10);
    if (money >= 0) {
        user["money"] = money;
        moneyEl.textContent = user["money"];

        purchaseWeaponGroup.forEach((button, idx) => {
            if (!weapons[weaponKeys[idx]].purchased) {
                if (user["player_level"] >= parseInt(weapons[weaponKeys[idx]].unlocksAt, 10)) {
                    if (user["money"] >= weapons[weaponKeys[idx]].price) {
                        button.removeAttribute('disabled');
                    } else {
                        button.setAttribute('disabled', true);
                    }
                }
            }
        });
        purchaseAmmoGroup.forEach((button, idx) => {
            if (weapons[weaponKeys[idx]].purchased) {
                if (user["money"] >= weapons[weaponKeys[idx]].ammoPrice && weapons[weaponKeys[idx]].currentAmmo >= 0) {
                    button.removeAttribute('disabled');
                } else {
                    button.setAttribute('disabled', true);
                }
            }
        });

        // update save data
        var idx = accounts.findIndex(account => account.id === user.id);
        accounts[idx] = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accounts', JSON.stringify(accounts));

        updateRecord();

        updateDetails();
    }
}

function loadResources() {
    levelEl = document.querySelector('#level');
    moneyEl = document.querySelector('#money');

    levelEl.textContent = user["player_level"];
    moneyEl.textContent = user["money"];
}

function createList() {
    gridEl = document.querySelector('#grid-container');

    // remove previous elements - clean slate
    var gridItems = Array.from(gridEl.querySelectorAll('.grid'));
    gridItems.forEach((item) => {
        if (item.classList.contains('grid')) {
            item.remove();
        }
    });

    // base href for display images
    var baseHref = 'assets/weapons/display/';
    // grid elements
    var divGrid, divImage, divInfo, divAction;
    var pName, pFireRate, pDamage, pClipSize, inputEquipped, labelEquipped, buttonWeapon, pAmmo, buttonAmmo;
    var divFireRateOuter, divFireRateInner, divDamageOuter, divDamageInner;

    // create grid item for each weapon - append to container
    weaponKeys.forEach((weapon, idx) => {
        divGrid = document.createElement('div');
        divImage = document.createElement('div');
        divInfo = document.createElement('div');
        divAction = document.createElement('div');

        // create display image
        image = document.createElement('img');
        href = baseHref + weapon + '.png';
        image.setAttribute('src', href);
        divImage.appendChild(image);

        // create grid
        divGrid.setAttribute('class', 'grid');
        // use modulo to target every n1, n2, n3 elements for 3 columns
        var remainder = idx % 3;
        if (remainder === 2) {
            divGrid.classList.add("column3");
        } else if (remainder == 1) {
            divGrid.classList.add("column2");
        } else {
            divGrid.classList.add("column1");
        }
        divImage.setAttribute('class', 'image');
        divInfo.setAttribute('class', 'weapon-info');
        divAction.setAttribute('class', 'action');

        // create weapon detail elements
        pName = document.createElement('p');
        spanName = document.createElement('span');
        spanName.setAttribute('class', 'span-weapon-name');
        pFireRate = document.createElement('p');
        pDamage = document.createElement('p');
        pClipSize = document.createElement('p');
        inputEquipped = document.createElement('input');
        labelEquipped = document.createElement('label');
        buttonWeapon = document.createElement('button');
        pAmmo = document.createElement('p');
        buttonAmmo = document.createElement('button');

        // create bars for fire rate & damage
        divFireRateOuter = document.createElement('div');
        divFireRateInner = document.createElement('div');
        divDamageOuter = document.createElement('div');
        divDamageInner = document.createElement('div');
        divFireRateOuter.setAttribute('class', 'progress-outer');
        divFireRateInner.style.setProperty('width', ((50 - weapons[weapon].fireRate) / 100) * 100 + '%');
        divFireRateOuter.appendChild(divFireRateInner);
        divDamageOuter.setAttribute('class', 'progress-outer');
        divDamageInner.style.setProperty('width', (weapons[weapon].damage / 100) * 100 + '%');
        divDamageOuter.appendChild(divDamageInner);

        // determine purchase weapon button state
        if (weapons[weapon].purchased) {
            buttonWeapon.textContent = 'Owned';
        } else if (user["player_level"] < weapons[weapon].unlocksAt) {
            buttonWeapon.textContent = 'Unlocks level ' + weapons[weapon].unlocksAt;
        } else {
            buttonWeapon.textContent = 'Buy for $' + weapons[weapon].price;
            buttonAmmo.setAttribute('disabled', true);
        }
        if (user["player_level"] < weapons[weapon].unlocksAt || weapons[weapon].purchased || user["money"] < weapons[weapon].price) {
            buttonWeapon.setAttribute('disabled', true);
        }
        buttonWeapon.name = weapon;
        buttonWeapon.addEventListener('click', function (event) {
            purchaseWeapon(event);
        });

        // determine purchase ammo button state
        // pAmmo.textContent = 'Current Ammo: ' + weapons[weapon].clipSize + '/' + weapons[weapon].currentAmmo;
        var currentClip = weapons[weapon].currentAmmo >= weapons[weapon].clipSize ? weapons[weapon].clipSize : weapons[weapon].currentAmmo;
        var currentAmmo = weapons[weapon].currentAmmo - currentClip;
        pAmmo.textContent = 'Current Ammo: ' + currentClip + '/' + currentAmmo;
        buttonAmmo.textContent = 'Buy Ammo for $' + weapons[weapon].ammoPrice;
        buttonAmmo.addEventListener('click', function (event) {
            purchaseAmmo(event);
        });
        if (!weapons[weapon].purchased) {
            buttonAmmo.setAttribute('disabled', true);
        }
        buttonAmmo.name = weapon;

        // define equip weapon input
        inputEquipped.setAttribute('type', 'radio');
        inputEquipped.setAttribute('class', 'equip-input');
        inputEquipped.setAttribute('name', 'equipped');
        inputEquipped.setAttribute('id', weapon);
        labelEquipped.setAttribute('for', weapon);
        if (weapon == user.equipped) {
            inputEquipped.setAttribute('checked', true);
        }
        if (!weapons[weapon].purchased || user["player_level"] < weapons[weapon].unlocksAt) {
            inputEquipped.setAttribute('disabled', true);
        }
        inputEquipped.addEventListener('change', function (event) {
            updateWeaponList(event);
        });

        // define weapon details
        // pName.textContent = 'Name: ' + weapons[weapon].displayName;
        pName.textContent = 'Name: ';
        spanName.textContent = weapons[weapon].displayName;
        pFireRate.textContent = 'Fire rate:';
        pDamage.textContent = 'Damage:';
        pClipSize.textContent = 'Clip-size: ' + weapons[weapon].clipSize;
        labelEquipped.textContent = 'Equipped:';
        inputEquipped.value = weapon;

        // append deatils to info
        pName.appendChild(spanName);
        divInfo.appendChild(pName);
        divInfo.appendChild(pFireRate);
        divInfo.appendChild(divFireRateOuter);
        divInfo.appendChild(pDamage);
        divInfo.appendChild(divDamageOuter);
        divInfo.appendChild(pClipSize);

        // append buttons to action
        divAction.appendChild(buttonWeapon);
        divAction.appendChild(labelEquipped);
        divAction.appendChild(inputEquipped);
        divAction.appendChild(pAmmo);
        divAction.appendChild(buttonAmmo);

        // append elements to grid item
        divGrid.appendChild(divImage);
        divGrid.appendChild(divInfo);
        divGrid.appendChild(divAction);

        gridEl.appendChild(divGrid);

        // store buttons for iteration
        inputGroup.push(inputEquipped);
        purchaseWeaponGroup.push(buttonWeapon);
        purchaseAmmoGroup.push(buttonAmmo);
    });
}

function purchaseAmmo(event) {
    var weapon = event.target.name;
    if (user["money"] >= weapons[weapon].ammoPrice) {
        weapons[weapon].currentAmmo += weapons[weapon].clipSize;
        user["money"] -= weapons[weapon].ammoPrice;
        moneyEl.textContent = user["money"];
        // event.target.previousSibling.textContent = 'Current Ammo: ' + weapons[weapon].clipSize + '/' + weapons[weapon].currentAmmo;
        var currentClip = weapons[weapon].currentAmmo >= weapons[weapon].clipSize ? weapons[weapon].clipSize : weapons[weapon].currentAmmo;
        var currentAmmo = weapons[weapon].currentAmmo - currentClip;
        event.target.previousSibling.textContent = 'Current Ammo: ' + currentClip + '/' + currentAmmo;

        // update save data
        var idx = accounts.findIndex(account => account.id === user.id);
        user["weapons"] = weapons;
        accounts[idx] = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accounts', JSON.stringify(accounts));

        updateRecord();


        purchaseAmmoGroup.forEach((button, idx) => {
            if (!button.getAttribute('disabled')) {
                if (user["money"] < weapons[weapon].ammoPrice) {
                    button.setAttribute('disabled', true);
                }
            }
        });

        updateDetails();
    }
}

function purchaseWeapon(event) {
    var weapon = event.target.name;
    if (user["money"] >= weapons[weapon].price) {
        weapons[weapon].purchased = true;
        user["money"] -= weapons[weapon].price;
        moneyEl.textContent = user["money"];
        event.target.setAttribute('disabled', true);
        event.target.textContent = 'Owned';

        // update save data
        var idx = accounts.findIndex(account => account.id === user.id);
        user["weapons"] = weapons;
        accounts[idx] = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accounts', JSON.stringify(accounts));

        updateRecord();

        inputGroup.forEach((input, idx) => {
            if (input.getAttribute('value') == weapon) {
                input.removeAttribute('disabled');
            }
        });
        purchaseWeaponGroup.forEach((button, idx) => {
            if (!button.getAttribute('disabled')) {
                if (user["player_level"] < parseInt(weapons[weapon].unlocksAt, 10) || user["money"] < weapons[weapon].price) {
                    button.setAttribute('disabled', true);
                }
            }

            if (user["money"] >= weapons[weapon].ammoPrice && weapon === purchaseAmmoGroup[idx].name) {
                purchaseAmmoGroup[idx].removeAttribute('disabled');
            }
        });

        updateDetails();
    }
}

function updateDetails() {
    user = JSON.parse(localStorage.getItem('user'));
    var details = document.querySelectorAll('.details');
    details.forEach((detail) => {
        detail.textContent = user[detail.id];

        if (detail.id === "player_next_level") {
            detail.textContent = user["exp"] + '/' + user["player_next_level"];
        }
    })
}

function updateWeaponList(event) {
    weaponKeys.forEach((weapon) => {
        if (weapons[weapon].equipped) {
            weapons[weapon].equipped = false;
        }
    })
    weapons[event.target.value].equipped = true;

    user["equipped"] = event.target.value;

    // update save data
    var idx = accounts.findIndex(account => account.id === user.id);
    accounts[idx] = user;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accounts', JSON.stringify(accounts));

    updateRecord();
}

function getJSON(path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
}