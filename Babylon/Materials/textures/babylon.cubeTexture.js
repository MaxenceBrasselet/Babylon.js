﻿var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var CubeTexture = (function (_super) {
        __extends(CubeTexture, _super);
        //ANY
        function CubeTexture(rootUrl, scene, extensions, noMipmap) {
            _super.call(this, scene);
            this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;

            this.name = rootUrl;
            this.url = rootUrl;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;

            this._texture = this._getFromCache(rootUrl, noMipmap);

            if (!extensions) {
                extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
            }

            this._extensions = extensions;

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, extensions, noMipmap);
                } else {
                    this.delayLoadState = 4; //ANY BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }

            this.isCube = true;

            this._textureMatrix = BABYLON.Matrix.Identity();
        }
        // Methods
        CubeTexture.prototype.delayLoad = function () {
            if (this.delayLoadState != 4) {
                return;
            }

            this.delayLoadState = 1; //ANY BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                this._texture = this.getScene().getEngine().createCubeTexture(this.url, this.getScene(), this._extensions);
            }
        };

        CubeTexture.prototype._computeReflectionTextureMatrix = function () {
            return this._textureMatrix;
        };
        return CubeTexture;
    })(BABYLON.BaseTexture);
    BABYLON.CubeTexture = CubeTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.cubeTexture.js.map
