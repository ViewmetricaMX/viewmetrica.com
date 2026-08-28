/* ==========================================================================
   ViewMetricaMX — Experiencias 360°
   Navegador automático de demos
========================================================================== */


/* ==========================================================================
   CONFIGURACIÓN
========================================================================== */

const WHATSAPP_NUMBER = "528714005421";

const WHATSAPP_MESSAGE =
  "Hola, vi las experiencias 360° de ViewMetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.";


/*
   Tiempo de permanencia por experiencia.

   12000  = 12 segundos
   30000  = 30 segundos
   60000  = 1 minuto
   120000 = 2 minutos
*/

const AUTO_CHANGE_TIME = 12000;


/*
   Después de que el usuario interactúa, esperamos este tiempo
   antes de volver a activar el cambio automático.
*/

const AUTOPLAY_RESUME_DELAY = 5000;


/* ==========================================================================
   EXPERIENCIAS
========================================================================== */

const EXPERIENCES = [

  {
    key: "patrimonio",
    title: "PATRIMONIO CULTURAL",

    file:
      "assets/viewmetricamx_demo_360_patrimonio_cultural.jpg",

    lon: 0,
    lat: 0,
    fov: 500
  },

  {
    key: "exterior",
    title: "EXTERIOR",

    file:
      "assets/viewmetricamx_demo_360_exterior.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "restaurant",
    title: "RESTAURANT",

    file:
      "assets/viewmetricamx_demo_360_Restaurant.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "salon",
    title: "SALÓN",

    file:
      "assets/viewmetricamx_demo_360_salon.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },

  {
    key: "universidad",
    title: "UNIVERSIDAD",

    file:
      "assets/viewmetricamx_demo_360_universidad.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  }

];


/* ==========================================================================
   CONTROLES
========================================================================== */

const FOV_MIN = 32;
const FOV_MAX = 92;

const AUTOROTATE_SPEED = 0.006;


/* ==========================================================================
   INICIO
========================================================================== */

(function init() {

  const stageEl =
    document.getElementById("viewer-stage");

  const canvas =
    document.getElementById("pano-canvas");

  const loadingEl =
    document.getElementById("viewer-loading");

  const loadingLabel =
    document.getElementById("loading-label");

  const titleEl =
    document.getElementById("experience-title");

  const counterEl =
    document.getElementById("experience-counter");

  const dragHint =
    document.getElementById("drag-hint");

  const progressBar =
    document.getElementById("autoplay-progress-bar");

  const prevBtn =
    document.getElementById("viewer-prev");

  const nextBtn =
    document.getElementById("viewer-next");


  /* ========================================================================
     WEBGL
  ======================================================================== */

  function hasWebGL() {

    try {

      const testCanvas =
        document.createElement("canvas");

      return !!(
        window.WebGLRenderingContext &&
        (
          testCanvas.getContext("webgl") ||
          testCanvas.getContext("experimental-webgl")
        )
      );

    } catch (e) {

      return false;

    }

  }


  if (
    typeof THREE === "undefined" ||
    !hasWebGL()
  ) {

    loadingEl.hidden = true;

    canvas.hidden = true;

    const fallback =
      document.createElement("img");

    fallback.src =
      EXPERIENCES[0].file;

    fallback.alt =
      EXPERIENCES[0].title;

    fallback.style.width = "100%";
    fallback.style.height = "100%";
    fallback.style.objectFit = "cover";

    stageEl.insertBefore(
      fallback,
      stageEl.firstChild
    );

    return;

  }


  /* ========================================================================
     THREE.JS
  ======================================================================== */

  let renderer;
  let scene;
  let camera;
  let sphere;


  /* ========================================================================
     ESTADO
  ======================================================================== */

  let currentIndex = 0;

  let lon =
    EXPERIENCES[0].lon;

  let lat =
    EXPERIENCES[0].lat;

  let targetFov =
    EXPERIENCES[0].fov;


  let isPointerDown = false;

  let pointerDownX = 0;
  let pointerDownY = 0;

  let pointerDownLon = 0;
  let pointerDownLat = 0;


  let velocityLon = 0;
  let velocityLat = 0;


  const INERTIA_FRICTION = 0.94;
  const MAX_INERTIA = 2.5;


  let userHasInteracted = false;

  let lastInteraction =
    performance.now();


  let autoTimerStart =
    performance.now();


  let autoPausedUntil = 0;


  const textureCache = {};

  const loader =
    new THREE.TextureLoader();


  /* ========================================================================
     UTILIDADES
  ======================================================================== */

  function clamp(value, min, max) {

    return Math.max(
      min,
      Math.min(max, value)
    );

  }


  function cacheKey(index) {

    return String(index);

  }


  /* ========================================================================
     ESCENA
  ======================================================================== */

  function buildScene() {

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


    resizeRenderer();

    animate();

  }


  /* ========================================================================
     RESIZE
  ======================================================================== */

  function resizeRenderer() {

    const width =
      stageEl.clientWidth;

    const height =
      stageEl.clientHeight;


    if (!width || !height) return;


    renderer.setSize(
      width,
      height,
      false
    );


    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();

  }


  /* ========================================================================
     ACTUALIZAR UI
  ======================================================================== */

  function updateExperienceUI() {

    const experience =
      EXPERIENCES[currentIndex];


    titleEl.textContent =
      experience.title;


    counterEl.textContent =
      String(currentIndex + 1)
        .padStart(2, "0")
      + " / "
      + String(EXPERIENCES.length)
        .padStart(2, "0");

  }


  /* ========================================================================
     CARGAR EXPERIENCIA
  ======================================================================== */

  function loadExperience(index) {

    index =
      (
        index +
        EXPERIENCES.length
      ) %
      EXPERIENCES.length;


    currentIndex = index;


    const experience =
      EXPERIENCES[currentIndex];


    lon =
      experience.lon;

    lat =
      experience.lat;

    targetFov =
      experience.fov;


    camera.fov =
      experience.fov;

    camera.updateProjectionMatrix();


    updateExperienceUI();


    const key =
      cacheKey(currentIndex);


    if (textureCache[key]) {

      applyTexture(
        textureCache[key]
      );

      resetAutoplay();

      return;

    }


    loadingLabel.textContent =
      "Cargando " +
      experience.title.toLowerCase() +
      "…";


    loadingEl.hidden = false;


    loader.load(

      experience.file,

      function(texture) {

        if (
          "colorSpace"
          in texture
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


        textureCache[key] =
          texture;


        applyTexture(texture);


        loadingEl.hidden =
          true;


        resetAutoplay();

      },


      undefined,

      function(error) {

        console.error(
          "[ViewMetricaMX] Error:",
          experience.file,
          error
        );


        loadingLabel.textContent =
          "No se pudo cargar la experiencia.";

      }

    );

  }


  /* ========================================================================
     TEXTURA
  ======================================================================== */

  function applyTexture(texture) {

    texture.wrapS =
      THREE.ClampToEdgeWrapping;

    texture.wrapT =
      THREE.ClampToEdgeWrapping;


    texture.repeat.x = 1;

    texture.offset.x = 0;


    if (
      "colorSpace"
      in texture
    ) {

      texture.colorSpace =
        THREE.SRGBColorSpace;

    }


    sphere.material.map =
      texture;


    sphere.material.color.set(
      0xffffff
    );


    sphere.material.needsUpdate =
      true;

  }


  /* ========================================================================
     NAVEGACIÓN
  ======================================================================== */

  function nextExperience() {

    loadExperience(
      currentIndex + 1
    );

  }


  function previousExperience() {

    loadExperience(
      currentIndex - 1
    );

  }


  prevBtn.addEventListener(
    "click",
    function(e) {

      e.stopPropagation();

      markInteraction();

      previousExperience();

    }
  );


  nextBtn.addEventListener(
    "click",
    function(e) {

      e.stopPropagation();

      markInteraction();

      nextExperience();

    }
  );


  /* ========================================================================
     AUTOPLAY
  ======================================================================== */

  function resetAutoplay() {

    autoTimerStart =
      performance.now();

  }


  function pauseAutoplay() {

    autoPausedUntil =
      performance.now() +
      AUTOPLAY_RESUME_DELAY;

  }


  function updateAutoplay(now) {

    if (
      now <
      autoPausedUntil
    ) {

      progressBar.style.width =
        "0%";

      return;

    }


    const elapsed =
      now -
      autoTimerStart;


    const progress =
      clamp(
        elapsed /
        AUTO_CHANGE_TIME,
        0,
        1
      );


    progressBar.style.width =
      (progress * 100)
      + "%";


    if (
      elapsed >=
      AUTO_CHANGE_TIME
    ) {

      nextExperience();

    }

  }


  /* ========================================================================
     RENDER LOOP
  ======================================================================== */

  function animate() {

    requestAnimationFrame(
      animate
    );


    const now =
      performance.now();


    updateAutoplay(now);


    if (!isPointerDown) {

      if (
        Math.abs(velocityLon) >
          0.001 ||
        Math.abs(velocityLat) >
          0.001
      ) {

        lon += velocityLon;

        lat += velocityLat;


        velocityLon *=
          INERTIA_FRICTION;

        velocityLat *=
          INERTIA_FRICTION;

      }

      else if (
        userHasInteracted &&
        now -
          lastInteraction >
          AUTOPLAY_RESUME_DELAY
      ) {

        lon +=
          AUTOROTATE_SPEED;

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


    camera.lookAt(target);


    if (
      Math.abs(
        camera.fov -
        targetFov
      ) > 0.05
    ) {

      camera.fov +=
        (
          targetFov -
          camera.fov
        ) *
        0.15;


      camera.updateProjectionMatrix();

    }


    renderer.render(
      scene,
      camera
    );

  }


  /* ========================================================================
     INTERACCIÓN
  ======================================================================== */

  function markInteraction() {

    userHasInteracted =
      true;


    lastInteraction =
      performance.now();


    pauseAutoplay();


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


  function onPointerDown(
    clientX,
    clientY
  ) {

    isPointerDown =
      true;


    stageEl.classList.add(
      "is-dragging"
    );


    pointerDownX =
      clientX;

    pointerDownY =
      clientY;


    pointerDownLon =
      lon;

    pointerDownLat =
      lat;

  }


  function onPointerMove(
    clientX,
    clientY
  ) {

    if (!isPointerDown)
      return;


    const newLon =
      (
        pointerDownX -
        clientX
      ) *
      0.16 +
      pointerDownLon;


    const newLat =
      (
        clientY -
        pointerDownY
      ) *
      0.16 +
      pointerDownLat;


    velocityLon =
      clamp(
        newLon - lon,
        -MAX_INERTIA,
        MAX_INERTIA
      );


    velocityLat =
      clamp(
        newLat - lat,
        -MAX_INERTIA,
        MAX_INERTIA
      );


    lon =
      newLon;

    lat =
      newLat;


    markInteraction();

  }


  function onPointerUp() {

    isPointerDown =
      false;


    stageEl.classList.remove(
      "is-dragging"
    );

  }


  /* ========================================================================
     MOUSE
  ======================================================================== */

  stageEl.addEventListener(
    "mousedown",
    function(e) {

      onPointerDown(
        e.clientX,
        e.clientY
      );


      markInteraction();

    }
  );


  window.addEventListener(
    "mousemove",
    function(e) {

      onPointerMove(
        e.clientX,
        e.clientY
      );

    }
  );


  window.addEventListener(
    "mouseup",
    onPointerUp
  );


  /* ========================================================================
     TOUCH
  ======================================================================== */

  let pinchStartDist =
    null;

  let pinchStartFov =
    null;


  stageEl.addEventListener(
    "touchstart",
    function(e) {

      markInteraction();


      if (
        e.touches.length === 1
      ) {

        onPointerDown(
          e.touches[0].clientX,
          e.touches[0].clientY
        );

      }


      else if (
        e.touches.length === 2
      ) {

        isPointerDown =
          false;


        pinchStartDist =
          touchDistance(
            e.touches
          );


        pinchStartFov =
          targetFov;

      }

    },
    { passive: true }
  );


  stageEl.addEventListener(
    "touchmove",
    function(e) {

      if (
        e.touches.length === 1 &&
        isPointerDown
      ) {

        onPointerMove(
          e.touches[0].clientX,
          e.touches[0].clientY
        );

      }


      else if (
        e.touches.length === 2 &&
        pinchStartDist
      ) {

        const dist =
          touchDistance(
            e.touches
          );


        const scale =
          pinchStartDist /
          dist;


        targetFov =
          clamp(
            pinchStartFov *
              scale,
            FOV_MIN,
            FOV_MAX
          );


        markInteraction();

      }

    },
    { passive: true }
  );


  stageEl.addEventListener(
    "touchend",
    function(e) {

      if (
        e.touches.length === 0
      ) {

        onPointerUp();

        pinchStartDist =
          null;

      }

    }
  );


  function touchDistance(
    touches
  ) {

    const dx =
      touches[0].clientX -
      touches[1].clientX;


    const dy =
      touches[0].clientY -
      touches[1].clientY;


    return Math.sqrt(
      dx * dx +
      dy * dy
    );

  }


  /* ========================================================================
     RUEDA
  ======================================================================== */

  stageEl.addEventListener(
    "wheel",
    function(e) {

      e.preventDefault();

      markInteraction();


      targetFov =
        clamp(
          targetFov +
            e.deltaY * 0.04,
          FOV_MIN,
          FOV_MAX
        );

    },
    { passive: false }
  );


  /* ========================================================================
     ZOOM
  ======================================================================== */

  document
    .getElementById("zoom-in")
    .addEventListener(
      "click",
      function() {

        markInteraction();

        targetFov =
          clamp(
            targetFov - 10,
            FOV_MIN,
            FOV_MAX
          );

      }
    );


  document
    .getElementById("zoom-out")
    .addEventListener(
      "click",
      function() {

        markInteraction();

        targetFov =
          clamp(
            targetFov + 10,
            FOV_MIN,
            FOV_MAX
          );

      }
    );


  /* ========================================================================
     RECENTER
  ======================================================================== */

  document
    .getElementById("recenter")
    .addEventListener(
      "click",
      function() {

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


  /* ========================================================================
     FULLSCREEN
  ======================================================================== */

  document
    .getElementById("fullscreen-btn")
    .addEventListener(
      "click",
      function() {

        markInteraction();


        if (
          !document.fullscreenElement
        ) {

          const request =
            stageEl.requestFullscreen ||
            stageEl.webkitRequestFullscreen;


          if (request) {

            request.call(
              stageEl
            );

          }

        }

        else {

          const exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen;


          if (exit) {

            exit.call(
              document
            );

          }

        }

      }
    );


  /* ========================================================================
     RESIZE
  ======================================================================== */

  window.addEventListener(
    "resize",
    resizeRenderer
  );


  document.addEventListener(
    "fullscreenchange",
    resizeRenderer
  );


  /* ========================================================================
     NAVEGACIÓN DEL SITIO
  ======================================================================== */

  const navLinks =
    document.querySelectorAll(
      ".nav-link"
    );


  navLinks.forEach(
    function(link) {

      link.addEventListener(
        "click",
        function() {

          navLinks.forEach(
            function(item) {

              item.classList.remove(
                "is-active"
              );

            }
          );


          link.classList.add(
            "is-active"
          );

        }
      );

    }
  );


  /* ========================================================================
     WHATSAPP
  ======================================================================== */

  const cta =
    document.getElementById(
      "whatsapp-cta"
    );


  if (cta) {

    const url =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(
        WHATSAPP_MESSAGE
      );


    cta.href =
      url;

  }


  /* ========================================================================
     INICIALIZACIÓN
  ======================================================================== */

  buildScene();

  updateExperienceUI();

  loadExperience(
    0
  );


  setTimeout(
    function() {

      dragHint.classList.add(
        "is-hidden"
      );

    },
    6000
  );


})();
