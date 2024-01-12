import * as THREE from 'three'

export class OfflineVideoSource
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

        self.videoTag.src = window.URL.createObjectURL(videoFile);
        self.maxNumPoints = self.videoTag.videoWidth * self.videoTag.videoHeight / 4;

        self.parseAndApplyVideoMetadata(videoFile);
    }

    parseAndApplyVideoMetadata(videoFile)
    {
        /**
         *  Read chunks on incrementally greater length from the end of the file until we can find the intrinsic matrix.
         */

        let self = this;
        let videoFileSize = videoFile.size;

        let chunkSizeInBytes = 1000;
        var numBytesToRead = 0;
        let fileReader = new FileReader();

        let readLargerChunk = () => {
            numBytesToRead = Math.min(videoFileSize, numBytesToRead + chunkSizeInBytes);
            let currBlob = videoFile.slice(-numBytesToRead); // Read `numBytesToRead` from the end of the mp4 file
            fileReader.readAsText(currBlob);
        };

        fileReader.onload = e => {
            let fileContents = e.target.result;

            let idx = fileContents.lastIndexOf('{"intrinsic');
            if ( idx < 0 ) {
                readLargerChunk();
            }
            else
            {
                let metadataJsonString = fileContents.slice(idx, -1);
                let metadata = JSON.parse(metadataJsonString);
                self.intrMat.elements = metadata['intrinsicMatrix'];
                self.intrMat.transpose();
            }
        };
        
        readLargerChunk();
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
