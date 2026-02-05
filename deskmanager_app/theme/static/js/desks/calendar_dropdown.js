(function () {
  const config = {
    api: {
      loadAssignedUsers: "/load-assigned-users/?room_id=",
    },
    weekdays: {
      0: "Poniedziałek",
      1: "Wtorek",
      2: "Środa",
      3: "Czwartek",
      4: "Piątek",
    },
  };

  function populateCalendarDropdown() {
    const container = document.querySelector(".calendar-dropdown-content");
    if (!container) return;

    Object.entries(config.weekdays).forEach(([key, value]) => {
      const dayButton = document.createElement("button");
      dayButton.className = `calendar-button flex items-center justify-center w-full bg-violet-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200`;
      dayButton.textContent = value;

      dayButton.addEventListener("click", function () {
        const prevActive = container.querySelector(".bg-violet-800");
        if (prevActive && prevActive !== dayButton) {
          prevActive.classList.replace("bg-violet-800", "bg-violet-600");
        }

        const isCurrentlyActive = dayButton.classList.contains("bg-violet-800");

        if (isCurrentlyActive) {
          dayButton.classList.replace("bg-violet-800", "bg-violet-600");
          appState.userDisplayMode.active = false;
          appState.userDisplayMode.selectedDay = null;
        } else {
          dayButton.classList.replace("bg-violet-600", "bg-violet-800");
          appState.userDisplayMode.active = true;
          appState.userDisplayMode.selectedDay = key;
        }

        loadDesks(appState.currentRoom);
      });
      container.appendChild(dayButton);
    });
  }

  function toggleCalendarDropdown() {
    const toggleBtn = document.getElementById("calendar-view-btn");
    const menu = document.getElementById("day-select-menu");

    toggleBtn?.addEventListener("click", () => {
      if (!appState.currentRoom) return;

      menu?.classList.toggle("hidden");
      const isActive = toggleBtn.getAttribute("data-calendaractive") === "true";

      if (isActive) {
        toggleBtn.setAttribute("data-calendaractive", "false");
        appState.userDisplayMode.active = false;
        appState.userDisplayMode.selectedDay = null;

        const activeButton = document.querySelector(
          ".calendar-dropdown-content .bg-violet-800",
        );
        if (activeButton) {
          activeButton.classList.replace("bg-violet-800", "bg-violet-600");
        }

        loadDesks(appState.currentRoom);
      } else {
        toggleBtn.setAttribute("data-calendaractive", "true");
      }
    });
  }

  toggleCalendarDropdown();
  populateCalendarDropdown();
})();
