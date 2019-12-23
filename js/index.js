function init() {
    // Feature detect + local reference
    var storage;
    var fail;
    var uid;
    try {
        uid = new Date;
        (storage = window.localStorage).setItem(uid, uid);
        fail = storage.getItem(uid) != uid;
        storage.removeItem(uid);
        fail && (storage = false);
    } catch (exception) { }
    if (storage) {
        // Use `storage` here, e.g.
        if (storage.getItem('user')) {
            console.log('user detected');
        } else {
            console.log('user not detected');
            storage.setItem('user', JSON.stringify({ "equipped": "pistol", "money": 0, "exp": 0, "player_level": 0 }));
        }
    }
}