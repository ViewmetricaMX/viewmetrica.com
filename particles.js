/* ==========================================================================
   ViewmetricaMX — Low-poly particle rabbit
   Full-page background layer. The original page and 360° viewer remain intact.
   Cursor repulsion is handled globally; the canvas never captures clicks.
   ========================================================================== */
(function () {
  "use strict";

  function initParticleRabbit() {
    const canvas = document.getElementById("reality-particles");
    if (!canvas || !window.THREE) return;

    const THREE = window.THREE;
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
    camera.position.set(0, 0.25, 7.2);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 2000px)").matches;
    const pointCount = mobile ? 2100 : 3600;
    const cyan = new THREE.Color("#00c8ff");
    const blue = new THREE.Color("#315dff");
    const ice = new THREE.Color("#9aeaff");

    // Sample the surfaces of ellipsoids and tapered ears to preserve a clear rabbit silhouette.
    const parts = [
      // Silhouette based on the ViewmetricaMX logo: seated rabbit in three-quarter profile, facing left.
      { type: "ellipsoid", center: [-0.12, 0.43, 0.18], radius: [0.34, 0.36, 0.30], weight: 0.19 }, // compact head
      { type: "ellipsoid", center: [-0.38, 0.27, 0.36], radius: [0.22, 0.13, 0.18], weight: 0.07 }, // pointed muzzle
      { type: "ear", base: [-0.25, 0.66, 0.10], tip: [-0.42, 1.28, 0.02], radius: 0.105, weight: 0.09 },
      { type: "ear", base: [-0.02, 0.66, 0.08], tip: [0.20, 1.20, 0.00], radius: 0.105, weight: 0.09 },
      { type: "ellipsoid", center: [0.18, -0.12, -0.08], radius: [0.48, 0.43, 0.48], weight: 0.25 }, // rounded seated body
      { type: "ellipsoid", center: [0.40, -0.39, 0.10], radius: [0.34, 0.23, 0.34], weight: 0.10 }, // folded hind leg
      { type: "ellipsoid", center: [-0.08, -0.46, 0.24], radius: [0.30, 0.10, 0.20], weight: 0.08 }, // front paws
      { type: "ellipsoid", center: [0.59, -0.12, -0.40], radius: [0.14, 0.14, 0.14], weight: 0.05 } // small tail
    ];

    const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
    function sampleRabbitPoint() {
      let pick = Math.random() * totalWeight;
      let part = parts[0];
      for (const candidate of parts) {
        pick -= candidate.weight;
        if (pick <= 0) { part = candidate; break; }
      }

      let x, y, z;
      if (part.type === "ellipsoid") {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        // Surface sampling keeps the silhouette readable rather than filling it in.
        const facet = 0.965 + Math.random() * 0.07;
        x = part.center[0] + Math.sin(v) * Math.cos(u) * part.radius[0] * facet;
        y = part.center[1] + Math.cos(v) * part.radius[1] * facet;
        z = part.center[2] + Math.sin(v) * Math.sin(u) * part.radius[2] * facet;
      } else {
        const t = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const r = part.radius * (0.16 + Math.sqrt(Math.random()) * (1 - t * 0.62));
        const dx = part.tip[0] - part.base[0];
        const dy = part.tip[1] - part.base[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        x = part.base[0] + dx * t + nx * Math.cos(angle) * r;
        y = part.base[1] + dy * t + ny * Math.cos(angle) * r;
        z = part.base[2] + (part.tip[2] - part.base[2]) * t + Math.sin(angle) * r * 0.45;
      }

      // Quantization subtly suggests the Stanford-bunny low-poly / point-cloud aesthetic.
      const snap = 0.018;
      return [
        Math.round(x / snap) * snap,
        Math.round(y / snap) * snap,
        Math.round(z / snap) * snap
      ];
    }

    const original = new Float32Array(pointCount * 3);
    const positions = new Float32Array(pointCount * 3);
    const velocities = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const p = sampleRabbitPoint();
      original.set(p, i * 3);
      positions.set(p, i * 3);
      const height = THREE.MathUtils.clamp((p[1] + 0.55) / 2.0, 0, 1);
      const color = blue.clone().lerp(cyan, height).lerp(ice, Math.random() * 0.12);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: mobile ? 0.027 : 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const rabbit = new THREE.Group();
    rabbit.position.set(mobile ? 0.0 : 0.30, -0.02, 0);
    // Rotate points and connecting edges together around the rabbit's center.
    rabbit.rotation.order = "YXZ";
    rabbit.add(new THREE.Points(geometry, material));

    // Build a restrained low-poly wireframe by linking nearby original vertices.
    // Limit links per vertex to keep the silhouette legible and avoid a solid web.
    const maxEdgeLength = mobile ? 0.145 : 0.16;
    const maxDegree = 5;
    const degree = new Uint8Array(pointCount);
    const edgePairs = [];
    for (let i = 0; i < pointCount; i++) {
      const ax = original[i * 3], ay = original[i * 3 + 1], az = original[i * 3 + 2];
      const neighbors = [];
      for (let j = i + 1; j < pointCount; j++) {
        const dx = ax - original[j * 3];
        const dy = ay - original[j * 3 + 1];
        const dz = az - original[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < maxEdgeLength * maxEdgeLength && degree[i] < maxDegree && degree[j] < maxDegree) {
          neighbors.push({ j, d2 });
        }
      }
      neighbors.sort((a, b) => a.d2 - b.d2);
      for (const n of neighbors.slice(0, 3)) {
        if (degree[i] >= maxDegree || degree[n.j] >= maxDegree) continue;
        edgePairs.push(i, n.j);
        degree[i]++;
        degree[n.j]++;
      }
    }
    const linePositions = new Float32Array(edgePairs.length * 3);
    const lineColors = new Float32Array(edgePairs.length * 3);
    for (let e = 0; e < edgePairs.length; e += 2) {
      for (let endpoint = 0; endpoint < 2; endpoint++) {
        const vertex = edgePairs[e + endpoint];
        const out = (e + endpoint) * 3;
        linePositions[out] = positions[vertex * 3];
        linePositions[out + 1] = positions[vertex * 3 + 1];
        linePositions[out + 2] = positions[vertex * 3 + 2];
        lineColors[out] = colors[vertex * 3] * 0.55;
        lineColors[out + 1] = colors[vertex * 3 + 1] * 0.55;
        lineColors[out + 2] = colors[vertex * 3 + 2] * 0.55;
      }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const wireframe = new THREE.LineSegments(lineGeometry, lineMaterial);
    rabbit.add(wireframe);
    scene.add(rabbit);

    // A quiet cloud of ambient points gives depth without competing with page content.
    const dustCount = mobile ? 95 : 190;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      dustPositions[i * 3 + 2] = -1.5 - Math.random() * 4;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: "#168bff",
        size: 0.018,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(dust);

    const pointer = new THREE.Vector2(-9999, -9999);
    const mouseWorld = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let lastFrame = 0;

    function onPointerMove(event) {
      pointer.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointer.y = -(event.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(mousePlane, mouseWorld);
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.35));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      rabbit.scale.setScalar(mobile ? 0.79 : Math.min(1.02, Math.max(0.78, width / 1400)));
    }

    function animate(now) {
      if (document.hidden) {
        requestAnimationFrame(animate);
        return;
      }
      const frameInterval = mobile ? 38 : 28;
      if (now - lastFrame < frameInterval) {
        requestAnimationFrame(animate);
        return;
      }
      const dt = Math.min(2, Math.max(0.5, (now - (lastFrame || now - 16.7)) / 16.7));
      lastFrame = now;

      if (!reducedMotion) {
        // Slow continuous rotation makes the point-cloud rabbit visibly turn in space.
        rabbit.rotation.y += 0.0018 * dt;
        rabbit.rotation.x = Math.sin(now * 0.00021) * 0.045;
        dust.rotation.y += 0.00045 * dt;
      }

      const influenceRadius = mobile ? 0.72 : 0.88;
      const force = mobile ? 0.045 : 0.052;
      for (let i = 0; i < pointCount; i++) {
        const k = i * 3;
        const px = positions[k], py = positions[k + 1], pz = positions[k + 2];
        const ox = original[k], oy = original[k + 1], oz = original[k + 2];

        // Cursor pushes nearby points away; spring force restores the rabbit silhouette.
        if (pointer.x > -900 && !reducedMotion) {
          const dx = px + rabbit.position.x - mouseWorld.x;
          const dy = py + rabbit.position.y - mouseWorld.y;
          const dz = pz - mouseWorld.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < influenceRadius * influenceRadius && distSq > 0.00001) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / influenceRadius) * force * dt;
            velocities[k] += (dx / dist) * push;
            velocities[k + 1] += (dy / dist) * push;
            velocities[k + 2] += (dz / dist) * push;
          }
        }

        const spring = reducedMotion ? 0.11 : 0.055;
        velocities[k] += (ox - px) * spring * dt;
        velocities[k + 1] += (oy - py) * spring * dt;
        velocities[k + 2] += (oz - pz) * spring * dt;
        const damping = Math.pow(0.84, dt);
        velocities[k] *= damping;
        velocities[k + 1] *= damping;
        velocities[k + 2] *= damping;

        positions[k] += velocities[k] * dt;
        positions[k + 1] += velocities[k + 1] * dt;
        positions[k + 2] += velocities[k + 2] * dt;
      }
      geometry.attributes.position.needsUpdate = true;
      // Keep the low-poly edges attached as particles react to the cursor.
      for (let e = 0; e < edgePairs.length; e++) {
        const vertex = edgePairs[e];
        const out = e * 3;
        linePositions[out] = positions[vertex * 3];
        linePositions[out + 1] = positions[vertex * 3 + 1];
        linePositions[out + 2] = positions[vertex * 3 + 2];
      }
      lineGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderer.render(scene, camera);
    });
    resize();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParticleRabbit, { once: true });
  } else {
    initParticleRabbit();
  }
})();
