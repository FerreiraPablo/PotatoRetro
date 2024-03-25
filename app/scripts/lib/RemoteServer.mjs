import io from '../../node_modules/socket.io-client/dist/socket.io.esm.min.js';

export default class RemoteServer {
    latency = 0;
    get id() {
        return this.server?.id;
    }

    constructor(host, port) {
        this.server = io.connect(`https://${host}:${port}`, {
            port: port,
            secure: true,
            withCredentials: false,
            reconnection: true
        });
    }

    emit(... args) {
        if(this.debug) {
            console.log(args);
        }
        this.server.emit.apply(this.server, args);
    }

    on(eventName, callback) {
        this.server.on(eventName, (... args) => {
            if(this.debug) {
                console.log(eventName, args);
            }
            callback?.apply(this, args);
        });
    }
}