// Doppler effect diagram settings
const waveSpeed = 120;
const emissionFrequency = 2; 

let sourceSpeed = 0;

const container = document.getElementById("doppler-effect-diagram");

const stage = new Konva.Stage({
    container: container,
    width: container.clientWidth,
    height: container.clientHeight,
});

// Control element references
const pauseSimulationCheckbox = document.getElementById("pauseDopplerEffectSimulationCheckbox");

const speedSlider = document.getElementById("dopplerEffectSpeedSlider");
const speedNumericInput = document.getElementById("dopplerEffectSpeedNumericInput");

// Safely changes the source speed
function setSourceSpeed(newSpeed) {
    if (Number.isFinite(newSpeed)) {
        sourceSpeed = newSpeed;
    }
}

// Hook up event listeners
speedSlider.addEventListener("input", () => {
    speedNumericInput.value = speedSlider.value;

    setSourceSpeed(Number(speedSlider.value));
});

// Makes changing the slit width via the numeric input update the slider
speedNumericInput.addEventListener("change", () => {
    let value = Number(speedNumericInput.value);

    // Reject inputs that are not numbers
    if (Number.isNaN(value)) {
        value = Number(speedSlider.value);
    }

    // Clamp to slider min and max boundaries
    value = Math.max(
        Number(speedSlider.min),
        Math.min(Number(speedSlider.max), value)
    );

    speedSlider.value = value;
    speedNumericInput.value = value;

    setSourceSpeed(value);
});

speedNumericInput.value = speedSlider.value;

const waveLayer = new Konva.Layer();
const sourceLayer = new Konva.Layer();
stage.add(waveLayer);
stage.add(sourceLayer);

// Creates the square sound source
const source = new Konva.Rect({
    x: stage.width() / 2,
    y: stage.height() / 2,
    width: 40,
    height: 40,
    offsetX: 20,
    offsetY: 20,
    fill: "#767676",
    stroke: "#4e4e4e",
    strokeWidth: 2,
});

sourceLayer.add(source);

const wavefronts = [];
const emissionInterval = 1 / emissionFrequency;

// Emit the first wave immediately
let emissionTimer = emissionInterval; 

function emitWavefront() {
    // Each wave stays centred on the position where it was emitted
    const circle = new Konva.Circle({
        x: source.x(),
        y: source.y(),
        radius: 0,
        stroke: "#555555",
        strokeWidth: 2,
        fillEnabled: false,
    });

    waveLayer.add(circle);
    wavefronts.push(circle);
}

function update(dt) {
    // Move the source horizontally
    source.x(source.x() + sourceSpeed * dt);

    const halfWidth = source.width() / 2;
    const minimumX = halfWidth;
    const maximumX = stage.width() - halfWidth;

    if (source.x() <= minimumX) {
        source.x(minimumX);
        sourceSpeed = 0;
    } else if (source.x() >= maximumX) {
        source.x(maximumX);
        sourceSpeed = 0;
    }

    emissionTimer += dt;

    while (emissionTimer >= emissionInterval) {
        emissionTimer -= emissionInterval;
        emitWavefront();
    }

    // This makes every wave expand at the same speed
    const maximumRadius = Math.hypot(stage.width(), stage.height());

    for (let i = wavefronts.length - 1; i >= 0; i--) {
        const circle = wavefronts[i];
        circle.radius(circle.radius() + waveSpeed * dt);

        if (circle.radius() > maximumRadius) {
            circle.destroy();
            wavefronts.splice(i, 1);
        }
    }
}

// Animation loop
const animation = new Konva.Animation((frame) => {
    if (pauseSimulationCheckbox.checked) return;
    const dt = Math.min(frame.timeDiff / 1000, 0.05);
    update(dt);
}, [waveLayer, sourceLayer]);

animation.start();
