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

// Gets the text element showing the current value of the width slider
const widthNumber = document.getElementById("slitWidthNumber");

// Initially updates it
widthNumber.textContent = widthSlider.value + " px";

// Gets the current gap (in pixels) from the slider's current value 
const gap = Number(widthSlider.value);

const topHeight = (stage.height() - gap) / 2;
const bottomHeight = topHeight;

// Setup barrierTop object
const barrierTop = new Konva.Rect({
    x: stage.width() * 0.5,
    y: 0,
    width: container.clientWidth * 0.01,
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
    width: container.clientWidth * 0.01,
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

    widthNumber.textContent = widthSlider.value + " px";
});

// Wavefront functionality
const waveLayer = new Konva.Layer();
stage.add(waveLayer);

// Diffracted wave layer (This is a separate layer because the left side needs to be clipped to hide the other side of the circle, if this were done in the wavelayer then the incoming waves would be clipped)
const diffractionLayer = new Konva.Layer();
stage.add(diffractionLayer);

diffractionLayer.clip({
    x: stage.width() * 0.5,
    y: 0,
    width: stage.width() * 0.5,
    height: stage.height()
});

// moves the diffraction layer to the bottom
diffractionLayer.moveToBottom();

// moves the wavelayer below all the other layers
waveLayer.moveToBottom();

// Array that will store all teh wavefronts
const wavefronts = [];

// This references the HTML wavelength and wave speed slider input
const wavelengthSlider = document.getElementById("wavelengthSlider");
// const waveSpeedSlider = document.getElementById("waveSpeedSlider");

// This gets the text element that will display the value of the wavelength slider
const wavelengthNumber = document.getElementById("wavelengthNumber");

// Initially updates the value
wavelengthNumber.textContent = wavelengthSlider.value + " px";

// Show wavelets checkbox
const showWaveletsCheckbox = document.getElementById("showWaveletsCheckbox");

// Show wavefront checkbox
const showWavefrontCheckbox = document.getElementById("showWavefrontCheckbox");

// Pause simulation checkbox
const pauseSimulationCheckbox = document.getElementById("pauseSimulationCheckbox");

// Function to toggle wavelet visibility
function toggleWaveletVisibility(visible) {
    for (const waveData of wavefronts) {
        for (const wavelet of waveData.wavelets) {
            wavelet.circle.visible(visible);
        }
    }
}

// Toggles diffracted wavefront visibility
function toggleWavefrontVisibility(visible) {
    for (const waveData of wavefronts) {
        waveData.envelope.visible(visible);
        waveData.topEnvelope.visible(visible);
        waveData.bottomEnvelope.visible(visible);
    }

    waveLayer.batchDraw();
    diffractionLayer.batchDraw();
}

// Hooks up show wavelet checkbox to the wavelet visibility function
showWaveletsCheckbox.addEventListener("input", () => {
   toggleWaveletVisibility(showWaveletsCheckbox.checked);
});


// Hooks up wavefront checkbox to the wavefront visibility function
showWavefrontCheckbox.addEventListener("input", () => {
   toggleWavefrontVisibility(showWavefrontCheckbox.checked);
});

// Wave settings, can be changed by user
let speed = 100; // now constant
let spawnTimer = 0;
let spacing = Number(wavelengthSlider.value);

