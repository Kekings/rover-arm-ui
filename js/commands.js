/* ==========================================
   Imports
========================================== */

import {send} from "./websocket.js";

/* ==========================================
   Joystick
========================================== */

export function sendJoystick(side, x, y){

    if(side !== "l" && side !== "r"){
        console.error("Invalid joystick side. Expected 'l' or 'r'.", side);
        return;
    }

    const safeX = Math.max(-100, Math.min(100, Math.round(Number(x) || 0)));
    const safeY = Math.max(-100, Math.min(100, Math.round(Number(y) || 0)));

    // "l" is the arm joystick; "r" is the rover drive/steering joystick.
    send({
        type: "joystick",
        side: side,
        x: safeX,
        y: safeY
    });
}

/* ==========================================
   Generic Control Commands
========================================== */

function sendControl(target, action, fields = {}){

    send({
        type: "control",
        target,
        action,
        ...fields
    });

}

/* Arm Cartesian nudge: axis "x" or "y", direction -1 or +1. */
export function sendArmNudge(axis, direction){

    if(!["x", "y"].includes(axis) || ![-1, 1].includes(direction)){
        console.error("Invalid arm nudge. Expected axis x/y and direction -1/+1.");
        return;
    }

    sendControl("arm", "nudge", {axis, direction});

}

/* Rover yaw: direction -1 (left), +1 (right), or 0 (stop). */
export function sendWheelYaw(direction){

    if(![-1, 0, 1].includes(direction)){
        console.error("Invalid wheel yaw direction. Expected -1, 0, or +1.");
        return;
    }

    sendControl("wheels", "yaw", {direction});

}

/* Gripper is commanded once per click. */
export function sendGripper(state){

    if(state !== "open" && state !== "close"){
        console.error("Invalid gripper state. Expected open or close.");
        return;
    }

    sendControl("arm", "gripper", {state});

}

/* Base rotation is sent repeatedly while X or Y is held. */
export function sendBaseRotate(direction){

    if(![-1, 1].includes(direction)){
        console.error("Invalid base rotation direction. Expected -1 or +1.");
        return;
    }

    sendControl("arm", "base_rotate", {direction});

}

/* ==========================================
   Legacy Command Helpers
   Retained for compatibility with any existing imports.
   The remapped controller above uses the generic "control" messages.
========================================== */

/* ==========================================
   Face Buttons
   Sends one JSON command on click using the existing type format.
========================================== */

export function sendFaceButton(button){

    const allowedButtons = ["a", "b", "x", "y"];

    if(!allowedButtons.includes(button)){
        console.error("Invalid face button. Expected a, b, x, or y.", button);
        return;
    }

    send({
        type: button
    });

}

/* ==========================================
   Altitude
========================================== */

export function sendAltitudeUp(){

    send({
        type: "altitude_up"
    });

}

export function sendAltitudeDown(){

    send({
        type: "altitude_down"
    });

}

/* ==========================================
   Yaw
========================================== */

export function sendYawLeft(){

    send({
        type: "yaw_left"
    });

}

export function sendYawRight(){

    send({
        type: "yaw_right"
    });

}

/* ==========================================
   Land
========================================== */

export function sendLand(){

    send({
        type: "land"
    });

}

/* ==========================================
   Emergency Stop
========================================== */

export function sendEmergencyStop(){

    send({
        type: "emergency_stop"
    });

}


/* ==========================================
   Arm / Disarm
========================================== */

export function sendArm(){

    send({
        type: "flight",
        action: "arm"
    });

}

export function sendDisarm(){

    send({
        type: "flight",
        action: "disarm"
    });

}
