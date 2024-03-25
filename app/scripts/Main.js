import KeyGenerator from "./helpers/KeyGenerator.mjs";
import AnimationHelper from "./lib/AnimationHelper.mjs";
import DependencyInjector from "./lib/DependencyInjector.mjs";
import HashPageEngine from "./lib/HashPageEngine.mjs";
import RemoteServer from "./lib/RemoteServer.mjs";
import SimpleComponents from "./lib/SimpleComponents.mjs";
import LoginManager from "./managers/LoginManager.mjs";
import RoomManager from "./managers/RoomManager.mjs";

export default class Main { 
    constructor() {
        this.init();
    }

    init() {
        this.animationHelper = new AnimationHelper();
        this.dependencyInjector = new DependencyInjector();
        this.simpleComponents = new SimpleComponents();
        
        this.simpleComponents.injector = this.dependencyInjector;
        this.addServices();
        this.addDependencies();
        this.addPagesEngine();
    }

    addPagesEngine() {
       this.pageEngine = new HashPageEngine({
            findIndex: true,
            basePath: "pages",
            startPage: "login",
            container: "#mainContainer",
            viewsSuffix : ".html",
            injector : this.dependencyInjector,
            containerDispose: (container) => {
                return new Promise((resolve) => {
                    this.animationHelper.hide(container).then(resolve)
                });
            },
            containerSet: (container) => {
                this.animationHelper.show(container)
                return new Promise(function(resolve) {
                    resolve()
                });
            }
        })

        this.dependencyInjector.addSingleton("container", this.pageEngine.containerBody);
    }

    addServices() {
        this.remoteServer = new RemoteServer("ferreirapablo.com", 4550);
        this.keyGenerator = new KeyGenerator();
        this.roomManager = new RoomManager(this.remoteServer, this.keyGenerator);
        this.loginManager = new LoginManager(this.remoteServer, this.keyGenerator);
    }

    addDependencies() {
        this.dependencyInjector.addSingleton("remoteServer", this.remoteServer);
        this.dependencyInjector.addSingleton("animationHelper", this.animationHelper);
        this.dependencyInjector.addSingleton("keyGenerator", this.keyGenerator);
        this.dependencyInjector.addSingleton("roomManager", this.roomManager);
        this.dependencyInjector.addSingleton("loginManager", this.loginManager);
        this.dependencyInjector.addTransient("routerParameters", (() => new URLSearchParams("?" + location.hash.split("?")[1])));
    }
}