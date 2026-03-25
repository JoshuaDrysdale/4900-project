(function () {
    const hour = new Date().getHours(); //to test other times of day while in another, change this assignemnt to one of the numbers below (eg: const hour=5 will become isDay)
    const isDay     = hour >= 6  && hour < 17;
    const isEvening = hour >= 17 && hour < 20;
    const isNight   = hour >= 20 || hour < 6;

    const canvas = document.createElement("canvas");
    canvas.id = "bgCanvas";
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: -1;
    `;
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // -------------------------------------------------------------------------
    // STARS
    // -------------------------------------------------------------------------
    const stars = Array.from({ length: 220 }, () => ({
        x:       Math.random(),
        y:       Math.random(),
        r:       Math.random() * 1.6 + 0.3,
        speed:   Math.random() * 0.4 + 0.05,
        opacity: Math.random()
    }));

    // -------------------------------------------------------------------------
    // THEMES
    // -------------------------------------------------------------------------
    const themes = {
        day: {
            stops:   ["#4fc3f7", "#81d4fa", "#b3e5fc", "#4fc3f7"],
            overlay: "rgba(255, 255, 255, 0.78)",
            angle:   160
        },
        evening: {
            stops:   ["#0d1b4b", "#6b2d6b", "#c0504a", "#f0a500"],
            overlay: "rgba(255, 255, 255, 0.88)", // was 0.80
            angle:   170
        },
        night: {
            stops:   ["#0f0c29", "#1a1a3e", "#0f0c29"],
            overlay: "rgba(255, 255, 255, 0.92)",
            angle:   160
        }
    };

    const theme = isDay ? themes.day : isEvening ? themes.evening : themes.night;

    // -------------------------------------------------------------------------
    // OVERLAY + BRANDING
    // -------------------------------------------------------------------------
    function applyOverlay() {
        const style = document.createElement("style");
        style.textContent = `
            .loginContainer::before, .signupContainer::before {
                background: ${theme.overlay} !important;
            }
        `;
        document.head.appendChild(style);

        const branding = document.querySelector(".appName");
        if (branding) {
            branding.style.textShadow = isDay
                ? "0 2px 8px rgba(0,0,0,0.35)"
                : "0 4px 12px rgba(0,0,0,0.3)";
            branding.style.color = isDay ? "#1a3a5c" : "white";
        }

        const tagline = document.querySelector(".tagline");
        if (tagline) {
            tagline.style.color = isDay
                ? "rgba(20, 60, 100, 0.9)"
                : "rgba(255, 255, 255, 0.9)";
        }
    }

    // -------------------------------------------------------------------------
    // ANIMATION
    // -------------------------------------------------------------------------
    let gradientOffset = 0;
    let rayAngle       = 0;

    function draw() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // --- Gradient background ---
        gradientOffset += 0.002;
        const angle = (theme.angle + Math.sin(gradientOffset) * 10) * Math.PI / 180;
        const x1 = w / 2 + Math.cos(angle) * w;
        const y1 = h / 2 + Math.sin(angle) * h;
        const x2 = w / 2 - Math.cos(angle) * w;
        const y2 = h / 2 - Math.sin(angle) * h;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        theme.stops.forEach((color, i) => {
            grad.addColorStop(i / (theme.stops.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // --- NIGHT: twinkling stars ---
        if (isNight) {
            stars.forEach(star => {
                star.opacity += star.speed * 0.02;
                if (star.opacity > 1 || star.opacity < 0) {
                star.speed *= -1;

                star.y += star.speed * 0.0005;
                if (star.y > 1) star.y = 0;
            }
                ctx.beginPath();
                ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });
        }

        // --- DAY: bright sun with rotating rays ---
        if (isDay) {
            rayAngle += 0.003;
            const sunX = w * 0.75;
            const sunY = Math.max(h * 0.1, 80);
            const sunR = 48;

            // Outer glow
            const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 320);
            outerGlow.addColorStop(0,   "rgba(255, 240, 120, 0.45)");
            outerGlow.addColorStop(0.4, "rgba(255, 210, 80,  0.18)");
            outerGlow.addColorStop(1,   "rgba(255, 200, 50,  0)");
            ctx.fillStyle = outerGlow;
            ctx.fillRect(0, 0, w, h);

            // Rotating rays
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(rayAngle);
            const numRays = 12;
            for (let i = 0; i < numRays; i++) {
                const a = (i / numRays) * Math.PI * 2;
                const innerR = sunR + 10;
                const outerR = sunR + 38 + (i % 2 === 0 ? 14 : 0);
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
                ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
                ctx.strokeStyle = "rgba(255, 240, 100, 0.55)";
                ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
                ctx.stroke();
            }
            ctx.restore();

            // Sun core
            const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
            sunGrad.addColorStop(0,   "rgba(255, 255, 220, 1)");
            sunGrad.addColorStop(0.4, "rgba(255, 230, 80,  1)");
            sunGrad.addColorStop(1,   "rgba(255, 180, 30,  0.9)");
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
            ctx.fillStyle = sunGrad;
            ctx.fill();
        }

        // --- EVENING: glowing sun near horizon ---
        if (isEvening) {
            const sunX = w * 0.75;
            const sunY = h * 0.22; // fixed near top right
            const sunR = 38;

            // Wide horizon glow
            const horizonGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 380);
            horizonGlow.addColorStop(0,   "rgba(255, 180, 50,  0.5)");
            horizonGlow.addColorStop(0.4, "rgba(255, 100, 30,  0.2)");
            horizonGlow.addColorStop(1,   "rgba(255, 60,  10,  0)");
            ctx.fillStyle = horizonGlow;
            ctx.fillRect(0, 0, w, h);

            // Pulsing glow ring
            const pulse = 0.3 + Math.sin(gradientOffset * 2) * 0.12;
            const pulseGlow = ctx.createRadialGradient(sunX, sunY, sunR, sunX, sunY, sunR + 40);
            pulseGlow.addColorStop(0, `rgba(255, 200, 80, ${pulse})`);
            pulseGlow.addColorStop(1, "rgba(255, 100, 30, 0)");
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR + 40, 0, Math.PI * 2);
            ctx.fillStyle = pulseGlow;
            ctx.fill();

            const horizon = ctx.createLinearGradient(0, h * 0.5, 0, h);
            horizon.addColorStop(0, "rgba(0,0,0,0)");
            horizon.addColorStop(1, "rgba(0,0,0,0.25)");
            ctx.fillStyle = horizon;
            ctx.fillRect(0, 0, w, h);

        }
        requestAnimationFrame(draw);
    }
    
    draw();
    applyOverlay();

})();