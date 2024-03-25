import SerializableElement from "./SerializableElement.mjs";

export default class PlainText extends SerializableElement {
    constructor() {
        super({
            selectors: {
                backgroundElement: ".plain-text", 
                draggingHandle: ".dragging-handle",
                resizeHandle: ".resize-handle",
                textElement: "textarea"
            },
            default: {
                content: "Write something...",
                minSize: {width: "350px", height: "40px"},
                fontSize: "1.5rem"
            }
        });
        this.type = "plain-text";
        this.shadowRoot.innerHTML = `
            <style>
                .plain-text {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: 1px solid transparent;
                    z-index: 100;
                    overflow: hidden;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    transition: 0.3s;
                }

                .plain-text.grabbed {
                    box-shadow: 0px 10px 15px 0px rgba(0,0,0,0.1);
                }

                .plain-text textarea {
                    border: none;
                    resize: none;
                    background: transparent;
                    font-family: sans-serif;
                    user-select: none;
                    padding: 5px;
                    flex: 1;
                }

                .plain-text .dragging-handle {
                    height: 100%;
                    width: 20px;
                    background-color: rgb(0 0 0 / 5%);
                    cursor: grab;
                }

                .plain-text .resize-handle {
                    width: 20px;
                    height: 20px;
                    background-color: rgb(0 0 0 / 5%);
                    cursor: nwse-resize;
                    align-self: flex-end;
                    border-radius: 30px 0px 0px 0px;
                }

                .plain-text:not([locked]) .show-on-hover {
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .plain-text:not([locked]):hover .show-on-hover {
                    opacity: 1;
                }

                .plain-text:not([locked]):hover {
                    border: 1px solid #ddd;
                }

                .plain-text textarea:focus {
                    outline: none;
                }
            </style>
            <div class="plain-text">
                <div class='dragging-handle show-on-hover'></div>
                <textarea></textarea>
                <div class='resize-handle  show-on-hover'></div>
            </div>
        `;
    }
}

customElements.define("plain-text", PlainText);