class OfflineVideoSource
{
    constructor()
    {
        this.intrMat = new THREE.Matrix3();
        this.videoTag = document.createElement('video');
        this.videoTag.autoplay = true;
        this.videoTag.muted = true;
        this.videoTag.loop = true;
        this.videoTag.playsinline = true;
        this.videoTag.setAttribute('playsinline', '');
        this.isVideoLoaded = false;
        this.maxNumPoints = 720 * 960;
        this.lastVideoSize = {width: 0, height: 0};
        this.onVideoChange = () => {};

        let self = this;

        this.videoTag.onloadeddata = (e) => {
            self.isVideoLoaded = true;
            self.lastVideoSize.width = self.videoTag.videoWidth;
            self.lastVideoSize.height = self.videoTag.videoHeight;
            self.onVideoChange();
        };
    }

    load(videoFile)
    {
        let self = this;

        let dataURLReader = new FileReader();
        dataURLReader.onload = e => {
            self.videoTag.src = e.target.result;
            self.maxNumPoints = self.videoTag.videoWidth * self.videoTag.videoHeight / 4;
        };
        dataURLReader.readAsDataURL(videoFile);

        let binaryMetadataReader = new FileReader();
        binaryMetadataReader.onload = e => {
            let fileContents = e.target.result;
            let meta = fileContents.substr(fileContents.lastIndexOf('{"intrinsic'));
            meta = meta.substr(0, meta.length-1);
            let metadata = JSON.parse(meta);
            self.intrMat.elements = metadata['intrinsicMatrix'];
            self.intrMat.transpose();
        };
        binaryMetadataReader.readAsBinaryString(videoFile);
    }

    updateIntrinsicMatrix(intrMat)
    {
        this.intrMat = intrMat;
    }

    toggle()
    {
        if ( this.videoTag.paused ) this.videoTag.play();
        else this.videoTag.pause();
    }

    toggleAudio()
    {
        this.videoTag.muted = !this.videoTag.muted;
    }

    getVideoSize() {
        return {width: this.lastVideoSize.width / 2, height: this.lastVideoSize.height};
    }
}