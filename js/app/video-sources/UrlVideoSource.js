class UrlVideoSource
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
        this.videoTag.crossOrigin = "";
        this.isVideoLoaded = false;
        this.maxNumPoints = 720 * 960;
        this.lastVideoSize = {width: 0, height: 0};
        this.onVideoChange = () => {};

        let self = this;

        this.videoTag.onloadeddata = e => {
            self.isVideoLoaded = true;
            self.lastVideoSize.width = self.videoTag.videoWidth;
            self.lastVideoSize.height = self.videoTag.videoHeight;
            self.maxNumPoints = self.videoTag.videoWidth * self.videoTag.videoHeight / 4;

            // FIXME file is "loaded" twice, if I want to get metadata. Otherwise I can create video from byte data
            fetch(self.videoTag.src).then(response => {
                response.text().then(txt => {
                    let meta = txt.substr(txt.lastIndexOf('{"intrinsic'))
                    meta = meta.substr(0, meta.length-1)
                    let metadata = JSON.parse(meta);

                    // exiftool video_file.mp4
                    self.intrMat.elements = metadata['intrinsicMatrix'];
                    self.intrMat.transpose();

                    self.onVideoChange();
                })
            })

            //exiftool video_file.mp4
            // let metadata = {"intrinsicMatrix":[593.76177978515625,0,0,0,594.7872314453125,0,241.74200439453125,319.98410034179688,1]}
            // self.intrMat.elements = metadata['intrinsicMatrix'];
            // self.intrMat.transpose();
            // self.onVideoChange();
        };
    }

    load(url)
    {
        let self = this;
        self.videoTag.src = url //e.target.result;
    }

    updateIntrinsicMatrix(intrMat)
    {
        this.intrMat = intrMat;
    }

    toggle()
    {
        this.videoTag.paused ? this.videoTag.play() : this.videoTag.pause();
    }

    toggleAudio()
    {
        this.videoTag.muted = !this.videoTag.muted;
    }

    getVideoSize() {
        return {width: this.lastVideoSize.width / 2, height: this.lastVideoSize.height};
    }
}
