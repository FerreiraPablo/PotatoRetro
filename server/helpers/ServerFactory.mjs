import fs from 'fs';
import https from 'https';
import { Server } from "socket.io";

export default class ServerFactory {
    static get(port) {
        var server = https.createServer({
            key:  fs.readFileSync('/etc/letsencrypt/live/ferreirapablo.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/ferreirapablo.com/fullchain.pem'),
        });
        
        var io = new Server(server, {
            cors: {
                origin: '*',
                credentials: false
            },
        });
        server.listen(port);
        return io;
    }
}