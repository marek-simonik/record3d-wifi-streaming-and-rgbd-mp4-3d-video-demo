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

        this.onVideoChange = () => {};

        this.videoTag.onloadeddata = (e) => {
            this.isVideoLoaded = true;
            this.onVideoChange();
        };
    }

    load(videoFile)
    {
        let self = this;

        let dataURLReader = new FileReader();
        dataURLReader.onload = e => {
            self.videoTag.src = e.target.result;
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

        this.videoTag.muted = false;
    }
}