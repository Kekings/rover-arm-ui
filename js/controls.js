/* ==========================================
   Imports
========================================== */

import{
    sendAltitudeUp,
    sendAltitudeDown,
    sendYawLeft,
    sendYawRight,
    sendArm,
    sendDisarm
} from "./commands.js";

/* ==========================================
   Elements
========================================== */

const upButton = document.querySelector("#btn-up");
const downButton = document.querySelector("#btn-down");

const leftButton = document.querySelector("#btn-left");
const rightButton = document.querySelector("#btn-right");

const armButton = document.querySelector("#btn-arm");
const armStatusText = document.querySelector("#arm-status-text");

/* ==========================================
   Helpers
========================================== */

/* ==========================================
   Hold Button
========================================== */

function bindHold(button, command){

    let timer = null;

    button.addEventListener("pointerdown", ()=>{

        command();

        timer = setInterval(command, 100);

    });

    function stop(){

        if(timer){

            clearInterval(timer);
            timer = null;

        }

    }

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);

}

/* ==========================================
   Altitude
========================================== */

bindHold(upButton, sendAltitudeUp);
bindHold(downButton, sendAltitudeDown);

/* ==========================================
   Yaw
========================================== */

bindHold(leftButton, sendYawLeft);
bindHold(rightButton, sendYawRight);

/* ==========================================
   Arm / Disarm + Left D-Pad Visibility
   Short press: toggle the four left-side controls.
   Hold 1 second: arm. Hold 2 seconds while armed: disarm.
========================================== */

const ARM_HOLD_MS = 1000;
const DISARM_HOLD_MS = 2000;

const leftPanel = document.querySelector("#left-panel");
const dpad = document.querySelector("#dpad");

let isArmed = false;
let pressTimer = null;
let pressEligible = false;
let activePointerId = null;
let awaitingCommand = null; // "arm" | "disarm" | null

function toggleLeftControls(){

    const hidden = leftPanel.classList.toggle("left-controls-hidden");

    dpad.setAttribute("aria-hidden", String(hidden));
    armButton.setAttribute("aria-expanded", String(!hidden));

}

function setArmedVisual(armed){

    isArmed = armed;

    armButton.classList.remove("armed", "disarmed", "holding", "pending");

    armButton.classList.add(armed ? "armed" : "disarmed");

    armStatusText.textContent = armed ? "ARMED" : "DISARMED";

}

function setPendingVisual(command){

    awaitingCommand = command;

    armButton.classList.add("pending");

    armStatusText.textContent =
        command === "arm" ? "ARMING..." : "DISARMING...";

}

function startPress(event){

    // Ignore secondary mouse buttons and additional simultaneous pointers.
    if(event.pointerType === "mouse" && event.button !== 0)
        return;

    if(awaitingCommand || pressEligible)
        return;

    event.preventDefault();
    pressEligible = true;
    activePointerId = event.pointerId;
    armButton.classList.add("holding");

    // Keep receiving pointerup even if a finger or mouse slips outside the button.
    if(typeof armButton.setPointerCapture === "function"){
        try{
            armButton.setPointerCapture(event.pointerId);
        } catch(error){
            // The normal pointerup path still works when capture is unavailable.
        }
    }

    const holdDuration = isArmed ? DISARM_HOLD_MS : ARM_HOLD_MS;

    armButton.style.setProperty("--hold-duration", `${holdDuration}ms`);

    pressTimer = setTimeout(()=>{

        pressTimer = null;

        if(!pressEligible || awaitingCommand)
            return;

        if(isArmed){

            sendDisarm();
            setPendingVisual("disarm");

        } else {

            sendArm();
            setPendingVisual("arm");

        }

    }, holdDuration);

}

function finishPress(event){

    if(!pressEligible)
        return;

    if(event && activePointerId !== null && event.pointerId !== activePointerId)
        return;

    const wasShortPress = pressTimer !== null;

    if(pressTimer){
        clearTimeout(pressTimer);
        pressTimer = null;
    }

    pressEligible = false;
    activePointerId = null;
    armButton.classList.remove("holding");

    if(wasShortPress && !awaitingCommand)
        toggleLeftControls();

}

function cancelPress(event){

    if(!pressEligible)
        return;

    if(event && activePointerId !== null && event.pointerId !== activePointerId)
        return;

    pressEligible = false;
    activePointerId = null;

    if(pressTimer){
        clearTimeout(pressTimer);
        pressTimer = null;
    }

    armButton.classList.remove("holding");

}

armButton.addEventListener("pointerdown", startPress);
armButton.addEventListener("pointerup", finishPress);
armButton.addEventListener("pointercancel", cancelPress);
armButton.addEventListener("lostpointercapture", cancelPress);

// Keyboard activation remains a short press that toggles the left D-pad.
armButton.addEventListener("keydown", (event)=>{

    if((event.key !== "Enter" && event.key !== " ") || event.repeat)
        return;

    event.preventDefault();
    if(!awaitingCommand)
        toggleLeftControls();

});

// Listen for drone confirmation before flipping visual state
window.addEventListener("ack", (event)=>{

    const {command, success} = event.detail;

    if(command === "emergency_stop"){

        if(success){
            setArmedVisual(false);
            awaitingCommand = null;
        }

        return;
    }

    if(command !== "arm" && command !== "disarm")
        return;

    if(!success){

        // Command failed — revert to whatever we actually are, no state change
        armButton.classList.remove("pending");
        armStatusText.textContent = isArmed ? "ARMED" : "DISARMED";
        awaitingCommand = null;

        return;
    }

    setArmedVisual(command === "arm" ? true : false);
    awaitingCommand = null;

});

// Initialize visual state
setArmedVisual(false);