import {sendJoystick} from "./commands.js";

/* ==========================================
   Dual Joystick Controller
   Each stick owns its pointer ID, geometry and output state.
========================================== */

const DEAD_ZONE = 5;
const SPRING_DURATION_MS = 180;
const EDGE_GAP = 4;

function createJoystickController({rootId, side, telemetryXId, telemetryYId}){
    const root = document.getElementById(rootId);

    if(!root){
        console.error(`Joystick element #${rootId} was not found.`);
        return null;
    }

    const base = root.querySelector(".joystick-base");
    const stick = root.querySelector(".stick");
    const telemetryX = telemetryXId ? document.getElementById(telemetryXId) : null;
    const telemetryY = telemetryYId ? document.getElementById(telemetryYId) : null;

    if(!base || !stick){
        console.error(`Joystick #${rootId} is missing its base or thumb stick.`);
        return null;
    }

    let activePointerId = null;
    let centerX = 0;
    let centerY = 0;
    let maxDistance = 0;
    let currentX = 0;
    let currentY = 0;
    let outputX = 0;
    let outputY = 0;
    let springTimer = null;

    function updateGeometry(){
        const baseRect = base.getBoundingClientRect();
        const stickRect = stick.getBoundingClientRect();

        centerX = baseRect.left + baseRect.width / 2;
        centerY = baseRect.top + baseRect.height / 2;

        const baseRadius = Math.min(baseRect.width, baseRect.height) / 2;
        const stickRadius = Math.max(stickRect.width, stickRect.height) / 2;
        maxDistance = Math.max(1, baseRadius - stickRadius - EDGE_GAP);
    }

    function updateTelemetry(){
        if(telemetryX) telemetryX.textContent = String(outputX);
        if(telemetryY) telemetryY.textContent = String(outputY);
    }

    function calculateOutput(){
        outputX = Math.round((currentX / maxDistance) * 100);
        outputY = Math.round((-currentY / maxDistance) * 100);

        outputX = Math.max(-100, Math.min(100, outputX));
        outputY = Math.max(-100, Math.min(100, outputY));

        if(Math.abs(outputX) < DEAD_ZONE) outputX = 0;
        if(Math.abs(outputY) < DEAD_ZONE) outputY = 0;
    }

    function updateStick(){
        stick.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    function moveStick(event){
        let dx = event.clientX - centerX;
        let dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        if(distance > maxDistance){
            const scale = maxDistance / distance;
            dx *= scale;
            dy *= scale;
        }

        currentX = dx;
        currentY = dy;

        updateStick();
        calculateOutput();
        updateTelemetry();
        sendJoystick(side, outputX, outputY);
    }

    function startDrag(event){
        if(activePointerId !== null) return;
        if(event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();

        if(springTimer){
            clearTimeout(springTimer);
            springTimer = null;
        }

        updateGeometry();
        activePointerId = event.pointerId;

        // Each stick captures only its own pointer. A second finger can still
        // operate Arm/Disarm or the other joystick independently.
        if(typeof root.setPointerCapture === "function"){
            try{
                root.setPointerCapture(event.pointerId);
            } catch(error){
                // The window-level pointer listeners remain as a fallback.
            }
        }

        stick.style.transition = "none";
        moveStick(event);
    }

    function drag(event){
        if(activePointerId === null || event.pointerId !== activePointerId) return;
        event.preventDefault();
        moveStick(event);
    }

    function stopDrag(event){
        if(activePointerId === null) return;
        if(event && event.pointerId !== undefined && event.pointerId !== activePointerId) return;

        activePointerId = null;
        currentX = 0;
        currentY = 0;
        outputX = 0;
        outputY = 0;

        stick.style.transition = `transform ${SPRING_DURATION_MS}ms ease-out`;
        updateStick();
        updateTelemetry();
        sendJoystick(side, 0, 0);

        if(springTimer) clearTimeout(springTimer);
        springTimer = setTimeout(()=>{
            stick.style.transition = "";
            springTimer = null;
        }, SPRING_DURATION_MS);
    }

    root.addEventListener("pointerdown", startDrag);
    root.addEventListener("lostpointercapture", stopDrag);
    window.addEventListener("pointermove", drag, {passive:false});
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    return {stopDrag};
}

const joystickControllers = [
    createJoystickController({
        rootId:"left-joystick",
        side:"l",
        telemetryXId:"telemetry-x",
        telemetryYId:"telemetry-y"
    }),
    createJoystickController({
        rootId:"right-joystick",
        side:"r",
        telemetryXId:"telemetry-right-x",
        telemetryYId:"telemetry-right-y"
    })
].filter(Boolean);

// If the page loses focus while a stick is held, send a safe neutral reading.
window.addEventListener("blur", ()=>{
    joystickControllers.forEach(controller => controller.stopDrag());
});

document.addEventListener("visibilitychange", ()=>{
    if(document.hidden){
        joystickControllers.forEach(controller => controller.stopDrag());
    }
});
