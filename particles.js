/* ==========================================================================
   ViewmetricaMX — Reality Intelligence particle background
   Decorative Three.js scene. Does not touch #viewer-stage or #pano-canvas.
   ========================================================================== */
(function () {
  "use strict";

  function startRealityParticles() {
    const canvas = document.getElementById("reality-particles");
    if (!canvas || typeof THREE === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Keep a static, lightweight field for visitors who request reduced motion.
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    } catch (error) {
      canvas.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
    const count = mobile ? 850 : 1450;
    const positions = new Float32Array(count * 3);
    const home = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new THREE.Color("#00bfff");
    const violet = new THREE.Color("#526bff");
    const color = new THREE.Color();

    // Rabbit silhouette: ellipsoids for head/body and tapered ears, sampled as a point cloud.
    const parts = [
      { c: [0, .48, 0], r: [.55, .46, .36], w: .21 },
      { c: [0, -.25, -.08], r: [.78, .53, .43], w: .36 },
      { c: [-.25, 1.05, -.02], r: [.16, .64, .14], w: .13 },
      { c: [.25, 1.05, -.02], r: [.16, .64, .14], w: .13 },
      { c: [-.58, -.48, -.02], r: [.32, .3, .34], w: .07 },
      { c: [.58, -.48, -.02], r: [.32, .3, .34], w: .07 },
      { c: [0, -.31, -.55], r: [.19, .19, .19], w: .03 }
    ];
    const totalWeight = parts.reduce((sum, p) => sum + p.w, 0);

    for (let i = 0; i < count; i++) {
      let pick = Math.random() * totalWeight;
      let part = parts[0];
      for (const candidate of parts) { pick -= candidate.w; if (pick <= 0) { part = candidate; break; } }
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const radius = Math.cbrt(Math.random());
      let x = part.c[0] + Math.sin(v) * Math.cos(u) * radius * part.r[0];
      let y = part.c[1] + Math.sin(v) * Math.sin(u) * radius * part.r[1];
      let z = part.c[2] + Math.cos(v) * radius * part.r[2];
      // Spread the silhouette into a quiet spatial field rather than a foreground object.
      const spread = 1.0;
      home[i * 3] = x * spread + (Math.random() - .5) * .14;
      home[i * 3 + 1] = y * spread + (Math.random() - .5) * .14;
      home[i * 3 + 2] = z * spread;
      positions[i * 3] = home[i * 3];
      positions[i * 3 + 1] = home[i * 3 + 1];
      positions[i * 3 + 2] = home[i * 3 + 2];
      color.copy(cyan).lerp(violet, THREE.MathUtils.clamp((y + .65) / 2, 0, 1));
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: mobile ? .022 : .018, vertexColors: true, transparent: true, opacity: .72, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const cloud = new THREE.Points(geometry, material);
    cloud.position.set(mobile ? .55 : 1.65, -.1, 0);
    cloud.scale.setScalar(mobile ? 1.15 : 1.28);
    scene.add(cloud);

    const ambientCount = mobile ? 70 : 130;
    const ambientPos = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPos[i * 3] = (Math.random() - .5) * 15;
      ambientPos[i * 3 + 1] = (Math.random() - .5) * 9;
      ambientPos[i * 3 + 2] = (Math.random() - .5) * 5;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPos, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: "#00bfff", size: .018, transparent: true, opacity: .34, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);

    let width = 0, height = 0, frame = 0, lastFrame = 0;
    function resize() {
      width = window.innerWidth; height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.35));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      // Keep the rabbit cloud modest and to the side of central content on desktop.
      cloud.position.x = width < 700 ? .6 : 1.7;
    }
    function animate(now) {
      frame = requestAnimationFrame(animate);
      if (document.hidden) return;
      if (!reducedMotion && now - lastFrame < (mobile ? 45 : 33)) return;
      lastFrame = now;
      if (!reducedMotion) {
        cloud.rotation.y = Math.sin(now * .00012) * .13;
        cloud.rotation.x = Math.sin(now * .00009) * .035;
        dust.rotation.y += .00018;
        dust.rotation.x += .00004;
      }
      renderer.render(scene, camera);
    }
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) renderer.render(scene, camera); });
    resize();
    if (reducedMotion) renderer.render(scene, camera); else animate(0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startRealityParticles, { once: true });
  else startRealityParticles();
})();
