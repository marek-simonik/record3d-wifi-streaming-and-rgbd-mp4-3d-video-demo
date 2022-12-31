import * as THREE from 'three'
import {getPointCloudShaderMaterial} from "./pointcloud-material.js";

export const Record3DVideoRenderingMode = Object.freeze({
    POINTS: Symbol("points"),
    MESH: Symbol("mesh"),
});


export class Record3DVideo
{
    constructor(videoSource)
    {
        this.videoSource = null;
        this.videoTexture = null;
        this.videoObject = new THREE.Group();
        this.renderingMode = Record3DVideoRenderingMode.POINTS;
        this.material = getPointCloudShaderMaterial();
        this.setVideoSource(videoSource);
    }

    setVideoSource(videoSource)
    {
        if ( videoSource !== this.videoSource ) {
            this.videoSource = videoSource;

            let self = this;
            videoSource.onVideoChange = () => {
                self.onVideoTagChanged();
            };
        }

        if ( videoSource.isVideoLoaded ) {
            this.onVideoTagChanged();
        }

        this.switchRenderingTo(this.renderingMode);
    }

    onVideoTagChanged()
    {
        let videoSource = this.videoSource;

        this.videoTexture = new THREE.VideoTexture( videoSource.videoTag );
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBAFormat;

        videoSource.videoTag.play();

        let newVideoWidth = videoSource.videoTag.videoWidth;
        let newVideoHeight = videoSource.videoTag.videoHeight;
        this.material.uniforms.texSize.value = [newVideoWidth, newVideoHeight];
        this.material.uniforms.texImg.value = this.videoTexture;

        let intrinsicMatrix = videoSource.intrMat;
        let ifx = 1.0 / intrinsicMatrix.elements[0];
        let ify = 1.0 / intrinsicMatrix.elements[4];
        let itx = -intrinsicMatrix.elements[2] / intrinsicMatrix.elements[0];
        let ity = -intrinsicMatrix.elements[5] / intrinsicMatrix.elements[4];

        this.material.uniforms.iK.value = [ifx, ify, itx, ity];

        this.switchRenderingTo(this.renderingMode)
    }

    switchRenderingTo(renderingMode) {
        this.renderingMode = renderingMode;
        if ( this.renderingMode === Record3DVideoRenderingMode.MESH ) {
            this.switchRenderingToMesh();

        } else if ( this.renderingMode === Record3DVideoRenderingMode.POINTS ) {
            this.switchRenderingToPoints();

        } else {
            console.error('Invalid rendering mode.');
        }
    }

    removeVideoObjectChildren() {
        while (this.videoObject.children.length > 0)
        {
            this.videoObject.remove(this.videoObject.children[0]);
        }
    }

    switchRenderingToPoints()
    {
        this.removeVideoObjectChildren();

        let videoSize = this.videoSource.getVideoSize();
        let numPoints = videoSize.width * videoSize.height;

        this.buffIndices = new Uint32Array(numPoints);
        this.buffPointIndicesAttr = new Float32Array(numPoints);

        for ( let ptIdx = 0; ptIdx < numPoints; ptIdx++ )
        {
            this.buffIndices[ptIdx] = ptIdx;
            this.buffPointIndicesAttr[ptIdx] = parseFloat(ptIdx);
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('vertexIdx', new THREE.Float32BufferAttribute(this.buffPointIndicesAttr, 1));
        geometry.setIndex(new THREE.Uint32BufferAttribute(new Uint32Array(this.buffIndices), 1));

        let points = new THREE.Points(geometry, this.material);
        points.frustumCulled = false;
        this.videoObject.add(points);
    }

    switchRenderingToMesh()
    {
        this.removeVideoObjectChildren();

        let videoSize = this.videoSource.getVideoSize();
        if ( videoSize.width === 0 || videoSize.height === 0 ) {
            return;
        }

        let numPoints = videoSize.width * videoSize.height;
        this.buffIndices = new Uint32Array( (videoSize.width - 1) * (videoSize.height - 1) * 6 );
        this.buffPointIndicesAttr = new Float32Array(numPoints);

        for ( let ptIdx = 0; ptIdx < numPoints; ptIdx++ )
        {
            this.buffPointIndicesAttr[ptIdx] = parseFloat(ptIdx);
        }

        var indicesIdx = 0;
        let numRows = videoSize.height;
        let numCols = videoSize.width;
        for ( let row = 1; row < numRows; row++ ) {
            for ( let col = 0; col < numCols - 1; col++ ) {
                let tlIdx = (row - 1) * numCols + col;
                let trIdx = tlIdx + 1;

                let blIdx = row * numCols + col;
                let brIdx = blIdx + 1;

                this.buffIndices[indicesIdx++] = blIdx;
                this.buffIndices[indicesIdx++] = trIdx;
                this.buffIndices[indicesIdx++] = tlIdx;

                this.buffIndices[indicesIdx++] = blIdx;
                this.buffIndices[indicesIdx++] = brIdx;
                this.buffIndices[indicesIdx++] = trIdx;
            }
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('vertexIdx', new THREE.Float32BufferAttribute(this.buffPointIndicesAttr, 1));
        geometry.setIndex(new THREE.Uint32BufferAttribute(new Uint32Array(this.buffIndices), 1));

        let mesh = new THREE.Mesh(geometry, this.material);
        mesh.frustumCulled = false;
        this.videoObject.add(mesh);

        console.log(this.material.uniforms.texSize.value)
    }

    toggle()
    {
        this.videoSource.toggle();
    }

    toggleSound()
    {
        this.videoSource.toggleAudio();
    }

    setScale(scale)
    {
        for (let video of this.videoObject.children) {
            video.material.uniforms.scale.value = scale;
        }
    }

    setPointSize(ptSize)
    {
        for (let video of this.videoObject.children) {
            video.material.uniforms.ptSize.value = ptSize;
        }
    }
}