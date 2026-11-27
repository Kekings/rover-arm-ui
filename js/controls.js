/* ==========================================
   Imports
========================================== */

import {
    sendArmNudge,
    sendWheelYaw,
    sendBaseRotate,
    sendArm,
    sendDisarm,
    sendFaceButton
} from "./commands.js";

/* ==========================================
   Elements
========================================== */

const upButton = document.querySelector("#btn-up");
const downButton = document.querySelector("#btn-down");
const leftButton = document.querySelector("#btn-left");
const rightButton = document.querySelector("#btn-right");
const modeButton = document.querySelector("#btn-mode");

const armButton = document.querySelector("#btn-arm");
const armStatusText = document.querySelector("#arm-status-text");

/* ==========================================
   D-Pad Mode
========================================== */

let dpadMode = "arm";

function updateDpadMode(){

    const wheelMode = dpadMode === "wheel";

    modeButton.textContent = wheelMode ? "YAW" : "ARM";
    modeButton.classList.toggle("dpad-mode--wheel", wheelMode);
    modeButton.setAttribute("aria-pressed", String(wheelMode));
    modeButton.setAttribute(
        "aria-label",
        wheelMode
            ? "D-pad mode is wheel yaw. Activate to switch to arm positioning."
            : "D-pad mode is arm positioning. Activate to switch to wheel yaw."
    );
    modeButton.title = wheelMode ? "Switch to arm positioning" : "Switch to wheel yaw";
}

modeButton.addEventListener("click", ()=>{
    dpadMode = dpadMode === "arm" ? "wheel" : "arm";
    updateDpadMode();
});

updateDpadMode();

/* ==========================================
   D-Pad Hold Controls
========================================== */

const ARM_NUDGE_REPEAT_MS = 100;
const BASE_ROTATE_REPEAT_MS = 100;

function bindArmNudge(button, axis, direction){

    let repeatTimer = null;
    let activePointerId = null;

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
    }

    button.addEventListener("pointerdown", (event)=>{

        if(event.pointerType === "mouse" && event.button !== 0)
            return;

        if(activePointerId !== null)
            return;

        event.preventDefault();
        activePointerId = event.pointerId;

        if(typeof button.setPointerCapture === "function"){
            try{ button.setPointerCapture(event.pointerId); }
            catch(error){ /* Pointer events still work without capture. */ }
        }

        const nudge = ()=>sendArmNudge(axis, direction);
        nudge();
        repeatTimer = setInterval(nudge, ARM_NUDGE_REPEAT_MS);
    });

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", ()=>stop());
}

function bindHorizontalControl(button, direction){

    let repeatTimer = null;
    let activePointerId = null;
    let actionAtPress = null;

    function stop(event){

        if(activePointerId === null)
            return;

        if(event && event.pointerId !== undefined && event.pointerId !== activePointerId)
            return;

        if(repeatTimer){
            clearInterval(repeatTimer);
            repeatTimer = null;
        }

        // A wheel-yaw command is held until release, then explicitly stopped.
        if(actionAtPress === "wheel")
            sendWheelYaw(0);

        actionAtPress = null;
        activePointerId = null;
    }

    button.addEventListener("pointerdown", (event)=>{

        if(event.pointerType === "mouse" && event.button !== 0)
            return;

        if(activePointerId !== null)
            return;

        event.preventDefault();
        activePointerId = event.pointerId;

        if(typeof button.setPointerCapture === "function"){
            try{ button.setPointerCapture(event.pointerId); }
            catch(error){ /* Pointer events still work without capture. */ }
        }

        actionAtPress = dpadMode === "wheel" ? "wheel" : "arm";

        if(actionAtPress === "wheel"){
            // Send once on press. The explicit direction 0 on release stops yaw.
            sendWheelYaw(direction);
        } else {
            const nudge = ()=>sendArmNudge("x", direction);
            nudge();
            repeatTimer = setInterval(nudge, ARM_NUDGE_REPEAT_MS);
        }
    });

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", ()=>stop());
}

// Up/down always make small arm Y-position adjustments.
bindArmNudge(upButton, "y", 1);
bindArmNudge(downButton, "y", -1);

// Left/right adjust arm X in ARM mode, or hold rover yaw in WHEEL mode.
bindHorizontalControl(leftButton, -1);
bindHorizontalControl(rightButton, 1);

/* ==========================================
   Face Buttons
========================================== */

["a", "b"].forEach((button)=>{

    const element = document.querySelector(`#btn-${button}`);

    if(!element){
        console.error(`Face button #btn-${button} was not found.`);
        return;
    }

    element.addEventListener("click", ()=>sendFaceButton(button));
});

function bindBaseRotate(button, direction){

    let repeatTimer = null;
    let activePointerId = null;

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
    }

    button.addEventListener("pointerdown", (event)=>{

        if(event.pointerType === "mouse" && event.button !== 0)
            return;

        if(activePointerId !== null)
            return;

        event.preventDefault();
        activePointerId = event.pointerId;

        if(typeof button.setPointerCapture === "function"){
            try{ button.setPointerCapture(event.pointerId); }
            catch(error){ /* Pointer events still work without capture. */ }
        }

        const rotate = ()=>sendBaseRotate(direction);
        rotate();
        repeatTimer = setInterval(rotate, BASE_ROTATE_REPEAT_MS);
    });

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", ()=>stop());
}

// X/Y rotate the base while held. A/B open and close the gripper once per click.
bindBaseRotate(document.querySelector("#btn-x"), -1);
bindBaseRotate(document.querySelector("#btn-y"), 1);

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