import SerializableElement from "./SerializableElement.mjs";

export default class StickyNote extends SerializableElement {
    constructor() {
        super({
            selectors: {
                backgroundElement: ".sticky-note", 
                draggingHandle: ".dragging-handle",
                resizeHandle: ".resize-handle",
                textElement: "textarea"
            },
            default: {
                fontSize: "1rem",
                backgroundColor: "rgba(255, 245, 179, 1)",
            }
        });
        
        this.type = "sticky-note";
        this.shadowRoot.innerHTML = `
            <style>
                .sticky-note {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    box-shadow: 0px 5px 10px 0px rgba(0,0,0,0.03);
                    z-index: 100;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: 0.3s;
                }

                .sticky-note.grabbed {
                    box-shadow: 0px 10px 15px 0px rgba(0,0,0,0.1);
                }

                .sticky-note textarea {
                    border: none;
                    resize: none;
                    background: transparent;
                    font-family: sans-serif;
                    user-select: none;
                    padding: 5px;
                    flex: 1;
                }

                .sticky-note .dragging-handle {
                    height: 20px;
                    background-color: rgb(0 0 0 / 5%);
                    cursor: grab;
                }

                .sticky-note .resize-handle {
                    width: 20px;
                    height: 20px;
                    background-color: rgb(0 0 0 / 5%);
                    cursor: nwse-resize;
                    align-self: flex-end;
                    border-radius: 30px 0px 0px 0px;
                }

                .sticky-note:not([locked]) .show-on-hover {
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .sticky-note:not([locked]):hover .show-on-hover {
                    opacity: 1;
                }

                .sticky-note textarea:focus {
                    outline: none;
                }
            </style>
            <div class="sticky-note">
                <div class='dragging-handle show-on-hover'></div>
                <textarea></textarea>
                <div class='resize-handle  show-on-hover'></div>
            </div>
        `;
    }
}

customElements.define("sticky-note", StickyNote);