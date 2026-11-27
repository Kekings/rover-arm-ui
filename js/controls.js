/* ==========================================
   Imports
========================================== */

import{
    sendArmNudge,
    sendWheelYaw,
    sendGripper,
    sendBaseRotate,
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
const modeButton = document.querySelector("#btn-dpad-mode");

const armButton = document.querySelector("#btn-arm");
const armStatusText = document.querySelector("#arm-status-text");

const HOLD_REPEAT_MS = 100;
let controlMode = "arm"; // "arm" or "yaw"
const activeControlStops = new Set();

function isPrimaryPointer(event){
    return !(event.pointerType === "mouse" && event.button !== 0);
}

/* Keep a held control safe when the page loses focus or is hidden. */
function stopAllActiveControls(){
    [...activeControlStops].forEach(stop => stop());
}

window.addEventListener("blur", stopAllActiveControls);
document.addEventListener("visibilitychange", ()=>{
    if(document.hidden)
        stopAllActiveControls();
});

/* ==========================================
   Repeating Button: arm nudges / base rotation
========================================== */

function bindRepeat(button, command){

    if(!button){
        console.error("A repeating control button is missing.");
        return;
    }

    let activePointerId = null;
    let repeatTimer = null;

    function stop(event){
        if(activePointerId === null)
            return;

        if(event && event.pointerId !== undefined && event.pointerId !== activePointerId)
            return;

        if(repeatTimer){
            clearInterval(repeatTimer);
            repeatTimer = null;
        }

        activePointerId = null;
        activeControlStops.delete(stop);
    }

    function start(event){
        if(!isPrimaryPointer(event) || activePointerId !== null)
            return;

        event.preventDefault();
        activePointerId = event.pointerId;

        if(typeof button.setPointerCapture === "function"){
            try{
                button.setPointerCapture(event.pointerId);
            } catch(error){
                // Window-level pointerup/cancel listeners remain as fallback.
            }
        }

        command();
        repeatTimer = setInterval(command, HOLD_REPEAT_MS);
        activeControlStops.add(stop);
    }

    button.addEventListener("pointerdown", start);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);

}

/* ==========================================
   Horizontal D-Pad: ARM nudges or continuous rover yaw
========================================== */

function bindHorizontal(button, direction){

    if(!button){
        console.error("A horizontal D-pad button is missing.");
        return;
    }

    let activePointerId = null;
    let repeatTimer = null;
    let yawModeActive = false;

    function stop(event){
        if(activePointerId === null)
            return;

        if(event && event.pointerId !== undefined && event.pointerId !== activePointerId)
            return;

        if(repeatTimer){
            clearInterval(repeatTimer);
            repeatTimer = null;
        }

        if(yawModeActive){
            sendWheelYaw(0);
            yawModeActive = false;
        }

        activePointerId = null;
        activeControlStops.delete(stop);
    }

    function start(event){
        if(!isPrimaryPointer(event) || activePointerId !== null)
            return;

        event.preventDefault();
        activePointerId = event.pointerId;

        if(typeof button.setPointerCapture === "function"){
            try{
                button.setPointerCapture(event.pointerId);
            } catch(error){
                // Window-level pointerup/cancel listeners remain as fallback.
            }
        }

        if(controlMode === "yaw"){
            yawModeActive = true;
            sendWheelYaw(direction);
        } else {
            const nudge = () => sendArmNudge("x", direction);
            nudge();
            repeatTimer = setInterval(nudge, HOLD_REPEAT_MS);
        }

        activeControlStops.add(stop);
    }

    button.addEventListener("pointerdown", start);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);

}

/* ==========================================
   Directional Button Mapping
========================================== */

// UP / DOWN always make small arm Y-position adjustments.
bindRepeat(upButton, ()=>sendArmNudge("y", 1));
bindRepeat(downButton, ()=>sendArmNudge("y", -1));

// LEFT / RIGHT change function according to the centre D-pad mode.
bindHorizontal(leftButton, -1);
bindHorizontal(rightButton, 1);

