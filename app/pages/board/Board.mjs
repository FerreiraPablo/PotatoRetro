import StickyNote from "../../scripts/components/StickyNote.mjs";
import PlainText from "../../scripts/components/PlainText.mjs";
import anime from "../../node_modules/animejs/lib/anime.es.js";

export default class Board {
    boardElements = [];
    selectedElement = null;
    cursors = [];

    constructor(container, loginManager, roomManager, remoteServer, keyGenerator, routerParameters) {
        this.container = container;
        this.editingToolbar = container.querySelector(".editing-toolbar");
        this.boardArea = container.querySelector(".board-area");
        this.board = this.boardArea.querySelector(".board");
        this.loginManager = loginManager;
        this.roomManager = roomManager;
        this.remoteServer = remoteServer;
        this.routerParameters = routerParameters;
        this.keyGenerator = keyGenerator;
        this.init();
    }

    async init() {
        try {
            await this.loginManager.waitForLogin();
        } catch {
            localStorage.setItem("returnUrl", location.hash)
            location.replace("#login");
            return;
        }

        if (!this.routerParameters.get("name")) {
            location.replace("#home");
            return;
        }

        if (!this.roomManager.hasJoinedRoom) {
            await this.roomManager.joinRoom({ name: this.routerParameters.get("name") });
            try {
                await this.roomManager.waitForRoom();
            } catch {
                location.replace("#home");
                return;
            }
        }

        this.container.querySelectorAll(".board-ui").forEach(x => {
            x.hidden = false;
        })

        this.renderRoomData(this.roomManager.room);
        this.renderUsers(this.roomManager.room.users);

        this.remoteServer.on("room", (room) => {
            this.renderRoomData(room);
        });

        this.remoteServer.on("users", (users) => {
            this.renderUsers(users);
        });


        this.addZoomListeners();
        this.addToolbarListeners();
        this.addServerListeners();
        this.addUserListeners();
        this.addDragScroll();
    }

    addZoomListeners() {
        this.board.scale = 1;
        this.board.style.transform = "scale(1)";

        this.container.querySelector('[data-option="board-zoom-in"]').addEventListener("click", () => {
            this.setZoom(this.board.scale + 0.25);
        });

        this.container.querySelector('[data-option="board-zoom-out"]').addEventListener("click", () => {
            this.setZoom(this.board.scale - 0.25);
        });

        // this.container.querySelector("#resetZoom").addEventListener("click", () => {
        //     this.setZoom(1);
        // });
    }

    centerScroll() {
        var scrollElement = this.boardArea;
        var boardElement = this.board;
        scrollElement.scrollLeft = (boardElement.scrollWidth - scrollElement.clientWidth) / 2;
        scrollElement.scrollTop = (boardElement.scrollHeight - scrollElement.clientHeight) / 2;
    }

    addDragScroll() {
        var isDown = false;
        var startPosition = { x: 0, y: 0 };
        var scrollPosition = { x: 0, y: 0 };
        var scrollElement = this.boardArea;
        this.centerScroll();

        scrollElement.addEventListener('mousedown', e => {
            if(e.target != this.board) {
                return;
            }

            scrollElement.style.cursor = "grabbing";
            isDown = true;
            startPosition.y = e.pageY - scrollElement.offsetTop;
            startPosition.x = e.pageX - scrollElement.offsetLeft;
            scrollPosition.x = scrollElement.scrollLeft;
            scrollPosition.y = scrollElement.scrollTop;
        });

        scrollElement.addEventListener('mouseup', e => {
            isDown = false;
            scrollElement.style.cursor = "grab";
        })
        
        scrollElement.addEventListener('mouseleave', e => {
            isDown = false;
            scrollElement.style.cursor = "grab";
        });

        scrollElement.addEventListener('mousemove', e => {
            if (isDown) {
                e.preventDefault();
                const y = e.pageY - scrollElement.offsetTop;
                const walkY = y - startPosition.y;
                scrollElement.scrollTop = scrollPosition.y - walkY;
                const x = e.pageX - scrollElement.offsetLeft;
                const walkX = x - startPosition.x;
                scrollElement.scrollLeft = scrollPosition.x - walkX;
            }
        });
    }

