class WiFiStreamedVideoSource
{
    constructor(deviceAddress)
    {
        this.peerAddress = deviceAddress;
        this.intrMat = null;
        this.videoTag = document.createElement('video');
        this.videoTag.autoplay = true;
        this.videoTag.muted = true;
        this.videoTag.loop = true;
        this.videoTag.playsinline = true;
        this.videoTag.setAttribute('playsinline', '');
        this.isVideoLoaded = false;
        this.lastVideoSize = {width: 0, height: 0};
        this.onVideoChange = () => {};
        this.maxNumPoints = 720 * 960;
        this.originalVideoSize = {width: undefined, height: undefined};

        this.peerConnection = null;
        this.signalingClient = null;

        this.videoTag.onloadeddata = (e) => {
            this.onVideoChange()
        };

        let self = this;
        this.videoTag.onprogress = (e) => {
            if ( self.videoTag.videoWidth != self.lastVideoSize.width || self.videoTag.videoHeight != self.lastVideoSize.height )
            {
                getMetadata(this.peerAddress)
                    .then(metadata => self.processMetadata(metadata));
            }

            self.lastVideoSize.width = self.videoTag.videoWidth;
            self.lastVideoSize.height = self.videoTag.videoHeight;
        };
    }

    connect()
    {
        if (this.peerConnection !== null)
        {
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection();
        this.signalingClient = new Record3DSignalingClient(this.peerAddress);

        let self = this;

        this.peerConnection.onicecandidate = event => {
            if (event.candidate === null) {
                let jsonData = {'type': 'answer', 'data': self.peerConnection.localDescription.sdp};
                self.signalingClient.sendAnswer(jsonData);
            }
        };

        this.peerConnection.ontrack = event => {
            self.videoTag.srcObject = event.streams[0];
            getMetadata(this.peerAddress)
                .then(metadata => self.processMetadata(metadata));
        };

        this.signalingClient.retrieveOffer()
            .then(remoteOffer => {
                if ( remoteOffer === undefined )
                    return;

                self.peerConnection
                    .setRemoteDescription(remoteOffer)
                    .then(() => self.peerConnection.createAnswer())
                    .then(sdp => self.peerConnection.setLocalDescription(sdp));
            });
    }

    getVideoSize() {
        return {width: this.lastVideoSize.width / 2, height: this.lastVideoSize.height};
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

    updateIntrinsicMatrix(intrMat)
    {
        this.intrMat = intrMat;
    }

    processIntrMat(origIntrMatElements, origVideoSize)
    {
        let intrMat = new THREE.Matrix3();
        intrMat.elements = origIntrMatElements;
        intrMat.transpose();

        if ( origVideoSize.width === undefined || origVideoSize.height === undefined )
            intrMat.multiplyScalar(this.videoTag.videoHeight / (origIntrMatElements[5] < 256 ? 256 : 640));
        else
            intrMat.multiplyScalar(this.videoTag.videoHeight / origVideoSize.height);

        intrMat.elements[8] = 1;

        return intrMat;
    }

    processMetadata(metadata)
    {
        let ogVideoSizeKey = 'originalSize';
        if (ogVideoSizeKey in metadata) {
            let originalVideoSize = metadata[ogVideoSizeKey];
            this.originalVideoSize.width = originalVideoSize[0];
            this.originalVideoSize.height = originalVideoSize[1];
        }

        this.intrMat = this.processIntrMat(metadata['K'], this.originalVideoSize);

        this.onVideoChange();
    }
}


