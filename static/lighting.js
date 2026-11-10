(() => {
    "use strict";

    const ALL_COLOR = 1;
    const RIPPLE = 2;
    const IDLE_COLOR = "#394b68";
    const RIPPLE_MS = 2100;
    const RIPPLE_WIDTH = 88;
    const svgNamespace = "http://www.w3.org/2000/svg";

    const stage = document.querySelector("#stage");
    const lightLayer = document.querySelector("#penlights");
    const performer = document.querySelector("#performer");
    const ring = document.querySelector("#wave-ring");
    const positionX = document.querySelector("#position-x");
    const positionY = document.querySelector("#position-y");
    const colorInput = document.querySelector("#effect-color");
    const colorValue = document.querySelector("#color-value");
    const status = document.querySelector("#status");
    const swatches = document.querySelectorAll(".swatch");
    const lights = [];
    let animationFrame = null;

    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 15; column++) {
            // Leave two aisles between the three groups of seats.
            const x = 76 + column * 38 + Math.floor(column / 5) * 18;
            const y = 190 + row * 27;
            const dot = document.createElementNS(svgNamespace, "circle");
            dot.setAttribute("cx", x);
            dot.setAttribute("cy", y);
            dot.setAttribute("r", 4);
            dot.setAttribute("fill", IDLE_COLOR);
            lightLayer.append(dot);
            lights.push({ x, y, dot });
        }
    }

    function readPosition() {
        return { x: positionX.valueAsNumber, y: positionY.valueAsNumber };
    }

    function setPosition({ x, y }) {
        positionX.value = Math.round(x);
        positionY.value = Math.round(y);
        const position = readPosition();
        performer.setAttribute("transform", `translate(${position.x} ${position.y})`);
    }

    function showColorChoice() {
        colorValue.value = colorInput.value.toUpperCase();
        for (const swatch of swatches) {
            swatch.setAttribute("aria-pressed", swatch.value === colorInput.value);
        }
    }

    function resetLights() {
        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        ring.setAttribute("visibility", "hidden");
        for (const { dot } of lights) {
            dot.setAttribute("fill", IDLE_COLOR);
            dot.setAttribute("r", 4);
        }
    }

    function movePerformer(position) {
        if (animationFrame !== null) {
            resetLights();
            status.textContent = "位置を変更しました。もう一度再生できます。";
        }
        setPosition(position);
    }

    function playRipple(color, origin) {
        const distances = lights.map(({ x, y, dot }) => ({
            dot,
            distance: Math.hypot(x - origin.x, y - origin.y),
        }));
        const endRadius = Math.max(...distances.map(light => light.distance)) + RIPPLE_WIDTH;
        ring.setAttribute("cx", origin.x);
        ring.setAttribute("cy", origin.y);
        ring.setAttribute("stroke", color);
        ring.setAttribute("r", 0);
        ring.setAttribute("visibility", "visible");
        const startedAt = performance.now();

        function draw(now) {
            const progress = Math.min((now - startedAt) / RIPPLE_MS, 1);
            const radius = progress * endRadius;
            ring.setAttribute("r", radius);
            ring.setAttribute("opacity", (1 - progress) * 0.62);

            for (const { dot, distance } of distances) {
                const elapsedDistance = radius - distance;
                const strength = elapsedDistance < 0
                    ? 0
                    : Math.max(0, 1 - elapsedDistance / RIPPLE_WIDTH);
                const fill = strength > 0
                    ? `color-mix(in srgb, ${color} ${Math.round(strength * 100)}%, ${IDLE_COLOR})`
                    : IDLE_COLOR;
                dot.setAttribute("fill", fill);
                dot.setAttribute("r", 4 + strength * 2.5);
            }

            if (progress < 1) {
                animationFrame = requestAnimationFrame(draw);
                return;
            }
            animationFrame = null;
            ring.setAttribute("visibility", "hidden");
            status.textContent = "波紋の再生が終わりました。";
        }

        status.textContent = "波紋を再生しています。";
        animationFrame = requestAnimationFrame(draw);
    }

    // Preview interface. The effect IDs and number of colors are local to this page.
    function play({ effectNumber, colors }, origin = readPosition()) {
        if (effectNumber !== ALL_COLOR && effectNumber !== RIPPLE) {
            throw new RangeError("演出番号は 1 または 2 を指定してください。");
        }
        const rgb = Array.isArray(colors) && colors.length === 1 ? colors[0] : null;
        if (!(rgb instanceof Uint8Array || Array.isArray(rgb)) || rgb.length !== 3 ||
            !Array.from(rgb).every(value => Number.isInteger(value) && value >= 0 && value <= 255)) {
            throw new TypeError("演出色は RGB 3 バイトを 1 組指定してください。");
        }
        const { x, y } = origin;
        const { width, height } = stage.viewBox.baseVal;
        if (!Number.isFinite(x) || x < 0 || x > width || !Number.isFinite(y) || y < 0 || y > height) {
            throw new RangeError("演者の座標はステージ図の範囲内で指定してください。");
        }

        resetLights();
        setPosition(origin);
        const color = "#" + Array.from(rgb, value => value.toString(16).padStart(2, "0")).join("");
        document.querySelector(`input[name="effect"][value="${effectNumber}"]`).checked = true;
        colorInput.value = color;
        showColorChoice();

        if (effectNumber === ALL_COLOR) {
            for (const { dot } of lights) {
                dot.setAttribute("fill", color);
                dot.setAttribute("r", 5.5);
            }
            status.textContent = "全体の色を変更しました。";
            return;
        }
        playRipple(color, readPosition());
    }

    window.lightingPreview = { play };

    for (const input of [positionX, positionY]) {
        input.addEventListener("input", () => movePerformer(readPosition()));
    }
    stage.addEventListener("click", event => {
        const point = new DOMPoint(event.clientX, event.clientY);
        const { x, y } = point.matrixTransform(stage.getScreenCTM().inverse());
        const { width, height } = stage.viewBox.baseVal;
        movePerformer({
            x: Math.max(0, Math.min(x, width)),
            y: Math.max(0, Math.min(y, height)),
        });
    });
    colorInput.addEventListener("input", showColorChoice);
    for (const swatch of swatches) {
        swatch.addEventListener("click", () => {
            colorInput.value = swatch.value;
            showColorChoice();
        });
    }
    document.querySelector("#play").addEventListener("click", () => {
        const effectNumber = Number(document.querySelector('input[name="effect"]:checked').value);
        const pairs = colorInput.value.slice(1).match(/.{2}/g);
        const rgb = Uint8Array.from(pairs, pair => Number.parseInt(pair, 16));
        play({ effectNumber, colors: [rgb] });
    });
    document.querySelector("#clear").addEventListener("click", () => {
        resetLights();
        status.textContent = "消灯しました。";
    });

    setPosition(readPosition());
    showColorChoice();
})();
