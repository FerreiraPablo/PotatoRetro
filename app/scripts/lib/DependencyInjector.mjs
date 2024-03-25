export default class DependencyInjector {
    dependencies = [];

    get(name) { 
        var existingDependency = this.dependencies.find(x => x.name == name);
        if(existingDependency) {
            var instance = existingDependency.instance;
            if(typeof instance === "function") {
                instance = this.inject(instance);
            }
            
            return instance;
        } else { 
            return null;
        }
    }

    getParameters(func) {
        if(!func) 
            return [];

        var functionStringDefinition = func.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg);
        var isClass = functionStringDefinition.includes("constructor");
        var indexOfArguments = 0;
        if(isClass) {
            indexOfArguments = functionStringDefinition.indexOf('(', functionStringDefinition.indexOf("constructor")) + 1
        } else {
            indexOfArguments = functionStringDefinition.indexOf('(') + 1
        }
        var argumentArray = functionStringDefinition.slice(indexOfArguments, functionStringDefinition.indexOf(')', indexOfArguments)).match(/([^\s,]+)/g);
        if (argumentArray === null)
            argumentArray = [];
        return argumentArray;
    };

    addTransient(name, instance) {
        this.#addDependency({
            "name": name,
            "instance": instance
        })
    }

    addSingleton(name, instance) {
        if(typeof instance == "function") {
            instance = this.inject(instance);
        }

        this.#addDependency({
            "name": name,
            "instance": instance
        })
    }

    #addDependency(dependency) {
        var existingDependency = this.get(dependency.name);
        if(existingDependency) {
            existingDependency.instance = instance
            return instance;
        } else {
            this.dependencies.push(dependency)
            return dependency.instance;
        }
    }
    
    inject(module) {
        if(!module)
            return null;

        var moduleParameters = this.getParameters(module);
        var dependencies = moduleParameters.map(x => this.get(x));
        
        return module.prototype ? new (module.bind.apply(module, [null].concat(dependencies)))() : module.apply(null, dependencies);
    }
}

