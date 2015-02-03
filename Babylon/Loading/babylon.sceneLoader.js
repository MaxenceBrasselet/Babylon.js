"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.SceneLoader = {
        _registeredPlugins: [],

        _getPluginForFilename: function (sceneFilename) {
            var dotPosition = sceneFilename.lastIndexOf(".");
            var extension = sceneFilename.substring(dotPosition).toLowerCase();

            for (var index = 0; index < this._registeredPlugins.length; index++) {
                var plugin = this._registeredPlugins[index];

                if (plugin.extensions.indexOf(extension) !== -1) {
                    return plugin;
                }
            }

            return this._registeredPlugins[this._registeredPlugins.length - 1];
        },
                
        BREAKHIERARCHYOPTIONS: {
            NONE: 1, // do not break hierarchy
            WITHOUTCHILDREN: 2, // break hierarchy (children), it does not import children.
            RESET: 3,// break hierarchy (parent) and reset mesh transform in world space.
            BAKEPARENTS: 4, // break hierarchy (parent) and leave the mesh as is in the world (parents' transforms are baked into its transform).
            SETINWORLD: 5, // break hierarchy (parent) but leave localWorld matrix as is.
        },

        // Public functions
        RegisterPlugin: function (plugin) {
            plugin.extensions = plugin.extensions.toLowerCase();
            this._registeredPlugins.push(plugin);
        },

         ImportMesh: function (meshesNames, rootUrl, sceneFilename, scene, onsuccess, progressCallBack, onerror, parentId, breakHierarchyOptions) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            var database = new BABYLON.Database(rootUrl + sceneFilename);
            scene.database = database;

            var plugin = this._getPluginForFilename(sceneFilename);

            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, function (data) {
                var meshes = [];
                var particleSystems = [];
                var skeletons = [];

                if (!plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons, parentId, breakHierarchyOptions)) {
                    if (onerror) {
                        onerror(scene);
                    }

                    return;
                }

                if (onsuccess) {
                    scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                    onsuccess(meshes, particleSystems, skeletons);
                }
            }, progressCallBack, database);
        },

        Load: function (rootUrl, sceneFilename, engine, onsuccess, progressCallBack, onerror) {

            var plugin = this._getPluginForFilename(sceneFilename.name || sceneFilename);
            var database;

            var loadSceneFromData = function (data) {
                var scene = new BABYLON.Scene(engine);
                scene.database = database;

                if (!plugin.load(scene, data, rootUrl)) {
                    if (onerror) {
                        onerror(scene);
                    }

                    return;
                }

                if (onsuccess) {
                    onsuccess(scene);
                }
            };

            if (rootUrl.indexOf("file:") === -1) {
                // Checking if a manifest file has been set for this scene and if offline mode has been requested
                database = new BABYLON.Database(rootUrl + sceneFilename);

                BABYLON.Tools.LoadFile(rootUrl + sceneFilename, loadSceneFromData, progressCallBack, database);
            }
                // Loading file from disk via input file or drag'n'drop
            else {
                BABYLON.Tools.ReadFile(sceneFilename, loadSceneFromData, progressCallBack);
            }
        }
    };
})();