import anime from "../../node_modules/animejs/lib/anime.es.js";

export default class SerializableElement extends HTMLElement {
    owner = null;
    updateUser = null;
    type = "element";
    selectors = {
        draggingHandle: ".dragging-handle",
        resizeHandle: ".resize-handle",
        textElement: "textarea, input"
    }

    get isLocked() {
        return this.backgroundElement.hasAttribute("locked");
    }

    set isLocked(value) {
        if(value) {
            this.backgroundElement.setAttribute("locked", "");
        } else {
            this.backgroundElement.removeAttribute("locked");
        }
    }

    set isLockedOwnerOnly(value) {
        if(value) {
            this.backgroundElement.setAttribute("locked-owner-only", "");
        } else {
            this.backgroundElement.removeAttribute("locked-owner-only");
        }
    }

    get isLockedOwnerOnly() {
        return this.backgroundElement.hasAttribute("locked-owner-only");
    }

    get content() {
        return this.textElement.value;
    }

    set content(value) {
        this.textElement.value = value;
    }

    get position() {
        return {
            x: this.style.left,
            y: this.style.top
        }
    }

    set position(value) {
        this.style.left = value.x;
        this.style.top = value.y;
    }

    get size() {
        return {
            width: this.style.width,
            height: this.style.height
        }
    }

    set size(value) {
        this.style.width = value.width;
        this.style.height = value.height;
    }


    set minSize(value) {
        this.style.minWidth = value.width;
        this.style.minHeight = value.height;
    }

    get minSize() {
        return {
            width: this.style.minWidth,
            height: this.style.minHeight
        }
    }

    set backgroundColor(value) {
        this.backgroundElement.style.backgroundColor = value;
    }

    get backgroundColor() {
        return this.backgroundElement.style.backgroundColor;
    }

    get textColor() {
        return this.textElement.style.color;
    }

    set textColor(value) {
        this.textElement.style.color = value;
    }

    get textDecoration() {
        return this.textElement.style.textDecoration;
    }

    set textDecoration(value) {
        this.textElement.style.textDecoration = value;
    }

    get fontStyle() {
        return this.textElement.style.fontStyle;
    }

    set fontStyle(value) {
        this.textElement.style.fontStyle = value;
    }

    get draggingHandle() {
        return this.shadowRoot.querySelector(this.selectors.draggingHandle);
    }

    get resizeHandle() {
        return this.shadowRoot.querySelector(this.selectors.resizeHandle);
    }

    get textElement() {
        return this.shadowRoot.querySelector(this.selectors.textElement);
    }

    get backgroundElement() {
        return this.shadowRoot.querySelector(this.selectors.backgroundElement);
    }
    
    get fontSize() {
        return this.textElement.style.fontSize;
    }

    set fontSize(value) {
        this.textElement.style.fontSize = value;
    }

    get fontWeight() {
        return this.textElement.style.fontWeight;
    }

    set fontWeight(value) {
        this.textElement.style.fontWeight = value;
    }

    get textAlign() {
        return this.textElement.style.textAlign;
    }

    set textAlign(value) {
        this.textElement.style.textAlign = value;
    }

    get layer() {
        return this.style.zIndex || 0;
    }

    set layer(value) {
        this.style.zIndex = value;
    }

    constructor(settings) {
        super();
        this.attachShadow({ mode: 'open' });
        this.settings = settings || {};
        this.selectors = this.settings.selectors || this.selectors;     
    }