/* ==========================================
   D-Pad Mode Toggle
========================================== */

function updateModeButton(){

    if(!modeButton)
        return;

    const yawMode = controlMode === "yaw";

    modeButton.textContent = yawMode ? "YAW" : "ARM";
    modeButton.classList.toggle("yaw-mode", yawMode);
    modeButton.setAttribute("aria-pressed", String(yawMode));
    modeButton.setAttribute(
        "aria-label",
        yawMode
            ? "YAW mode. Click to switch horizontal controls to arm positioning"
            : "ARM mode. Click to switch horizontal controls to rover yaw"
    );
    modeButton.title = yawMode ? "Horizontal buttons: rover yaw" : "Horizontal buttons: arm X positioning";

}

if(modeButton){
    modeButton.addEventListener("click", ()=>{
        stopAllActiveControls();
        controlMode = controlMode === "arm" ? "yaw" : "arm";
        updateModeButton();
    });
} else {
    console.error("D-pad mode toggle #btn-dpad-mode was not found.");
}

updateModeButton();

/* ==========================================
   Face Buttons
========================================== */

// A closes the gripper; B opens it.
document.querySelector("#btn-a")?.addEventListener("click", ()=>sendGripper("close"));
document.querySelector("#btn-b")?.addEventListener("click", ()=>sendGripper("open"));

// X rotates the base left; Y rotates the base right while held.
bindRepeat(document.querySelector("#btn-x"), ()=>sendBaseRotate(-1));
bindRepeat(document.querySelector("#btn-y"), ()=>sendBaseRotate(1));

/* ==========================================
   Arm / Disarm + Controller Button Visibility
   Short press: toggle both four-button clusters.
   Hold 1 second: arm. Hold 2 seconds while armed: disarm.
========================================== */

const ARM_HOLD_MS = 1000;
const DISARM_HOLD_MS = 2000;

const gamepadShell = document.querySelector("#gamepad-shell");
const dpad = document.querySelector("#dpad");
const faceButtons = document.querySelector("#face-buttons");

let isArmed = false;
let pressTimer = null;
let pressEligible = false;
let activePointerId = null;
let awaitingCommand = null; // "arm" | "disarm" | null

function toggleControllerButtons(){

    const hidden = gamepadShell.classList.toggle("control-clusters-hidden");

    dpad.setAttribute("aria-hidden", String(hidden));
    faceButtons.setAttribute("aria-hidden", String(hidden));

    // Prevent keyboard focus from entering button clusters while they are hidden.
    dpad.inert = hidden;
    faceButtons.inert = hidden;

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
        toggleControllerButtons();

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

/*
   Capture the Arm/Disarm pointer at window level. This allows a second
   finger to operate this button while either joystick already owns another
   active pointer, and avoids depending on the button's bubble-phase events.
*/
function eventBelongsToArmButton(event){
    if(typeof event.composedPath === "function")
        return event.composedPath().includes(armButton);

    return event.target === armButton || armButton.contains(event.target);
}

window.addEventListener("pointerdown", (event)=>{
    if(eventBelongsToArmButton(event))
        startPress(event);
}, true);

window.addEventListener("pointerup", (event)=>{
    if(activePointerId !== null && event.pointerId === activePointerId)
        finishPress(event);
}, true);

window.addEventListener("pointercancel", (event)=>{
    if(activePointerId !== null && event.pointerId === activePointerId)
        cancelPress(event);
}, true);

window.addEventListener("lostpointercapture", (event)=>{
    if(activePointerId !== null && event.pointerId === activePointerId)
        cancelPress(event);
}, true);

// Keyboard activation remains a short press that toggles the left D-pad.
armButton.addEventListener("keydown", (event)=>{

    if((event.key !== "Enter" && event.key !== " ") || event.repeat)
        return;

    event.preventDefault();
    if(!awaitingCommand)
        toggleControllerButtons();

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