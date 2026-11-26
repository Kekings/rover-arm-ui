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

    // Send both sticks as JSON so the ROS 2 node can parse every message.
    // The side field preserves which joystick generated this reading.
    send({
        type: "joystick",
        side: side,
        x: safeX,
        y: safeY
    });
}

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