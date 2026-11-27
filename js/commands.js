/* ==========================================
   Rover UI Commands
   All browser-to-ROS 2 messages use JSON.
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

    send({
        type: "joystick",
        side,
        x: safeX,
        y: safeY
    });
}

/* ==========================================
   Generic Control Commands
========================================== */

export function sendControl(target, action, details = {}){

    if(!target || !action){
        console.error("Control command requires a target and action.");
        return;
    }

    send({
        ...details,
        type: "control",
        target,
        action
    });
}

export function sendArmNudge(axis, direction){

    if(axis !== "x" && axis !== "y"){
        console.error("Invalid arm nudge axis. Expected x or y.", axis);
        return;
    }

    if(direction !== -1 && direction !== 1){
        console.error("Invalid arm nudge direction. Expected -1 or 1.", direction);
        return;
    }

    sendControl("arm", "nudge", {axis, direction});
}

export function sendWheelYaw(direction){

    if(![-1, 0, 1].includes(direction)){
        console.error("Invalid wheel yaw direction. Expected -1, 0, or 1.", direction);
        return;
    }

    sendControl("wheels", "yaw", {direction});
}

/* ==========================================
   Face Buttons
========================================== */

export function sendFaceButton(button){

    const commands = {
        a: {target: "arm", action: "gripper", state: "close"},
        b: {target: "arm", action: "gripper", state: "open"}
    };

    const command = commands[button];

    if(!command){
        console.error("Invalid face button. Expected a, b, x, or y.", button);
        return;
    }

    sendControl(command.target, command.action, {state: command.state});
}

export function sendBaseRotate(direction){

    if(direction !== -1 && direction !== 1){
        console.error("Invalid base rotation direction. Expected -1 or 1.", direction);
        return;
    }

    sendControl("arm", "base_rotate", {direction});
}

/* ==========================================
   Existing System Commands
========================================== */

export function sendLand(){
    send({type: "land"});
}

export function sendEmergencyStop(){
    send({type: "emergency_stop"});
}

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
