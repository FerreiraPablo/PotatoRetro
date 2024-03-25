export default class Home {
    get roomInformation() {
        const data = new FormData(this.form);
        return Object.fromEntries(data.entries());
    }

    constructor(container, remoteServer, loginManager, roomManager) {        
        this.remoteServer = remoteServer;
        this.loginManager = loginManager;
        this.roomManager = roomManager;
        this.form = container.querySelector("form");
        this.init();
    }

    async init() {
        await this.loginManager.waitForLogin();
        if(!this.loginManager.isLogged) {
            location.replace("#login");
            return;
        }

        if(this.roomManager.hasJoinedRoom && this.roomManager.room?.id) {
            location.replace("#board?roomId=" + this.roomManager.room.id);
            return;
        }

        this.form.hidden = false;
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.createRoom(this.roomInformation);
        });
    }

    createRoom(roomData) {
        var roomName = this.roomManager.createRoom(roomData);
        location.replace("#board?name=" + roomName);
    }
}