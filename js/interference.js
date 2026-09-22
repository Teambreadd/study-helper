// Wave settings, cannot be changed by user
let speed = 100; // now constant
let spawnTimer = 0;

// Spacing, can be changed by user
let spacing = 70;


let cycleSpacing = spacing;
let nextIsTrough = false;

// The (div) container the interference diagram will be in
const container = document.getElementById("interferenceDiagram");

// The canvas
const stage = new Konva.Stage({
    container: container,
    width: container.clientWidth,
    height: container.clientHeight,
});

// The layer for all the objects (top barrier and bottom barrier)
const objectLayer = new Konva.Layer();
stage.add(objectLayer);

// Gap is fixed this time otherwise the simulation would get too complex
const slitWidth = 30;

// The height of the barrier between the two slits/the separation between the two slits
const middleHeight = 80;

const topHeight = (stage.height() - (slitWidth * 2) - middleHeight) / 2;

const bottomHeight = topHeight;
const barrierX = stage.width() * 0.25;
const barrierWidth = container.clientWidth * 0.01;

// Setup barrierTop, barrierMiddle and barrierBottom objects
const barrierTop = new Konva.Rect({
    x: barrierX,
    y: 0,
    width: barrierWidth,
    height: topHeight,
    fill: "gray",
    stroke: "black",
    strokeWidth: 2,
});

const barrierMiddle = new Konva.Rect({
    x: barrierX,

    // Begins after the top barrier and first slit
    y: topHeight + slitWidth,

    width: barrierWidth,
    height: middleHeight,
    fill: "gray",
    stroke: "black",
    strokeWidth: 2,
});

const barrierBottom = new Konva.Rect({
    x: barrierX,

    // Begins after top barrier, slit 1, middle barrier and slit 2
    y: topHeight + slitWidth + middleHeight + slitWidth,

    width: barrierWidth,
    height: bottomHeight,
    fill: "gray",
    stroke: "black",
    strokeWidth: 2,
});

// Properly centers the object vertically to the parent container (basically konva's version of anchor point (0.5,0))
barrierTop.offsetX(barrierTop.width() / 2);

// Properly centers the object vertically to the parent container (basically konva's version of anchor point (0.5,0))
barrierMiddle.offsetX(barrierTop.width() / 2);

// Properly centers the object vertically to the parent container (basically konva's version of anchor point (0.5,0))
barrierBottom.offsetX(barrierTop.width() / 2);

// Adds all objects to the layer
objectLayer.add(barrierTop);
objectLayer.add(barrierBottom);
objectLayer.add(barrierMiddle);

// Just testing some drag functionality, will be used for next interference diagram (very cool)
// const circle = new Konva.Circle({
//     x: 400,
//     y: 140,
//     radius: 40,
//     fill: "red",
//     draggable: true,
// });

// objectLayer.add(circle);

// Wavefront functionality
const waveLayer = new Konva.Layer();
stage.add(waveLayer);

// Diffracted wave layer (This is a separate layer because the left side needs to be clipped to hide the other side of the circle, if this were done in the wavelayer then the incoming waves would be clipped)
const interferenceLayer = new Konva.Layer();
stage.add(interferenceLayer);

interferenceLayer.clip({
    x: stage.width() * 0.25,
    y: 0,
    width: stage.width() * 0.75,
    height: stage.height()
});

// moves the interference layer to the bottom
interferenceLayer.moveToBottom();

// moves the wavelayer below all the other layers
waveLayer.moveToBottom();

// Array that will store all teh wavefronts
const wavefronts = [];

// Pause simulation checkbox
const pauseInterferenceSimulationCheckbox = document.getElementById("pauseInterferenceSimulationCheckbox");

// All the event listeners setup here: ------------------------------------------------------------------------------------------------------------
// Wavelength slider
const wavelengthSlider = document.getElementById("interferenceWavelengthSlider")

// Wavelength number
const wavelengthNumber = document.getElementById("interferenceWavelengthNumber")

wavelengthNumber.value = wavelengthSlider.value


// Connects the wavelength number input and wavelength slider to the spacing variable so it updates when changed by user
wavelengthSlider.addEventListener("input", () => {
    const value = Number(wavelengthSlider.value);
    if (!Number.isFinite(value) || value <= 0) return;

    spacing = value;
    wavelengthNumber.value = wavelengthSlider.value;

    redrawInterferenceLines();
});

