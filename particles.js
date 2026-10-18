/* ==========================================================================
   ViewmetricaMX — Low-poly particle rabbit
   Full-page background layer. The original page and 360° viewer remain intact.
   Cursor repulsion is handled globally; the canvas never captures clicks.
   ========================================================================== */
(function () {
  "use strict";

  async function initParticleRabbit() {
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
    camera.position.set(0, 0.25, 3.5);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const pointCount = mobile ? 2100 : 3600;
    const cyan = new THREE.Color("#00c8ff");
    const blue = new THREE.Color("#315dff");
    const ice = new THREE.Color("#9aeaff");
    const heatYellow = new THREE.Color("#ffe600");
    const heatCyan = new THREE.Color("#16e6ff");
    const baseColors = new Float32Array(pointCount * 3);

    // Load the exact brand SVG and sample its filled silhouette into points.
    // This keeps the logo geometry faithful instead of approximating it with ellipsoids.
    async function sampleLogoPoints(count) {
      const response = await fetch("bunny-logo.svg", { cache: "force-cache" });
      if (!response.ok) throw new Error("Could not load bunny-logo.svg");
      const svgBlob = await response.blob();
      const objectUrl = URL.createObjectURL(svgBlob);
      try {
        const image = new Image();
        image.src = objectUrl;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        const raster = document.createElement("canvas");
        raster.width = 414;
        raster.height = 517;
        const ctx = raster.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, raster.width, raster.height);
        ctx.drawImage(image, 0, 0, raster.width, raster.height);
        const pixels = ctx.getImageData(0, 0, raster.width, raster.height).data;
        const opaque = [];
        for (let y = 0; y < raster.height; y++) {
          for (let x = 0; x < raster.width; x++) {
            const alpha = pixels[(y * raster.width + x) * 4 + 3];
            if (alpha > 96) opaque.push([x, y]);
          }
        }
        if (!opaque.length) throw new Error("SVG silhouette is empty");
        const result = new Float32Array(count * 3);
        // Preserve the SVG's 206.54 × 258.28 aspect ratio.
        const logoHeight = 2.18;
        const logoWidth = logoHeight * (206.54 / 258.28);
        for (let i = 0; i < count; i++) {
          const pixel = opaque[Math.floor(Math.random() * opaque.length)];
          const k = i * 3;
          result[k] = (pixel[0] / raster.width - 0.5) * logoWidth;
          result[k + 1] = (0.5 - pixel[1] / raster.height) * logoHeight;
          // A very shallow depth gives the flat brand mark a subtle point-cloud volume.
          result[k + 2] = (Math.random() - 0.5) * 0.075;
        }
        return result;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    let original;
    try {
      original = await sampleLogoPoints(pointCount);
    } catch (error) {
      console.error("[ViewmetricaMX particles] Logo SVG could not be sampled:", error);
      canvas.style.display = "none";
      return;
    }
    const positions = new Float32Array(pointCount * 3);
    const velocities = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const p = [original[i * 3], original[i * 3 + 1], original[i * 3 + 2]];
      original.set(p, i * 3);
      positions.set(p, i * 3);
      const height = THREE.MathUtils.clamp((p[1] + 0.55) / 2.0, 0, 1);
      const color = blue.clone().lerp(cyan, height).lerp(ice, Math.random() * 0.12);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      baseColors[i * 3] = color.r;
      baseColors[i * 3 + 1] = color.g;
      baseColors[i * 3 + 2] = color.b;
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
    window.addEventListener("pointerleave", function () {
      pointer.set(-9999, -9999);
    }, { passive: true });

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
        // Keep the logo nearly front-facing so its exact silhouette remains recognizable.
        rabbit.rotation.y += 0.00018 * dt;
        rabbit.rotation.x = Math.sin(now * 0.00021) * 0.008;
        dust.rotation.y += 0.00045 * dt;
      }

      const influenceRadius = mobile ? 0.72 : 0.88;
      const heatRadius = mobile ? 1.05 : 1.28;
      const force = mobile ? 0.045 : 0.052;
      for (let i = 0; i < pointCount; i++) {
        const k = i * 3;
        const px = positions[k], py = positions[k + 1], pz = positions[k + 2];
        const ox = original[k], oy = original[k + 1], oz = original[k + 2];

        // Heatmap: particles nearest the cursor glow yellow; the color grades
        // through cyan before returning to the original blue farther away.
        let heat = 0;
        if (pointer.x > -900) {
          const hx = px + rabbit.position.x - mouseWorld.x;
          const hy = py + rabbit.position.y - mouseWorld.y;
          const hz = pz - mouseWorld.z;
          const heatDist = Math.sqrt(hx * hx + hy * hy + hz * hz);
          if (heatDist < heatRadius) {
            const falloff = 1 - heatDist / heatRadius;
            heat = falloff * falloff * (3 - 2 * falloff);
          }
        }
        const baseR = baseColors[k], baseG = baseColors[k + 1], baseB = baseColors[k + 2];
        // Yellow at the cursor, cyan at the edge of the influence, blue outside it.
        const mid = Math.max(0, Math.min(1, heat * 1.8));
        const yellowMix = Math.max(0, Math.min(1, (heat - 0.42) / 0.58));
        const targetR = baseR + (heatCyan.r - baseR) * mid;
        const targetG = baseG + (heatCyan.g - baseG) * mid;
        const targetB = baseB + (heatCyan.b - baseB) * mid;
        colors[k] = targetR + (heatYellow.r - targetR) * yellowMix;
        colors[k + 1] = targetG + (heatYellow.g - targetG) * yellowMix;
        colors[k + 2] = targetB + (heatYellow.b - targetB) * yellowMix;

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
      geometry.attributes.color.needsUpdate = true;
      // Keep the low-poly edges attached as particles react to the cursor and update their heatmap colors.
      for (let e = 0; e < edgePairs.length; e++) {
        const vertex = edgePairs[e];
        const out = e * 3;
        linePositions[out] = positions[vertex * 3];
        linePositions[out + 1] = positions[vertex * 3 + 1];
        linePositions[out + 2] = positions[vertex * 3 + 2];
        lineColors[out] = colors[vertex * 3] * 0.55;
        lineColors[out + 1] = colors[vertex * 3 + 1] * 0.55;
        lineColors[out + 2] = colors[vertex * 3 + 2] * 0.55;
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
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