export default class AnimationHelper {
    constructor(duration, interpolator) {
        this.defaultTiming = duration || 0.5;
        this.interpolator = interpolator || "easeInDefaultInterpolator";
        this.defaultAnimation = "fadeAndUp";
        this.getTimingClass = function (seconds) {
            seconds = seconds || this.defaultTiming;
            if (typeof seconds !== 'number') { return; }
            if (seconds > 5) { return "time5s0ms"; }
            if (seconds % 0.25 != 0) { return "time0s25ms"; }
            var x = seconds.toString().split(".");
            return `time${(x[0])}s${(x[1] || 0)}ms`;
        };

        this.getTimingSeconds = function (className) {
            className = className || this.getTimingClass();
            if (typeof className !== 'string') { return; }
            className = className.replace("time", "");
            className = className.replace("ms", "");
            className = className.replace("s", ".");
            return parseFloat(className);
        };

        this.restore = function (element) {
            var ref = this;
            element.classList.remove(ref.getTimingClass(), ref.interpolator, element.__animationApplied + "In", element.__animationApplied + "Out");
        };
        this.show = function (element, animation) {
            var ref = this;
            animation = animation || ref.defaultAnimation;
            return new Promise(function (resolve) {
                if (element.hidden) {
                    element.hidden = false;
                    ref.restore(element);
                    element.classList.add(ref.getTimingClass(), ref.interpolator, animation + "In");
                    element.__animationApplied = animation;
                    element.ontransitionend = element.onanimationend = function () {
                        resolve();
                        ref.restore(this);
                    };
                } else {
                    resolve();
                }
            });
        };

        this.hide = function (element, animation) {
            var ref = this;
            animation = animation || ref.defaultAnimation;
            return new Promise(function (resolve) {
                if (!element.hidden) {
                    ref.restore(element);
                    element.classList.add(ref.getTimingClass(), ref.interpolator, animation + "Out");
                    element.__animationApplied = animation;
                    element.ontransitionend = element.onanimationend = function () {
                        element.hidden = true;
                        resolve();
                        ref.restore(this);
                    };
                } else {
                    resolve();
                }
            });
        };

        this.toggle = function (element, animation) {
            var ref = this;
            if (element.hidden) {
                return ref.show(element, animation);
            } else {
                return ref.hide(element, animation);
            }
        };
    }
}

