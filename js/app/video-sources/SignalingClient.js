export class Record3DSignalingClient {
    constructor(serverURL) {
        let self = this;
        self.serverURL = serverURL;
    }

    retrieveOffer() {
        let serverURL = this.serverURL + '/getOffer';
        return fetch(serverURL)
            .then(resp => resp.json())
            .catch(e => {
                console.log('Error while requesting an offer.');
                alert('Error: Cannot connect to your iPhone/iPad.\n\nMake sure you are on the same Wi-Fi network as your iPhone/iPad and that you entered a correct address of your iPhone/iPad.\n\nNote that this demo will not work when viewed via a HTTPS website; either visit http://record3d.xyz/ or downoad this demo to your computer and open the index.html file on your computer (https://github.com/marek-simonik/record3d-wifi-streaming-and-rgbd-mp4-3d-video-demo).\n\nRefresh this website and try again.\n\nERROR MESSAGE: ' + e.toLocaleString());
            });
    }

    sendAnswer(answer) {
        let jsonAnswer = JSON.stringify(answer);
        let serverURL = this.serverURL + '/answer';
        fetch(serverURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonAnswer
        }).catch(e => {
            console.log('Error while sending the answer.');
            alert('Error while receiving WebRTC Answer: ' + e.message);
        })
    }
}

function getMetadata(serverURL) {
    // Metadata contains the intrinsic matrix
    let metadataEndpoint = serverURL + '/metadata';
    return fetch(metadataEndpoint)
        .then(resp => resp.json())
        .catch(e => {
            console.log('Could not retrieve the intrinsic matrix.');
            alert('Error while fetching metadata: ' + e.message);
        });
}