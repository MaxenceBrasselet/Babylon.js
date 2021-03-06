﻿module BABYLON {
    export class RenderTargetTexture extends Texture {
        public renderList = new Array<Mesh>();
        public renderParticles = true;
        public renderSprites = false;
        public isRenderTarget = true;
        public coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
        public onBeforeRender: () => void;
        public onAfterRender: () => void;
        public customRenderFunction: (opaqueSubMeshes: SmartArray, transparentSubMeshes: SmartArray, alphaTestSubMeshes: SmartArray, beforeTransparents: () => void) => void;

        private _size: number;
        public _generateMipMaps: boolean;
        private _renderingManager
        public _waitingRenderList: number[];

        //ANY
        constructor(name: string, size: number, scene, generateMipMaps?: boolean) {
            super(null, scene, !generateMipMaps);

            this.name = name;
            this._size = size;
            this._generateMipMaps = generateMipMaps;

            this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);

            // Rendering groups
            this._renderingManager = new BABYLON.RenderingManager(scene);
        }

        public resize(size, generateMipMaps) {
            this.releaseInternalTexture();
            this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
        }

        public render() {

            if (this.onBeforeRender) {
                this.onBeforeRender();
            }

            var scene = this.getScene();
            var engine = scene.getEngine();

            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    this.renderList.push(scene.getMeshByID(id));
                }

                delete this._waitingRenderList;
            }

            if (!this.renderList || this.renderList.length == 0) {
                if (this.onAfterRender) {
                    this.onAfterRender();
                }
                return;
            }

            // Bind
            engine.bindFramebuffer(this._texture);

            // Clear
            engine.clear(scene.clearColor, true, true);

            this._renderingManager.reset();

            for (var meshIndex = 0; meshIndex < this.renderList.length; meshIndex++) {
                var mesh = this.renderList[meshIndex];

                if (mesh && mesh.isEnabled() && mesh.isVisible) {
                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];
                        scene._activeVertices += subMesh.verticesCount;
                        this._renderingManager.dispatch(subMesh);
                    }
                }
            }

            // Render
            this._renderingManager.render(this.customRenderFunction, this.renderList, this.renderParticles, this.renderSprites);

            //Call this before unBinding Framebuffer in case of manipulating texture with WebGL commands inside the onAfterRender method.
            if (this.onAfterRender) {
                this.onAfterRender();
            }

            // Unbind
            engine.unBindFramebuffer(this._texture);
        }

        public clone(): RenderTargetTexture {
            var textureSize = this.getSize();
            var newTexture = new BABYLON.RenderTargetTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }
    }
} 