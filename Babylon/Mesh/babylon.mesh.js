﻿var __extends = this.__extends || function (d, b) {
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
            // Physics
            this._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
            this._totalVertices = 0;
            this._pivotMatrix = BABYLON.Matrix.Identity();
            this._indices = [];
            this._renderId = 0;
            this._onBeforeRenderCallbacks = [];
            this._vertexStrideSize = 0;
            this._animationStarted = false;

            scene.meshes.push(this);
        }
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

        Mesh.prototype.getAbsolutePosition = function () {
            this.computeWorldMatrix();
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
            return this._totalVertices;
        };

        Mesh.prototype.getVerticesData = function (kind) {
            return this._vertexBuffers[kind].getData();
        };

        Mesh.prototype.getVertexBuffer = function (kind) {
            return this._vertexBuffers[kind];
        };

        Mesh.prototype.isVerticesDataPresent = function (kind) {
            if (!this._vertexBuffers) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._vertexBuffers[kind] !== undefined;
        };

        Mesh.prototype.getVerticesDataKinds = function () {
            var result = [];
            if (!this._vertexBuffers && this._delayInfo) {
                for (var kind in this._delayInfo) {
                    result.push(kind);
                }
            } else {
                for (kind in this._vertexBuffers) {
                    result.push(kind);
                }
            }

            return result;
        };

        Mesh.prototype.getTotalIndices = function () {
            return this._indices.length;
        };

        Mesh.prototype.getIndices = function () {
            return this._indices;
        };

        Mesh.prototype.getVertexStrideSize = function () {
            return this._vertexStrideSize;
        };

        Mesh.prototype.setPivotMatrix = function (matrix) {
            this._pivotMatrix = matrix;
            this._cache.pivotMatrixUpdated = true;
        };

        Mesh.prototype.getPivotMatrix = function () {
            return this._pivotMatrix;
        };

        Mesh.prototype._isSynchronized = function () {
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
            this._currentRenderId = -1;
        };

        Mesh.prototype.refreshBoundingInfo = function () {
            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (!data) {
                return;
            }

            var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
            this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            for (var index = 0; index < this.subMeshes.length; index++) {
                this.subMeshes[index].refreshBoundingInfo();
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
            if (!this._totalVertices || !this._indices) {
                return null;
            }

            this.subMeshes = [];
            return new BABYLON.SubMesh(0, 0, this._totalVertices, 0, this._indices.length, this);
        };

        Mesh.prototype.subdivide = function (count) {
            if (count < 1) {
                return;
            }

            var subdivisionSize = this._indices.length / count;
            var offset = 0;

            this.subMeshes = [];
            for (var index = 0; index < count; index++) {
                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, this._indices.length - offset), this);

                offset += subdivisionSize;
            }
        };

        Mesh.prototype._setVerticesDataByMerging = function (meshesToMerge, kind, doNotDeleteAfterMerging) {
            if (!(meshesToMerge instanceof Array))
                meshesToMerge = [meshesToMerge];
            
            var vertices = [];
            var indices = [];

            // Indices are only useful for positions.
            if (kind === BABYLON.VertexBuffer.PositionKind)
                indices = this.getIndices();
            
            // Calculate center of all meshes merged to know the final center, 
            // thus we'll transform all vertices position into the new center space.
            var center = this.getCenterPositionOfMeshes(meshesToMerge);

            // Generate transform matrix to center space.
            // transformMatrixCenter to convert all vertices of each mershToMerge in center space.
            var transformMatrixCenter = BABYLON.Matrix.Translation(center.x, center.y, center.z);
            transformMatrixCenter.invert();

            var meshParent = this.parent;
            var parentWorldMatrixInv;

            if (meshParent) {
                parentWorldMatrixInv = meshParent.getWorldMatrix().clone();
                parentWorldMatrixInv.invert();
            }

            var meshTransformMatrix;
            if (kind === BABYLON.VertexBuffer.PositionKind
                || kind === BABYLON.VertexBuffer.NormalKind) {
                meshTransformMatrix = this._localWorld.multiply(transformMatrixCenter);
            }

            // Transform vertices into the center space.
            for (var i = 0; i < meshesToMerge.length; ++i) {
                var meshToMerge = meshesToMerge[i];

                if (meshToMerge === this && meshToMerge.id === this.id) {
                    // Trying to merge with itself.
                    continue;
                }

                if (!meshToMerge.isVerticesDataPresent([kind]))
                    continue;

                var meshToMergeTransformMatrix;

                if (kind === BABYLON.VertexBuffer.PositionKind
                    || kind === BABYLON.VertexBuffer.NormalKind) {
                    // meshToMerge position expressed in this.parent space.
                    var meshToMergePosition = meshToMerge.position;
                    // Transform to apply on meshToMergePosition to express it into this.parent space.
                    var toMergeInParentWorldTransform = meshToMerge.getWorldMatrix();

                    if (meshParent) {
                        toMergeInParentWorldTransform = toMergeInParentWorldTransform.multiply(parentWorldMatrixInv);

                        meshToMergePosition = BABYLON.Vector3.TransformCoordinates(meshToMergePosition, toMergeInParentWorldTransform);
                    }
                    else {
                        meshToMergePosition = meshToMerge.getAbsolutePosition();
                    }

                    meshToMergeTransformMatrix = toMergeInParentWorldTransform.multiply(transformMatrixCenter);
                }

                switch (kind) {
                    case BABYLON.VertexBuffer.PositionKind:
                        // merge positions.                
                        if (vertices.length == 0) { // means we treat the first mesh to merge with vertices.                
                            this._getVerticesPositionsAndNormals(kind, vertices, meshTransformMatrix);
                        }

                        // must be done before adding meshToMerge vertices to vertices array.
                        var maxValue = vertices.length / 3;

                        meshToMerge._getVerticesPositionsAndNormals(kind, vertices, meshToMergeTransformMatrix);

                        var tmpIndices = meshToMerge.getIndices();

                        // Concat indices.
                        ite = 0;
                        // If there was no indices we just need to concat.
                        if (indices.length != 0) {
                            while (ite < tmpIndices.length) {
                                tmpIndices[ite++] += maxValue;
                            }
                        }

                        // Merge subMeshes
                        var meshToMergeSubMeshes = meshToMerge.subMeshes;
                        for (var i = 0; i < meshToMergeSubMeshes.length; ++i) {
                            var meshToMergeSubMesh = meshToMergeSubMeshes[i];

                            var indicesLength = indices.length > 0 ? indices.length : 0;
                            var indexStart = meshToMergeSubMesh.indexStart + indicesLength;
                            var verticesStart = meshToMergeSubMesh.verticesStart + maxValue;

                            this.subMeshes = this.subMeshes || [];

                            if (!this.material || !(this.material instanceof BABYLON.MultiMaterial)) {
                                this.material = new BABYLON.MultiMaterial(this.name + "Material", this.getScene());
                            }

                            this.material.subMaterials.push(meshToMergeSubMesh.getMaterial());
                            
                            var materialIndex = this.material.subMaterials.length - 1;

                            new BABYLON.SubMesh(materialIndex, verticesStart, meshToMergeSubMesh.verticesCount, indexStart, meshToMergeSubMesh.indexCount, this);
                        }
                        //

                        indices = indices.concat(tmpIndices);
                        break;
                    case BABYLON.VertexBuffer.NormalKind:
                        // means we treat the first mesh to merge.
                        if (vertices.length == 0) {       
                            this._getVerticesPositionsAndNormals(kind, vertices, meshTransformMatrix);
                        }

                        meshToMerge._getVerticesPositionsAndNormals(kind, vertices, meshToMergeTransformMatrix);
                        break;
                    default:
                        // means we treat the first mesh to merge.   
                        if (vertices.length == 0 && this.isVerticesDataPresent([kind])) { 
                            vertices = this.getVerticesData(kind);
                        }

                        if (meshToMerge.isVerticesDataPresent([kind])) {
                            vertices = vertices.concat(meshToMerge.getVerticesData(kind));
                        }
                        break;
                }

                if (!doNotDeleteAfterMerging) {                    
                    // When we delete the meshToMerge, we need to reset its children position into the world,
                    // because we gonna delete the meshToMerge and we don't want to move children's position.
                    var children = meshToMerge.getChildren();

                    for (var ci in children) {
                        var child = children[ci];

                        child.position = child.getAbsolutePosition();
                    }

                    meshToMerge.dispose(true);
                }
            }

            if (vertices.length >= BABYLON.Mesh.VERTICESLIMITATION) {
                console.error('To much vertices');
                //BABYLON.Tools.Log.log(BABYLON.Tools.Log.Level.WARN, 'Mesh "' + this.name + '" have more than ' + BABYLON.Mesh.VERTICESLIMITATION + 'vertices !');
            }

            if (vertices.length === 0)
                return;

            this.setVerticesData(vertices, kind, false);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                this.setIndices(indices, true);

                // Transform children's position.
                var children = this.getChildren();

                for (var ci = 0; ci < children.length; ++ci) {
                    var child = children[ci];

                    // Just need to add its parent position because the merge is only applied to its parent,
                    // so its parent keep its relative position to its own parent.
                    childPositionInParentSpace = child.position.add(this.position);
                    child.position = childPositionInParentSpace.subtract(center);
                }

                this.position = center;
            }
        };

        Mesh.prototype.getCenterPositionOfMeshes = function (meshes) {
            var center = this.position;

            // Use avoid calculate a wrong center if "this" appear several times.
            var currentMeshApparition = 0;

            for (var i = 0; i < meshes.length; ++i) {
                var mesh = meshes[i];

                if (mesh === this && mesh.id === this.id) {
                    ++currentMeshApparition;
                    continue;
                }

                center = center.add(mesh.getAbsolutePosition());
            }

            // +1 because "this" is not in meshes array.
            var meshesCount = meshes.length - currentMeshApparition + 1;

            if (meshesCount > 0)
                center = center.scale(1 / meshesCount);

            return center;
        };

        Mesh.prototype._getVerticesPositionsAndNormals = function (kind, vertices, transformMatrix) {
            if (!this.isVerticesDataPresent([kind])) {
                return; // No vertices to transform.
            }

            var localVertices = this.getVerticesData(kind);

            var ite = 0;
            while (ite < localVertices.length) {
                var vertex = new BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(localVertices[ite++], localVertices[ite++], localVertices[ite++]), transformMatrix);
                vertices.push(vertex.x);
                vertices.push(vertex.y);
                vertices.push(vertex.z);
            }
        };

        Mesh.prototype._merge = function (meshesToMerge, doNotDeleteAfterMerging) {
            if (!meshesToMerge)
                return;

            this.computeWorldMatrix(true);

            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.UVKind, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.UV2Kind, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.ColorKind, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.MatricesIndicesKind, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.MatricesWeightsKind, true);
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.NormalKind, true);
            // the delete of the mesh must be done during the last _setVerticesDataByMerging 
            // because if we did it earlier, the mesh will be deleted for the next step.
            this._setVerticesDataByMerging(meshesToMerge, BABYLON.VertexBuffer.PositionKind, doNotDeleteAfterMerging);

            return this;
        };

        Mesh.prototype.flattenInPlace = function (doNotDeleteAfterMerging) {
            var descendants = this.getDescendants();

            if (!descendants || descendants.length <= 0)
                return this;

            this.mergeInPlace(descendants, doNotDeleteAfterMerging);
        };

        Mesh.prototype.mergeInPlace = function (meshesToMerge, doNotDeleteAfterMerging, flattenChildren) {
            if (!meshesToMerge) {
                BABYLON.Tools.Log.log(BABYLON.Tools.Log.Level.ERROR, 'Must have meshes to merge.');
                return;
            }

            if (flattenChildren) {
                this.flattenInPlace(doNotDeleteAfterMerging);

                if (!Array.isArray(meshesToMerge))
                    meshesToMerge = [meshesToMerge];

                for (var i = 0; i < meshesToMerge.length; ++i) {
                    meshesToMerge[i].flattenInPlace(doNotDeleteAfterMerging);
                }
            }

            return this._merge(meshesToMerge, doNotDeleteAfterMerging);
        };

        Mesh.Merge = function (meshesToMerge, newMeshName, scene, doNotDeleteAfterMerging, flattenChildren) {
            var newMesh = new BABYLON.Mesh(newMeshName, scene);

            newMesh.mergeInPlace(meshesToMerge, doNotDeleteAfterMerging, flattenChildren);

            return newMesh;
        };

        Mesh.prototype.setVerticesData = function (data, kind, updatable) {
            if (!this._vertexBuffers) {
                this._vertexBuffers = {};
            }

            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose(); 
            }

            this._vertexBuffers[kind] = new BABYLON.VertexBuffer(this, data, kind, updatable);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                this._resetPointsArrayCache();

                var stride = this._vertexBuffers[kind].getStrideSize();
                var previousVerticesNumber = this._totalVertices;
                this._totalVertices = data.length / stride;

                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
                this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

                // We consider that if the length of the vertices data has not changed, 
                // we do not need to create a new submesh. 
                // Considering that vertices are sorted in the same order.
                if (previousVerticesNumber != data.length) {
                    this._createGlobalSubMesh();
                }
            }
        };

        Mesh.prototype.updateVerticesData = function (kind, data, updateExtends) {
            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].update(data);

                if (kind === BABYLON.VertexBuffer.PositionKind) {
                    this._resetPointsArrayCache();

                    if (updateExtends) {
                        var stride = this._vertexBuffers[kind].getStrideSize();
                        this._totalVertices = data.length / stride;

                        var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
                        this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
                    }
                }
            }
        };

        Mesh.prototype.setIndices = function (indices, keepIndexesAsAre) {
            if (this._indexBuffer) {
                this.getScene().getEngine()._releaseBuffer(this._indexBuffer);
            }

            this._indexBuffer = this.getScene().getEngine().createIndexBuffer(indices);
            this._indices = indices;

            if (!keepIndexesAsAre) {
                this._createGlobalSubMesh();
            }
        };

        // ANY
        Mesh.prototype.bindAndDraw = function (subMesh, effect, wireframe) {
            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind = this._indexBuffer;
            var useTriangles = true;

            if (wireframe) {
                indexToBind = subMesh.getLinesIndexBuffer(this._indices, engine);
                useTriangles = false;
            }

            // VBOs
            engine.bindMultiBuffers(this._vertexBuffers, indexToBind, effect);

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
            if (!this._vertexBuffers || !this._indexBuffer) {
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
            var _this = this;
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            var result = this._boundingInfo.isInFrustum(frustumPlanes);

            if (result && this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;
                this.getScene()._addPendingData(this);

                BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                    _this._delayLoadingFunction(JSON.parse(data), _this);
                    _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    _this.getScene()._removePendingData(_this);
                }, function () {
                }, this.getScene().database);
            }

            return result;
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

            var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
            var temp = [];
            for (var index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].getData();
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this._vertexBuffers[BABYLON.VertexBuffer.NormalKind].isUpdatable());
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

            var data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
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
            collider._collide(subMesh, subMesh._lastColliderWorldVertices, this._indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
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

                var currentIntersectInfo = subMesh.intersects(ray, this._positions, this._indices, fastCheck);

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

            // Buffers
            result._vertexBuffers = this._vertexBuffers;
            for (var kind in result._vertexBuffers) {
                result._vertexBuffers[kind]._buffer.references++;
            }

            result._indexBuffer = this._indexBuffer;
            this._indexBuffer.references++;

            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], ["_indices", "_totalVertices"]);

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this._totalVertices);
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
            if (this._vertexBuffers) {
                for (var vbKind in this._vertexBuffers) {
                    this._vertexBuffers[vbKind].dispose();
                }
                this._vertexBuffers = null;
            }

            if (this._indexBuffer) {
                this.getScene().getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }

            // Physics
            if (this.getPhysicsImpostor() != BABYLON.PhysicsEngine.NoImpostor) {
                this.setPhysicsState({ impostor: BABYLON.PhysicsEngine.NoImpostor });
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
        Mesh.prototype.setPhysicsState = function (options) {
            var physicsEngine = this.getScene().getPhysicsEngine();

            if (!physicsEngine) {
                return;
            }

            options.impostor = options.impostor || BABYLON.PhysicsEngine.NoImpostor;
            options.mass = options.mass || 0;
            options.friction = options.friction || 0.2;
            options.restitution = options.restitution || 0.9;

            this._physicImpostor = options.impostor;
            this._physicsMass = options.mass;
            this._physicsFriction = options.friction;
            this._physicRestitution = options.restitution;

            if (options.impostor === BABYLON.PhysicsEngine.NoImpostor) {
                physicsEngine._unregisterMesh(this);
                return;
            }

            physicsEngine._registerMesh(this, options);
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

                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    updatableNormals = this.getVertexBuffer(kind).isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = this.getVertexBuffer(kind);
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();

            for (index = 0; index < indices.length; index++) {
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
            for (var index = 0; index < indices.length; index += 3) {
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
            var minVector;
            var maxVector;
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
        Mesh.BILLBOARDMODE_NONE = 0;
        Mesh.BILLBOARDMODE_X = 1;
        Mesh.BILLBOARDMODE_Y = 2;
        Mesh.BILLBOARDMODE_Z = 4;
        Mesh.BILLBOARDMODE_ALL = 7;
        // If we have more than 65535 vertices (WebGL limitation) we should cut our mesh.
        Mesh.VERTICESLIMITATION = 65535;

        return Mesh;
    })(BABYLON.Node);
    BABYLON.Mesh = Mesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mesh.js.map
