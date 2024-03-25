export default class RoomManager {
    room = null;
    hasError = false;
    
    get hasJoinedRoom() {
        return this.room?.name;
    }

    get roomName() {
        if(this.room?.name) {
            return this.room?.name;
        }

        return this.keyGenerator.get(6);
    }

    constructor(remoteServer, keyGenerator) {
        this.remoteServer = remoteServer;
        this.keyGenerator = keyGenerator;
        this.init();
    }

    init() {
        this.addListeners();
    }
    
    addListeners() {
        this.remoteServer.on("room", (room) => {
            this.room = room;
        });

        this.remoteServer.on("login success", () => {
            if(!this.hasJoinedRoom) return;

            this.remoteServer.emit("join room", this.room)
        });

        this.remoteServer.on("room join error", () => {
            this.room = null;
            this.hasError = true;
        });
    }

    createRoom(roomData) {
        roomData.name = this.roomName;
        this.remoteServer.emit("room", roomData)
        return roomData.name;
    }

    joinRoom(roomData) {
        this.remoteServer.emit("join room", roomData);
    }

    async waitForRoom() {
        if(this.hasJoinedRoom) return;

        var maxWait = 3000;
        await new Promise((resolve, reject) => {
            var interval = setInterval(() => {
                if(this.hasJoinedRoom) {
                    clearInterval(interval);
                    resolve();
                }
                maxWait -= 100;
                if(maxWait <= 0 || this.hasError) {
                    this.hasError = false;
                    clearInterval(interval);
                    reject();
                }
            }, 100);
        });
    }
}