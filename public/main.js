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
        });
        localVideo.srcObject = localStream;

        pc = new RTCPeerConnection();

        pc.onaddstream = (event) => {
            remoteVideo.srcObject = event.stream;
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Send the candidate to the remote peer
                socket.emit("message", { candidate: event.candidate });
            }
        };

        pc.addStream(localStream);
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

        pc.addStream(localStream);
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
