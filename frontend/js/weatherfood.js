// Weather + Food Bot - Smart Nutrition Advisor Logic

class WeatherFoodBot {
  constructor() {
    this.userPreferences = {
      dietType: "",
      fitnessGoal: "",
      restrictions: [],
      location: "Rayagada",
    };
    this.weatherData = null;
    this.recommendations = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Diet type selection - get the first question section's buttons
    const questionSections = document.querySelectorAll(".question-section");
    if (questionSections.length > 0) {
      const dietButtons = questionSections[0].querySelectorAll("[data-choice]");
      dietButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          this.selectDietType(button, button.dataset.choice);
        });
      });
    }

    // Fitness goal selection - using data-choice attribute
    const goalSection = document.getElementById("goal-section");
    if (goalSection) {
      const goalButtons = goalSection.querySelectorAll("[data-choice]");
      goalButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          this.selectGoal(button, button.dataset.choice);
        });
      });
    }

    // Restriction tags
    document.querySelectorAll(".restriction-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        // Handle "None" option - clear all others
        if (tag.dataset.restriction === "none") {
          document
            .querySelectorAll(".restriction-tag")
            .forEach((t) => t.classList.remove("selected"));
          tag.classList.add("selected");
          this.userPreferences.restrictions = [];
          return;
        }

        // Deselect "None" if any other is selected
        const noneTag = document.querySelector(
          '.restriction-tag[data-restriction="none"]'
        );
        if (noneTag) noneTag.classList.remove("selected");

        tag.classList.toggle("selected");
        const restriction = tag.dataset.restriction;
        const index = this.userPreferences.restrictions.indexOf(restriction);
        if (index > -1) {
          this.userPreferences.restrictions.splice(index, 1);
        } else {
          this.userPreferences.restrictions.push(restriction);
        }
      });
    });

    // Custom restrictions input
    const restrictionsInput = document.getElementById("restrictions-input");
    if (restrictionsInput) {
      restrictionsInput.addEventListener("input", (e) => {
        const customRestrictions = e.target.value
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r.length > 0);

        // Merge custom with selected tags
        const tagRestrictions = Array.from(
          document.querySelectorAll(".restriction-tag.selected")
        )
          .map((tag) => tag.dataset.restriction)
          .filter((r) => r !== "none");

        this.userPreferences.restrictions = [
          ...new Set([...tagRestrictions, ...customRestrictions]),
        ];
      });
    }

    // Location input - using city-input ID
    const cityInput = document.getElementById("city-input");
    if (cityInput) {
      cityInput.addEventListener("input", (e) => {
        this.userPreferences.location = e.target.value || "Rayagada";
      });
    }

    // Submit button - using get-recommendations ID
    const submitBtn = document.getElementById("get-recommendations");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        this.submitPreferences();
      });
    }

    // Meal plan button - use event delegation
    document.addEventListener("click", (e) => {
      if (
        e.target.id === "get-meal-plan" ||
        e.target.closest("#get-meal-plan")
      ) {
        e.preventDefault();
        this.getMealPlan();
      }
    });

    // New search button - use event delegation
    document.addEventListener("click", (e) => {
      if (e.target.id === "new-search" || e.target.closest("#new-search")) {
        e.preventDefault();
        this.resetToQuestions();
      }
    });

    // Modal close
    const modalClose = document.querySelector(".modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", () => {
        const modal = document.getElementById("meal-plan-modal");
        if (modal) modal.style.display = "none";
      });
    }

    // Close modal on background click
    const mealPlanModal = document.getElementById("meal-plan-modal");
    if (mealPlanModal) {
      mealPlanModal.addEventListener("click", (e) => {
        if (e.target.id === "meal-plan-modal") {
          mealPlanModal.style.display = "none";
        }
      });
    }
  }

  selectDietType(selectedButton, value) {
    // Remove selected class from all diet buttons
    const questionSections = document.querySelectorAll(".question-section");
    if (questionSections.length > 0) {
      const dietButtons = questionSections[0].querySelectorAll("[data-choice]");
      dietButtons.forEach((btn) => {
        btn.classList.remove("selected");
      });
    }

    // Add selected class to clicked button
    selectedButton.classList.add("selected");

    // Update preferences
    this.userPreferences.dietType = value;

    // Show next section (fitness goal)
    const goalSection = document.getElementById("goal-section");
    if (goalSection) goalSection.style.display = "block";
  }

  selectGoal(selectedButton, value) {
    // Remove selected class from all goal buttons
    const goalSection = document.getElementById("goal-section");
    if (goalSection) {
      const goalButtons = goalSection.querySelectorAll("[data-choice]");
      goalButtons.forEach((btn) => {
        btn.classList.remove("selected");
      });
    }

    // Add selected class to clicked button
    selectedButton.classList.add("selected");

    // Update preferences
    this.userPreferences.fitnessGoal = value;

    // Show next section (restrictions)
    const restrictionsSection = document.getElementById("restrictions-section");
    if (restrictionsSection) restrictionsSection.style.display = "block";

    const locationSection = document.getElementById("location-section");
    if (locationSection) locationSection.style.display = "block";
  }

  selectOption(selector, selectedButton, preferenceKey, value) {
    // Remove selected class from all buttons in the group
    document.querySelectorAll(selector).forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Add selected class to clicked button
    selectedButton.classList.add("selected");

    // Update preferences
    this.userPreferences[preferenceKey] = value;
  }

  async submitPreferences() {
    // Validate required fields
    if (!this.userPreferences.dietType) {
      alert("Please select your diet type");
      return;
    }

    if (!this.userPreferences.fitnessGoal) {
      alert("Please select your fitness goal");
      return;
    }

    if (!this.userPreferences.location) {
      alert("Please enter your location");
      return;
    }

    // Show results screen
    document.getElementById("questions-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "block";

    // Fetch weather data
    await this.getWeatherData();

    // Get food recommendations
    await this.getFoodRecommendations();
  }

  async getWeatherData() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/weather?city=${encodeURIComponent(
          this.userPreferences.location
        )}`
      );
      const data = await response.json();

      if (data.error) {
        console.error("Weather error:", data.error);
        this.displayWeatherError();
        return;
      }

      this.weatherData = data;
      this.displayWeatherData(data);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      this.displayWeatherError();
    }
  }

  displayWeatherData(data) {
    // Handle both direct properties and weather object
    const weather = data.weather || data;

    // Update location display
    const locationDisplay = document.getElementById("location-display");
    if (locationDisplay) {
      locationDisplay.textContent =
        weather.city || this.userPreferences.location;
    }

    // Update temperature display
    const tempDisplay = document.getElementById("temp-display");
    if (tempDisplay) {
      tempDisplay.textContent = `${Math.round(weather.temperature)}°C`;
    }

    // Update humidity display
    const humidityDisplay = document.getElementById("humidity-display");
    if (humidityDisplay) {
      humidityDisplay.textContent = `${weather.humidity}%`;
    }

    // Update weather summary
    const weatherSummary =
      `Current weather in ${weather.city}: ${
        weather.condition
      } with ${Math.round(weather.temperature)}°C. ` +
      `Humidity at ${weather.humidity}%. Perfect for planning your nutrition!`;
    const summaryElem = document.getElementById("weather-summary");
    if (summaryElem) {
      summaryElem.textContent = weatherSummary;
    }

    // Update weather icon
    const iconDisplay = document.getElementById("weather-icon-display");
    if (iconDisplay) {
      iconDisplay.textContent = this.getWeatherEmoji(
        weather.condition,
        weather.temperature
      );
    }
  }

  getWeatherEmoji(condition, temperature) {
    if (!condition) return "🌤️";
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
      return "🌧️";
    } else if (conditionLower.includes("cloud")) {
      return "☁️";
    } else if (
      conditionLower.includes("clear") ||
      conditionLower.includes("sun")
    ) {
      if (temperature > 30) return "☀️";
      return "🌤️";
    } else if (conditionLower.includes("snow")) {
      return "❄️";
    } else if (
      conditionLower.includes("thunder") ||
      conditionLower.includes("storm")
    ) {
      return "⛈️";
    } else if (
      conditionLower.includes("mist") ||
      conditionLower.includes("fog")
    ) {
      return "🌫️";
    }

    return "🌡️";
  }

  displayWeatherError() {
    // Set default weather data for Rayagada, Odisha
    this.weatherData = {
      city: this.userPreferences.location || "Rayagada",
      temperature: 8,
      humidity: 65,
      condition: "Partly Cloudy",
      feels_like: 6,
    };

    const locationDisplay = document.getElementById("location-display");
    if (locationDisplay) locationDisplay.textContent = this.weatherData.city;

    const tempDisplay = document.getElementById("temp-display");
    if (tempDisplay)
      tempDisplay.textContent = `${this.weatherData.temperature}°C`;

    const humidityDisplay = document.getElementById("humidity-display");
    if (humidityDisplay)
      humidityDisplay.textContent = `${this.weatherData.humidity}%`;

    const weatherSummary = `Current weather in ${this.weatherData.city}: ${this.weatherData.condition} with ${this.weatherData.temperature}°C. Humidity at ${this.weatherData.humidity}%. Perfect for planning your nutrition!`;
    const summaryElem = document.getElementById("weather-summary");
    if (summaryElem) {
      summaryElem.textContent = weatherSummary;
    }

    const weatherIcon = document.getElementById("weather-icon-display");
    if (weatherIcon) weatherIcon.textContent = "🌤️";
  }

  async getFoodRecommendations() {
    const loadingIndicator = document.querySelector(".loading-indicator");
    const recommendationsText = document.getElementById("recommendations-text");
    const quickFoods = document.querySelector(".quick-foods");

    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = "block";
    recommendationsText.innerHTML = "";
    if (quickFoods) quickFoods.style.display = "none";

    // Ensure we have weather data (use defaults if not)
    if (!this.weatherData) {
      this.weatherData = {
        city: this.userPreferences.location || "Rayagada",
        temperature: 8,
        humidity: 65,
        condition: "Partly Cloudy",
        feels_like: 6,
      };
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/weather-food/recommend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diet_type: this.userPreferences.dietType,
            goal: this.userPreferences.fitnessGoal,
            restrictions:
              this.userPreferences.restrictions.join(", ") || "none",
            city: this.userPreferences.location,
            weather_data: this.weatherData,
          }),
        }
      );

      const data = await response.json();

      if (data.error || !data.success) {
        throw new Error(data.error || "Failed to generate recommendations");
      }

      console.log("Recommendations received:", data);
      this.recommendations = data;
      this.displayRecommendations(data);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      recommendationsText.innerHTML = `
                <p style="color: red; font-weight: 600;">⚠️ Unable to generate recommendations</p>
                <p style="margin-top: 0.5rem;">Error: ${error.message}</p>
                <p style="margin-top: 1rem; color: #666;">
                  <strong>Troubleshooting:</strong><br>
                  • Make sure the backend server is running on port 5000<br>
                  • Check that your GROQ_API_KEY is set in .env file<br>
                  • Open browser console for detailed error logs
                </p>
            `;
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = "none";
      // Show recommendations content
      const recommendationsContent = document.getElementById(
        "recommendations-content"
      );
      if (recommendationsContent)
        recommendationsContent.style.display = "block";
    }
  }

  displayRecommendations(data) {
    console.log("Displaying recommendations:", data);
    const recommendationsText = document.getElementById("recommendations-text");

    if (!recommendationsText) {
      console.error("recommendations-text element not found!");
      return;
    }

    // Display the AI-generated recommendations
    if (data.recommendations) {
      const formatted = this.formatRecommendationsText(data.recommendations);
      console.log("Formatted text:", formatted);
      recommendationsText.innerHTML = formatted;
    } else {
      console.error("No recommendations in data:", data);
      recommendationsText.innerHTML = "<p>No recommendations available.</p>";
    }

    // Display quick foods if available
    if (data.base_foods && data.base_foods.length > 0) {
      this.displayQuickFoods(data.base_foods);
    }

    // Display research sources if available
    if (data.research_sources && data.research_sources.length > 0) {
      this.displayResearchSources(data.research_sources);
    }
  }

  formatRecommendationsText(text) {
    // Convert markdown-like formatting to HTML
    let formatted = text;

    // Headers
    formatted = formatted.replace(/###\s+(.+)/g, "<h3>$1</h3>");
    formatted = formatted.replace(/##\s+(.+)/g, "<h3>$1</h3>");

    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Lists - detect bullet points
    formatted = formatted.replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>");

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/gs, "<ul>$&</ul>");

    // Paragraphs
    formatted = formatted
      .split("\n\n")
      .map((para) => {
        if (
          !para.startsWith("<h3>") &&
          !para.startsWith("<ul>") &&
          para.trim()
        ) {
          return `<p>${para}</p>`;
        }
        return para;
      })
      .join("\n");

    return formatted;
  }

  displayQuickFoods(foods) {
    const quickFoods = document.querySelector(".quick-foods");
    const grid = document.querySelector(".quick-foods-grid");

    grid.innerHTML = "";

    foods.forEach((food) => {
      const card = document.createElement("div");
      card.className = "food-card";
      card.innerHTML = `
                <div class="food-name">${food.name}</div>
                <div class="food-benefit">${food.benefit}</div>
                <div class="food-timing">${food.timing}</div>
            `;
      grid.appendChild(card);
    });

    if (quickFoods) quickFoods.style.display = "block";
  }

  displayResearchSources(sources) {
    const sourcesList = document.getElementById("sources-list");
    sourcesList.innerHTML = "";

    sources.forEach((source) => {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = source.url;
      link.target = "_blank";
      link.innerHTML = `
                <span>🔬</span>
                <span>${source.title || source.url}</span>
            `;
      sourcesList.appendChild(link);
    });
  }

  async getMealPlan() {
    const modal = document.getElementById("meal-plan-modal");
    const loading = document.querySelector(".meal-plan-loading");
    const content = document.getElementById("meal-plan-content");

    // Ensure we have weather data
    if (!this.weatherData) {
      this.weatherData = {
        city: this.userPreferences.location || "Rayagada",
        temperature: 8,
        humidity: 65,
        condition: "Partly Cloudy",
        feels_like: 6,
      };
    }

    // Show modal and loading
    modal.style.display = "flex";
    if (loading) loading.style.display = "block";
    content.innerHTML = "";

    try {
      const response = await fetch(
        "http://localhost:5000/api/weather-food/meal-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diet_type: this.userPreferences.dietType,
            goal: this.userPreferences.fitnessGoal,
            city: this.userPreferences.location,
            restrictions:
              this.userPreferences.restrictions.join(", ") || "none",
            weather_data: this.weatherData,
            current_recommendations:
              this.recommendations?.recommendations || "",
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Display meal plan
      content.innerHTML = this.formatRecommendationsText(data.meal_plan);
    } catch (error) {
      console.error("Failed to get meal plan:", error);
      content.innerHTML = `
                <p style="color: red;">Failed to generate meal plan. Please try again.</p>
                <p>Error: ${error.message}</p>
                <p style="margin-top: 1rem; color: #666;">Make sure the backend server is running on port 5000.</p>
            `;
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  resetToQuestions() {
    // Reset preferences
    this.userPreferences = {
      dietType: "",
      fitnessGoal: "",
      restrictions: [],
      location: "Rayagada",
    };
    this.weatherData = null;
    this.recommendations = null;

    // Reset UI
    document
      .querySelectorAll(".choice-button")
      .forEach((btn) => btn.classList.remove("selected"));
    document
      .querySelectorAll(".restriction-tag")
      .forEach((tag) => tag.classList.remove("selected"));

    const restrictionsInput = document.getElementById("restrictions-input");
    if (restrictionsInput) restrictionsInput.value = "";

    const cityInput = document.getElementById("city-input");
    if (cityInput) cityInput.value = "Rayagada";

    // Hide all sections except the first one
    document.getElementById("goal-section").style.display = "none";
    document.getElementById("restrictions-section").style.display = "none";
    document.getElementById("location-section").style.display = "none";

    // Show questions screen
    document.getElementById("results-screen").style.display = "none";
    document.getElementById("questions-screen").style.display = "flex";
  }
}

// Initialize the bot when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new WeatherFoodBot();
});
