export default class SimpleComponents {
    constructor(componentElementScope, dependencyInjector) {
        var reference = this;
        this.dependencyInjector = dependencyInjector;
        this._baseElement = componentElementScope || document.querySelector("body");
        this._registered = [];
        this.isHtml = function (text) {
            return text.match(/<(.*)><\/(.*)>/) != null;
        };

        reference.getComponent = async (url) => {
            return await fetch(url).then(function (response) {
                return response.text();
            });
        };

        this.register = function (tagName, component) {
            var ref = this;
            var content = component;
            return new Promise(async function (resolve, reject) {

                if (!ref.isHtml(content)) {
                    content = await reference.getComponent(content);
                }
                if (content && tagName) {
                    var component = {
                        "tag": tagName,
                        "content": content
                    };
                    var injector = ref.injector;
                    customElements.define(tagName, class extends HTMLElement {
                        constructor() {
                            super();
                            this.attachShadow({ mode: 'open' });
                            this.shadowRoot.innerHTML = component.content;
                            this.shadowRoot.querySelectorAll("script").forEach(script => {
                                var codeFunction = eval(`(function() { 
                                    ${script.innerText}
                                })`);
                                codeFunction.apply(this);
                                script.remove();
                            });
                            this.dispatchEvent(new Event("rendered"));
                        }

                        connectedCallback() {
                            this.dispatchEvent(new Event("connected"));
                            if(this.onConnected) {
                                !ref.injector ? this.onConnected() : ref.injector.inject(this.onConnected);
                            }
                        }
                    });
                    ref._registered.push(component);
                    resolve(component);
                }
            });
        };
    }
}