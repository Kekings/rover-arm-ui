# Rover Arm transparent gamepad patch

Copy these files into the root of the existing Rover Arm UI project and overwrite the matching files.

Included changes:
- Make the gamepad shell and centre section transparent so the camera video remains visible behind the floating controls.
- Remove the drone-only LAND and E-STOP buttons from the gamepad and detach their UI handlers. The original command exports in js/commands.js are intentionally left untouched.
- Reduce the existing Arm/Disarm button size. Its original 1-second arm and 2-second disarm hold actions and ACK-based state handling are retained. A short press now toggles the left D-pad visibility.
- When the D-pad is hidden, the left joystick shifts toward the left edge to clear more central viewing space.
- Simplify each joystick to one thin outer travel ring and a standalone thumb knob. The existing joystick geometry and travel calculations are retained.
- Keep responsive sizing and touch interaction rules for desktop and mobile landscape.

No changes are made to js/joystick.js, js/commands.js, js/websocket.js, js/camera.js, app.js, or the ROS 2 bridge. The test-video mode remains in js/camera.js.

Validation performed: JavaScript syntax checks, duplicate-ID scan, browser harness checks for transparency, D-pad toggle/restore, arm/disarm long-press + ACK state changes, existing D-pad repeat command, dual joystick independent inputs and neutral-on-release messages, and mobile-landscape layout geometry. A live ROS 2 robot session and a physical Android device were not available for this test.
