import DataStorage from "./helpers/DataStorage.mjs";
import Logger from "./helpers/Logger.mjs";
import ServerFactory from "./helpers/ServerFactory.mjs"
import NameGenerator from "./helpers/NameGenerator.mjs";

var server = ServerFactory.get(4550);
var dataStorage = new DataStorage("data.stg");
var nameGenerator = new NameGenerator();
var logger = new Logger();
var rooms = [];
var users = [];
var savedData = dataStorage.load();


if(savedData) {
    rooms = savedData.rooms || rooms;
    users = savedData.users || users;
}

setInterval(() => {
    dataStorage.save({rooms, users});
}, 500);

function applyVisibilityFilters(room) {
    if(room.userVisibility != "private") {
        return room;
    }

    var copy = JSON.parse(JSON.stringify(room));
    copy.users.forEach(user => {
        if(user.name) { 
            user.name = user.concealedName || "-";
        }
    });
    return copy;
}

server.on("connection", (socket) => {
    socket.emit("who are you");
    logger.logInformation("User connected. " + socket.id);
    socket.on("login", (data) => {
        if(!data?.key || data.key.length != 32) {
            socket.emit("error", "Key invalid.");
            socket.emit("login error");
            return;
        }

        var ownedRooms = rooms.filter(x => x.key == data.key);
        ownedRooms.forEach(room => {
            room.owner = socket.id;
        });

        var user = users.find(user => user.key == data.key);
        if(!user) {
            user = {};
            users.push(user);
        }

        user.id = socket.id;
        user.key = data.key;
        user.name = data.name;
        user.concealedName = nameGenerator.get();
        user.color = data.color;
        socket.emit("login success", user);
        logger.logInformation("User " + user.name + " logged in.");
    });

    socket.on("join room", (data) => {
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            socket.emit("error", "User not found.");
            socket.emit("room join error");
            return;
        }

        var room = rooms.find(room => room.name == data.name);
        if (!room) {
            socket.emit("error", "Room not found.");
            socket.emit("room join error");
            return;
        }

        var isOnRoom = room.users.find(x => x.id == user.id);
        if(isOnRoom) {
            return;
        }

        if(user.room) {
            socket.leave(user.room);
            var oldRoom = rooms.find(room => room.name == user.room);
            if(oldRoom) {
                oldRoom.userCount = users.filter(user => user.room == oldRoom?.name).length;
                server.to(oldRoom.name).emit("room", applyVisibilityFilters(oldRoom));
            }
        }

        var existOnRoom = room.users.find(x => x.key == user.key);
        if(existOnRoom) {
            room.users = room.users.filter(x => x.key != user.key);
        }

        user.room = data.name;
        room.users.push(user);
        socket.join(user.room);
        logger.logInformation("User " + user.name + " joined the room " + room.name + ".");
        server.to(user.room).emit("room", applyVisibilityFilters(room));
    })

    socket.on("board element", (element) => {
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            socket.emit("error", "User not found.");
            return;
        }

        var room = rooms.find(room => room.name == user.room);
        if (!room) {
            socket.emit("error", "Room not found.");
            return;
        }
        
        element.updateUser = user.key;
        var existing = room.components.find(x => x.id == element.id);
        if(existing) {
            if(existing.updateUser == element.updateUser && existing.time == element.time) {
                return;
            }
            
            Object.assign(existing, element);
        } else {
            room.components.push(element);
        }

        server.to(user.room).emit("board element", element);
    })


    socket.on("remove element", (element) => {
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            socket.emit("error", "User not found.");
            return;
        }

        var room = rooms.find(room => room.name == user.room);
        if (!room) {
            socket.emit("error", "Room not found.");
            return;
        }
        
        var existing = room.components.find(x => x.id == element.id);
        if(existing) {
            room.components = room.components.filter(x => x.id != element.id);
        } 
        logger.logInformation("User " + user.name + " removed an element from the room " + room.name + ".");
        server.to(user.room).emit("remove element", element);
    })

    
    socket.on("cursor", (position) => {
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            socket.emit("error", "User not found.");
            return;
        }

        var room = rooms.find(room => room.name == user.room);
        if (!room) {
            socket.emit("error", "Room not found.");
            return;
        }

        user.cursor = position;
        var filteredRoom = applyVisibilityFilters(room);
        server.to(user.room).emit("users", filteredRoom.users);
    })


    socket.on("room", (data) => {  
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            socket.emit("error", "User not found.");
            return;
        }

        if(!data.name) 
        {
            socket.emit("error", "Room name is required.");
            return;
        }

        var room = rooms.find(room => room.name == data.name);
        if (!room) {
            var room = Object.assign(data, {
                key: user.key,
                owner: socket.id,
                users: [user],
                components: []
            });
            rooms.push(room);
            logger.logInformation("Room " + room.name + " was created by " + user.name + ".");
            socket.join(room.name);
            user.room = room.name;
        }
        
        if (room.owner != socket.id) {
            socket.emit("error", "You're not the owner of the room.");
            return;
        }
        user.room = room.name;
        socket.join(user.room);
        logger.logInformation("Room " + room.name + " was updated by " + user.name + ".");
        server.to(room.name).emit("room", applyVisibilityFilters(room));
    });

    socket.on("disconnect", () => {
        var user = users.find(user => user.id == socket.id);
        if (!user) {
            return;
        }

        users = users.filter(user => user.id != socket.id);
        var room = rooms.find(room => room.name == user.room);
        if (!room) {
            return;
        }
        
        logger.logInformation("User " + user.name + " left the room " + room.name + ".");
        room.users = room.users.filter(user => user.id != socket.id);

        server.to(user.room).emit("room", room);
        if (room.owner == socket.id) {
            setTimeout(() => {
                var ownerInRoom = users.find(x => x.key == room.key);
                if (ownerInRoom) {
                    return;
                }

                rooms.splice(rooms.indexOf(room), 1);
                server.to(user.room).emit("room", room);
                logger.logInformation("Room " + room.name + " was deleted because the owner left.");
            }, 30 * 60 * 1000);
        }
    });
})