// Connects the wave speed and wavelength slider to the spacing and speed variables so it updates when changed by user
wavelengthSlider.addEventListener("input", () => {
    spacing = Number(wavelengthSlider.value);

    wavelengthNumber.textContent = wavelengthSlider.value + " px";
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

        const envelope = new Konva.Line({
            points: [],
            stroke: "gray",
            strokeWidth: 2,
            lineCap: "round",
            lineJoin: "round",
        });

        const topEnvelope = new Konva.Line({
            points: [],
            stroke: "gray",
            strokeWidth: 2,
            lineCap: "round",
            lineJoin: "round",
        });

        const bottomEnvelope = new Konva.Line({
            points: [],
            stroke: "gray",
            strokeWidth: 2,
            lineCap: "round",
            lineJoin: "round",
        });

        waveLayer.add(line);
        diffractionLayer.add(envelope);
        diffractionLayer.add(topEnvelope);
        diffractionLayer.add(bottomEnvelope);

        wavefronts.push({
            x: 0,
            line: line,
            envelope,
            topEnvelope,
            bottomEnvelope,
            diffractionStarted: false,
            wavelets: [],
        });
    }

    for (let i = wavefronts.length - 1; i >= 0; i--) {

        const wave = wavefronts[i];

        wave.x += speed * dt;
        wave.line.x(wave.x);

        // Cleans up all objects once they are offscreen
        if (wave.x > stage.width() * 1.5) {
            for (const wavelet of wave.wavelets) {
                wavelet.circle.destroy();
            }

            wave.line.destroy();
            wave.envelope.destroy();
            wave.topEnvelope.destroy();
            wave.bottomEnvelope.destroy();

            wavefronts.splice(i, 1);
        }

        if (!wave.diffractionStarted && wave.x >= stage.width() * 0.5) {
            wave.diffractionStarted = true;

            // Save the gap at that moment so future changes don't affect already diffracted waves
            wave.slitTop = barrierTop.height();
            wave.slitBottom = barrierBottom.y();

            const slitX = stage.width() * 0.5;
            const slitTop = barrierTop.height();
            const slitBottom = barrierBottom.y();

            const gap = slitBottom - slitTop;

            const sourceSpacing = 8; // this is pixels between each circle

            const sourceCount = Math.max(
                2,
                Math.ceil(gap / sourceSpacing)
            );

            for (let j = 0; j < sourceCount; j++) {

                const y = slitTop + (j / (sourceCount - 1)) * gap;

                const circle = new Konva.Circle({
                    x: slitX,
                    y: y,
                    radius: 0,
                    stroke: "gray",
                    opacity: 0.3,
                    fillEnabled: false,
                });

                diffractionLayer.add(circle);

                // Ensures the wavelets update their visibility initially
                circle.visible(showWaveletsCheckbox.checked);

                wave.wavelets.push({
                    circle: circle
                });
            }

            wave.line.visible(false);

        }
    }

    for (const waveData of wavefronts) {

        for (const wave of waveData.wavelets) {
            wave.circle.radius(
                wave.circle.radius() + speed * dt
            );
        }

        // This is where the actual wavefront is drawn:

        // These are the variables, redefined
        const slitX = stage.width() * 0.5;

        // Array of all the points collected at the front of the wavefront (near the middle)
        const frontPoints = [];

        // Loop checks between slitTop and slitBottom every 2 pixels along a y value and finds the circle with x value that is furthest to the right, this is basically the same for all 3 loops just with different areas to check for each.
        for (let y = waveData.slitTop; y <= waveData.slitBottom; y += 2) {

            // no point yet so just define as -infinity as nothing can be smaller than negative infinity 
            let bestX = -Infinity; // Any valid x-coordinate will be larger than this.

            // Checks through every circle 
            for (const wavelet of waveData.wavelets) {

                // Gets the circle
                const circle = wavelet.circle;

                // gets the circle radius
                const r = circle.radius();

                // The distance between the y value and the center of the circle
                const dy = y - circle.y();

                // Skips the circles which do not intercept the y value. 
                if (Math.abs(dy) > r) continue; // E.g., if distance dy from center of circle is greater than the circle radius r, the circle obviously does not intercept the y value being checked.

                // Gets the right hand edge of the circle
                const x = circle.x() + Math.sqrt(r * r - dy * dy);

                // Checks whether it is the furtherest circle so far against the previous best
                bestX = Math.max(bestX, x);
            }

            // If a value was found (it changed from the default -infinity), then append.
            if (bestX !== -Infinity) {
                frontPoints.push(bestX, y);
            }
        }

        waveData.envelope.points(frontPoints);

        // Array of all the points collected at the top of the wavefront (near the middle)
        const topPoints = [];

        // same thing but for top half
        for (let x = slitX; x <= stage.width(); x += 2) {

            let bestY = Infinity;

            for (const wavelet of waveData.wavelets) {

                const circle = wavelet.circle;

                const dx = x - circle.x();
                const r = circle.radius();

                if (Math.abs(dx) > r) continue;

                const y = circle.y() - Math.sqrt(r * r - dx * dx);

                bestY = Math.min(bestY, y);
            }

            if (bestY !== Infinity) {
                topPoints.push(x, bestY);
            }
        }

        // Array of all the points collected at the bottom of the wavefront (near the middle)
        const bottomPoints = [];

        // same thing but for the bottom half
        for (let x = slitX; x <= stage.width(); x += 2) {

            let bestY = -Infinity;

            for (const wavelet of waveData.wavelets) {

                const circle = wavelet.circle;

                const dx = x - circle.x();
                const r = circle.radius();

                if (Math.abs(dx) > r) continue;

                const y = circle.y() + Math.sqrt(r * r - dx * dx);

                bestY = Math.max(bestY, y);
            }

            if (bestY !== -Infinity) {
                bottomPoints.push(x, bestY);
            }
        }


        if (frontPoints.length >= 2 && topPoints.length >= 2) {
            topPoints[topPoints.length - 2] = frontPoints[0];
            topPoints[topPoints.length - 1] = frontPoints[1];
        }

        if (frontPoints.length >= 2 && bottomPoints.length >= 2) {

            const joinX = frontPoints[frontPoints.length - 2];
            const joinY = frontPoints[frontPoints.length - 1];

            let bestIndex = 0;
            let bestDistance = Infinity;

            for (let i = 0; i < bottomPoints.length; i += 2) {

                const distance = Math.abs(bottomPoints[i] - joinX);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = i;
                }
            }

            bottomPoints[bestIndex] = joinX;
            bottomPoints[bestIndex + 1] = joinY;
        }

        waveData.topEnvelope.points(topPoints);
        waveData.bottomEnvelope.points(bottomPoints);

        // Ensures the envelopes spawn in with the correct visibility
        waveData.topEnvelope.visible(showWavefrontCheckbox.checked)
        waveData.bottomEnvelope.visible(showWavefrontCheckbox.checked)
        waveData.envelope.visible(showWavefrontCheckbox.checked)
    }
}

// Animation event that runs every frame
const animation = new Konva.Animation((frame) => {
    if (pauseSimulationCheckbox.checked) return;
    
    const dt = Math.min(frame.timeDiff / 1000, 0.05);

    update(dt);
}, waveLayer);

// Start the animation
animation.start();

// Draw up everything (make everything appear on canvas)
objectLayer.draw();
waveLayer.draw();


