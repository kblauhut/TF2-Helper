style = document.createElement("link");
style.rel = "stylesheet";
style.type = "text/css";
style.href = chrome.extension.getURL("res/css/popup.css");
document.head.appendChild(style);

togglebutton = document.createElement("link");
togglebutton.rel = "stylesheet";
togglebutton.type = "text/css";
togglebutton.href = chrome.extension.getURL("res/css/togglebutton.css");
document.head.appendChild(togglebutton);

window.onload = function () {
  const divTagToggle = document.getElementById("divTagToggle");
  const versionElement = document.getElementById("version");
  
  const version = chrome.runtime.getManifest().version;
  $(versionElement).text(version);

  let settings = getSettings();

  function updateDivToggle(isEnabled, toggleElement) {
    $(toggleElement).prop("checked", isEnabled);
  }

  divTagToggle.onclick = function () {
    settings.divTags = !settings.divTags;
    updateDivToggle(settings.divTags, divTagToggle);
    setSettings();
  };

  function getSettings() {
    chrome.storage.sync.get("settings", function (data) {
      settings = data.settings;
      updateDivToggle(settings.divTags, divTagToggle);
    });
  }

  function setSettings() {
    chrome.storage.sync.set({ settings: settings }, function () { });
  }
};