// Hooks up the wavelength numeric input to user input and syncs it with the wavelength slider
wavelengthNumber.addEventListener("change", () => {
    let value = wavelengthNumber.valueAsNumber;
    // Reject inputs that are not numbers
    if (Number.isNaN(value)) {
        value = Number(wavelengthSlider.value);
    }

    // Clamp to slider min and max boundaries
    value = Math.max(
        Number(wavelengthSlider.min),
        Math.min(Number(wavelengthSlider.max), value)
    );

    spacing = value;
    wavelengthNumber.value = value;
    wavelengthSlider.value = value;

    redrawInterferenceLines();
});

// Show peaks checkbox
const showPeaksCheckbox = document.getElementById("showInterferencePeaks")

// Show troughs checkbox
const showTroughsCheckbox = document.getElementById("showInterferenceTroughs")

// Function to toggle the visibility of the peaks and troughs
function applyWaveVisibility(waveData) {
    const enabled = waveData.isTrough
        ? showTroughsCheckbox.checked
        : showPeaksCheckbox.checked;

    for (const circle of waveData.slitCircles) {
        circle.visible(enabled && waveData.interferenceStarted);
    }
}

// This function is to be hooked up to the checkboxes so it updates on user input.
function updateWaveVisibility() {
    for (const waveData of wavefronts) {
        applyWaveVisibility(waveData);
    }

    // Redraw even when the simulation is paused
    interferenceLayer.batchDraw();
}

// Hooks up updateWaveVisibility() to the two checkboxes
showPeaksCheckbox.addEventListener("change", updateWaveVisibility);
showTroughsCheckbox.addEventListener("change", updateWaveVisibility);

const showAntinodalLinesCheckbox = document.getElementById("showAntinodalLines")
const showNodalLinesCheckbox = document.getElementById("showNodalLines")


showAntinodalLinesCheckbox.addEventListener("change", redrawInterferenceLines);

showNodalLinesCheckbox.addEventListener("change", redrawInterferenceLines);

// Decided not to do wave speed slider as NCEA level 3 assumes wave speed is constant to show the relationship between wavelength and frequency
// waveSpeedSlider.addEventListener("input", () => {
//    speed = Number(waveSpeedSlider.value);
// });

// Calculates and returns the coordinates along one nodal/anti-nodal line
function getInterferenceLinePoints(pathDifference, side, slitX, centreY, slitSeparation, endX) {
    const points = [];

    const c = slitSeparation / 2;
    const a = pathDifference / 2;

    // This path difference cannot form a forward-going curve
    if (a >= c) return points;

    // Horizontally every 4 pixels a coordinate is calculated.
    for (let x = slitX; x <= endX; x += 4) {
        const distanceFromSlits = x - slitX;

        const offset = a === 0
            ? 0
            : a * Math.sqrt(
                1 + distanceFromSlits ** 2 / (c ** 2 - a ** 2)
            );

        points.push(x, centreY + side * offset);
    }

    return points;
}

// Creates the stationary nodal and antinodal Konva layer
const patternLayer = new Konva.Layer();
stage.add(patternLayer);

patternLayer.clip({
    x: barrierX + barrierWidth / 2,
    y: 0,
    width: stage.width() - barrierX - barrierWidth / 2,
    height: stage.height(),
});

const patternLines = [];

