# Rover Arm Gamepad UI Update

This is a focused patch for the Rover Arm web controller. It changes the flight-screen control layout to a gamepad-style layout and adds the second analog joystick.

## Install

1. Make a backup or Git commit before installing.
2. Extract this ZIP into the root of your existing Rover Arm UI project.
3. Preserve the included folder structure and allow the listed files to be overwritten.
4. Keep your existing `js/connection.js`; it is deliberately not included so any temporary development-login bypass or connection-specific edits remain untouched.
5. Refresh the browser with a hard reload.

## Existing controls preserved

The original IDs and their event handlers are kept for:

- `#btn-up`, `#btn-down`, `#btn-left`, `#btn-right`
- `#btn-arm` and `#arm-status-text`
- `#btn-land` and `#btn-stop`
- `#telemetry-x` and `#telemetry-y`
- Controller IP/port and camera configuration inputs and connection buttons

`js/controls.js`, `js/connection.js`, `js/app.js`, and `css/style.css` are not included and are not changed by this patch.

## New gamepad elements

- `#right-joystick` adds an independent second analog stick.
- `#btn-a`, `#btn-b`, `#btn-x`, and `#btn-y` are visual-only placeholders for future functions. They have no command handlers yet.
- Right-stick telemetry is displayed using `#telemetry-right-x` and `#telemetry-right-y`.

## Joystick wire format

Joystick messages are sent as raw WebSocket text frames (not JSON):

- Left stick: `l,x,y` (example: `l,35,-12`)
- Right stick: `r,x,y` (example: `r,-48,21`)

Each coordinate is an integer in the range `-100` to `100`. Releasing a stick sends its neutral frame (`l,0,0` or `r,0,0`). The existing JSON `send()` function remains available and continues to carry all non-joystick commands.

The comma-separated format follows the proposed prefix convention. Make sure the ROS 2 bridge parses the same delimiter.

## Files included

- `index.html`
- `css/connection.css` (the previously approved Rover Arm connection-screen visual refresh)
- `css/layout.css`
- `css/joystick.css`
- `css/controls.css`
- `css/buttons.css`
- `css/telemetry.css`
- `css/responsive.css`
- `css/mobile.css`
- `js/joystick.js`
- `js/commands.js`
- `js/websocket.js`
- `ROVER_ARM_GAMEPAD_TEST_REPORT.json`
