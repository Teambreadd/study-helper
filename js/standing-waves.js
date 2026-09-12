// Element references
const container = document.getElementById("standingWavesDiagram");

const harmonicSlider = document.getElementById("harmonicSlider");
const harmonicNumericInput = document.getElementById("harmonicSliderNumericInput");

const showIncidentWaveCheckbox = document.getElementById("showIncidentWaveCheckbox");
const showReflectedWaveCheckbox = document.getElementById("showReflectedWaveCheckbox");
const showResultantWaveCheckbox = document.getElementById("showResultantWaveCheckbox");

const showNodalLinesCheckbox = document.getElementById("showStandingWavesNodalLinesCheckbox");
const showAntiNodalLinesCheckbox = document.getElementById("showStandingWavesAntinodalLinesCheckbox");

const pauseSimulationCheckbox = document.getElementById("pauseStandingWavesSimulationCheckbox");

const selectBoundaryType = document.getElementById("standingWavesBoundaryType");

let currentBoundaryType = selectBoundaryType.value;

// The canvas
const stage = new Konva.Stage({
    container: container,
    width: container.clientWidth,
    height: container.clientHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

// Diagram dimensions
const leftX = 40;
const rightX = stage.width() - 40;
const centreY = stage.height() / 2;
const pipeLength = rightX - leftX;

const amplitude = 35;
let harmonic = 5;
const numberOfPoints = 300;

// Initial sync slider and corresponding input
harmonicNumericInput.value = harmonicSlider.value

// Update harmonic slider on input
harmonicSlider.addEventListener("input", () => {
    const value = Number(harmonicSlider.value);
    if (!Number.isFinite(value) || value <= 0) return;

    harmonic = value;
    harmonicNumericInput.value = harmonicSlider.value;

    redrawNodeAndAntinodeMarkers();
});

// Update harmonic numeric input on input
harmonicNumericInput.addEventListener("change", () => {
    let value = harmonicNumericInput.valueAsNumber;

    // Check if valid
    if (!Number.isFinite(value)) {
        harmonicNumericInput.value = String(harmonic);
        return;
    }

    // Since the numeric input does not by default have the min/max values check against harmonic slider
    const min = Number(harmonicSlider.min);
    const max = Number(harmonicSlider.max);

    // Restrict it to a whole number within the slider range
    value = Math.round(value);
    value = Math.max(min, Math.min(max, value));

    // Fixed–open only permits odd harmonics
    if (currentBoundaryType === "fixed-open" && value % 2 === 0) {
        value = value === max ? value - 1 : value + 1;
    }

    // Update variables
    harmonic = value;
    harmonicSlider.value = String(value);
    harmonicNumericInput.value = String(value);
    harmonic = value;
    redrawNodeAndAntinodeMarkers();
});

// Pipe centre line
const centreLine = new Konva.Line({
    points: [leftX, centreY, rightX, centreY],
    stroke: "#AAAAAA",
    strokeWidth: 1,
    dash: [6, 6],
});

// Closed left end
const leftEnd = new Konva.Line({
    points: [
        leftX,
        centreY - amplitude * 2.5,
        leftX,
        centreY + amplitude * 2.5,
    ],
    stroke: "#393939",
    strokeWidth: 6,
});

// Closed right end
const rightEnd = new Konva.Line({
    points: [
        rightX,
        centreY - amplitude * 2.5,
        rightX,
        centreY + amplitude * 2.5,
    ],
    stroke: "#393939",
    strokeWidth: 6,
});

// Wave travelling towards the right
const incidentWave = new Konva.Line({
    stroke: "#2563eb",
    strokeWidth: 2,
    opacity: 0.65,
    lineCap: "round",
    lineJoin: "round",
});

// Reflected wave travelling towards the left
const reflectedWave = new Konva.Line({
    stroke: "#d97706",
    strokeWidth: 2,
    opacity: 0.65,
    lineCap: "round",
    lineJoin: "round",
});

// Resultant standing wave
const resultantWave = new Konva.Line({
    stroke: "#555555",
    strokeWidth: 4,
    lineCap: "round",
    lineJoin: "round",
});

const nodeMarkerGroup = new Konva.Group({
    listening: false,
});

const antinodeMarkerGroup = new Konva.Group({
    listening: false,
});

// Add all objects to the layer
layer.add(
    centreLine,
    nodeMarkerGroup,
    antinodeMarkerGroup,
    incidentWave,
    reflectedWave,
    resultantWave,
    leftEnd,
    rightEnd
);

// Hook up all visibility checkboxes to the objects
showIncidentWaveCheckbox.addEventListener("change", () => {
    incidentWave.visible(showIncidentWaveCheckbox.checked);
});

showReflectedWaveCheckbox.addEventListener("change", () => {
    reflectedWave.visible(showReflectedWaveCheckbox.checked);
});

showResultantWaveCheckbox.addEventListener("change", () => {
    resultantWave.visible(showResultantWaveCheckbox.checked);
});

showNodalLinesCheckbox.addEventListener("change", () => {
    nodeMarkerGroup.visible(showNodalLinesCheckbox.checked);
});

showAntiNodalLinesCheckbox.addEventListener("change", () => {
    antinodeMarkerGroup.visible(showAntiNodalLinesCheckbox.checked);
});

// Initial setup
incidentWave.visible(showIncidentWaveCheckbox.checked);
reflectedWave.visible(showReflectedWaveCheckbox.checked);
resultantWave.visible(showResultantWaveCheckbox.checked);
nodeMarkerGroup.visible(showNodalLinesCheckbox.checked);
antinodeMarkerGroup.visible(showAntiNodalLinesCheckbox.checked);

// Gets all the nodes and antinodes from the current standing wave
function getNodeAndAntinodeRatios() {
    const config = getWaveConfiguration();
    const k = config.k;

    const nodes = [];
    const antinodes = [];

    // The physics
    if (config.wave === Math.sin) {
        // sin(kx) = 0 at nodes
        for (let m = 0; m * Math.PI <= k; m++) {
            nodes.push((m * Math.PI) / k);
        }

        // |sin(kx)| = 1 at antinodes
        for (let m = 0; Math.PI / 2 + m * Math.PI <= k; m++) {
            antinodes.push((Math.PI / 2 + m * Math.PI) / k);
        }
    } else {
        // cos(kx) = 0 at nodes
        for (let m = 0; Math.PI / 2 + m * Math.PI <= k; m++) {
            nodes.push((Math.PI / 2 + m * Math.PI) / k);
        }

        // |cos(kx)| = 1 at antinodes
        for (let m = 0; m * Math.PI <= k; m++) {
            antinodes.push((m * Math.PI) / k);
        }
    }

    return { nodes, antinodes };
}

// Removes old node/antinode lines and draws new node/antinode lines in their updated positions
function redrawNodeAndAntinodeMarkers() {
    nodeMarkerGroup.destroyChildren();
    antinodeMarkerGroup.destroyChildren();

    const positions = getNodeAndAntinodeRatios();

    const markerTop = centreY - amplitude * 2.2;
    const markerBottom = centreY + amplitude * 2.2;

    // Draw and label nodes
    for (const xRatio of positions.nodes) {
        const x = leftX + xRatio * pipeLength;

        nodeMarkerGroup.add(
            new Konva.Line({
                points: [x, markerTop, x, markerBottom],
                stroke: "#dc2626",
                strokeWidth: 2,
                dash: [5, 5],
            }),

            new Konva.Text({
                x: x - 12,
                y: markerTop - 24,
                width: 24,
                text: "N",
                align: "center",
                fontSize: 16,
                fontStyle: "bold",
                fill: "#dc2626",
            })
        );
    }

    // Draw and label antinodes
    for (const xRatio of positions.antinodes) {
        const x = leftX + xRatio * pipeLength;

        antinodeMarkerGroup.add(
            new Konva.Line({
                points: [x, markerTop, x, markerBottom],
                stroke: "#16a34a",
                strokeWidth: 2,
                dash: [5, 5],
            }),

            new Konva.Text({
                x: x - 12,
                y: markerTop - 24,
                width: 24,
                text: "A",
                align: "center",
                fontSize: 16,
                fontStyle: "bold",
                fill: "#16a34a",
            })
        );
    }

    layer.batchDraw();
}

// Toggles harmonic controls between fix-fixed/open-open which allows all harmonic numbers, and fixed-open which only allows odd numbers
function updateHarmonicControls() {
    const min = Number(harmonicSlider.min);
    const max = Number(harmonicSlider.max);

    // Changes slider step and current value based on the current boundary type
    if (currentBoundaryType === "fixed-open") {
        harmonicSlider.step = "2";

        // Convert the current harmonic to the nearest allowed odd number
        let newHarmonic = Math.round(harmonic);

        if (newHarmonic % 2 === 0) {
            newHarmonic -= 1;
        }

        newHarmonic = Math.max(min, Math.min(max, newHarmonic));
        harmonic = newHarmonic;
    } else {
        harmonicSlider.step = "1";
        harmonic = Math.round(harmonic);
    }

    // Update values
    harmonicSlider.value = String(harmonic);
    harmonicNumericInput.value = String(harmonic);
}

// Sets the physics configuration for each boundary type
function getWaveConfiguration() {
    if (currentBoundaryType === "fixed-fixed") {
        return {
            k: harmonic * Math.PI,
            wave: Math.sin,
            leftClosed: true,
            rightClosed: true,
        };
    }

    if (currentBoundaryType === "open-open") {
        return {
            k: harmonic * Math.PI,
            wave: Math.cos,
            leftClosed: false,
            rightClosed: false,
        };
    }

    if (currentBoundaryType === "fixed-open") {
        return {
            // Only odd harmonics: 1, 3, 5, 7...
            k: harmonic * Math.PI / 2,
            wave: Math.sin,
            leftClosed: true,
            rightClosed: false,
        };
    }
}

// Applies the correct boundary type
function updateBoundaryDisplay() {
    const config = getWaveConfiguration();

    leftEnd.visible(config.leftClosed);
    rightEnd.visible(config.rightClosed);
}

// Initial update
updateBoundaryDisplay();
redrawNodeAndAntinodeMarkers();

// Updates the current boundary type and the display on select input
selectBoundaryType.addEventListener("change", () => {
    currentBoundaryType = selectBoundaryType.value;

    updateHarmonicControls();
    updateBoundaryDisplay();
    redrawNodeAndAntinodeMarkers();
});

// Draws the waves
function createWavePoints(waveFunction) {
    const points = [];

    for (let i = 0; i <= numberOfPoints; i++) {
        // Position along the pipe from 0 to 1
        const xRatio = i / numberOfPoints;

        const x = leftX + xRatio * pipeLength;
        const displacement = waveFunction(xRatio);

        points.push(
            x,
            centreY - displacement
        );
    }

    return points;
}

let phase = 0;

// Main event loop
const animation = new Konva.Animation((frame) => {
    // If pause checkbox is checked don't update
    if (pauseSimulationCheckbox.checked) return;

    // how far the waves have progressed through their cycle
    phase += frame.timeDiff * 0.003;

    // Gets the current boundary type config
    const config = getWaveConfiguration();
    const k = config.k;
    const wave = config.wave;

    // Updates all the waves with their new positions
    incidentWave.points(
        createWavePoints((x) => {
            return amplitude * wave(k * x - phase);
        })
    );

    reflectedWave.points(
        createWavePoints((x) => {
            return amplitude * wave(k * x + phase);
        })
    );

    resultantWave.points(
        createWavePoints((x) => {
            const incident =
                amplitude * wave(k * x - phase);

            const reflected =
                amplitude * wave(k * x + phase);

            return incident + reflected;
        })
    );
}, layer);

// Starts the animation
animation.start();