    addUserListeners() {
        this.container.addEventListener("mousemove", (event) => {
            this.remoteServer.emit("cursor", {
                x: event.clientX,
                y: event.clientY
            });
        });
    }

    renderRoomData(room) {
        if (!room)
            return;

        room.components.forEach(elementData => {
            this.updateElement(elementData);
        });

        if (room.users) {
            this.renderUsers(room.users);
        }
    }

    renderUsers(users) {
        var usersElement = this.container.querySelector(".users");
        var existingElements = usersElement.querySelectorAll(".user");
        
        for(var userElement of existingElements) {
            if(!users.find(user => user.key == userElement.dataset.key)) {
                userElement.remove();
            }
        }

        for (var user of users) {
            
            if (user.cursor) {
                if (user.key != this.loginManager.key) {
                    var cursor = this.cursors.find(cursor => cursor.dataset.key == user.key);
                    if (!cursor) {
                        cursor = document.createElement("div");
                        cursor.dataset.key = user.key;
                        cursor.style.position = "absolute";
                        cursor.style.borderRadius = "0px 50px 50px 50px";
                        cursor.style.padding = "5px 10px";
                        cursor.innerText = user.name;
                        cursor.style.color = user.color;
                        cursor.style.border = "2px solid";
                        cursor.style.zIndex = 1000;
                        this.board.appendChild(cursor);
                        this.cursors.push(cursor);
                    }

                    cursor.style.left = user.cursor.x + "px";
                    cursor.style.top = user.cursor.y + "px";
                }

                var userElement = this.container.querySelector(".user[data-key='" + user.key + "']");
                if (!userElement) {
                    userElement = document.createElement("div");
                    userElement.dataset.key = user.key;
                    userElement.classList.add("user");
                    userElement.style.borderColor = user.color;
                    userElement.innerText = (user.name.match(/[A-Z]/g) || []).join('');
                    usersElement.appendChild(userElement);
                }
            }
        }

        this.update();
    }

    addServerListeners() {
        this.remoteServer.on("board element", (elementData) => {
            this.updateElement(elementData);
        });

        this.remoteServer.on("remove element", (elementData) => {
            var element = this.boardElements.find(e => e.id === elementData.id);
            if (element) {
                element.remove();
                this.boardElements = this.boardElements.filter(e => e.id !== elementData.id);
            }
        });

        this.boardArea.addEventListener("click", (e) => {
            if (e.target == this.container) {
                this.selectedElement = null;
            }
        })
    }

    async setZoom(zoom) {
        if(zoom < 0.25 || zoom > 2) { return; }

        var oldScale = this.board.scale
        this.board.scale = zoom;
        await anime({
            targets: this.board,
            scale: zoom,
            duration: 500,
            easing: 'easeInOutExpo',
            update: (anim) => {
                this.container.querySelector(".current-zoom").innerText = Math.round(anim.animations[0].currentValue * 100) + "%";
            }
        }).finished;
    }

