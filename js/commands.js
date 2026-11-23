/* ==========================================
   Imports
========================================== */

import {send, sendRaw} from "./websocket.js";

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

    // Wire format: l,x,y for the left stick; r,x,y for the right stick.
    sendRaw(`${side},${safeX},${safeY}`);
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