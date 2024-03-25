export default class BindingContext {
    constructor(model, element) {
        var contextReference = this;
        this._bindEvent = new CustomEvent('bind', { detail: { model: model } });
        this._baseElement = element || document.querySelector("body");
        this._observationId = null;
        this._bindedElements = [];
        this.applyElementBindings = function (bindedElement) {
            if (!bindedElement) {
                return;
            }
            if (!contextReference.checkIfExist(bindedElement)) {
                contextReference.remove(bindedElement);
                return;
            }
            var bindingElementContext = bindedElement.bindingContext;
            for (var extensionName of bindingElementContext.extensions) {
                var extensionMethod = BindingContext.extensions[extensionName];
                if (typeof extensionMethod === 'function') {
                    var bindingExpression = bindedElement.getAttribute("data-" + extensionName);
                    extensionMethod.apply(contextReference.model || contextReference, [bindedElement, bindingExpression, "data-" + extensionName]);
                }
            }
        };

        this.apply = async function () {
            for (var bindedElement of contextReference._bindedElements) {
                contextReference.applyElementBindings(bindedElement);
            }
        };

        this.update = async function () {
            if (contextReference.running) {
                this.apply();
                setTimeout(() => {
                    requestAnimationFrame(() => contextReference.update ? contextReference.update() : null);
                }, 1000 / 60);
            }
        };

        this.remove = function (element) {
            var ref = this;
            var indexOfElement = ref._bindedElements.indexOf(element);
            if (indexOfElement > -1) {
                var bindedElement = ref._bindedElements[indexOfElement];
                bindedElement.bindingContext = null;
                bindedElement.context = null;
                bindedElement.model = null;
                delete bindedElement.model;
                delete bindedElement.context;
                delete bindedElement.bindingContext;
                ref._bindedElements.splice(indexOfElement, 1);
            }
        };

        this.prepareForNewContext = function (element) {
            if (element.bindingContext) {
                if (element.bindingContext.context._baseElement.contains(contextReference._baseElement)) {
                    element.bindingContext.context.remove(element);
                } else {
                    return false;
                }
            }
            return true;
        };

        this.start = function (updateInterval) {
            this.stop();
            this.running = true;
            contextReference?.update();
            element?.dispatchEvent(this._bindEvent);
        };

        this.stop = function () {
            this.running = false;
        };

        this.bindElement = function (element, extension) {
            if (contextReference._bindedElements.indexOf(element) < 0 && contextReference.prepareForNewContext(element)) {
                if (!element.bindingContext) {
                    element.bindingContext = {
                        extensions: [],
                        context: contextReference,
                        model: contextReference.model
                    };
                }
                contextReference._bindedElements.push(element);
            }

            if (element.bindingContext.extensions.indexOf(extension) < 0) {
                element.bindingContext.extensions.push(extension);
            }
        };

        this.searchBindedElements = function () {
            for (var extension in BindingContext.extensions) {
                this._baseElement.querySelectorAll("[data-" + extension + "]").forEach(function (bindedElement) {
                    contextReference.bindElement(bindedElement, extension);
                });
                if (this._baseElement.hasAttribute("[data-" + extension + "]")) {
                    contextReference.bindElement(this._baseElement, extension);
                }
            }
        };
        this.model = model || window;
        this.searchBindedElements();
        this.observer = new MutationObserver(function (mutations, observer) {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(x => {
                    if (!contextReference.checkIfExist(x)) {
                        contextReference.remove(x);
                    }
                });
            });
            contextReference.searchBindedElements();
            contextReference.verifyOrDie();
        });

        this.observer.observe(this._baseElement, {
            attributes: true,
            childList: true,
            subtree: true
        });

        this.verifyOrDie = function () {
            var ref = this;
            if (!document.body.contains(ref._baseElement)) {
                ref.destroy();
                return;
            }
        };

        this.checkIfExist = function (element) {
            var ref = this;
            return ref._baseElement.contains(element) || element.parentReference;
        };

        this.destroy = function () {
            var ref = this;
            ref.stop();
            ref._bindedElements.forEach(x => ref.remove(x));
            ref.observer.disconnect();
            for (var i in ref) {
                delete ref[i];
            }
        };
        this.start();
    }
}

