/* ==========================================================================
   ViewmetricaMX — Interactive particle sphere
   Full-page visual layer; independent from the 360° viewer.
   Pointer movement changes the sphere's orientation and position.
   ========================================================================== */
(function () {
  "use strict";

  function initParticleSphere() {
    const canvas = document.getElementById("reality-particles");
    if (!canvas || !window.THREE) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power"
      });
    } catch (error) {
      canvas.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const count = mobile ? 1900 : 4200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const cyan = new THREE.Color("#00c8ff");
    const blue = new THREE.Color("#315dff");
    const pale = new THREE.Color("#9aeaff");

    // Fibonacci distribution gives the sphere an even, recognizable particle shell.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const jitter = (Math.random() - 0.5) * 0.035;
      const radius = 2.12 + jitter;
      positions[i * 3] = Math.cos(theta) * ring * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * ring * radius;

      const blend = THREE.MathUtils.clamp((y + 1) * 0.5 + (Math.random() - 0.5) * 0.25, 0, 1);
      const col = blue.clone().lerp(cyan, blend).lerp(pale, Math.random() * 0.16);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      sizes[i] = 0.65 + Math.random() * 0.9;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: mobile ? 0.026 : 0.021,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const sphere = new THREE.Points(geometry, material);
    sphere.position.set(mobile ? 0.05 : 0.35, 0.0, 0);
    scene.add(sphere);

    // A sparse halo of smaller particles adds depth without becoming visual noise.
    const dustCount = mobile ? 100 : 220;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const r = 2.8 + Math.random() * 2.5;
      const planar = Math.sqrt(1 - z * z);
      dustPositions[i * 3] = Math.cos(theta) * planar * r;
      dustPositions[i * 3 + 1] = z * r;
      dustPositions[i * 3 + 2] = Math.sin(theta) * planar * r;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: "#3a9dff",
        size: 0.014,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(dust);

    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastFrame = 0;

    function onPointerMove(event) {
      targetX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 0.8;
      targetY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 0.5;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.35));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      sphere.scale.setScalar(mobile ? 0.86 : Math.min(1.12, Math.max(0.82, width / 1300)));
    }

    function render(now) {
      if (document.hidden) {
        requestAnimationFrame(render);
        return;
      }
      if (!reducedMotion && now - lastFrame < (mobile ? 40 : 30)) {
        requestAnimationFrame(render);
        return;
      }
      lastFrame = now;

      pointerX += (targetX - pointerX) * 0.035;
      pointerY += (targetY - pointerY) * 0.035;

      if (!reducedMotion) {
        sphere.rotation.y += 0.0017;
        sphere.rotation.y += (pointerX * 0.32 - sphere.rotation.y) * 0.0025;
        sphere.rotation.x += (pointerY * 0.22 - sphere.rotation.x) * 0.0025;
        sphere.position.x = (mobile ? 0.05 : 0.35) + pointerX * 0.22;
        sphere.position.y = -pointerY * 0.16;
        dust.rotation.y -= 0.00035;
        dust.rotation.x += 0.00008;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderer.render(scene, camera);
    });
    resize();
    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParticleSphere, { once: true });
  } else {
    initParticleSphere();
  }
})();