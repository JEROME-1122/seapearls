const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled"); // moves to top:0
  } else {
    navbar.classList.remove("scrolled"); // back to top:50px
  }
});

const scrollBtn = document.getElementById("scrollTopBtn");

// Show button when user scrolls down 200px
window.onscroll = function () {
  if (
    document.body.scrollTop > 200 ||
    document.documentElement.scrollTop > 200
  ) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
};

// Scroll to top when button clicked
scrollBtn.onclick = function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// document.addEventListener("DOMContentLoaded", function () {
//   fetch("../header.html")
//     .then((response) => response.text())
//     .then((data) => {
//       document.getElementById("header-placeholder").innerHTML = data;
//     })
//     .catch((error) => console.error("Error loading header:", error));
// });

// Helper: list of SVG element names that can be stroked and measured
const SHAPE_TAGS = [
  "path",
  "circle",
  "rect",
  "ellipse",
  "line",
  "polyline",
  "polygon",
];

// For each draw container, set up the stroke-dasharray on its shapes
document.querySelectorAll(".svg-wrap").forEach(function (wrap) {
  const drawDiv = wrap.querySelector(".draw");
  // find the inner svg (first svg inside drawDiv)
  const svg = drawDiv.querySelector("svg");
  if (!svg) return;

  // For accessibility, copy viewBox if missing, ensure preservedAspectRatio
  if (!svg.hasAttribute("preserveAspectRatio"))
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Find all potential shape elements and convert them for stroking
  const shapes = [];
  SHAPE_TAGS.forEach((tag) => {
    svg.querySelectorAll(tag).forEach((el) => shapes.push(el));
  });

  shapes.forEach(function (el) {
    // add class
    el.classList.add("draw-path");
    // force stroke/fill appropriate for animation
    try {
      el.setAttribute("fill", "none");
      // if stroke is not set, set to CSS var (kept in :root)
      if (!el.getAttribute("stroke"))
        el.setAttribute("stroke", "var(--stroke-color)");
      if (!el.getAttribute("stroke-width"))
        el.setAttribute("stroke-width", "var(--stroke-width)");
    } catch (e) {
      /* ignore */
    }

    // For shapes that aren't path, convert to path length measurement by using getTotalLength where possible
    // Many SVG shapes support getTotalLength in modern browsers
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch (e) {
      // fallback: approximate
      len = 1000;
    }
    // set dash array/offset to hide initially
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    // store length as data attr for potential use
    el.dataset._dashlen = len;
    // ensure transition is smooth via CSS transition on strokeDashoffset
    el.style.transition = "stroke-dashoffset 1.2s linear";
  });

  // hover handlers: when mouse enters, hide overlay then start animation; on leave, reset
  let timeout;
  wrap.addEventListener("mouseenter", () => {
    wrap.classList.add("hover-hide");
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      shapes.forEach(function (el) {
        // restart by forcing reflow and setting dashoffset->0
        // reset to full hidden first
        const len =
          el.dataset._dashlen ||
          (el.getTotalLength && el.getTotalLength()) ||
          1000;
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
        // force reflow
        void el.getBoundingClientRect();
        // then trigger draw
        el.style.strokeDashoffset = 0;
      });
    }, 80);
  });
  wrap.addEventListener("mouseleave", () => {
    clearTimeout(timeout);
    wrap.classList.remove("hover-hide");
    shapes.forEach(function (el) {
      const len =
        el.dataset._dashlen ||
        (el.getTotalLength && el.getTotalLength()) ||
        1000;
      // reset to hidden for next hover
      el.style.transition = "stroke-dashoffset 0.45s linear";
      el.style.strokeDashoffset = len;
      // after brief moment restore transition to normal
      setTimeout(
        () => (el.style.transition = "stroke-dashoffset 1.2s linear"),
        500
      );
    });
  });

  // also support touch (tap) to replay
  drawDiv.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.add("hover-hide");
    shapes.forEach(function (el) {
      const len =
        el.dataset._dashlen ||
        (el.getTotalLength && el.getTotalLength()) ||
        1000;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      void el.getBoundingClientRect();
      el.style.strokeDashoffset = 0;
    });
    // restore overlay after animation duration (~1.4s)
    setTimeout(() => wrap.classList.remove("hover-hide"), 1400);
  });
});
