export default class LoginManager {
    isLogged = false;
    pastelColors = ["#FF6B6B", "#FFE66D", "#8EE4AF", "#50A7C2", "#A8D0E6", "#FFA69E", "#FF686B", "#FFD868", "#8EE4AF", "#50A7C2", "#A8D0E6", "#FFA69E"];

    get key() {
        if(localStorage.getItem("key")) {
            return localStorage.getItem("key");
        }

        var key = this.keyGenerator.get(32);
        localStorage.setItem("key", key);
        return key;
    }

    user = null;

    get savedUser() {
        if(this.storage.getItem("user")) {
            try {
                return JSON.parse(this.storage.getItem("user"));
            } catch {
                return null;
            }
        }
        return null;
    }

    constructor(remoteServer, keyGenerator) {
        this.remoteServer = remoteServer;
        this.keyGenerator = keyGenerator;
        this.storage = window.localStorage;
        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.remoteServer.on("who are you", () => {
            if(this.savedUser) 
                this.login(this.savedUser);
        });

        this.remoteServer.on("login success", (user) => {
            this.isLogged = true;
            this.user = user;
        });
    }

    login(userData) {
        userData.key = this.key;
        userData.color = this.pastelColors[Math.floor(Math.random() * this.pastelColors.length)];
        this.storage.setItem("user", JSON.stringify(userData));
        this.remoteServer.emit("login", userData);
        this.user = userData;
    }

    async waitForLogin() {
        if(this.isLogged) return;
        if(!this.savedUser) throw new Error("No user saved.");
        var maxWait = 3000;
        await new Promise((resolve, reject) => {
            var interval = setInterval(() => {
                if(this.isLogged) {
                    clearInterval(interval);
                    resolve();
                }
                maxWait -= 100;
                if(maxWait <= 0) {
                    clearInterval(interval);
                    reject();
                }
            }, 100);
        });
    }

    clear() {
        this.storage.removeItem("user");
        this.isLogged = false;
    }
}