    connectedCallback() {
        this.style.position = "absolute";
        this.style.opacity = 0;

        this.minSize = this.settings.default?.minSize || { width: "200px", height: "200px" };
        this.content = this.settings.default?.content || "";
        this.backgroundColor = this.settings.default?.backgroundColor || "#f5f5f5";
        this.textColor = this.settings.default?.textColor || "#000";
        this.size = this.minSize;
        if(this.settings?.default) {
            this.fromJSON(this.settings.default);
        }

        this.dispatchEvent(new Event("readyforchanges"));

        if(this.draggingHandle) {
            this.draggingHandle.addEventListener("mousedown", (event) => {
                if(this.isLocked) return;

                this.backgroundElement.classList.add("grabbed");
                this.dragging = true;
                this.draggingInitialPosition = { x: event.clientX - parseInt(this.position.x), y: event.clientY - parseInt(this.position.y) };
            });
        }

        if(this.resizeHandle) {
            this.resizeHandle.addEventListener("mousedown", (event) => {
                if(this.isLocked) return;

                this.resizing = true;
                this.resizingInitialSize = this.size;
                this.draggingInitialPosition = { x: event.clientX, y: event.clientY };
            })
        }

        document.addEventListener("mousemove", (event) => {
            if (this.dragging) {
                document.body.style.userSelect = "none";
                this.draggingHandle.style.cursor = "grabbing";
                this.position = {
                    x: (event.clientX - parseInt(this.draggingInitialPosition.x)) + "px",
                    y: (event.clientY - parseInt(this.draggingInitialPosition.y)) + "px"
                }
                this.dispatchEvent(new Event("updated"));
            }

            if (this.resizing) {
                document.body.style.userSelect = "none";
                this.size = { width: (parseInt(this.resizingInitialSize.width) + (event.clientX - this.draggingInitialPosition.x)) + "px", height: (parseInt(this.resizingInitialSize.height) + (event.clientY - this.draggingInitialPosition.y)) + "px" };
                this.dispatchEvent(new Event("updated"));
            }
        })

        document.addEventListener("mouseup", () => {
            this.dragging = false;
            this.resizing = false;
            this.draggingInitialPosition = null;
            this.resizingInitialSize = null;
            this.backgroundElement.classList.remove("grabbed");
            this.draggingHandle.style.cursor = "grab";
            document.body.style.userSelect = "auto";
            this.dispatchEvent(new Event("updated"));
        })

        if(this.textElement) {
            this.textElement.addEventListener("input", () => {
                if(this.isLocked) return;

                this.dispatchEvent(new Event("contentChanged"));
                this.dispatchEvent(new Event("updated"));
            });

            this.textElement.addEventListener("focus", () => {
                this.dispatchEvent(new Event("focused"));
            });
        }
        this.dispatchEvent(new Event("updated"));
        

        anime({
            targets: this,
            opacity: 1,
            scale: [1.1, 1],
            translateY: ["-25px", 0],
            duration: 500,
            easing: 'easeInOutExpo'
        });

    }

    disconnectedCallback() {
        document.removeEventListener("mousemove", this.draggingHandler);
        document.removeEventListener("mouseup", this.draggingHandler);
    }

    toJSON() {
        return {
            id: this.id,
            content: this.content,
            position: this.position,
            size: this.size,
            backgroundColor: this.backgroundColor,
            textColor: this.textColor,
            fontSize: this.fontSize,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textDecoration: this.textDecoration,
            textAlign: this.textAlign,
            owner: this.owner,
            updateUser: this.updateUser,
            type: this.type,
            time: Date.now(),
            layer: this.layer
        }
    }

    fromJSON(json) {
        this.content = json.content || this.settings.default?.content || "";
        this.position = json.position || this.settings.default?.position || this.position;
        this.size = json.size || this.settings.default?.size || this.size;
        this.backgroundColor = json.backgroundColor || this.settings.default?.backgroundColor || this.backgroundColor;
        this.textColor = json.textColor || this.settings.default?.textColor || this.textColor;
        this.fontSize = json.fontSize || this.settings.default?.fontSize || this.fontSize;
        this.fontWeight = json.fontWeight || this.settings.default?.fontWeight || this.fontWeight;
        this.fontStyle = json.fontStyle || this.settings.default?.fontStyle || this.fontStyle;
        this.textDecoration = json.textDecoration || this.settings.default?.textDecoration || this.textDecoration;
        this.textAlign = json.textAlign || this.settings.default?.textAlign || this.textAlign;
        this.owner = json.owner || this.owner;
        this.updateUser = json.updateUser || this.updateUser;
        this.layer = json.layer || this.layer;
        this.id = json.id || this.id;
        this.type = json.type || this.type;
    }

    async fromJSONSmooth(json) {
        anime({
            targets: this,
            left: json.position.x,
            top: json.position.y,
            width: json.size.width,
            height: json.size.height,
            duration: 500,
            easing: 'easeInOutQuad'
        });

        anime({
            targets: this.backgroundElement,
            backgroundColor: json.backgroundColor,
            duration: 500,
            easing: 'easeInOutQuad'
        });

        anime({
            targets: this.textElement,
            color: json.textColor,
            fontSize: json.fontSize,
            fontWeight: json.fontWeight,
            duration: 500,
            easing: 'easeInOutQuad'
        })


        delete json.position;
        delete json.size;
        delete json.backgroundColor;
        delete json.textColor;
        delete json.fontSize;
        delete json.fontWeight;

        this.fromJSON(json);
    }
}
