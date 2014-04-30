﻿var BABYLON;
(function (BABYLON) {
    // FPS
    var fpsRange = 60;
    var previousFramesDuration = [];
    var fps = 60;
    var deltaTime = 0;

    var cloneValue = function (source, destinationObject) {
        if (!source)
            return null;

        if (source instanceof BABYLON.Mesh) {
            return null;
        }

        if (source instanceof BABYLON.SubMesh) {
            return source.clone(destinationObject);
        } else if (source.clone) {
            return source.clone();
        }
        return null;
    };

    var Tools = (function () {
        function Tools() {
        }
        Tools.GetFilename = function (path) {
            var index = path.lastIndexOf("/");
            if (index < 0)
                return path;

            return path.substring(index + 1);
        };

        Tools.GetDOMTextContent = function (element) {
            var result = "";
            var child = element.firstChild;

            while (child) {
                if (child.nodeType == 3) {
                    result += child.textContent;
                }
                child = child.nextSibling;
            }

            return result;
        };

        Tools.ToDegrees = function (angle) {
            return angle * 180 / Math.PI;
        };

        Tools.ToRadians = function (angle) {
            return angle * Math.PI / 180;
        };

        Tools.ExtractMinAndMax = function (positions, start, count) {
            var minimum = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            for (var index = start; index < start + count; index++) {
                var current = new BABYLON.Vector3(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);

                minimum = BABYLON.Vector3.Minimize(current, minimum);
                maximum = BABYLON.Vector3.Maximize(current, maximum);
            }

            return {
                minimum: minimum,
                maximum: maximum
            };
        };

        Tools.MakeArray = function (obj, allowsNullUndefined) {
            if (allowsNullUndefined !== true && (obj === undefined || obj == null))
                return undefined;

            return Array.isArray(obj) ? obj : [obj];
        };

        // Misc.
        Tools.GetPointerPrefix = function () {
            var eventPrefix = "pointer";

            // Check if hand.js is referenced or if the browser natively supports pointer events
            if (!navigator.pointerEnabled) {
                eventPrefix = "mouse";
            }

            return eventPrefix;
        };

        Tools.QueueNewFrame = function (func) {
            if (window.requestAnimationFrame)
                window.requestAnimationFrame(func);
            else if (window.msRequestAnimationFrame)
                window.msRequestAnimationFrame(func);
            else if (window.webkitRequestAnimationFrame)
                window.webkitRequestAnimationFrame(func);
            else if (window.mozRequestAnimationFrame)
                window.mozRequestAnimationFrame(func);
            else if (window.oRequestAnimationFrame)
                window.oRequestAnimationFrame(func);
            else {
                window.setTimeout(func, 16);
            }
        };

        Tools.RequestFullscreen = function (element) {
            if (element.requestFullscreen)
                element.requestFullscreen();
            else if (element.msRequestFullscreen)
                element.msRequestFullscreen();
            else if (element.webkitRequestFullscreen)
                element.webkitRequestFullscreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
        };

        Tools.ExitFullscreen = function () {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msCancelFullScreen) {
                document.msCancelFullScreen();
            }
        };

        // External files
        Tools.LoadImage = function (url, onload, onerror, database) {
            var img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = function () {
                onload(img);
            };

            img.onerror = function (err) {
                onerror(img, err);
            };

            var noIndexedDB = function () {
                img.src = url;
            };

            var loadFromIndexedDB = function () {
                database.loadImageFromDB(url, img);
            };

            //ANY database to do!
            if (database && database.enableTexturesOffline) {
                database.openAsync(loadFromIndexedDB, noIndexedDB);
            } else {
                if (url.indexOf("file:") === -1) {
                    noIndexedDB();
                } else {
                    try  {
                        var textureName = url.substring(5);
                        var blobURL;
                        try  {
                            blobURL = URL.createObjectURL(FilesTextures[textureName], { oneTimeOnly: true });
                        } catch (ex) {
                            // Chrome doesn't support oneTimeOnly parameter
                            blobURL = URL.createObjectURL(FilesTextures[textureName]);
                        }
                        img.src = blobURL;
                    } catch (e) {
                        console.log("Error while trying to load texture: " + textureName);
                        img.src = null;
                    }
                }
            }

            return img;
        };

        //ANY
        Tools.LoadFile = function (url, callback, progressCallBack, database, useArrayBuffer) {
            var noIndexedDB = function () {
                var request = new XMLHttpRequest();
                var loadUrl = Tools.BaseUrl + url;
                request.open('GET', loadUrl, true);

                if (useArrayBuffer) {
                    request.responseType = "arraybuffer";
                }

                request.onprogress = progressCallBack;

                request.onreadystatechange = function () {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            callback(!useArrayBuffer ? request.responseText : request.response);
                        } else {
                            throw new Error("Error status: " + request.status + " - Unable to load " + loadUrl);
                        }
                    }
                };

                request.send(null);
            };

            var loadFromIndexedDB = function () {
                database.loadSceneFromDB(url, callback, progressCallBack, noIndexedDB);
            };

            // Caching only scenes files
            if (database && url.indexOf(".babylon") !== -1 && (database.enableSceneOffline)) {
                database.openAsync(loadFromIndexedDB, noIndexedDB);
            } else {
                noIndexedDB();
            }
        };

        Tools.ReadFile = function (fileToLoad, callback, progressCallBack) {
            var reader = new FileReader();
            reader.onload = function (e) {
                callback(e.target.result);
            };
            reader.onprogress = progressCallBack;

            // Asynchronous read
            reader.readAsText(fileToLoad);
        };

        // Misc.
        Tools.WithinEpsilon = function (a, b) {
            var num = a - b;
            return -1.401298E-45 <= num && num <= 1.401298E-45;
        };

        Tools.DeepCopy = function (source, destination, doNotCopyList, mustCopyList) {
            for (var prop in source) {
                if (prop[0] === "_" && (!mustCopyList || mustCopyList.indexOf(prop) === -1)) {
                    continue;
                }

                if (doNotCopyList && doNotCopyList.indexOf(prop) !== -1) {
                    continue;
                }
                var sourceValue = source[prop];
                var typeOfSourceValue = typeof sourceValue;

                if (typeOfSourceValue == "function") {
                    continue;
                }

                if (typeOfSourceValue == "object") {
                    if (sourceValue instanceof Array) {
                        destination[prop] = [];

                        if (sourceValue.length > 0) {
                            if (typeof sourceValue[0] == "object") {
                                for (var index = 0; index < sourceValue.length; index++) {
                                    var clonedValue = cloneValue(sourceValue[index], destination);

                                    if (destination[prop].indexOf(clonedValue) === -1) {
                                        destination[prop].push(clonedValue);
                                    }
                                }
                            } else {
                                destination[prop] = sourceValue.slice(0);
                            }
                        }
                    } else {
                        destination[prop] = cloneValue(sourceValue, destination);
                    }
                } else {
                    destination[prop] = sourceValue;
                }
            }
        };

        Tools.IsEmpty = function (obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        };

        Tools.GetFps = function () {
            return fps;
        };

        Tools.GetDeltaTime = function () {
            return deltaTime;
        };

        Tools._MeasureFps = function () {
            previousFramesDuration.push((new Date).getTime());
            var length = previousFramesDuration.length;

            if (length >= 2) {
                deltaTime = previousFramesDuration[length - 1] - previousFramesDuration[length - 2];
            }

            if (length >= fpsRange) {
                if (length > fpsRange) {
                    previousFramesDuration.splice(0, 1);
                    length = previousFramesDuration.length;
                }

                var sum = 0;
                for (var id = 0; id < length - 1; id++) {
                    sum += previousFramesDuration[id + 1] - previousFramesDuration[id];
                }

                fps = 1000.0 / (sum / (length - 1));
            }
        };

        // Log.
        Tools.Log = {};

        Tools.Log.Level = {
            LOG: 1, // Do a console.log.
            WARN: 2, // Do a console.warn.
            ERROR: 4, // Do a console.error.
        };

        Tools.Log.enableFor = BABYLON.Tools.Log.Level.LOG | BABYLON.Tools.Log.Level.WARN | BABYLON.Tools.Log.Level.ERROR;

        Tools.Log.log = function (level, message) {
            var levelActive = (level & BABYLON.Tools.Log.enableFor);

            // LevelActive === 0 mean the level was not activated.
            if (!message || levelActive === 0) {
                return;
            }

            switch (levelActive) {
                case BABYLON.Tools.Log.Level.WARN:
                    console.warn(message);
                    break;
                case BABYLON.Tools.Log.Level.ERROR:
                    console.error(message);
                    break;
                case BABYLON.Tools.Log.Level.LOG:
                    console.log(message);
                    break;
            }
        };

        Tools.BaseUrl = "";
        return Tools;
    })();
    BABYLON.Tools = Tools;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.tools.js.map
