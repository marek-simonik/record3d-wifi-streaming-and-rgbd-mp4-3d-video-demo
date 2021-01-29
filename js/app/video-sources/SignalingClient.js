class Record3DSignalingClient {
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
        });
}