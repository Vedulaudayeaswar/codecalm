// Header Button Interactions
document.addEventListener("DOMContentLoaded", () => {
  // Menu Toggle Functionality
  const menuToggle = document.querySelector(".menu-toggle");
  const menuClose = document.querySelector(".menu-close");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  const body = document.body;
  const menuLinks = document.querySelectorAll(".menu-link");

  // Check if menu elements exist
  if (!menuToggle || !dropdownMenu) {
    console.error("Menu elements not found");
    return;
  }

  // Open Menu
  function openMenu() {
    dropdownMenu.classList.add("active");
    menuToggle.classList.add("active");
    body.classList.add("menu-open");
    console.log("Menu opened");
  }

  // Close Menu
  function closeMenu() {
    dropdownMenu.classList.remove("active");
    menuToggle.classList.remove("active");
    body.classList.remove("menu-open");
    console.log("Menu closed");
  }

  // Toggle Menu with menu button
  menuToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isActive = dropdownMenu.classList.contains("active");

    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close Menu with close button
  if (menuClose) {
    menuClose.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  // Close menu when clicking a link
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // Check if it's an external page link (not starting with #)
      if (!href.startsWith("#")) {
        // Allow default behavior for external links
        closeMenu();
        return;
      }

      e.preventDefault();
      const targetSection = document.querySelector(href);

      closeMenu();

      if (targetSection) {
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: "smooth" });
        }, 600); // Wait for menu to close
      }
    });
  });

  // Close menu with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dropdownMenu.classList.contains("active")) {
      closeMenu();
    }
  });

  // Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      alert("Login feature coming soon!");
    });
  }

  // Smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // CTA Buttons
  const featureBtn = document.querySelector(".btn-primary");
  const getStartedBtn = document.querySelector(".btn-secondary");

  featureBtn.addEventListener("click", () => {
    console.log("Features button clicked");
    // Add your features navigation logic here
  });

  getStartedBtn.addEventListener("click", () => {
    console.log("Get Started button clicked");
    // Add your get started logic here
  });

  // Explore Features button
  const exploreBtn = document.querySelector(".btn-explore");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      const firstFeature = document.querySelector(".feature-item");
      if (firstFeature) {
        firstFeature.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }

  // Header scroll effect - Add glassmorphism (no image expansion to prevent shaking)
  const header = document.querySelector(".header");

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;

    // Add/remove scrolled class for glassmorphism effect
    if (scrolled > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Smooth scrolling
  document.documentElement.style.scrollBehavior = "smooth";

  // Carousel pause on hover enhancement
  const carouselTrack = document.querySelector(".carousel-track");

  carouselTrack.addEventListener("mouseenter", () => {
    carouselTrack.style.animationPlayState = "paused";
  });

  carouselTrack.addEventListener("mouseleave", () => {
    carouselTrack.style.animationPlayState = "running";
  });

  // Add intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  // Observe carousel cards
  document.querySelectorAll(".carousel-card").forEach((card) => {
    observer.observe(card);
  });

  // Split text into words for reveal animation
  function splitTextIntoWords(element) {
    const text = element.textContent.trim();
    const words = text.split(" ");

    element.innerHTML = words
      .map(
        (word, index) =>
          `<span class="word" style="--word-index: ${index};">${word}</span>`
      )
      .join(" ");
  }

  // Special function for Why Us heading with line breaks and classes
  function splitWhyHeading(element) {
    const spans = element.querySelectorAll("span.light, span.bold");
    spans.forEach((span) => {
      const text = span.textContent.trim();
      const words = text.split(" ");
      const className = span.className;

      span.innerHTML = words
        .map(
          (word, index) =>
            `<span class="${className} word" style="--word-index: ${
              index + Array.from(element.querySelectorAll(".word")).length
            };">${word}</span>`
        )
        .join(" ");
    });
  }

  // Initialize text splitting for reveal heading
  const revealHeading = document.querySelector(".reveal-heading");
  if (revealHeading) {
    splitTextIntoWords(revealHeading);
  }

  // Initialize Why Us heading
  const whyHeading = document.querySelector(".why-heading");
  if (whyHeading) {
    splitWhyHeading(whyHeading);
  }

  // Initialize text splitting for features section headings
  const featuresMainHeading = document.querySelector(".features-main-heading");
  if (featuresMainHeading) {
    splitTextIntoWords(featuresMainHeading);
  }

  document.querySelectorAll(".feature-heading").forEach((heading) => {
    splitTextIntoWords(heading);
  });

  // Bidirectional scroll-reveal animation for About section
  let lastScrollY = window.scrollY;
  let ticking = false;

  const revealObserverOptions = {
    threshold: [0, 0.3, 0.5, 0.7],
    rootMargin: "0px",
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const currentScrollY = window.scrollY;

      // Add class when scrolling down and entering
      // Remove class when scrolling up and exiting
      if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
        entry.target.classList.add("is-visible");
      } else if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
        entry.target.classList.remove("is-visible");
      }

      lastScrollY = currentScrollY;
    });
  }, revealObserverOptions);

  // Observe elements with data-scroll-reveal attribute
  document.querySelectorAll("[data-scroll-reveal]").forEach((element) => {
    revealObserver.observe(element);
  });

  // Smooth scroll handler for tracking scroll direction
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        lastScrollY = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });

  // Transformation Section - Two-Phase Scroll Animation
  const transformSection = document.querySelector(".transformation-section");
  const stickyContainer = document.querySelector(".sticky-container");
  const sectionHeading = document.querySelector(".transform-heading");
  const sadImages = document.querySelectorAll(".sad-image");
  const happyImages = document.querySelectorAll(".happy-image");

  if (transformSection && stickyContainer) {
    // Easing function for smoother transitions
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function updateTransformation() {
      const rect = transformSection.getBoundingClientRect();
      const sectionTop = transformSection.offsetTop;
      const sectionHeight = transformSection.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Only calculate when section is in viewport
      if (rect.bottom < 0 || rect.top > windowHeight) return;

      // Phase 1: First 100vh is reveal phase (normal scroll)
      // Phase 2: Remaining 200vh is transformation phase
      const revealThreshold = windowHeight;
      const scrolledIntoSection = scrollY - sectionTop;
      const transformationDistance = sectionHeight - revealThreshold;

      // Calculate transformation progress (0 = just revealed, 1 = fully transformed)
      let progress =
        (scrolledIntoSection - revealThreshold) / transformationDistance;
      progress = Math.max(0, Math.min(1, progress));

      // Apply easing for smoother feel
      const easedProgress = easeInOutQuad(progress);

      // Update background color (black to white)
      const bgColor = Math.round(easedProgress * 255);
      stickyContainer.style.backgroundColor = `rgb(${bgColor}, ${bgColor}, ${bgColor})`;

      // Update text color (white to black)
      const textColor = Math.round((1 - easedProgress) * 255);
      const textRGB = `rgb(${textColor}, ${textColor}, ${textColor})`;
      stickyContainer.style.color = textRGB;
      if (sectionHeading) {
        sectionHeading.style.color = textRGB;
      }

      // Cross-fade images (sad to happy)
      sadImages.forEach((img) => {
        img.style.opacity = 1 - easedProgress;
      });

      happyImages.forEach((img) => {
        img.style.opacity = easedProgress;
      });

      // Update box shadow based on background
      const shadowOpacity = 0.4 - easedProgress * 0.25;
      document.querySelectorAll(".image-container").forEach((container) => {
        container.style.boxShadow = `0 8px 32px rgba(0, 0, 0, ${shadowOpacity})`;
      });
    }

    // Performance-optimized scroll handler
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateTransformation();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initialize
    updateTransformation();
  }

  // Statistics Section - Animated Bars
  const statsSection = document.querySelector(".statistics-section");
  if (statsSection) {
    const statItems = document.querySelectorAll(".stat-item");

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const statItem = entry.target;
            const percentage = statItem.getAttribute("data-percentage");

            // Stagger animation with delay
            setTimeout(() => {
              statItem.style.setProperty("--bar-width", `${percentage}%`);
              statItem.classList.add("animated");
            }, index * 200);

            statsObserver.unobserve(statItem);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    statItems.forEach((item) => {
      statsObserver.observe(item);
    });
  }

  // Real Results Section - Scroll Reveal
  const resultsSection = document.querySelector(".real-results-section");
  if (resultsSection) {
    const benefitCards = document.querySelectorAll(".benefit-card");

    const cardsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const card = entry.target;

            // Stagger reveal with delay
            setTimeout(() => {
              card.classList.add("revealed");
            }, index * 200);

            cardsObserver.unobserve(card);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    benefitCards.forEach((card) => {
      cardsObserver.observe(card);
    });
  }

  // FAQ Section - Accordion Functionality
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const toggleIcon = item.querySelector(".toggle-icon");

    question.addEventListener("click", () => {
      // Check if this item is already active
      const isActive = item.classList.contains("active");

      // Close all other FAQ items (accordion behavior)
      faqItems.forEach((otherItem) => {
        otherItem.classList.remove("active");
        otherItem
          .querySelector(".faq-question")
          .setAttribute("aria-expanded", "false");
        otherItem.querySelector(".toggle-icon").textContent = "+";
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add("active");
        question.setAttribute("aria-expanded", "true");
        toggleIcon.textContent = "−";
      } else {
        item.classList.remove("active");
        question.setAttribute("aria-expanded", "false");
        toggleIcon.textContent = "+";
      }
    });
  });

  // Final Contact Form - Form Submission
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;

      // Open email client with pre-filled data
      window.location.href = `mailto:udayeaswar24@gmail.com?subject=Contact from ${encodeURIComponent(
        name
      )}&body=Name: ${encodeURIComponent(
        name
      )}%0D%0AEmail: ${encodeURIComponent(email)}`;

      // Optional: Show success message
      // alert('Thank you! We will get back to you soon.');
      // this.reset();
    });
  }

  // Smooth scroll for navigation links
  document.querySelectorAll('.footer-nav a, a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Brand Animation Section - Scroll-triggered floating letter
  const brandSection = document.querySelector(".brand-animation-section");

  if (brandSection) {
    const brandObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add class when section is 50% visible
            entry.target.classList.add("scrolled");
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      }
    );

    brandObserver.observe(brandSection);
  }

  // Add loading animation
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
  });

  // Console log for debugging
  console.log("CodeCalm website initialized successfully!");

  // Video Selection and Player Logic
  const videoPlaceholder = document.getElementById("videoPlaceholder");
  const userTypeSelection = document.getElementById("userTypeSelection");
  const videoPlayerSection = document.getElementById("videoPlayerSection");
  const backToHome = document.getElementById("backToHome");
  const backToSelection = document.getElementById("backToSelection");
  const userTypeBtns = document.querySelectorAll(".user-type-btn");
  const videoGrid = document.getElementById("videoGrid");
  const videoSectionTitle = document.getElementById("videoSectionTitle");

  // Video data mapping
  const videoData = {
    student: {
      title: "Student Stress Relief Videos",
      videos: [
        {
          title: "Guided Meditation for Students",
          url: "https://www.youtube.com/watch?v=K4YoQHjaziI",
          embedUrl: "https://www.youtube.com/embed/K4YoQHjaziI",
        },
        {
          title: "10-Minute Meditation For Stress | Goodful",
          url: "https://www.youtube.com/watch?v=z6X5oEIg6Ak",
          embedUrl: "https://www.youtube.com/embed/z6X5oEIg6Ak",
        },
        {
          title: "5-Minute Meditation You Can Do Anywhere",
          url: "https://www.youtube.com/watch?v=inpok4MKVLM",
          embedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
        },
        {
          title: "Daily Calm | 10 Minute Mindfulness Meditation",
          url: "https://www.youtube.com/watch?v=ZToicYcHIOU",
          embedUrl: "https://www.youtube.com/embed/ZToicYcHIOU",
        },
        {
          title: "Stillness For Stress Relief | 15-Minute Meditation",
          url: "https://www.youtube.com/watch?v=CscxGprl1yw",
          embedUrl: "https://www.youtube.com/embed/CscxGprl1yw",
        },
      ],
    },
    parent: {
      title: "Parent Mental Wellness Videos",
      videos: [
        {
          title: "Tips for parents to support their children's mental wellness",
          url: "https://www.youtube.com/watch?v=yLRIy7KKADI",
          embedUrl: "https://www.youtube.com/embed/yLRIy7KKADI",
        },
        {
          title: "Your mental health & wellbeing – 10 top tips for parents",
          url: "https://www.youtube.com/watch?v=W0Dcb1awogI",
          embedUrl: "https://www.youtube.com/embed/W0Dcb1awogI",
        },
        {
          title:
            "Building Strong Roots: Tools for Strengthening Parental Mental Health",
          url: "https://www.youtube.com/watch?v=dOBg_YjAf3Y",
          embedUrl: "https://www.youtube.com/embed/dOBg_YjAf3Y",
        },
        {
          title:
            "Raising Parents: Mental Health and Self-care in Modern Parenthood",
          url: "https://www.youtube.com/watch?v=BvGquAyQ3lU",
          embedUrl: "https://www.youtube.com/embed/BvGquAyQ3lU",
        },
        {
          title: "Mental Health Tips for Parents",
          url: "https://www.youtube.com/watch?v=2kxCuVBwj4k",
          embedUrl: "https://www.youtube.com/embed/2kxCuVBwj4k",
        },
      ],
    },
    "working professional": {
      title: "Professional Workplace Stress Management",
      videos: [
        {
          title: "How to manage JOB STRESS? | Tips by Ex-McKinsey Consultant",
          url: "https://www.youtube.com/watch?v=idB3i_s_0sU",
          embedUrl: "https://www.youtube.com/embed/idB3i_s_0sU",
        },
        {
          title:
            "Understanding, Recognizing, and Managing Stress in the Workplace",
          url: "https://www.youtube.com/watch?v=XqFzXUsC6rE",
          embedUrl: "https://www.youtube.com/embed/XqFzXUsC6rE",
        },
        {
          title: "The Workplace Stress Solution",
          url: "https://www.youtube.com/watch?v=6OzKD1YWHRI",
          embedUrl: "https://www.youtube.com/embed/6OzKD1YWHRI",
        },
        {
          title: "Managing Stress – Brainsmart – BBC",
          url: "https://www.youtube.com/watch?v=hnpQrMqDoqE",
          embedUrl: "https://www.youtube.com/embed/hnpQrMqDoqE",
        },
        {
          title: "De-stress in 5 Minutes: Mind and Body Meditation",
          url: "https://www.youtube.com/watch?v=wE292vsJcBY",
          embedUrl: "https://www.youtube.com/embed/wE292vsJcBY",
        },
      ],
    },
  };

  // Show user type selection when clicking video placeholder
  if (videoPlaceholder) {
    videoPlaceholder.addEventListener("click", () => {
      videoPlaceholder.style.display = "none";
      userTypeSelection.style.display = "block";
    });
  }

  // Handle user type button clicks
  userTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const userType = btn.getAttribute("data-type");
      showVideos(userType);
    });
  });

  // Show videos based on user type
  function showVideos(userType) {
    const data = videoData[userType];

    if (!data) {
      console.error("Invalid user type:", userType);
      return;
    }

    // Update title
    videoSectionTitle.textContent = data.title;

    // Clear previous videos
    videoGrid.innerHTML = "";

    // Add videos to grid
    data.videos.forEach((video) => {
      const videoItem = document.createElement("div");
      videoItem.className = "video-item";
      videoItem.innerHTML = `
        <iframe 
          src="${video.embedUrl}" 
          title="${video.title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
        <div class="video-title">${video.title}</div>
      `;
      videoGrid.appendChild(videoItem);
    });

    // Hide selection, show player
    userTypeSelection.style.display = "none";
    videoPlayerSection.style.display = "block";
  }

  // Back to home button
  if (backToHome) {
    backToHome.addEventListener("click", () => {
      userTypeSelection.style.display = "none";
      videoPlaceholder.style.display = "flex";
    });
  }

  // Back to selection button
  if (backToSelection) {
    backToSelection.addEventListener("click", () => {
      videoPlayerSection.style.display = "none";
      userTypeSelection.style.display = "block";
    });
  }
});
