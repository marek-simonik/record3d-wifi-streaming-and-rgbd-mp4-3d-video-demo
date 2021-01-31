class Record3DPointCloud
{
    constructor(videoSource)
    {
        this.videoSource = null;
        this.videoTexture = null;
        this.pointCloud = null;

        this.material = getPointCloudShaderMaterial();
        this.setVideoSource(videoSource);

        this.initPointCloud();
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
    }

    onVideoTagChanged()
    {
        let videoSource = this.videoSource;

        this.videoTexture = new THREE.VideoTexture( videoSource.videoTag );
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBFormat;

        videoSource.videoTag.play();

        this.material.uniforms.texSize.value = [parseInt(videoSource.videoTag.videoWidth), videoSource.videoTag.videoHeight];
        this.material.uniforms.texImg.value = this.videoTexture;

        let intrinsicMatrix = videoSource.intrMat;
        let ifx = 1.0 / intrinsicMatrix.elements[0];
        let ify = 1.0 / intrinsicMatrix.elements[4];
        let itx = -intrinsicMatrix.elements[2] / intrinsicMatrix.elements[0];
        let ity = -intrinsicMatrix.elements[5] / intrinsicMatrix.elements[4];

        this.material.uniforms.iK.value = [ifx, ify, itx, ity];
    }

    initPointCloud()
    {
        const maxWidth = 480;
        const maxHeight = 640;
        let maxNumPoints = maxWidth * maxHeight;
        this.buffIndices = new Uint32Array(maxNumPoints);
        this.buffIndicesAttr = new Float32Array(maxNumPoints);

        for ( let ptIdx = 0; ptIdx < maxNumPoints; ptIdx++ )
        {
            this.buffIndices[ptIdx] = ptIdx;
            this.buffIndicesAttr[ptIdx] = parseFloat(ptIdx);
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('vertexIdx', new THREE.Float32BufferAttribute(this.buffIndicesAttr, 1));
        geometry.setIndex(new THREE.Uint32BufferAttribute(new Uint32Array(this.buffIndices), 1));

        this.pointCloud = new THREE.Points(geometry, this.material);
        this.pointCloud.frustumCulled = false;
    }

    toggle()
    {
        this.videoSource.toggle();
    }
}