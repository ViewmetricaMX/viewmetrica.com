/* ============================================================
   VIEWMETRICAMX
   VISOR 360° — EXPERIENCIAS
============================================================ */


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CONFIG = {

  /* WhatsApp */
  whatsappNumber: "528714005421",

  whatsappMessage:
    "Hola, vi la experiencia 360° de ViewmetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.",

  /* Tiempo entre experiencias.
     1 minuto = 60000
     2 minutos = 120000
     3 minutos = 180000
  */
  autoplayMinutes: 2,

  /* Velocidad automática del panorama */
  autoRotateSpeed: 0.006,

  /* Zoom */
  minFov: 32,
  maxFov: 92,

  /* Inercia */
  inertiaFriction: 0.94,
  maxInertia: 2.5

};


/* ============================================================
   EXPERIENCIAS
============================================================ */

const EXPERIENCES = [

  {
    key: "patrimonio",
    title: "PATRIMONIO CULTURAL",

    /* Si tus archivos son JPG, déjalos así */
    file: "assets/viewmetricamx_demo_360_patrimonio_cultural.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "exterior",
    title: "EXTERIOR",

    file: "assets/viewmetricamx_demo_360_exterior.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "restaurant",
    title: "RESTAURANT",

    file: "assets/viewmetricamx_demo_360_Restaurant.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "salon",
    title: "SALÓN",

    file: "assets/viewmetricamx_demo_360_salon.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "universidad",
    title: "UNIVERSIDAD",

    file: "assets/viewmetricamx_demo_360_universidad.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  }

];


/* ============================================================
   INICIO
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

  const stage = document.getElementById("viewer-stage");
  const canvas = document.getElementById("pano-canvas");

  const loading = document.getElementById("viewer-loading");
  const loadingLabel = document.getElementById("loading-label");

  const titleEl = document.getElementById("experience-title");
  const counterEl = document.getElementById("experience-counter");

  const prevBtn = document.getElementById("viewer-prev");
  const nextBtn = document.getElementById("viewer-next");

  const dragHint = document.getElementById("drag-hint");

  const progressBar =
    document.getElementById("autoplay-progress-bar");

  const autoplayTime =
    document.getElementById("autoplay-time");


  /* ============================================================
     VERIFICAR THREE.JS
  ============================================================ */

  if (typeof THREE === "undefined") {

    console.error(
      "[ViewmetricaMX] Three.js no fue cargado."
    );

    loadingLabel.textContent =
      "No se pudo cargar el visor 360°.";

    return;
  }


  /* ============================================================
     ESTADO THREE.JS
  ============================================================ */

  let renderer;
  let scene;
  let camera;
  let sphere;

  let currentIndex = 0;

  let lon = 0;
  let lat = 0;

  let targetFov = 84;

  let isPointerDown = false;

  let pointerStartX = 0;
  let pointerStartY = 0;

  let pointerStartLon = 0;
  let pointerStartLat = 0;

  let velocityLon = 0;
  let velocityLat = 0;

  let lastInteraction = performance.now();

  let userHasInteracted = false;

  const textureCache = {};

  const textureLoader =
    new THREE.TextureLoader();


  /* ============================================================
     AUTOPLAY
  ============================================================ */

  const AUTOPLAY_DURATION =
    CONFIG.autoplayMinutes * 60 * 1000;

  let autoplayStart = performance.now();


  function resetAutoplay() {

    autoplayStart = performance.now();

  }


  function updateAutoplay() {

    const elapsed =
      performance.now() - autoplayStart;

    const progress =
      Math.min(
        elapsed / AUTOPLAY_DURATION,
        1
      );

    progressBar.style.width =
      (progress * 100) + "%";


    const remaining =
      Math.max(
        0,
        AUTOPLAY_DURATION - elapsed
      );

    const seconds =
      Math.ceil(remaining / 1000);

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    autoplayTime.textContent =
      String(minutes).padStart(2, "0")
      + ":"
      + String(secs).padStart(2, "0");


    if (elapsed >= AUTOPLAY_DURATION) {

      nextExperience();

      resetAutoplay();

    }

  }


  /* ============================================================
     WEBGL
  ============================================================ */

  function hasWebGL() {

    try {

      const test =
        document.createElement("canvas");

      return !!(
        window.WebGLRenderingContext &&
        (
          test.getContext("webgl") ||
          test.getContext("experimental-webgl")
        )
      );

    } catch (error) {

      return false;

    }

  }


  if (!hasWebGL()) {

    loadingLabel.textContent =
      "Tu navegador no soporta WebGL.";

    return;

  }


  /* ============================================================
     ESCENA
  ============================================================ */

  function initThree() {

    renderer =
      new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
      });


    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
    );


    scene =
      new THREE.Scene();


    camera =
      new THREE.PerspectiveCamera(
        targetFov,
        16 / 9,
        1,
        1100
      );


    const geometry =
      new THREE.SphereGeometry(
        500,
        60,
        40
      );


    /* Fundamental para que el panorama
       se vea correctamente desde dentro */
    geometry.scale(
      1,
      1,
      -1
    );


    const material =
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false
      });


    sphere =
      new THREE.Mesh(
        geometry,
        material
      );


    scene.add(sphere);


    resize();

    window.addEventListener(
      "resize",
      resize
    );


    animate();

  }


  /* ============================================================
     RESIZE
  ============================================================ */

  function resize() {

    const width =
      stage.clientWidth;

    const height =
      stage.clientHeight;


    if (!width || !height) {
      return;
    }


    renderer.setSize(
      width,
      height,
      false
    );


    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();

  }


  /* ============================================================
     TEXTURA
  ============================================================ */

  function loadExperience(index) {

    const experience =
      EXPERIENCES[index];

    if (!experience) {
      return;
    }


    currentIndex = index;

    lon = experience.lon;
    lat = experience.lat;

    targetFov = experience.fov;


    titleEl.textContent =
      experience.title;


    counterEl.textContent =
      String(index + 1).padStart(2, "0")
      + " / "
      + String(EXPERIENCES.length).padStart(2, "0");


    loading.hidden = false;

    loadingLabel.textContent =
      "Cargando "
      + experience.title.toLowerCase()
      + "…";


    if (
      textureCache[experience.file]
    ) {

      applyTexture(
        textureCache[experience.file]
      );

      loading.hidden = true;

      resetAutoplay();

      return;

    }


    textureLoader.load(

      experience.file,

      function (texture) {

        console.log(
          "[ViewmetricaMX] Panorama cargado:",
          experience.file
        );


        if (
          "colorSpace" in texture
        ) {

          texture.colorSpace =
            THREE.SRGBColorSpace;

        }


        texture.minFilter =
          THREE.LinearFilter;

        texture.magFilter =
          THREE.LinearFilter;

        texture.generateMipmaps =
          false;


        texture.wrapS =
          THREE.ClampToEdgeWrapping;

        texture.wrapT =
          THREE.ClampToEdgeWrapping;


        texture.repeat.x = 1;
        texture.offset.x = 0;


        textureCache[experience.file] =
          texture;


        applyTexture(texture);


        loading.hidden = true;


        resetAutoplay();

      },

      undefined,

      function (error) {

        console.error(
          "[ViewmetricaMX] ERROR cargando:",
          experience.file,
          error
        );


        loadingLabel.textContent =
          "No se pudo cargar esta experiencia.";

      }

    );

  }


  /* ============================================================
     APLICAR TEXTURA
  ============================================================ */

  function applyTexture(texture) {

    sphere.material.map =
      texture;

    sphere.material.color.set(
      0xffffff
    );

    sphere.material.needsUpdate =
      true;

  }


  /* ============================================================
     NAVEGACIÓN
  ============================================================ */

  function nextExperience() {

    const next =
      (
        currentIndex + 1
      ) % EXPERIENCES.length;


    markInteraction();

    loadExperience(next);

  }


  function previousExperience() {

    const previous =
      (
        currentIndex - 1
        + EXPERIENCES.length
      ) % EXPERIENCES.length;


    markInteraction();

    loadExperience(previous);

  }


  nextBtn.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();

      nextExperience();

    }
  );


  prevBtn.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();

      previousExperience();

    }
  );


  /* ============================================================
     INTERACCIÓN
  ============================================================ */

  function markInteraction() {

    userHasInteracted = true;

    lastInteraction =
      performance.now();

    resetAutoplay();


    if (
      !dragHint.classList.contains(
        "is-hidden"
      )
    ) {

      dragHint.classList.add(
        "is-hidden"
      );

    }

  }


  function pointerDown(
    x,
    y
  ) {

    isPointerDown = true;

    stage.classList.add(
      "is-dragging"
    );


    pointerStartX = x;
    pointerStartY = y;


    pointerStartLon = lon;
    pointerStartLat = lat;


    velocityLon = 0;
    velocityLat = 0;

  }


  function pointerMove(
    x,
    y
  ) {

    if (!isPointerDown) {
      return;
    }


    const newLon =
      pointerStartLon
      + (
        pointerStartX - x
      ) * 0.16;


    const newLat =
      pointerStartLat
      + (
        y - pointerStartY
      ) * 0.16;


    velocityLon =
      clamp(
        newLon - lon,
        -CONFIG.maxInertia,
        CONFIG.maxInertia
      );


    velocityLat =
      clamp(
        newLat - lat,
        -CONFIG.maxInertia,
        CONFIG.maxInertia
      );


    lon = newLon;
    lat = newLat;


    markInteraction();

  }


  function pointerUp() {

    isPointerDown = false;

    stage.classList.remove(
      "is-dragging"
    );

  }


  /* ============================================================
     MOUSE
  ============================================================ */

  stage.addEventListener(
    "mousedown",
    function (event) {

      if (
        event.target.closest(
          "button"
        )
      ) {
        return;
      }


      markInteraction();

      pointerDown(
        event.clientX,
        event.clientY
      );

    }
  );


  window.addEventListener(
    "mousemove",
    function (event) {

      pointerMove(
        event.clientX,
        event.clientY
      );

    }
  );


  window.addEventListener(
    "mouseup",
    pointerUp
  );


  /* ============================================================
     TOUCH
  ============================================================ */

  let pinchDistance = null;
  let pinchFov = null;


  stage.addEventListener(
    "touchstart",
    function (event) {

      markInteraction();


      if (
        event.touches.length === 1
      ) {

        pointerDown(
          event.touches[0].clientX,
          event.touches[0].clientY
        );

      }


      if (
        event.touches.length === 2
      ) {

        isPointerDown = false;

        pinchDistance =
          getTouchDistance(
            event.touches
          );

        pinchFov =
          targetFov;

      }

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchmove",
    function (event) {

      if (
        event.touches.length === 1 &&
        isPointerDown
      ) {

        pointerMove(
          event.touches[0].clientX,
          event.touches[0].clientY
        );

      }


      if (
        event.touches.length === 2 &&
        pinchDistance
      ) {

        const distance =
          getTouchDistance(
            event.touches
          );


        const scale =
          pinchDistance / distance;


        targetFov =
          clamp(
            pinchFov * scale,
            CONFIG.minFov,
            CONFIG.maxFov
          );


        markInteraction();

      }

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchend",
    function (event) {

      if (
        event.touches.length === 0
      ) {

        pointerUp();

        pinchDistance = null;

      }

    }
  );


  function getTouchDistance(
    touches
  ) {

    const dx =
      touches[0].clientX -
      touches[1].clientX;

    const dy =
      touches[0].clientY -
      touches[1].clientY;


    return Math.sqrt(
      dx * dx + dy * dy
    );

  }


  /* ============================================================
     WHEEL
  ============================================================ */

  stage.addEventListener(
    "wheel",
    function (event) {

      event.preventDefault();

      markInteraction();


      targetFov =
        clamp(
          targetFov +
          event.deltaY * 0.04,
          CONFIG.minFov,
          CONFIG.maxFov
        );

    },
    {
      passive: false
    }
  );


  /* ============================================================
     ZOOM
  ============================================================ */

  document
    .getElementById("zoom-in")
    .addEventListener(
      "click",
      function () {

        markInteraction();

        targetFov =
          clamp(
            targetFov - 10,
            CONFIG.minFov,
            CONFIG.maxFov
          );

      }
    );


  document
    .getElementById("zoom-out")
    .addEventListener(
      "click",
      function () {

        markInteraction();

        targetFov =
          clamp(
            targetFov + 10,
            CONFIG.minFov,
            CONFIG.maxFov
          );

      }
    );


  /* ============================================================
     RECENTER
  ============================================================ */

  document
    .getElementById("recenter")
    .addEventListener(
      "click",
      function () {

        markInteraction();


        const experience =
          EXPERIENCES[currentIndex];


        lon =
          experience.lon;

        lat =
          experience.lat;

        targetFov =
          experience.fov;

      }
    );


  /* ============================================================
     FULLSCREEN
  ============================================================ */

  document
    .getElementById("fullscreen-btn")
    .addEventListener(
      "click",
      function () {

        markInteraction();


        if (
          !document.fullscreenElement
        ) {

          if (
            stage.requestFullscreen
          ) {

            stage.requestFullscreen();

          } else if (
            stage.webkitRequestFullscreen
          ) {

            stage.webkitRequestFullscreen();

          }

        } else {

          if (
            document.exitFullscreen
          ) {

            document.exitFullscreen();

          } else if (
            document.webkitExitFullscreen
          ) {

            document.webkitExitFullscreen();

          }

        }

      }
    );


  document.addEventListener(
    "fullscreenchange",
    resize
  );


  /* ============================================================
     RENDER LOOP
  ============================================================ */

  function animate() {

    requestAnimationFrame(
      animate
    );


    /* Inercia */
    if (!isPointerDown) {

      if (
        Math.abs(velocityLon) > 0.001 ||
        Math.abs(velocityLat) > 0.001
      ) {

        lon += velocityLon;
        lat += velocityLat;


        velocityLon *=
          CONFIG.inertiaFriction;

        velocityLat *=
          CONFIG.inertiaFriction;

      }

      /*
       * Una vez que termina la interacción,
       * el panorama continúa girando lentamente.
       */
      else if (
        userHasInteracted &&
        performance.now() -
        lastInteraction > 5200
      ) {

        lon +=
          CONFIG.autoRotateSpeed;

      }

    }


    lat =
      clamp(
        lat,
        -85,
        85
      );


    const phi =
      THREE.MathUtils.degToRad(
        90 - lat
      );


    const theta =
      THREE.MathUtils.degToRad(
        lon
      );


    const target =
      new THREE.Vector3(

        500 *
        Math.sin(phi) *
        Math.cos(theta),

        500 *
        Math.cos(phi),

        500 *
        Math.sin(phi) *
        Math.sin(theta)

      );


    camera.position.set(
      0,
      0,
      0
    );


    camera.lookAt(
      target
    );


    if (
      Math.abs(
        camera.fov - targetFov
      ) > 0.05
    ) {

      camera.fov +=
        (
          targetFov -
          camera.fov
        ) * 0.15;


      camera.updateProjectionMatrix();

    }


    renderer.render(
      scene,
      camera
    );


    updateAutoplay();

  }


  /* ============================================================
     UTILIDAD
  ============================================================ */

  function clamp(
    value,
    min,
    max
  ) {

    return Math.max(
      min,
      Math.min(
        max,
        value
      )
    );

  }


  /* ============================================================
     REVEAL
  ============================================================ */

  const revealElements =
    document.querySelectorAll(
      ".reveal"
    );


  if (
    "IntersectionObserver" in window
  ) {

    const observer =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(
            function (entry) {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  "in"
                );

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.12
        }
      );


    revealElements.forEach(
      function (element) {

        observer.observe(
          element
        );

      }
    );

  } else {

    revealElements.forEach(
      function (element) {

        element.classList.add(
          "in"
        );

      }
    );

  }


  /* ============================================================
     WHATSAPP
  ============================================================ */

  const whatsappUrl =
    "https://wa.me/"
    + CONFIG.whatsappNumber
    + "?text="
    + encodeURIComponent(
      CONFIG.whatsappMessage
    );


  const whatsappCta =
    document.getElementById(
      "whatsappCta"
    );


  const footerWhatsapp =
    document.getElementById(
      "footerWhatsapp"
    );


  if (whatsappCta) {

    whatsappCta.href =
      whatsappUrl;

    whatsappCta.target =
      "_blank";

    whatsappCta.rel =
      "noopener noreferrer";

  }


  if (footerWhatsapp) {

    footerWhatsapp.href =
      whatsappUrl;

    footerWhatsapp.target =
      "_blank";

    footerWhatsapp.rel =
      "noopener noreferrer";

  }


  /* ============================================================
     YEAR
  ============================================================ */

  const year =
    document.getElementById(
      "year"
    );


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  /* ============================================================
     INICIALIZAR
  ============================================================ */

  initThree();

  loadExperience(0);


  setTimeout(
    function () {

      dragHint.classList.add(
        "is-hidden"
      );

    },
    6000
  );


  console.log(
    "[ViewmetricaMX] Visor 360° inicializado."
  );

});
