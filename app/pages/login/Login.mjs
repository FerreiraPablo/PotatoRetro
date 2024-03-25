export default class Login {
    get user() {
        const data = new FormData(this.form);
        var json = Object.fromEntries(data.entries());
        return json;
    }

    constructor(container, loginManager) {
        this.loginManager = loginManager;    
        this.form = container.querySelector("form");
        this.init();
    }

    init() {
        if(this.loginManager.isLogged) {
            location.replace("#home");
            return;
        }
        this.form.hidden = false;

        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.login(this.user);
        });
    }

    login(userData) {
        this.loginManager.login(userData);
        var returnUrl = localStorage.getItem("returnUrl");
        location.replace(returnUrl || "#home");
        localStorage.removeItem("returnUrl");
    }
}