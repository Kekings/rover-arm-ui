/* ==========================================
   Imports
========================================== */

import {connectWebSocket, disconnect} from "./websocket.js";

/* ==========================================
   Default Values
========================================== */

const DEFAULT_CONTROLLER_IP = "";
const DEFAULT_CONTROLLER_PORT = "5555";

const DEFAULT_CAMERA_IP = "10.76.74.101";
const DEFAULT_CAMERA_STREAM = "/stream";

/* ==========================================
   Auto Scan
========================================== */

const SCAN_START = 100;
const SCAN_END = 120;
const SCAN_DELAY = 500;

let scanning = false;

/* ==========================================
   Elements
========================================== */

const controllerIp = document.querySelector("#controller-ip");
const controllerPort = document.querySelector("#controller-port");

const controllerDefault = document.querySelector("#controller-default");

const cameraIp = document.querySelector("#camera-ip");
const cameraStream = document.querySelector("#camera-stream-path");

const cameraDefault = document.querySelector("#camera-default");

const connectButton = document.querySelector("#connect-button");
const scanButton = document.querySelector("#scan-button");
const disconnectButton = document.querySelector("#disconnect-button");

const statusText = document.querySelector("#connection-status-text");

const connectionScreen = document.querySelector("#connection-screen");
const flightScreen = document.querySelector("#flight-screen");

/* ==========================================
   Default Inputs
========================================== */

function updateDefaultInputs(){

    if(controllerDefault.checked){

        controllerIp.value = DEFAULT_CONTROLLER_IP;
        controllerPort.value = DEFAULT_CONTROLLER_PORT;

        controllerIp.disabled = true;
        controllerPort.disabled = true;

    }

    else{

        controllerIp.disabled = false;
        controllerPort.disabled = false;

    }

    if(cameraDefault.checked){

        cameraIp.value = DEFAULT_CAMERA_IP;
        cameraStream.value = DEFAULT_CAMERA_STREAM;

        cameraIp.disabled = true;
        cameraStream.disabled = true;

    }

    else{

        cameraIp.disabled = false;
        cameraStream.disabled = false;

    }

}

/* ==========================================
   Connect
========================================== */

function connect(scanningAttempt = false){

    const ip = controllerIp.value.trim();
    const port = controllerPort.value.trim();

    if(!ip || !port){
        statusText.textContent = "🔴 Enter ROS 2 PC IP and port";
        return;
    }

    statusText.textContent = scanningAttempt
        ? `🔍 Trying ${ip}:${port}...`
        : "🟡 Connecting to ROS 2 node...";

    connectWebSocket(ip, port, scanningAttempt);

}

/* ==========================================
   Disconnect
========================================== */

function disconnectDrone(){

    disconnect();

    scanning = false;

    statusText.textContent = "🔴 Disconnected";

    connectionScreen.classList.add("active");
    flightScreen.classList.remove("active");

}

/* ==========================================
   Auto Scan
========================================== */

async function autoScan(){

    if(scanning)
        return;

    scanning = true;

    statusText.textContent = "🔍 Scanning...";

    const parts = controllerIp.value.trim().split(".");

    if(parts.length !== 4 || parts.some(part => part === "" || !/^\d+$/.test(part) || Number(part) > 255)){

        statusText.textContent = "🔴 Enter a valid subnet IP first";
        scanning = false;
        return;

    }

    const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.`;
    const originalIp = controllerIp.value;

    for(let i = SCAN_START; i <= SCAN_END; i++){

        if(!scanning)
            break;

        controllerIp.value = subnet + i;
        connect(true);

        await new Promise(resolve => setTimeout(resolve, SCAN_DELAY));

        // A successful connection stops the scan in connectionSuccess().
        if(!scanning)
            break;

    }

    if(scanning){
        scanning = false;
        controllerIp.value = originalIp;
        statusText.textContent = "🔴 No ROS 2 node found in scan range";
        disconnect();
    }

}

/* ==========================================
   Connection Success
========================================== */

function connectionSuccess(event){

   scanning = false;
   console.log("Drone Info:", event.detail);

   statusText.textContent = "🟢 Connected";

   // Hide the connection screen only if it is still visible
   if(connectionScreen.classList.contains("active")){

      setTimeout(()=>{

         connectionScreen.classList.remove("active");
         flightScreen.classList.add("active");

      },800);

   }

}

/* ==========================================
   Connection Failed
========================================== */

function connectionFailed(){

    statusText.textContent = "🔴 Connection Failed";

}


/* ==========================================
   Reconnecting
========================================== */

function reconnecting(){

    statusText.textContent = "🟡 Reconnecting...";

}

/* ==========================================
   WebSocket Events
========================================== */

window.addEventListener("drone-connected", connectionSuccess);
window.addEventListener("drone-disconnected", connectionFailed);
window.addEventListener("drone-reconnecting", reconnecting);


/* ==========================================
   Button Events
========================================== */

// Connect to the ROS 2 UI WebSocket server.
connectButton.addEventListener("click", () => {
    scanning = false;
    connect();
});

scanButton.addEventListener("click", autoScan);
disconnectButton.addEventListener("click", disconnectDrone);


/* ==========================================
   Default Checkbox Events
========================================== */

// Update fields immediately whenever either checkbox is toggled.
controllerDefault.addEventListener("change", updateDefaultInputs);
cameraDefault.addEventListener("change", updateDefaultInputs);

/* ==========================================
   Initialize
========================================== */

updateDefaultInputs();