    addToolbarListeners() {
        this.container.querySelectorAll("#elements-bar .toolbar-button").forEach(button => {
            button.addEventListener("click", () => {
                var buttonPosition = button.getBoundingClientRect();
                var offset = {
                    x: this.boardArea.scrollLeft,
                    y: this.boardArea.scrollTop
                }
                var element = this.updateElement({
                    type: button.dataset.option,
                    owner: this.loginManager.key,
                    updateUser: this.loginManager.key,
                    id: this.keyGenerator.get(64),
                    position: { x: (buttonPosition.left + offset.x + 50) + "px", y: (buttonPosition.top + offset.y) + "px" }
                });
                this.selectedElement = element;
            });
        })


        this.editingToolbar.querySelectorAll(".toolbar-button").forEach(button => {
            button.addEventListener("click", () => {
                var option = button.dataset.option;
                switch (option) {
                    case "delete":
                        this.remoteServer.emit("remove element", this.selectedElement.toJSON());
                        this.selectedElement.remove();
                        this.selectedElement = null;
                        break;
                    case "bold":
                        this.selectedElement.fontWeight = this.selectedElement.fontWeight === "bold" ? "normal" : "bold";
                        break;
                    case "italic":
                        this.selectedElement.fontStyle = this.selectedElement.fontStyle === "italic" ? "normal" : "italic";
                        break;
                    case "underline":
                        this.selectedElement.textDecoration = this.selectedElement.textDecoration === "underline" ? "none" : "underline";
                        break;
                }

                if (this.selectedElement) {
                    this.remoteServer.emit("board element", this.selectedElement.toJSON());
                }
            });
        });

        this.editingToolbar.querySelector("#fontColorPicker").addEventListener("input", (event) => {
            this.selectedElement.textColor = event.target.value;
            this.remoteServer.emit("board element", this.selectedElement.toJSON());
        });

        this.editingToolbar.querySelector("#backgroundColorPicker").addEventListener("input", (event) => {
            this.selectedElement.backgroundColor = event.target.value;
            this.remoteServer.emit("board element", this.selectedElement.toJSON());
        });

        this.editingToolbar.querySelector("#fontSize").addEventListener("input", (event) => {
            this.selectedElement.fontSize = event.target.value;
            this.remoteServer.emit("board element", this.selectedElement.toJSON());
        });
    }

    update() {
        if (this.selectedElement) {
            var currentSettings = JSON.stringify(this.selectedElement.toJSON());
            if (currentSettings != this.lastSettings) {
                this.lastSettings = currentSettings;

                this.editingToolbar.hidden = false;
                var editingToolbarRect = this.editingToolbar.getBoundingClientRect();
                var selectedElementRect = this.selectedElement.getBoundingClientRect();
                this.editingToolbar.style.left = (selectedElementRect.left + (selectedElementRect.width / 2) - (editingToolbarRect.width / 2)) + "px";
                this.editingToolbar.style.top = (selectedElementRect.top - editingToolbarRect.height - 15) + "px";

                this.editingToolbar.querySelectorAll(".toolbar-button").forEach(button => {
                    if (button.dataset.option === "bold") {
                        button.classList.toggle("active", this.selectedElement.fontWeight === "bold");
                    }

                    if (button.dataset.option === "italic") {
                        button.classList.toggle("active", this.selectedElement.fontStyle === "italic");
                    }

                    if (button.dataset.option === "underline") {
                        button.classList.toggle("active", this.selectedElement.textDecoration === "underline");
                    }
                });

                this.editingToolbar.querySelector("#fontColorPicker").value = this.rgbToHex(this.selectedElement.textColor);
                this.editingToolbar.querySelector("#backgroundColorPicker").value = this.rgbToHex(this.selectedElement.backgroundColor);
                this.editingToolbar.querySelector("#fontSize").value = this.selectedElement.fontSize;
            }
        } else if (!this.editingToolbar.hidden) {
            this.editingToolbar.hidden = true;
        }

        requestAnimationFrame(() => this.update());
    }

    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    rgbToHex(cssString) {
        var rgb = cssString.match(/\d+/g);
        var r = parseInt(rgb[0]);
        var g = parseInt(rgb[1]);
        var b = parseInt(rgb[2]);

        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    updateElement(elementData) {
        var existing = this.boardElements.find(e => e.id === elementData.id);
        if (existing) {
            if (elementData.updateUser != this.loginManager.key) {
                existing.fromJSON(elementData);
            }
            return existing;
        }

        var element = document.createElement(elementData.type);

        element.addEventListener("readyforchanges", () => {
            element.fromJSON(elementData);
        });

        this.board.appendChild(element);
        this.boardElements.push(element);

        element.addEventListener("updated", () => {
            if (!this.boardElements.includes(element)) {
                return;
            }

            var elementData = element.toJSON();
            this.remoteServer.emit("board element", elementData);
        })

        element.addEventListener("click", () => {
            this.selectedElement = element;
        });

        this.remoteServer.emit("board element", elementData);
        return element;
    }
}