// Function that draws the interference nodal/anti-nodal lines
function redrawInterferenceLines() {
    for (const line of patternLines) {
        line.destroy();
    }
    patternLines.length = 0;

    if (!Number.isFinite(spacing) || spacing <= 0) {
        patternLayer.batchDraw();
        return;
    }

    const slit1Y = (
        barrierTop.y() + barrierTop.height() +
        barrierMiddle.y()
    ) / 2;

    const slit2Y = (
        barrierMiddle.y() + barrierMiddle.height() +
        barrierBottom.y()
    ) / 2;

    const centreY = (slit1Y + slit2Y) / 2;
    const separation = Math.abs(slit2Y - slit1Y);

    // Function that draws the nodal/anti-nodal lines
    function drawLine(pathDifference, side, isNodal) {
        const points = getInterferenceLinePoints(
            pathDifference,
            side,
            barrierX,
            centreY,
            separation,
            stage.width()
        );

        if (points.length < 4) return;

        const line = new Konva.Line({
            points: points,
            stroke: isNodal ? "#d97706" : "#2563eb",
            strokeWidth: 1.5,
            dash: isNodal ? [6, 6] : [],
        });

        patternLayer.add(line);
        patternLines.push(line);
    }

    // Draw antinodal lines only when enabled
    if (showAntinodalLinesCheckbox.checked) {
        // Central antinodal line
        drawLine(0, 1, false);

        // Other antinodal lines: path difference = nλ
        for (let n = 1; n * spacing < separation; n++) {
            drawLine(n * spacing, -1, false);
            drawLine(n * spacing, 1, false);
        }
    }

    // Draw nodal lines only when enabled
    if (showNodalLinesCheckbox.checked) {
        // Nodal lines: path difference = (n + 0.5)λ
        for (
            let n = 0;
            (n + 0.5) * spacing < separation;
            n++
        ) {
            drawLine((n + 0.5) * spacing, -1, true);
            drawLine((n + 0.5) * spacing, 1, true);
        }
    }

    patternLayer.batchDraw();
}

// The update function that is run every animation frame
function update(dt) {
    const travel = speed * dt;
    spawnTimer += travel;

    // Centres of the two slit openings.
    const slitCentres = [
        (
            barrierTop.y() + barrierTop.height() +
            barrierMiddle.y()
        ) / 2,

        (
            barrierMiddle.y() + barrierMiddle.height() +
            barrierBottom.y()
        ) / 2,
    ];

    // Beyond this radius, both semicircles are entirely offscreen
    const maxRadius = Math.max(
        ...slitCentres.map(centreY =>
            Math.hypot(
                stage.width() - barrierX,
                Math.max(centreY, stage.height() - centreY)
            )
        )
    );

    while (spawnTimer >= cycleSpacing / 2) {
        spawnTimer -= cycleSpacing / 2;

        const isTrough = nextIsTrough;
        nextIsTrough = !nextIsTrough;

        // This captures the wavelength at the start of each cycle
        if (!isTrough) {
            cycleSpacing = spacing;
        }

        const line = new Konva.Line({
            points: [0, 0, 0, stage.height()],
            stroke: "gray",
            visible: !isTrough,
        });

        waveLayer.add(line);

        // One circle at each slit centre
        const slitCircles = slitCentres.map(centreY => {
            const circle = new Konva.Circle({
                x: barrierX,
                y: centreY,
                radius: 0,
                stroke: isTrough ? "#b8b8b8" : "#555555",
                strokeWidth: 2,
                fillEnabled: false,
                visible: false,
            });

            interferenceLayer.add(circle);
            return circle;
        });

        wavefronts.push({
            x: spawnTimer - travel,
            line: line,
            slitCircles: slitCircles,
            isTrough: isTrough,
            interferenceStarted: false,
        });
    }

    for (let i = wavefronts.length - 1; i >= 0; i--) {
        const wave = wavefronts[i];

        wave.x += travel;
        wave.line.x(wave.x);

        const radius = wave.x - barrierX;

        if (radius > maxRadius + 4) {
            wave.line.destroy();

            for (const circle of wave.slitCircles) {
                circle.destroy();
            }

            wavefronts.splice(i, 1);
            continue;
        }

        // Begin diffraction when the incoming wave reaches the slits
        if (!wave.interferenceStarted && radius >= 0) {
            wave.interferenceStarted = true;
            wave.line.visible(false);
        }

        if (wave.interferenceStarted) {
            for (const circle of wave.slitCircles) {
                circle.radius(radius);
            }
        }

        applyWaveVisibility(wave);
    }

    interferenceLayer.batchDraw();
}

// Animation event that runs every frame
const animation = new Konva.Animation((frame) => {
    if (pauseInterferenceSimulationCheckbox.checked) return;

    const dt = Math.min(frame.timeDiff / 1000, 0.05);

    update(dt);
}, waveLayer);

// Synchronise the initial wavelength with the slider
const initialWavelength = Number(wavelengthSlider.value);

if (Number.isFinite(initialWavelength) && initialWavelength > 0) {
    spacing = initialWavelength;
}

cycleSpacing = spacing;
wavelengthNumber.value = spacing;

// Draws the initial pattern
redrawInterferenceLines();

// Start the animation
animation.start();

// Draw up everything (make everything appear on canvas)
objectLayer.draw();
waveLayer.draw();