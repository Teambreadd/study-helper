// The (div) container the diffraction diagram will be in
const container = document.getElementById("diffractionDiagram");

// The canvas
const stage = new Konva.Stage({
    container: container,
    width: container.clientWidth,
    height: container.clientHeight,
});

// The layer for all the objects (top barrier and bottom barrier)
const objectLayer = new Konva.Layer();
stage.add(objectLayer);

// This references the HTML width slider input
const widthSlider = document.getElementById("slitWidthSlider");

// Gets the current gap (in pixels) from the slider's current value 
const gap = Number(widthSlider.value);

const topHeight = (stage.height() - gap) / 2;
const bottomHeight = topHeight;

// Setup barrierTop object
const barrierTop = new Konva.Rect({
    x: stage.width() * 0.5,
    y: 0,
    width: container.clientWidth * 0.05,
    height: topHeight,
    fill: "gray",
    stroke: "black",
    strokeWidth: 2,
    // draggable: true,
});

// Properly centers the object to the parent container (basically konva's version of anchor point (0.5,0))
barrierTop.offsetX(barrierTop.width() / 2);

// Setup barrierBottom object
const barrierBottom = new Konva.Rect({
    x: stage.width() * 0.5,
    y: topHeight + gap,
    width: container.clientWidth * 0.05,
    height: bottomHeight,
    fill: "gray",
    stroke: "black",
    strokeWidth: 2,
    // draggable: true,
});

// Properly centers the object to the parent container (basically konva's version of anchor point (0.5,0))
barrierBottom.offsetX(barrierTop.width() / 2);

// Adds both objects to the layer
objectLayer.add(barrierTop);
objectLayer.add(barrierBottom);

// Just testing some drag functionality, will be used for next diffraction diagram (very cool)
// const circle = new Konva.Circle({
//     x: 400,
//     y: 140,
//     radius: 40,
//     fill: "red",
//     draggable: true,
// });

// objectLayer.add(circle);

// connects the width slider's change in input to the actual canvas gap
widthSlider.addEventListener("input", () => {
    const gap = Number(widthSlider.value);

    const topHeight = (stage.height() - gap) / 2;

    barrierTop.y(0);
    barrierTop.height(topHeight);

    barrierBottom.y(topHeight + gap);
    barrierBottom.height(topHeight);

    objectLayer.batchDraw();
});

// Wavefront functionality
const waveLayer = new Konva.Layer();
stage.add(waveLayer);

// moves the wavelayer below all the other layers
waveLayer.moveToBottom();

// Array that will store all teh wavefronts
const wavefronts = [];

// This references the HTML wavelength and wave speed slider input
const wavelengthSlider = document.getElementById("wavelengthSlider");
const waveSpeedSlider = document.getElementById("waveSpeedSlider");

// Wave settings, can be changed by user
let speed = 100; // now constant
let spawnTimer = 0;
let spacing = Number(wavelengthSlider.value);

// Connects the wave speed and wavelength slider to the spacing and speed variables so it updates when changed by user
wavelengthSlider.addEventListener("input", () => {
   spacing = Number(wavelengthSlider.value);
});

// Decided not to do wave speed slider as NCEA level 3 assumes wave speed is constant to show the relationship between wavelength and frequency
// waveSpeedSlider.addEventListener("input", () => {
//    speed = Number(waveSpeedSlider.value);
// });

// The update function that is run every animation frame
function update(dt) {

    spawnTimer += speed * dt;

    if (spawnTimer >= spacing) {
        spawnTimer -= spacing;

        const line = new Konva.Line({
            points: [0, 0, 0, stage.height()],
            stroke: "gray"
        });

        waveLayer.add(line);

        wavefronts.push({
            x: 0,
            line: line
        });
    }

    for (let i = wavefronts.length - 1; i >= 0; i--) {

        const wave = wavefronts[i];

        wave.x += speed * dt;
        wave.line.x(wave.x);

        if (wave.x > stage.width()) {
            wave.line.destroy();
            wavefronts.splice(i, 1);
        }
    }
}

// Animation event that runs every frame
const animation = new Konva.Animation((frame) => {
    const dt = frame.timeDiff / 1000;

    update(dt);
}, waveLayer);

// Start the animation
animation.start();

// Draw up everything (make everything appear on canvas)
objectLayer.draw();
waveLayer.draw();


