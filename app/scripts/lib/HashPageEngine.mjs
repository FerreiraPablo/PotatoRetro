export default class HashPageEngine {
    #lastRoute = "";
    #defaults = {
        container: 'body',
        viewsSuffix: ".html",
        basePath: "",
        startPage: "",
        injector: null,
        defaultPage: null,
        errorPage: null,
        containerDispose() {
            return new Promise(function (resolve) {
                resolve();
            });
        },
        containerSet() {
            return new Promise(function (resolve) {
                resolve()
            });
        }
    };

    get routeBase() {
        return location.href.replace(location.hash, "").replace("index.html", "");
    }

    get routeParameters() {
        return new URLSearchParams("?" + location.hash.split("?")[1]);
    }

    get containerBody() {
        return document.querySelector(this.config.container);
    }

    constructor(config = {}) {
        this.config = Object.assign(this.#defaults, config);
        window.addEventListener("hashchange", x => this.#navigationHandler(x));
        this.#navigationHandler();
    }

    async getPage(url) {
        const response = await fetch(url);
        if(response.ok)
            return await response.text()
    
        throw response.statusText;
    }

    #prepareRoute(route) {
        route = "/" + route;
        route = route.replace(/#/g, "");
        if (route.charAt(0) == "/" && this.config.basePath.charAt(this.config.basePath.length - 1) == "/") {
            route = route.substring(1)
        }

        if (route.substring(0, this.config.basePath.length) == this.config.basePath) {
            route = route.substring(this.config.basePath.length);
        }

        while (route.indexOf("//") > -1) {
            route = route.replace(/\/\//g, "/")
        }

        if(route.endsWith(this.config.viewsSuffix)) {
            route = route.substring(0, route.length - this.config.viewsSuffix.length);
        }

        route = route.split("?")[0];
        return this.config.basePath + route;
    }

    async #applyContent(element) {
        await this.config.containerDispose.apply(this, [this.containerBody])
        this.containerBody.innerHTML = "";
        this.containerBody.append(element)
        await this.config.containerSet.apply(this, [this.containerBody])
    }

    async #evaluateScripts() {
        this.containerBody.querySelectorAll("script").forEach(x => {
            eval(x.innerText);
            x.remove();
        })
    }

    async #navigationHandler(hashChangeEvent) {
        let route = window.location.hash.trim() == "" ? this.config.startPage : window.location.hash;

        if (route == this.#lastRoute) {
            if (hashChangeEvent) {
                hashChangeEvent.preventDefault();
            }
            return false;
        }

        let requestedPage = route;
        requestedPage = this.#prepareRoute(requestedPage);
        if(this.config.findIndex) {
            requestedPage = requestedPage + "/index";
        }


        if (this.config.defaultPage) {
            if (requestedPage.charAt(requestedPage.length - 1) == "/") {
                requestedPage += this.config.defaultPage;
            }
        }

        if (requestedPage.length > 1) {
            if (requestedPage.toLowerCase().substring(-this.config.viewsSuffix.length) != this.config.viewsSuffix.toLowerCase()) {
                requestedPage += this.config.viewsSuffix;
            }
        }

        try {
            var content = await this.getPage(requestedPage + "?__Z=" + Math.floor(Math.random() * 999999999));
            content = "<base href='" + this.routeBase + requestedPage + "'/>" + content;
            var domContent = new DOMParser().parseFromString(content, "text/html");


            var links = domContent.querySelectorAll("link");
            for(var link of links) {
                link.setAttribute("href", link.href);
            }

            var template = domContent.querySelector("template");
            if(!template) {
                template = document.createElement("template");
                template.innerHTML = domContent.body.innerHTML;
            }
            
            var element =  template.content.cloneNode(true);
            links.forEach(x => {
                element.append(x);
            });
            var mainModule = domContent.querySelector("script[main]");
            await this.#applyContent(element);
            var pageModule;
            if(mainModule) {
                var moduleSource = mainModule.src;
                if(!moduleSource) {
                    var moduleText = mainModule.innerText;
                    var moduleBlob = new Blob([moduleText], {type: 'application/javascript'});
                    moduleSource = URL.createObjectURL(moduleBlob);
                }
                var module = await import(moduleSource);
                if(module.default) {
                    pageModule = module.default;
                }
            }


            if(pageModule) {
                if(!this.config.injector) {
                    new (pageModule)().init(this.routeParameters); 
                } else {
                    this.config.injector.inject(pageModule);
                }
            }

            this.#lastRoute = route;
        } catch (e) {
            console.error(e);
            window.location.hash = this.config.errorPage || this.#lastRoute || this.config.startPage;
        }
    };
}