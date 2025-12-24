// Show main content after intro animation
setTimeout(() => {
  document.getElementById("intro-section").style.display = "none";
  document.getElementById("main-content").style.display = "block";
  document.getElementById("main-content").style.animation =
    "fadeIn 0.8s ease-in-out";
}, 4000);

// Add fade in animation
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ZenMode BTMM Scroll Animation
let currentStep = 0;

function updateZenModeContent() {
  const zenmodeSection = document.querySelector(".zenmode-section");
  if (!zenmodeSection) return;

  const sectionTop = zenmodeSection.offsetTop;
  const sectionHeight = zenmodeSection.offsetHeight;
  const scrollPos = window.scrollY;
  const windowHeight = window.innerHeight;

  // Calculate which step we're on based on scroll position
  const scrollProgress =
    (scrollPos - sectionTop + windowHeight / 2) / sectionHeight;
  const newStep = Math.floor(scrollProgress * 4);
  const clampedStep = Math.max(0, Math.min(3, newStep));

  if (clampedStep !== currentStep) {
    currentStep = clampedStep;

    // Update BTMM letters
    document.querySelectorAll(".btmm-letter").forEach((letter, index) => {
      if (index === currentStep) {
        letter.classList.add("active");
      } else {
        letter.classList.remove("active");
      }
    });

    // Update content slides
    document.querySelectorAll(".zenmode-slide").forEach((slide, index) => {
      if (index === currentStep) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });
  }
}

// Header scroll effect - transparent to glass white
window.addEventListener("scroll", () => {
  const header = document.getElementById("header");
  const heroSection = document.getElementById("hero");
  const heroHeight = heroSection ? heroSection.offsetHeight : 0;

  if (window.scrollY > heroHeight - 100) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  // Update ZenMode content on scroll
  updateZenModeContent();

  // Update We Care section on scroll
  updateWeCareSection();
});

// We Care Section - Scroll Transformation
function updateWeCareSection() {
  const wecareSection = document.querySelector(".wecare-section");
  if (!wecareSection) return;

  const sectionTop = wecareSection.offsetTop;
  const sectionHeight = wecareSection.offsetHeight;
  const scrollPos = window.scrollY;
  const windowHeight = window.innerHeight;

  // Calculate scroll progress through the section
  const scrollIntoSection = scrollPos - sectionTop + windowHeight;
  const scrollProgress = scrollIntoSection / sectionHeight;

  // Transform when scrolled 35% through the section
  if (scrollProgress > 0.35) {
    wecareSection.classList.add("transformed");
  } else {
    wecareSection.classList.remove("transformed");
  }
}

// Smooth scroll to sections
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    console.log(`${sectionId} section coming soon!`);
    alert(`${sectionId.replace("-", " ")} section coming soon!`);
  }
}

// Make scrollToSection available globally
window.scrollToSection = scrollToSection;

// Feature cards scroll reveal animation
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }, index * 150);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Apply observer after main content loads
setTimeout(() => {
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });

  // Initialize ZenMode content on load
  updateZenModeContent();

  // Initialize We Care section on load
  updateWeCareSection();
}, 4100);