BindingContext.extensions = {
    bind: function (bindedElement, bindValue) {
        try {
            var dataReferences = {
                "elementReference": typeof bindedElement.value === 'undefined' || bindedElement.tagName == "BUTTON" ? `bindedElement.innerHTML` : `bindedElement.value`,
                "objectReference": bindValue
            };
            if (bindedElement.type) {
                if (bindedElement.type == "checkbox") {
                    dataReferences.elementReference = 'bindedElement.checked'
                }
                if (["checkbox", "number"].indexOf(bindedElement.type) > -1) {
                    dataReferences.directReference = true;
                } else {
                    dataReferences.directReference = false;
                }
            }
            var elementValue = eval(dataReferences.elementReference);
            var objectValue = eval(dataReferences.objectReference);
            if (bindedElement.originalObjectValue != objectValue) {
                if (dataReferences.directReference) {
                    eval(dataReferences.elementReference + " = " + objectValue);
                } else {
                    eval(dataReferences.elementReference + " = unescape(\`" + escape(objectValue || "") + "\`)");
                }
                if (bindedElement.onchange) {
                    bindedElement.dispatchEvent(new Event('change'));
                }
                bindedElement.originalObjectValue = objectValue;
                return;
            }
            if (elementValue != objectValue) {
                if (dataReferences.directReference) {
                    eval(dataReferences.objectReference + " = " + elementValue);
                } else {
                    eval(dataReferences.objectReference + " = unescape(\`" + escape(elementValue) + "\`)");
                }
                return;
            }
        } catch (e) {}
    },
    if: function (bindedElement, bindValue) {
        try {
            bindedElement.hidden = !eval(bindValue);
        } catch (e) {
            bindedElement.hidden = true;
        }
    },
    "disabled-if": function (bindedElement, bindValue) {
        bindedElement.disabled = eval(bindValue);
    },
    "class-if": function (bindedElement, bindValue, attribute) {
        if (bindValue.trim() != "") {
            var parameters = bindValue.split(";");
            if (parameters.length >= 2) {
                var condition = parameters[0];
                var classIfTrue = parameters[1].trim();
                var classIfFalse = null;
                if (parameters[2]) {
                    classIfFalse = parameters[2].trim();
                    classIfFalse = classIfFalse.split(" ");
                }

                classIfTrue = classIfTrue.split(" ");
                var add = bindedElement.classList.add;
                var remove = bindedElement.classList.remove;
                var contains = bindedElement.classList.contains;
                var thisReference = bindedElement.classList;
                if (eval(condition)) {
                    if (classIfFalse && contains.apply(thisReference, classIfFalse)) {
                        remove.apply(thisReference, classIfFalse)
                    }

                    if (!contains.apply(thisReference, classIfTrue)) {
                        add.apply(thisReference, classIfTrue)
                    }
                } else {
                    if (contains.apply(thisReference, classIfTrue)) {
                        remove.apply(thisReference, classIfTrue)
                    }

                    if (classIfFalse && !contains.apply(thisReference, classIfFalse)) {
                        add.apply(thisReference, classIfFalse)
                    }
                }
            }
        }
    },
    "bind-attributes": function (bindedElement, bindValue) {
        var existingAttributes = bindedElement.attributes;
        var specificAttributes = null;
        if (bindValue != "") {
            specificAttributes = bindValue.split(",");
        }
        for (var attribute of existingAttributes) {
            if (specificAttributes) {
                if (specificAttributes.indexOf(attribute.name) < 0) {
                    continue;
                }
            }
            if (attribute.bindingExpression) {
                var expressionValue = eval(attribute.bindingExpression);
                if (expressionValue && expressionValue != attribute.value) {
                    attribute.value = expressionValue;
                }
            } else {
                var expresionMatch = attribute.value.match(/\{\{(.*?)\}\}/);
                if (expresionMatch) {
                    var expression = expresionMatch[1];
                    if (expression && expression.trim() != "") {
                        attribute.bindingExpression = expression;
                    }
                }
            }
        }
    },
    repeat: function (bindedElement, bindValue, attribute) {
        try {
            if (!bindedElement.parentReference) {
                bindedElement.parentReference = bindedElement.parentElement;
                bindedElement.parentReference.bindedElements = [];
                bindedElement.parentReference.childTemplate = bindedElement;
            }
            var parent = bindedElement.parentReference;
            if (!parent.indexedElements || parent.indexedElements != eval(bindValue)) {
                parent.indexedElements = eval(bindValue);
            }

            var existingItems = parent.indexedElements;
            var actualSerialization = JSON.stringify(existingItems);
            if (parent.lastSerialization == actualSerialization) {
                return;
            }

            var actualElements = parent.bindedElements;
            
            var renderedItems = actualElements.map(x => x.context.model);

            existingItems.forEach(item => {
                var isRendered = renderedItems.indexOf(item) > -1;
                if (!isRendered) {
                    var domElement = parent.childTemplate.cloneNode(true);
                    domElement.removeAttribute(attribute)
                    domElement.context = new BindingContext(item, domElement);
                    domElement.context.start();
                    domElement.model = item;
                    parent.append(domElement);
                    actualElements.push(domElement);
                }
            });

            actualElements.forEach(element => {
                var isExisting = existingItems.indexOf(element.context.model) < 0;
                if (isExisting) {
                    element.remove();
                }
            });
            parent.lastSerialization = actualSerialization;
            bindedElement.remove();
        } catch (e) {
            throw e;
        }
    }
};