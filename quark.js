define(['text'], function (text) {

    function isString(variable) {
        if (typeof variable === 'string' || variable instanceof String) {
            return true;
        }

        return false;
    }

    // Config the given components in the specified namespace
    function configNamespace(namespace, components, moduleName, req, onLoad) {
        moduleName = moduleName || '';

        // Iterate each specified component
        for (var name in components) {
            var item = components[name];

            // Construct the component's full name
            var fullName;

            if (name) {
                if (namespace) {
                    fullName = namespace + '-' + name;
                } else {
                    fullName = name;
                }
            } else {
                fullName = namespace;
            }

            // If the specified component value is a string register as component
            // if not assume its another namespace and call this function
            // recursively
            if (isString(item)) {
                if (moduleName) {
                    //$$.registerComponent(fullName, moduleName + '/' + item);
                    console.log(moduleName + '/' + item);
                    try {
                        req([moduleName + '/' + item], function () {
                            onLoad();
                        });
                    } catch(ex) {
                        console.log(ex);
                    }
                } else {
                    //$$.registerComponent(fullName, item);
                    console.log(item);
                    req([item], function() {                        
                        onLoad();
                    });
                }
            } else {
                configNamespace(fullName, item, moduleName, req, onLoad);
            }
        }
    }
    
    return {
        load: function (name, req, onLoad, config) {
            if (config.isBuild && ((req.toUrl(name).indexOf('empty:') === 0) || (req.toUrl(name).indexOf('http:') === 0) || (req.toUrl(name).indexOf('https:') === 0))) {
                // Avoid inlining cache busted JSON or if inlineJSON:false
                // and don't inline files marked as empty!
                onLoad(null);
            } else {
                if (config.isBuild) {
                    req(["json!" + name + "/main.json"], function () {
                        text.get(req.toUrl(name + "/main.json"), function (data) {
                            eval("var qConfig = " + data);

                            // If there's a components configuration add the prefix to the tag name of each component,
                            // the module path to the component's path and register
                            if (qConfig.components) {
                                // Iterate over the components
                                for (var componentTagName in qConfig.components) {
                                    // Add the prefix to the tag name and the module name as root to the module path
                                    var tagName = qConfig.prefix + "-" + componentTagName;
                                    var path = moduleName + '/' + qConfig.components[componentTagName];

                                    req(path, function() {
                                        onLoad();
                                    });

                                    // Register the component
                                    //$$.registerComponent(tagName, path);
                                }
                            }

                            // If theres namespace component registrations
                            if (qConfig.namespaces) {
                                if (qConfig.prefix) {
                                    configNamespace(qConfig.prefix, qConfig.namespaces, name, req, onLoad);
                                } else {
                                    configNamespace('', qConfig.namespaces, name, req, onLoad);
                                }
                            }
                        });  
                    });
                } else {
                    req(["quark", "json!" + name + "/main.json"], function ($$, moduleConf) {
                        var moduleData = {
                            id: name + "/main",
                            uri: req.toUrl(name + "/main")
                        }

                        $$.module(moduleData, moduleConf);

                        onLoad(moduleConf);
                    });
                }
            }
        }
    }
});
