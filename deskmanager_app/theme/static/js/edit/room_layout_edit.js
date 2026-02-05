(function () {
  let config = {
    elements: {
      layoutEditMenu: document.querySelector(".edit-options-menu"),
    },

    buttons: {
      layoutEditButton: document.getElementById("layout-edit-btn"),
      editRemoveBtn: document.getElementById("edit-remove-btn"),
      editCreateBtn: document.getElementById("edit-create-btn"),
      editUndoBtn: document.getElementById("edit-undo-btn"),
      editSaveBtn: document.getElementById("edit-save-btn"),
    },

    activeDeskList: [],
    deleteMode: false,
  };

  const styles = {
    deskEditBorder: "border-3",
    deskEditBorderColor: "border-blue-300",
  };

  // properties biurka, zapisywane pod kluczem desk_id w formacie JSON jako ciąg.
  localStorage.setItem('editCache', []);

  function debounce(func, wait, immediate = false) {
    let timeout;
    return function (...args) {
      const context = this;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  config.buttons.layoutEditButton.addEventListener("click", () => {
    switch (appState.editMode) {
      case false:
        if (appState.currentRoom) {
          appState.editMode = true;
          config.elements.layoutEditMenu.classList.remove("hidden");
          config.buttons.layoutEditButton.ariaPressed = true;
          config.buttons.layoutEditButton.classList.replace(
            "bg-violet-600",
            "bg-violet-800",
          );

          break;  
        } else {
          break;
        }

      case true:
        appState.editMode = false;
        config.buttons.layoutEditButton.ariaPressed = false;
        config.buttons.layoutEditButton.classList.replace(
          "bg-violet-800",
          "bg-violet-600",
        );
        config.elements.layoutEditMenu.classList.add("hidden");
        config.activeDeskList.forEach((deskId) => {
          if (config.activeDeskList.length === 0) return;
          let deskObj = document.getElementById(deskId);
          deskObj.classList.remove(
            styles.deskEditBorder,
            styles.deskEditBorderColor,
          );
        });

        editModeClose(config.activeDesk);
        config.activeDesk = null;
        break;
    }
  });

  function editModeOpen(desk) {
    if (!appState.editMode || !desk) return;

    interact(desk).draggable(true);
    interact(desk).resizable(true);
    desk.classList.add(styles.deskEditBorder, styles.deskEditBorderColor);
    if (!config.activeDeskList.includes(desk.getAttribute("id"))) {
      config.activeDeskList.push(desk.getAttribute("id"));
    }
  }

  function editModeClose(desk) {
    if (appState.editMode) return;
    config.activeDeskList.forEach((deskId) => {
      let deskObj = document.getElementById(deskId);
      interact(deskObj).draggable(false);
      interact(deskObj).resizable(false);
    });
    config.activeDeskList = [];
    localStorage.removeItem('editCache');
  }

  function editCreate() {
    if (!appState.editMode) return;

    let deskCreateForm = document.getElementById("desk-create-form");
    let cancelBtn = document.getElementById("cancel-btn");
    let submitBtn = document.getElementById("submit-btn");
    let errorLabel = document.getElementById('create-error');

    let idField = document.getElementById("desk-id"); // str
    let widthField = document.getElementById("width"); // int
    let heightField = document.getElementById("height"); // int

    newSubmitBtn = submitBtn.cloneNode(true); // use only 'new' buttons to avoid eventListener stacking
    newCancelBtn = cancelBtn.cloneNode(true);

    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    deskCreateForm.classList.remove("hidden");

    newSubmitBtn.addEventListener(
      "click",
      debounce(
        () => {
          if (idField) {
            fetch("/desk-create/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
              },
              body: JSON.stringify({
                desk_id: idField.value,
                room_id: appState.currentRoom,
                width: parseInt(widthField.value) || 100,
                height: parseInt(heightField.value) || 100,
              }),
            }).then((response) => {
              if (response.ok) {
                newCancelBtn.click();
                loadDesksEdit(appState.currentRoom);
              } else {
                errorLabel.classList.remove('hidden');
              }
            });
          }
        },
        500,
        true,
      ),
    );

    newCancelBtn.addEventListener("click", () => {
      idField.value = "";
      widthField.value = "100";
      heightField.value = "200";
      deskCreateForm.classList.add("hidden");
      errorLabel.classList.add('hidden');
    });
  }

  function editUndo() {
    if (!appState.editMode || config.activeDeskList.length === 0) return;

    const deskId = config.activeDeskList[config.activeDeskList.length - 1];
    const deskObj = document.getElementById(deskId);
    const cachedDataStr = localStorage.getItem(deskId);
    
    if (!deskObj || !cachedDataStr) return;
    
    const cachedData = JSON.parse(cachedDataStr);
    const x = cachedData.x || 0;
    const y = cachedData.y || 0;
    
    deskObj.setAttribute('data-x', x);
    deskObj.setAttribute('data-y', y);
    deskObj.style.transform = `translate(${x}px, ${y}px)`;
    
    if (cachedData.width) deskObj.style.width = `${cachedData.width}px`;
    if (cachedData.height) deskObj.style.height = `${cachedData.height}px`; 

    if (config.activeDeskList.length > 1 ){
      let mem = config.activeDeskList.pop();
      config.activeDeskList.unshift(mem);
    }
  }

  // ! change to one request with multiple updates.
  function editSave() {
    if (!appState.editMode || !config.activeDeskList.length) return;
    config.activeDeskList.forEach((deskId) => {
      deskObj = document.getElementById(deskId);
      fetch("/desk-update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          desk_id: deskId,
          x: deskObj.getAttribute("data-x"),
          y: deskObj.getAttribute("data-y"),
          width: parseInt(deskObj.style.width),
          height: parseInt(deskObj.style.height),
        }),
      }).then((response) => {
        if (response.ok) {
        } else {
          console.error("failed to save desk properties.");
        }
      });
    });
  }

  function editRemove(desk) {
    if (!appState.editMode || !desk || !config.deleteMode) return;

    let deskDeleteForm = document.getElementById("desk-delete-form");
    let confirmInput = document.getElementById("delete-confirm-input");
    let submitBtn = document.getElementById("del-submit-btn");
    let cancelBtn = document.getElementById("del-cancel-btn");

    deskDeleteForm.classList.remove("hidden");

    const newSubmitBtn = submitBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.addEventListener("click", () => {
      deskDeleteForm.classList.add("hidden");
      confirmInput.value = "";
      confirmInput.classList.replace("border-rose-200", "border-gray-200");
      confirmInput.classList.replace("bg-rose-50", "bg-gray-50");
    });

    newSubmitBtn.addEventListener("click", async () => {
      if (confirmInput.value === "USUNIĘCIE") {
        newSubmitBtn.disabled = true;
        try {
          const response = await fetch("/desk-remove/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ desk_id: desk.getAttribute("id") }),
          });
          const result = await response.json();
          if (response.ok && result.status === "success") {
            newCancelBtn.click();
            loadDesksEdit(appState.currentRoom);
          } else {
            alert(result.error);
          }
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          newSubmitBtn.disabled = false;
        }
      } else {
        confirmInput.classList.replace("border-gray-200", "border-rose-200");
        confirmInput.classList.replace("bg-gray-50", "bg-rose-50");
      }
    });
  }

  function editDeleteMode() {
    if (!appState.editMode) return;
    if (config.deleteMode == false) {
      config.deleteMode = true;
      let desks = document.querySelectorAll(".desk-item");
      desks.forEach((desk) => {
        desk.classList.remove(
          styles.deskEditBorder,
          styles.deskEditBorderColor,
        );
      });
      config.buttons.editRemoveBtn.classList.replace(
        "bg-rose-500",
        "bg-rose-600",
      );
      config.buttons.editRemoveBtn.ariaPressed = true;
    } else {
      config.deleteMode = false;
      config.buttons.editRemoveBtn.classList.replace(
        "bg-rose-600",
        "bg-rose-500",
      );
      config.buttons.editRemoveBtn.ariaPressed = false;
    }
  }

  config.buttons.editRemoveBtn.addEventListener("click", () => {
    editDeleteMode();
  });

  config.buttons.editCreateBtn.addEventListener("click", () => {
    editCreate();
  });

  config.buttons.editUndoBtn.addEventListener("click", () => {
    editUndo();
  });

  config.buttons.editSaveBtn.addEventListener(
    "click",
    debounce(
      () => {
        editSave();
      },
      500,
      true,
    ),
  );

  document.addEventListener("click", function (e) {
    let desk = e.target.closest(".desk-item");
    if (!appState.editMode || !desk) return;

    if (config.deleteMode) {
      editRemove(desk);
    } else {
      editModeOpen(desk);
      //caching initial desk properties
      desk_id = desk.getAttribute('id');
      fetch(`/desk-read/?desk_id=${desk_id}`)
        .then(response => response.json())
        .then(data => { 
          localStorage.setItem(desk_id, JSON.stringify(data));
        }) 

    }
  });
})();
