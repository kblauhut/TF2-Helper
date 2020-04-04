let colors;
let querystrings;
let settings;
let region = "eu";

chrome.storage.sync.get(["colors", "querystrings", "settings"], function (
  result
) {
  colors = result.colors;
  settings = result.settings;
  querystrings = result.querystrings;
  let players = document.getElementsByClassName(querystrings.players);
  let slots = document.getElementsByClassName(querystrings.slots);

  if (settings.divTags) {
    let style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = chrome.extension.getURL("res/css/divTag.css");
    document.head.appendChild(style);
    updatePlayers(players);
    for (let i = 0; i < slots.length; i++) {
      addMutationObserver(slots[i]);
    }
  }
});

function addMutationObserver(target) {
  console.log(target);

  let config = {
    attributes: true,
    attributeFilter: ['class'],
    childList: false,
    characterData: true,
    attributeOldValue: true
  };

  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      console.log("ya");
    });
  });
  observer.observe(target, config);
}

function updatePlayers(players) {
  let idArray = getIds(players);
  let port = chrome.runtime.connect({ name: region });
  port.postMessage({ idArray: idArray });
  port.onMessage.addListener(function (msg) {
    for (let i = 0; i < players.length; i++) {
      userID = players[i].children[1].firstElementChild
        .getAttribute("href")
        .substring(9);
      if (userID != null && userID != undefined) {
        if (msg.user.id == userID) {
          if (msg.user.registered) {
            updateUser(
              players[i].parentElement,
              msg.user.data.division,
              msg.user.data.etf2lID
            );
          } else {
            updateUser(players[i].parentElement, null, null);
          }
        }
      }
    }
  });
}

function updateUser(targetElement, div, id) {
  let tag = targetElement.getElementsByClassName("etf2lDivTag")[0];
  let href = null;
  if (id != null) href = "http://etf2l.org/forum/user/" + id;
  if (tag == null) {
    tag = document.createElement("a");
    tag.className = "etf2lDivTag";
    if (href != null) {
      tag.setAttribute("href", href);
      tag.setAttribute("target", "_blank");
    }
    targetElement.firstElementChild.appendChild(tag);
    tag.style.color = "black";
  } else {
    tag.removeAttribute("href");
    if (href != null) {
      tag.setAttribute("href", href);
    }
  }

  switch (div) {
    case "etf2l_prem":
      tag.style.background = colors.prem;
      tag.innerText = "PREM";
      break;
    case "etf2l_div1":
      tag.style.background = colors.div1;
      tag.innerText = "DIV1";
      break;
    case "etf2l_div2":
      tag.style.background = colors.div2;
      tag.innerText = "DIV2";
      break;
    case "etf2l_div3":
      tag.style.background = colors.div3;
      tag.innerText = "DIV3";
      break;
    case "etf2l_mid":
      tag.style.background = colors.mid;
      tag.innerText = "MID";
      break;
    case "etf2l_low":
      tag.style.background = colors.low;
      tag.innerText = "LOW";
      break;
    case "etf2l_open":
      tag.style.background = colors.open;
      tag.innerText = "OPEN";
      break;
    case "rgl_inv":
      tag.style.background = colors.prem;
      tag.innerText = "RGL-I";
      break;
    case "rgl_adv":
      tag.style.background = colors.div1;
      tag.innerText = "RGL-A";
      break;
    case "rgl_main":
      tag.style.background = colors.div2;
      tag.innerText = "RGL-M";
      break;
    case "rgl_im":
      tag.style.background = colors.mid;
      tag.innerText = "RGL-IM";
      break;
    case "rgl_open":
      tag.style.background = colors.low;
      tag.innerText = "RGL-O";
      break;
    case "rgl_new":
      tag.style.background = colors.open;
      tag.innerText = "RGL-N";
      break;
    case "esea_inv":
      tag.style.background = colors.prem;
      tag.innerText = "ESEA-I";
      break;
    case "esea_im":
      tag.style.background = colors.div1;
      tag.innerText = "ESEA-IM";
      break;
    case "esea_open":
      tag.style.background = colors.div2;
      tag.innerText = "ESEA-O";
      break;
    default:
      tag.style.background = colors.null;
      tag.innerText = "NEW";
  }
}

function getIds(players) {
  let idArray = [];
  for (let i = 0; i < players.length; i++) {
    let id = players[i].children[1].firstElementChild
      .getAttribute("href")
      .substring(9);
    idArray.push(id);
  }
  return idArray;
}