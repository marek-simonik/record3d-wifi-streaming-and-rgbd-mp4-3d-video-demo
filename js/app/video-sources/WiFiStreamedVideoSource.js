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
                    .then(resp => {
                        self.intrMat = self.processIntrMat(resp['K']);
                        self.onVideoChange();
                    });
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
            getMetadata(this.peerAddress)
                .then(resp => {
                    self.videoTag.srcObject = event.streams[0];
                    self.intrMat = self.processIntrMat(resp['K']);
                });
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

    toggle()
    {
        if ( this.videoTag.paused ) this.videoTag.play();
        else this.videoTag.pause();
    }

    updateIntrinsicMatrix(intrMat)
    {
        this.intrMat = intrMat;
    }

    processIntrMat(origIntrMatElements)
    {
        let intrMat = new THREE.Matrix3();
        intrMat.elements = origIntrMatElements;
        intrMat.transpose();
        intrMat.multiplyScalar(this.videoTag.videoHeight / (origIntrMatElements[5] < 256 ? 256 : 640));
        intrMat.elements[8] = 1;

        return intrMat;
    }
}


