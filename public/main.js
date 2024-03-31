const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
let start = document.getElementById("start");
let localStream;
let pc;
const socket = io();

async function init() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        localVideo.srcObject = localStream;

        pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            console.log("event: ", event);
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0]; // Use event.streams[0] for remote stream
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Send the candidate to the remote peer
                socket.emit("message", { candidate: event.candidate });
            }
        };

        localStream
            .getTracks()
            .forEach((track) => pc.addTrack(track, localStream));
    } catch (error) {
        console.error("Error starting:", error);
    }
}

async function startProcess() {
    try {
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send the offer to the remote peer
        socket.emit("message", { offer: pc.localDescription });
    } catch (error) {
        console.error("Error starting:", error);
    }
}

async function receiveOfferAndCreateAnswer(offer) {
    try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send the answer to the remote peer
        socket.emit("message", { answer: pc.localDescription });
    } catch (error) {
        console.error("Error receiving offer and creating answer:", error);
    }
}

socket.on("message", (message) => {
    console.log("Received from signaling server:", message);
    if (message.offer) {
        receiveOfferAndCreateAnswer(message.offer);
    } else if (message.answer) {
        pc.setRemoteDescription(message.answer);
    } else if (message.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
});

start.addEventListener("click", startProcess);

init();
