var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Mesh = (function (_super) {
        __extends(Mesh, _super);
        function Mesh(name, scene) {
            _super.call(this, name, scene);
            // Members
            this.position = new BABYLON.Vector3(0, 0, 0);
            this.rotation = new BABYLON.Vector3(0, 0, 0);
            this.rotationQuaternion = null;
            this.scaling = new BABYLON.Vector3(1, 1, 1);
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.material = null;
            this.isVisible = true;
            this.isPickable = true;
            this.visibility = 1.0;
            this.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
            this.checkCollisions = false;
            this.receiveShadows = false;
            this._isDisposed = false;
            this.onDispose = null;
            this.skeleton = null;
            this.renderingGroupId = 0;
            this.infiniteDistance = false;
            this.showBoundingBox = false;
            // Cache
            this._positions = null;
            this._localScaling = BABYLON.Matrix.Zero();
            this._localRotation = BABYLON.Matrix.Zero();
            this._localTranslation = BABYLON.Matrix.Zero();
            this._localBillboard = BABYLON.Matrix.Zero();
            this._localPivotScaling = BABYLON.Matrix.Zero();
            this._localPivotScalingRotation = BABYLON.Matrix.Zero();
            this._localWorld = BABYLON.Matrix.Zero();
            this._worldMatrix = BABYLON.Matrix.Zero();
            this._rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);
            this._collisionsTransformMatrix = BABYLON.Matrix.Zero();
            this._collisionsScalingMatrix = BABYLON.Matrix.Zero();
            this._absolutePosition = BABYLON.Vector3.Zero();
            this._isDirty = false;
            // Physics
            this._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
            this._pivotMatrix = BABYLON.Matrix.Identity();
            this._renderId = 0;
            this._onBeforeRenderCallbacks = [];
            this._animationStarted = false;
            this._newMeshForMerge = false;

            scene.meshes.push(this);
        }
        Object.defineProperty(Mesh, "BILLBOARDMODE_NONE", {
            get: function () {
                return Mesh._BILLBOARDMODE_NONE;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Mesh, "BILLBOARDMODE_X", {
            get: function () {
                return Mesh._BILLBOARDMODE_X;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Mesh, "BILLBOARDMODE_Y", {
            get: function () {
                return Mesh._BILLBOARDMODE_Y;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Mesh, "BILLBOARDMODE_Z", {
            get: function () {
                return Mesh._BILLBOARDMODE_Z;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Mesh, "BILLBOARDMODE_ALL", {
            get: function () {
                return Mesh._BILLBOARDMODE_ALL;
            },
            enumerable: true,
            configurable: true
        });

        Mesh.prototype.getBoundingInfo = function () {
            return this._boundingInfo;
        };

        Mesh.prototype.getWorldMatrix = function () {
            if (this._currentRenderId !== this.getScene().getRenderId()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        };

        Mesh.prototype.rotate = function (axis, amount, space) {
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = BABYLON.Vector3.Zero();
            }

            if (!space || space == 0 /* LOCAL */) {
                var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = this.rotationQuaternion.multiply(rotationQuaternion);
            } else {
                if (this.parent) {
                    var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                    invertParentWorldMatrix.invert();

                    axis = BABYLON.Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = rotationQuaternion.multiply(this.rotationQuaternion);
            }
        };

        Mesh.prototype.translate = function (axis, distance, space) {
            var displacementVector = axis.scale(distance);

            if (!space || space == 0 /* LOCAL */) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            } else {
                this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
            }
        };

        Mesh.prototype.getAbsolutePosition = function (force) {
            this.computeWorldMatrix(force);
            return this._absolutePosition;
        };

        Mesh.prototype.setAbsolutePosition = function (absolutePosition) {
            if (!absolutePosition) {
                return;
            }

            var absolutePositionX;
            var absolutePositionY;
            var absolutePositionZ;

            if (absolutePosition.x === undefined) {
                if (arguments.length < 3) {
                    return;
                }
                absolutePositionX = arguments[0];
                absolutePositionY = arguments[1];
                absolutePositionZ = arguments[2];
            } else {
                absolutePositionX = absolutePosition.x;
                absolutePositionY = absolutePosition.y;
                absolutePositionZ = absolutePosition.z;
            }

            if (this.parent) {
                var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                invertParentWorldMatrix.invert();

                var worldPosition = new BABYLON.Vector3(absolutePositionX, absolutePositionY, absolutePositionZ);

                this.position = BABYLON.Vector3.TransformCoordinates(worldPosition, invertParentWorldMatrix);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
        };

        Mesh.prototype.getTotalVertices = function () {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        };

        Mesh.prototype.getVerticesData = function (kind) {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind);
        };

        Mesh.prototype.getVertexBuffer = function (kind) {
            if (!this._geometry) {
                return undefined;
            }
            return this._geometry.getVertexBuffer(kind);
        };

        Mesh.prototype.isVerticesDataPresent = function (kind) {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        };

        Mesh.prototype.getVerticesDataKinds = function () {
            if (!this._geometry) {
                var result = [];
                if (this._delayInfo) {
                    for (var kind in this._delayInfo) {
                        result.push(kind);
                    }
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        };

        Mesh.prototype.getTotalIndices = function () {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        };

        Mesh.prototype.getIndices = function () {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices();
        };

        Mesh.prototype.setPivotMatrix = function (matrix) {
            this._pivotMatrix = matrix;
            this._cache.pivotMatrixUpdated = true;
        };

        Mesh.prototype.getPivotMatrix = function () {
            return this._pivotMatrix;
        };

        Mesh.prototype._isSynchronized = function () {
            if (this._isDirty) {
                return false;
            }

            if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE)
                return false;

            if (this._cache.pivotMatrixUpdated) {
                return false;
            }

            if (this.infiniteDistance) {
                return false;
            }

            if (!this._cache.position.equals(this.position))
                return false;

            if (this.rotationQuaternion) {
                if (!this._cache.rotationQuaternion.equals(this.rotationQuaternion))
                    return false;
            } else {
                if (!this._cache.rotation.equals(this.rotation))
                    return false;
            }

            if (!this._cache.scaling.equals(this.scaling))
                return false;

            return true;
        };

        Mesh.prototype.isReady = function () {
            return this._isReady;
        };

        Mesh.prototype.isAnimated = function () {
            return this._animationStarted;
        };

        Mesh.prototype.isDisposed = function () {
            return this._isDisposed;
        };

        // Methods
        Mesh.prototype._initCache = function () {
            _super.prototype._initCache.call(this);

            this._cache.localMatrixUpdated = false;
            this._cache.position = BABYLON.Vector3.Zero();
            this._cache.scaling = BABYLON.Vector3.Zero();
            this._cache.rotation = BABYLON.Vector3.Zero();
            this._cache.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 0);
        };

        Mesh.prototype.markAsDirty = function (property) {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
        };

        Mesh.prototype.refreshBoundingInfo = function () {
            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (data) {
                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this.getTotalVertices());
                this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
            }

            if (this.subMeshes) {
                for (var index = 0; index < this.subMeshes.length; index++) {
                    this.subMeshes[index].refreshBoundingInfo();
                }
            }

            this._updateBoundingInfo();
        };

        Mesh.prototype._updateBoundingInfo = function () {
            this._boundingInfo = this._boundingInfo || new BABYLON.BoundingInfo(this._absolutePosition, this._absolutePosition);

            this._boundingInfo._update(this._worldMatrix);

            if (!this.subMeshes) {
                return;
            }

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this._worldMatrix);
            }
        };

        Mesh.prototype.computeWorldMatrix = function (force) {
            if (!force && (this._currentRenderId == this.getScene().getRenderId() || this.isSynchronized(true))) {
                return this._worldMatrix;
            }

            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._currentRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            BABYLON.Matrix.ScalingToRef(this.scaling.x, this.scaling.y, this.scaling.z, this._localScaling);

            // Rotation
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(this._localRotation);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            } else {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
                this._cache.rotation.copyFrom(this.rotation);
            }

            // Translation
            if (this.infiniteDistance && !this.parent) {
                var camera = this.getScene().activeCamera;
                var cameraWorldMatrix = camera.getWorldMatrix();

                var cameraGlobalPosition = new BABYLON.Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                BABYLON.Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y, this.position.z + cameraGlobalPosition.z, this._localTranslation);
            } else {
                BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
            }

            // Composing transformations
            this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
            this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);

            // Billboarding
            if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE) {
                var localPosition = this.position.clone();
                var zero = this.getScene().activeCamera.position.clone();

                if (this.parent && this.parent.position) {
                    localPosition.addInPlace(this.parent.position);
                    BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
                }

                if ((this.billboardMode & Mesh.BILLBOARDMODE_ALL) === Mesh.BILLBOARDMODE_ALL) {
                    zero = this.getScene().activeCamera.position;
                } else {
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_X)
                        zero.x = localPosition.x + BABYLON.Engine.Epsilon;
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Y)
                        zero.y = localPosition.y + 0.001;
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Z)
                        zero.z = localPosition.z + 0.001;
                }

                BABYLON.Matrix.LookAtLHToRef(localPosition, zero, BABYLON.Vector3.Up(), this._localBillboard);
                this._localBillboard.m[12] = this._localBillboard.m[13] = this._localBillboard.m[14] = 0;

                this._localBillboard.invert();

                this._localPivotScalingRotation.multiplyToRef(this._localBillboard, this._localWorld);
                this._rotateYByPI.multiplyToRef(this._localWorld, this._localPivotScalingRotation);
            }

            // Local world
            this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix && this.billboardMode === BABYLON.Mesh.BILLBOARDMODE_NONE) {
                this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
            } else {
                this._worldMatrix.copyFrom(this._localWorld);
            }

            // Bounding info
            this._updateBoundingInfo();

            // Absolute position
            this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

            return this._worldMatrix;
        };

        Mesh.prototype._createGlobalSubMesh = function () {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            this.subMeshes = [];
            return new BABYLON.SubMesh(0, 0, totalVertices, 0, this.getTotalIndices(), this);
        };

        Mesh.prototype.subdivide = function (count) {
            if (count < 1) {
                return;
            }

            var totalIndices = this.getTotalIndices();
            var subdivisionSize = totalIndices / count;
            var offset = 0;

            this.subMeshes = [];
            for (var index = 0; index < count; index++) {
                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }
        };

        Mesh.Merge = function (meshesToMerge, newMeshName, scene, breakHierarchy, doNotDeleteAfterMerging, flattenChildren) {
            var newMesh = new BABYLON.Mesh(newMeshName, scene);

            // This variable is used to know that this mesh is the merged one
            // so we don't have to consider it in some case (like when calculating the center of meshes).
            // because it has been created just as a container.
            newMesh._newMeshForMerge = true;

            newMesh.mergeInPlace(meshesToMerge, breakHierarchy, doNotDeleteAfterMerging, flattenChildren);

            newMesh._newMeshForMerge = false;

            return newMesh;
        };

        Mesh.prototype.mergeInPlace = function (meshesToMerge, breakHierarchy, doNotDeleteAfterMerging, flattenChildren) {
            if (!meshesToMerge) {
                BABYLON.Tools.Error('Must have meshes to merge.');
                return;
            }

            if (!Array.isArray(meshesToMerge)) {
                meshesToMerge = [meshesToMerge];
            }

            if (flattenChildren) {
                this.flattenInPlace(Array.isArray(breakHierarchy) ? breakHierarchy[0] : breakHierarchy, doNotDeleteAfterMerging);

                for (var i = 0; i < meshesToMerge.length; ++i) {
                    // i + 1 because breakHierarchy[0] is for the merged one.
                    meshesToMerge[i].flattenInPlace(Array.isArray(breakHierarchy) ? breakHierarchy[i + 1] : breakHierarchy);
                }
            }

            return this._merge(meshesToMerge, breakHierarchy, doNotDeleteAfterMerging);
        };

        Mesh.prototype.flattenInPlace = function (breakHierarchy, doNotDeleteAfterMerging) {
            var descendants = this.getDescendants();

            if (!descendants || descendants.length <= 0)
                return this;

            this.mergeInPlace(descendants, breakHierarchy, doNotDeleteAfterMerging);
        };

        Mesh.prototype._merge = function (meshesToMerge, breakHierarchy, doNotDeleteAfterMerging) {
            this.computeWorldMatrix(true);

            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.UVKind, false, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.UV2Kind, false, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.ColorKind, false, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.MatricesIndicesKind, false, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.MatricesWeightsKind, false, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.NormalKind, false, true);

            // the delete of the mesh must be done during the last _setVerticesDataByMerging
            // because if we did it earlier, the mesh will be deleted for the next step.
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.PositionKind, breakHierarchy, doNotDeleteAfterMerging);

            return this;
        };

        Mesh.prototype._setVerticesDataByMerging = function (meshesToMerge, kind, breakHierarchy, doNotDeleteAfterMerging) {
            if (!(meshesToMerge instanceof Array)) {
                meshesToMerge = [meshesToMerge];
            }

            var vertices = [];
            var indices = [];
            var meshesToDispose = [];
            var center;
            var transformMatrixCenter;
            var parentWorldMatrixInv;
            var meshToMergeTransformMatrix;
            var invThisWorldMatrix;

            if (kind === BABYLON.VertexBuffer.PositionKind || kind === BABYLON.VertexBuffer.NormalKind) {
                indices = this.getIndices();

                invThisWorldMatrix = this.getWorldMatrix().clone();
                invThisWorldMatrix.invert();
            }

            for (var i = 0; i < meshesToMerge.length; ++i) {
                var meshToMerge = meshesToMerge[i];

                if (meshToMerge === this && meshToMerge.id === this.id) {
                    continue;
                }

                if (!meshToMerge.isVerticesDataPresent([kind])) {
                    continue;
                }

                var meshToMergeMatrix = meshToMerge.getWorldMatrix().clone();
                var transformMatrix = meshToMergeMatrix.multiply(invThisWorldMatrix);

                switch (kind) {
                    case BABYLON.VertexBuffer.PositionKind:
                        // merge positions.
                        if (vertices.length == 0) {
                            vertices = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                        }

                        // must be done before adding meshToMerge vertices to vertices array.
                        var maxValue = vertices.length / 3;

                        meshToMerge._getTransformedVerticesPositions(vertices, transformMatrix);

                        var tmpIndices = meshToMerge.getIndices();

                        // Concat indices.
                        var ite = 0;

                        // If there was no indices we just need to concat.
                        if (indices.length != 0) {
                            while (ite < tmpIndices.length) {
                                tmpIndices[ite++] += maxValue;
                            }
                        }

                        // Merge subMeshes
                        var meshToMergeSubMeshes = meshToMerge.subMeshes;
                        for (var idx = 0; idx < meshToMergeSubMeshes.length; ++idx) {
                            var meshToMergeSubMesh = meshToMergeSubMeshes[idx];

                            var indicesLength = indices.length > 0 ? indices.length : 0;
                            var indexStart = meshToMergeSubMesh.indexStart + indicesLength;
                            var verticesStart = meshToMergeSubMesh.verticesStart + maxValue;

                            this.subMeshes = this.subMeshes || [];

                            if (!this.material || !(this.material instanceof BABYLON.MultiMaterial)) {
                                // it was not a multiMaterial so it means there was only one material.
                                var previousMaterial = this.material;

                                this.material = new BABYLON.MultiMaterial(this.name + "Material", this.getScene());
                                this.material.subMaterials.push(previousMaterial);
                            }

                            this.material.subMaterials.push(meshToMergeSubMesh.getMaterial());

                            var materialIndex = this.material.subMaterials.length - 1;

                            new BABYLON.SubMesh(materialIndex, verticesStart, meshToMergeSubMesh.verticesCount, indexStart, meshToMergeSubMesh.indexCount, this);
                        }

                        //
                        indices = indices.concat(tmpIndices);

                        if (!doNotDeleteAfterMerging) {
                            // When we delete the meshToMerge, we need to reset its children position into the world,
                            // because we gonna delete the meshToMerge and we don't want to move children's position.
                            // breakHierarchy[i + 1] because 0 is for "this" mesh.
                            var haveToBreakHierarchy = false;
                            if ((typeof breakHierarchy == "boolean" && breakHierarchy) || (Array.isArray(breakHierarchy) && breakHierarchy[i + 1])) {
                                haveToBreakHierarchy = true;
                            }

                            var children = meshToMerge.getChildren();
                            var meshToMergeWorldMatrix = meshToMerge.getWorldMatrix();

                            for (var ci in children) {
                                var child = children[ci];

                                if (haveToBreakHierarchy) {
                                    // TODO: make a method to break hierarchy.
                                    child._breakHierarchy(meshToMergeWorldMatrix);
                                } else {
                                    // transform child.
                                }
                            }

                            // Have to store meshes to dispose to avoid collection modification.
                            // e.g: When you want to merge all  meshes of a scene we give the meshes collection
                            // and when we dispose one mesh it decrease the meshesToMerge length.
                            meshesToDispose.push(meshToMerge);
                        }
                        break;
                    case BABYLON.VertexBuffer.NormalKind:
                        if (vertices.length == 0 && this.isVerticesDataPresent(kind)) {
                            vertices = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                        }

                        meshToMerge._getTransformedVerticesNormal(vertices, transformMatrix);
                        break;
                    default:
                        // means we treat the first mesh to merge.
                        if (vertices.length == 0 && this.isVerticesDataPresent(kind)) {
                            vertices = this.getVerticesData(kind);
                        }

                        if (meshToMerge.isVerticesDataPresent([kind])) {
                            vertices = vertices.concat(meshToMerge.getVerticesData(kind));
                        }
                        break;
                }
            }

            for (var i = 0; i < meshesToDispose.length; ++i) {
                meshesToDispose[i].dispose(true);
            }

            if (vertices.length >= BABYLON.Mesh.VERTICESLIMITATION) {
                BABYLON.Tools.Warn('Mesh "' + this.name + '" have more than ' + BABYLON.Mesh.VERTICESLIMITATION + 'vertices !');
            }

            if (vertices.length === 0)
                return;

            this.setVerticesData(vertices, kind, false, true);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                this.setIndices(indices, true);

                // Transform children's position.
                var thisChildren = this.getChildren();

                var haveToBreakHierarchy = false;
                if ((typeof breakHierarchy == "boolean" && breakHierarchy) || (Array.isArray(breakHierarchy) && breakHierarchy[0])) {
                    haveToBreakHierarchy = true;
                }

                var meshWorldMatrix = this.getWorldMatrix();

                for (var thisCi = 0; thisCi < thisChildren.length; ++thisCi) {
                    var thisChild = thisChildren[thisCi];

                    // Just added means the child was added by merging.
                    if (thisChild.justAdded) {
                        continue;
                    }

                    if (haveToBreakHierarchy) {
                        thisChild._breakHierarchy(meshToMergeWorldMatrix);
                        thisChild.parent = null;
                    }
                }
                //this.position = center;
            }
        };

        Mesh.prototype.getCenterPositionOfMeshes = function (meshes) {
            var center = this.getAbsolutePosition(true);

            // Use avoid calculate a wrong center if "this" appear several times.
            var currentMeshApparition = 0;

            for (var i = 0; i < meshes.length; ++i) {
                var mesh = meshes[i];

                if (mesh === this && mesh.id === this.id) {
                    ++currentMeshApparition;
                    continue;
                }

                center = center.add(mesh.getAbsolutePosition(true));
            }

            // +1 because "this" is not in meshes array.
            var meshesCount = meshes.length - currentMeshApparition + 1;

            // newMeshForMerge means the mesh is a new created one and we gonna put all meshesToMerge's vertices into this new mesh.
            // So we need to decrease meshesCount to skip it and to don't make the center wrong.
            if (this._newMeshForMerge)
                --meshesCount;

            if (meshesCount > 0)
                center = center.scale(1 / meshesCount);

            return center;
        };

        Mesh.prototype._getTransformedVerticesPositions = function (vertices, transformMatrix) {
            this._getTransformedVertices(BABYLON.VertexBuffer.PositionKind, vertices, transformMatrix);
        };

        Mesh.prototype._getTransformedVerticesNormal = function (vertices, transformMatrix) {
            this._getTransformedVertices(BABYLON.VertexBuffer.NormalKind, vertices, transformMatrix);
        };

        Mesh.prototype._getTransformedVertices = function (kind, vertices, transformMatrix) {
            if (!this.isVerticesDataPresent(kind)) {
                return;
            }

            var localVertices = this.getVerticesData(kind);

            var ite = 0;
            while (ite < localVertices.length) {
                var vertex;
                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    vertex = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(localVertices[ite++], localVertices[ite++], localVertices[ite++]), transformMatrix);
                } else {
                    vertex = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(localVertices[ite++], localVertices[ite++], localVertices[ite++]), transformMatrix);
                }
                vertices.push(vertex.x);
                vertices.push(vertex.y);
                vertices.push(vertex.z);
            }
        };

        Mesh.prototype.breakHierarchy = function () {
            var children = this.getChildren();

            if (!children || children.length <= 0) {
                return;
            }

            var worldMatrix = this.getWorldMatrix();

            for (var i = 0; i < children.length; ++i) {
                var child = children[i];

                child._breakHierarchy(worldMatrix);
            }
        };

        Mesh.prototype._breakHierarchy = function (parentWorldMatrix) {
            this.parent = null;

            if (!parentWorldMatrix) {
                return;
            }

            this.setPivotMatrix(parentWorldMatrix.clone());
        };

        Mesh.prototype.decomposeTranslationRotationScalingMatrix = function (matrix) {
            var innerMatrix = matrix.clone();

            // Translation
            var positionX = innerMatrix.m[12];
            var positionY = innerMatrix.m[13];
            var positionZ = innerMatrix.m[14];

            var translation = new BABYLON.Vector3(positionX, positionY, positionZ);
            var translationMatrixInv = BABYLON.Matrix.Translation(-positionX, -positionY, -positionZ);

            //
            // Scaling
            var scalingX = Math.sqrt(innerMatrix.m[0] * innerMatrix.m[0] + innerMatrix.m[1] * innerMatrix.m[1] + innerMatrix.m[2] * innerMatrix.m[2]);
            var scalingY = Math.sqrt(innerMatrix.m[4] * innerMatrix.m[4] + innerMatrix.m[5] * innerMatrix.m[5] + innerMatrix.m[6] * innerMatrix.m[6]);
            var scalingZ = Math.sqrt(innerMatrix.m[8] * innerMatrix.m[8] + innerMatrix.m[9] * innerMatrix.m[9] + innerMatrix.m[10] * innerMatrix.m[10]);

            var scaling = new BABYLON.Vector3(scalingX, scalingY, scalingZ);

            //
            // Rotation
            var rotationMatrix = innerMatrix.multiply(translationMatrixInv);

            // Normalize to remove scaling.
            if (scalingX) {
                rotationMatrix.m[0] /= scalingX;
                rotationMatrix.m[1] /= scalingX;
                rotationMatrix.m[2] /= scalingX;
            }
            if (scalingY) {
                rotationMatrix.m[4] /= scalingY;
                rotationMatrix.m[5] /= scalingY;
                rotationMatrix.m[6] /= scalingY;
            }
            if (scalingZ) {
                rotationMatrix.m[8] /= scalingZ;
                rotationMatrix.m[9] /= scalingZ;
                rotationMatrix.m[10] /= scalingZ;
            }

            //
            var rotationX = Math.asin(-rotationMatrix.m[9]);
            var rotationY = Math.atan2(rotationMatrix.m[8], rotationMatrix.m[10]);
            var rotationZ = Math.atan2(rotationMatrix.m[1], rotationMatrix.m[5]);

            var rotation = new BABYLON.Vector3(rotationX, rotationY, rotationZ);

            //
            var result = {
                translation: translation,
                scaling: scaling,
                rotation: rotation
            };

            return result;
        };

        Mesh.prototype.setVerticesData = function (data, kind, updatable, keepSubMeshesAsAre) {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, updatable, this);
            } else {
                this._geometry.setVerticesData(data, kind, updatable, keepSubMeshesAsAre);
            }
        };

        Mesh.prototype.updateVerticesData = function (kind, data, updateExtends, makeItUnique) {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            } else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        };

        Mesh.prototype.makeGeometryUnique = function () {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(BABYLON.Geometry.RandomId());
            geometry.applyToMesh(this);
        };

        Mesh.prototype.setIndices = function (indices, keepSubMeshesAsAre) {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, false, this);
            } else {
                this._geometry.setIndices(indices, keepSubMeshesAsAre);
            }
        };

        // ANY
        Mesh.prototype.bindAndDraw = function (subMesh, effect, wireframe) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind = this._geometry.getIndexBuffer();
            var useTriangles = true;

            if (wireframe) {
                indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
                useTriangles = false;
            }

            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
        };

        Mesh.prototype.registerBeforeRender = function (func) {
            this._onBeforeRenderCallbacks.push(func);
        };

        Mesh.prototype.unregisterBeforeRender = function (func) {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        };

        Mesh.prototype.render = function (subMesh) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // World
            var world = this.getWorldMatrix();

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
                return;
            }

            effectiveMaterial._preBind();
            effectiveMaterial.bind(world, this);

            // Bind and draw
            var engine = this.getScene().getEngine();
            this.bindAndDraw(subMesh, effectiveMaterial.getEffect(), engine.forceWireframe || effectiveMaterial.wireframe);

            // Unbind
            effectiveMaterial.unbind();
        };

        Mesh.prototype.getEmittedParticleSystems = function () {
            var results = new Array();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }

            return results;
        };

        Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
            var results = new Array();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (descendants.indexOf(particleSystem.emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        };

        Mesh.prototype.getChildren = function () {
            var results = [];
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];
                if (mesh.parent == this) {
                    results.push(mesh);
                }
            }

            return results;
        };

        Mesh.prototype.isInFrustum = function (frustumPlanes) {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (!this._boundingInfo.isInFrustum(frustumPlanes)) {
                return false;
            }

            var that = this;
            var scene = this.getScene();

            if (this._geometry) {
                this._geometry.load(scene);
            } else if (that.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;

                scene._addPendingData(that);

                BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                    that._delayLoadingFunction(JSON.parse(data), that);
                    that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(that);
                }, function () {
                }, scene.database);
            }

            return true;
        };

        Mesh.prototype.setMaterialByID = function (id) {
            var materials = this.getScene().materials;
            for (var index = 0; index < materials.length; index++) {
                if (materials[index].id == id) {
                    this.material = materials[index];
                    return;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id == id) {
                    this.material = multiMaterials[index];
                    return;
                }
            }
        };

        Mesh.prototype.getAnimatables = function () {
            var results = [];

            if (this.material) {
                results.push(this.material);
            }

            return results;
        };

        // Geometry
        Mesh.prototype.setPositionWithLocalVector = function (vector3) {
            this.computeWorldMatrix();

            this.position = BABYLON.Vector3.TransformNormal(vector3, this._localWorld);
        };

        Mesh.prototype.getPositionExpressedInLocalSpace = function () {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();

            return BABYLON.Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        };

        Mesh.prototype.locallyTranslate = function (vector3) {
            this.computeWorldMatrix();

            this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
        };

        Mesh.prototype.bakeTransformIntoVertices = function (transform) {
            // Position
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                return;
            }

            this._resetPointsArrayCache();

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var temp = [];
            for (var index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
        };

        Mesh.prototype.lookAt = function (targetPoint, yawCor, pitchCor, rollCor) {
            /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
            /// <param name="targetPoint" type="BABYLON.Vector3">The position (must be in same space as current mesh) to look at</param>
            /// <param name="yawCor" type="Number">optional yaw (y-axis) correction in radians</param>
            /// <param name="pitchCor" type="Number">optional pitch (x-axis) correction in radians</param>
            /// <param name="rollCor" type="Number">optional roll (z-axis) correction in radians</param>
            /// <returns>Mesh oriented towards targetMesh</returns>
            yawCor = yawCor || 0; // default to zero if undefined
            pitchCor = pitchCor || 0;
            rollCor = rollCor || 0;

            var dv = targetPoint.subtract(this.position);
            var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
            var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
            var pitch = Math.atan2(dv.y, len);
            this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(yaw + yawCor, pitch + pitchCor, rollCor);
        };

        // Cache
        Mesh.prototype._resetPointsArrayCache = function () {
            this._positions = null;
        };

        Mesh.prototype._generatePointsArray = function () {
            if (this._positions)
                return;

            this._positions = [];

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            for (var index = 0; index < data.length; index += 3) {
                this._positions.push(BABYLON.Vector3.FromArray(data, index));
            }
        };

        // Collisions
        Mesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
            this._generatePointsArray();

            // Transformation
            if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
                subMesh._lastColliderTransformMatrix = transformMatrix.clone();
                subMesh._lastColliderWorldVertices = [];
                subMesh._trianglePlanes = [];
                var start = subMesh.verticesStart;
                var end = (subMesh.verticesStart + subMesh.verticesCount);
                for (var i = start; i < end; i++) {
                    subMesh._lastColliderWorldVertices.push(BABYLON.Vector3.TransformCoordinates(this._positions[i], transformMatrix));
                }
            }

            // Collide
            collider._collide(subMesh, subMesh._lastColliderWorldVertices, this.getIndices(), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
        };

        Mesh.prototype._processCollisionsForSubModels = function (collider, transformMatrix) {
            for (var index = 0; index < this.subMeshes.length; index++) {
                var subMesh = this.subMeshes[index];

                // Bounding test
                if (this.subMeshes.length > 1 && !subMesh._checkCollision(collider))
                    continue;

                this._collideForSubMesh(subMesh, transformMatrix, collider);
            }
        };

        Mesh.prototype._checkCollision = function (collider) {
            // Bounding box test
            if (!this._boundingInfo._checkCollision(collider))
                return;

            // Transformation matrix
            BABYLON.Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
            this._worldMatrix.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

            this._processCollisionsForSubModels(collider, this._collisionsTransformMatrix);
        };

        Mesh.prototype.intersectsMesh = function (mesh, precise) {
            if (!this._boundingInfo || !mesh._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersects(mesh._boundingInfo, precise);
        };

        Mesh.prototype.intersectsPoint = function (point) {
            if (!this._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersectsPoint(point);
        };

        // Picking
        Mesh.prototype.intersects = function (ray, fastCheck) {
            var pickingInfo = new BABYLON.PickingInfo();

            if (!this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
                return pickingInfo;
            }

            this._generatePointsArray();

            var intersectInfo = null;

            for (var index = 0; index < this.subMeshes.length; index++) {
                var subMesh = this.subMeshes[index];

                // Bounding test
                if (this.subMeshes.length > 1 && !subMesh.canIntersects(ray))
                    continue;

                var currentIntersectInfo = subMesh.intersects(ray, this._positions, this.getIndices(), fastCheck);

                if (currentIntersectInfo) {
                    if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                        intersectInfo = currentIntersectInfo;

                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }

            if (intersectInfo) {
                // Get picked point
                var world = this.getWorldMatrix();
                var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
                var direction = ray.direction.clone();
                direction.normalize();
                direction = direction.scale(intersectInfo.distance);
                var worldDirection = BABYLON.Vector3.TransformNormal(direction, world);

                var pickedPoint = worldOrigin.add(worldDirection);

                // Return result
                pickingInfo.hit = true;
                pickingInfo.distance = BABYLON.Vector3.Distance(worldOrigin, pickedPoint);
                pickingInfo.pickedPoint = pickedPoint;
                pickingInfo.pickedMesh = this;
                pickingInfo.bu = intersectInfo.bu;
                pickingInfo.bv = intersectInfo.bv;
                pickingInfo.faceId = intersectInfo.faceId;
                return pickingInfo;
            }

            return pickingInfo;
        };

        // Clone
        Mesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
            var result = new BABYLON.Mesh(name, this.getScene());

            // Geometry
            this._geometry.applyToMesh(result);

            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], []);

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            // Material
            result.material = this.material;

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent == this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            for (index = 0; index < this.getScene().particleSystems.length; index++) {
                var system = this.getScene().particleSystems[index];

                if (system.emitter == this) {
                    system.clone(system.name, result);
                }
            }

            result.computeWorldMatrix(true);

            return result;
        };

        // Dispose
        Mesh.prototype.dispose = function (doNotRecurse) {
            if (this._geometry) {
                this._geometry.releaseForMesh(this);
            }

            // Physics
            if (this.getPhysicsImpostor() != BABYLON.PhysicsEngine.NoImpostor) {
                this.setPhysicsState(BABYLON.PhysicsEngine.NoImpostor);
            }

            // Remove from scene
            var index = this.getScene().meshes.indexOf(this);
            this.getScene().meshes.splice(index, 1);

            if (!doNotRecurse) {
                for (index = 0; index < this.getScene().particleSystems.length; index++) {
                    if (this.getScene().particleSystems[index].emitter == this) {
                        this.getScene().particleSystems[index].dispose();
                        index--;
                    }
                }

                // Children
                var objects = this.getScene().meshes.slice(0);
                for (index = 0; index < objects.length; index++) {
                    if (objects[index].parent == this) {
                        objects[index].dispose();
                    }
                }
            } else {
                for (index = 0; index < this.getScene().meshes.length; index++) {
                    var obj = this.getScene().meshes[index];
                    if (obj.parent === this) {
                        obj.parent = null;
                        obj.computeWorldMatrix(true);
                    }
                }
            }

            this._isDisposed = true;

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };

        // Physics
        Mesh.prototype.setPhysicsState = function (impostor, options) {
            var physicsEngine = this.getScene().getPhysicsEngine();

            if (!physicsEngine) {
                return;
            }

            if (impostor.impostor) {
                // Old API
                options = impostor;
                impostor = impostor.impostor;
            }

            impostor = impostor || BABYLON.PhysicsEngine.NoImpostor;

            if (impostor === BABYLON.PhysicsEngine.NoImpostor) {
                physicsEngine._unregisterMesh(this);
                return;
            }

            options.mass = options.mass || 0;
            options.friction = options.friction || 0.2;
            options.restitution = options.restitution || 0.9;

            this._physicImpostor = impostor;
            this._physicsMass = options.mass;
            this._physicsFriction = options.friction;
            this._physicRestitution = options.restitution;

            physicsEngine._registerMesh(this, impostor, options);
        };

        Mesh.prototype.getPhysicsImpostor = function () {
            if (!this._physicImpostor) {
                return BABYLON.PhysicsEngine.NoImpostor;
            }

            return this._physicImpostor;
        };

        Mesh.prototype.getPhysicsMass = function () {
            if (!this._physicsMass) {
                return 0;
            }

            return this._physicsMass;
        };

        Mesh.prototype.getPhysicsFriction = function () {
            if (!this._physicsFriction) {
                return 0;
            }

            return this._physicsFriction;
        };

        Mesh.prototype.getPhysicsRestitution = function () {
            if (!this._physicRestitution) {
                return 0;
            }

            return this._physicRestitution;
        };

        Mesh.prototype.applyImpulse = function (force, contactPoint) {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._applyImpulse(this, force, contactPoint);
        };

        Mesh.prototype.setPhysicsLinkWith = function (otherMesh, pivot1, pivot2) {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._createLink(this, otherMesh, pivot1, pivot2);
        };

        // Geometric tools
        Mesh.prototype.convertToFlatShadedMesh = function () {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>
            var kinds = this.getVerticesDataKinds();
            var vbs = [];
            var data = [];
            var newdata = [];
            var updatableNormals = false;
            for (var kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                var kind = kinds[kindIndex];
                var vertexBuffer = this.getVertexBuffer(kind);

                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();
            var totalIndices = this.getTotalIndices();

            for (index = 0; index < totalIndices; index++) {
                var vertexIndex = indices[index];

                for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                    kind = kinds[kindIndex];
                    var stride = vbs[kind].getStrideSize();

                    for (var offset = 0; offset < stride; offset++) {
                        newdata[kind].push(data[kind][vertexIndex * stride + offset]);
                    }
                }
            }

            // Updating faces & normal
            var normals = [];
            var positions = newdata[BABYLON.VertexBuffer.PositionKind];
            for (var index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;

                var p1 = BABYLON.Vector3.FromArray(positions, index * 3);
                var p2 = BABYLON.Vector3.FromArray(positions, (index + 1) * 3);
                var p3 = BABYLON.Vector3.FromArray(positions, (index + 2) * 3);

                var p1p2 = p1.subtract(p2);
                var p3p2 = p3.subtract(p2);

                var normal = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));

                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }

            this.setIndices(indices);
            this.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatableNormals);

            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(newdata[kind], kind, vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.subMeshes = [];
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                var subMesh = new BABYLON.SubMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }
        };

        // Statics
        Mesh.CreateBox = function (name, size, scene, updatable) {
            var box = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(size);

            vertexData.applyToMesh(box, updatable);

            return box;
        };

        Mesh.CreateSphere = function (name, segments, diameter, scene, updatable) {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(segments, diameter);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        };

        // Cylinder and cone (Code inspired by SharpDX.org)
        Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, scene, updatable) {
            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        };

        // Torus  (Code from SharpDX.org)
        Mesh.CreateTorus = function (name, diameter, thickness, tessellation, scene, updatable) {
            var torus = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(diameter, thickness, tessellation);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        };

        Mesh.CreateTorusKnot = function (name, radius, tube, radialSegments, tubularSegments, p, q, scene, updatable) {
            var torusKnot = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        };

        // Plane & ground
        Mesh.CreatePlane = function (name, size, scene, updatable) {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        };

        Mesh.CreateGround = function (name, width, height, subdivisions, scene, updatable) {
            var ground = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

            return ground;
        };

        Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
            var ground = new BABYLON.Mesh(name, scene);

            var onload = function (img) {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                var vertexData = BABYLON.VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);

                vertexData.applyToMesh(ground, updatable);

                ground._isReady = true;
            };

            BABYLON.Tools.LoadImage(url, onload, function () {
            }, scene.database);

            ground._isReady = false;

            return ground;
        };

        // Tools
        Mesh.MinMax = function (meshes) {
            var minVector = null;
            var maxVector = null;
            for (var i in meshes) {
                var mesh = meshes[i];
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                if (!minVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                    continue;
                }
                minVector.MinimizeInPlace(boundingBox.minimumWorld);
                maxVector.MaximizeInPlace(boundingBox.maximumWorld);
            }

            return {
                min: minVector,
                max: maxVector
            };
        };

        Mesh.Center = function (meshesOrMinMaxVector) {
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
            return BABYLON.Vector3.Center(minMaxVector.min, minMaxVector.max);
        };
        Mesh.VERTICESLIMITATION = 65535;
        Mesh._BILLBOARDMODE_NONE = 0;
        Mesh._BILLBOARDMODE_X = 1;
        Mesh._BILLBOARDMODE_Y = 2;
        Mesh._BILLBOARDMODE_Z = 4;
        Mesh._BILLBOARDMODE_ALL = 7;

        Mesh.Between0And2PI = function (number) {
            var r = number % (2 * Math.PI);

            if (number < 0) {
                r += 2 * Math.PI;
            }

            return r;
        };
        return Mesh;
    })(BABYLON.Node);
    BABYLON.Mesh = Mesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mesh.js.map
