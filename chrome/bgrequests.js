let userDataCache = [];
let requestQueue = [];
let openRequests = [];
let eseaDivJSON;
let ozfDivJSON;

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    for (let i = 0; i < msg.idArray.length; i++) {
      returnData(msg.idArray[i], port);
    }
  });
});

async function returnData(id, port) {
  let cachedIDs = [];
  let userData;
  let idPos;

  for (let i = 0; i < userDataCache.length; i++) {
    cachedIDs.push(userDataCache[i].id);
  }
  idPos = cachedIDs.indexOf(id);

  if (idPos != -1) {
    port.postMessage({ user: userDataCache[idPos] });
  } else if (requestQueue.indexOf(id) != -1) {
    openRequests.push({ id: id, port: port });
  } else if (requestQueue.indexOf(id) == -1) {
    requestQueue.push(id);
    if (port.name == "eu") {
      userData = await etf2lUserData(id);
      if (userData.registered == false || userData.data.division == null)
        userData = await rglUserData(id);
      //if (userData.registered == false || userData.data.division == null)
      //userData = await eseaUserData(id);
      // if (userData.registered == false || userData.data.division == null)
      //   userData = await ozfUserData(id);
    } else if (port.name == "na") {
      userData = await rglUserData(id);
      if (userData.registered == false || userData.data.division == null)
        //userData = await eseaUserData(id);
        //if (userData.registered == false || userData.data.division == null)
        userData = await etf2lUserData(id);
      // if (userData.registered == false || userData.data.division == null)
      //   userData = await ozfUserData(id);
    } else {
      // userData = await ozfUserData(id);
      //if (userData.registered == false || userData.data.division == null)
      userData = await rglUserData(id);
      //if (userData.registered == false || userData.data.division == null)
      //userData = await eseaUserData(id);
      if (userData.registered == false || userData.data.division == null)
        userData = await etf2lUserData(id);
    }
    requestQueue.splice(requestQueue.indexOf(id), 1);
    userDataCache.push(userData);
    port.postMessage({ user: userData });
    userDataUpdated(id, userData);
  }
}

function userDataUpdated(id, userData) {
  for (let i = 0; i < openRequests.length; i++) {
    if (openRequests[i].id == id) {
      let port = openRequests[i].port;
      port.postMessage({ user: userData });
      openRequests.splice(i, 1);
      i--;
    }
  }
}

async function request(url) {
  const headers = new Headers();
  headers.append("Accept", "application/json");
  const response = await fetch(url, {
    headers
  });
  return await response.json();

}

function etf2lUserData(id) {
  return new Promise(async resolve => {
    console.log("Getting ETF2L data for " + id);
    let userURL = "http://api.etf2l.org/player/" + id;
    let resultURL = "http://api.etf2l.org/player/" + id + "/results/1?since=0";

    let userJSON = await request(userURL);
    if (
      userJSON &&
      userJSON.status.code != 404 &&
      userJSON.status.code != 500
    ) {
      let resultJSON = await request(resultURL);
      let name = userJSON.player.name;
      let etf2lID = userJSON.player.id;
      let team = getTeam(resultJSON);
      let division = getDiv(resultJSON);
      userData = {
        id: id,
        league: "etf2l",
        data: { name: name, team: team, division: division, etf2lID: etf2lID },
        registered: true
      };
    } else {
      userData = { id: id, registered: false };
    }
    resolve(userData);
  });

  function getTeam(resultJSON) {
    let clan1;
    let clan2;
    let tier;
    let category;
    if (resultJSON.results != null) {
      for (let i = 0; i < resultJSON.results.length; i++) {
        clan1 = resultJSON.results[i].clan1;
        clan2 = resultJSON.results[i].clan2;
        category = resultJSON.results[i].competition.category;
        tier = resultJSON.results[i].division.tier;
        if (category == "6v6 Season" && tier != null) {
          if (clan1.was_in_team == 1) {
            return clan1.name;
          } else if (clan2.was_in_team == 1) {
            return clan2.name;
          }
        }
      }
    }
    return null;
  }

  function getDiv(resultJSON) {
    if (resultJSON.results != null) {
      for (let i = 0; i < resultJSON.results.length; i++) {
        let tier = resultJSON.results[i].division.tier;
        let tierName = resultJSON.results[i].division.name;
        let competitionName = resultJSON.results[i].competition.name;
        let category = resultJSON.results[i].competition.category;
        let clan1 = resultJSON.results[i].clan1;
        let clan2 = resultJSON.results[i].clan2;
        if (
          category.includes("6v6 Season") &&
          tier != null &&
          (clan1.was_in_team == 1 || clan2.was_in_team == 1)
        ) {
          if (tierName.includes("Prem")) {
            return "etf2l_prem";
          }
          if (tierName.includes("Division 1")) {
            return "etf2l_div1";
          }
          if (tierName.includes("High")) {
            return "etf2l_div1";
          }
          if (tierName.includes("Division 2")) {
            return "etf2l_div2";
          }
          if (tierName.includes("Division 3")) {
            return "etf2l_div3";
          }
          if (tierName.includes("Mid")) {
            return "etf2l_mid";
          }
          if (tierName.includes("Low")) {
            return "etf2l_low";
          }
          if (tierName.includes("Open")) {
            return "etf2l_open";
          }
        } else if (
          category.includes("6v6 Season") &&
          competitionName.includes("Playoffs") &&
          (clan1.was_in_team == 1 || clan2.was_in_team == 1)
        ) {
          if (competitionName.includes("Prem")) {
            return "etf2l_prem";
          }
          if (competitionName.includes("Division 1")) {
            return "etf2l_div1";
          }
          if (competitionName.includes("High")) {
            return "etf2l_div1";
          }
          if (competitionName.includes("Division 2")) {
            return "etf2l_div2";
          }
          if (competitionName.includes("Division 3")) {
            return "etf2l_div3";
          }
          if (competitionName.includes("Mid")) {
            return "etf2l_mid";
          }
          if (competitionName.includes("Low")) {
            return "etf2l_low";
          }
          if (competitionName.includes("Open")) {
            return "etf2l_open";
          }
        }
      }
      return null;
    }
  }
}

function rglUserData(id) {
  return new Promise(async resolve => {
    console.log("Getting RGL data for " + id);

    const apiUrl = `https://rgl.payload.tf/api/v1/profiles/${id}/experience?formats=sixes&disableCache=true`;
    const req = await fetch(apiUrl);
    const { data: userJSON } = await req.json();
    
    if (userJSON.message != "Player does not exist in RGL") {
      let name = userJSON.name;
      let division = getDiv(userJSON);
      userData = {
        id: id,
        league: "rgl",
        data: { name: name, division: division },
        registered: true
      };
    } else {
      userData = { id: id, registered: false };
    }
    resolve(userData);
  });

  function getDiv(playerObj) {
    switch(playerObj?.experience?.[0].div) {
      case "invite": return "rgl_inv"
      case "div-2": return "rgl_adv"
      case "div-1": return "rgl_adv"
      case "advanced": return "rgl_adv"
      case "main": return "rgl_main"
      case "intermediate": return "rgl_im"
      case "open": return "rgl_open"
      case "newcomer": return "rgl_new"
      default: return null
    }
  }
}

function eseaUserData(id) {
  return new Promise(async resolve => {
    console.log("Getting ESEA data for " + id);
    let dataURL =
      "https://raw.githubusercontent.com/minicircle/esea_tf2_data/master/esea_data_full.json";

    if (eseaDivJSON == undefined) eseaDivJSON = await request(dataURL);
    let division = getDiv(eseaDivJSON, id);
    if (division != null) {
      userData = {
        id: id,
        league: "esea",
        data: { division: division },
        registered: true
      };
    } else {
      userData = { id: id, registered: false };
    }
    resolve(userData);
  });

  function getDiv(divJSON, id) {
    let ids = Object.keys(divJSON);
    let idPos = ids.indexOf(id);

    if (idPos != -1) {
      let division = divJSON[ids[idPos]];
      if (division.includes("Invite")) {
        return "esea_inv";
      }
      if (division.includes("Intermediate")) {
        return "esea_im";
      }
      if (division.includes("Open")) {
        return "esea_open";
      }
    }
    return null;
  }
}

function ozfUserData(id) {
  return new Promise(async resolve => {
    let dataURL =
      "https://raw.githubusercontent.com/kodeeey/OzfortressDivs/master/data/ozfortress_divs.json";

    if (ozfDivJSON == undefined) ozfDivJSON = await request(dataURL);
    if (ozfDivJSON) {
      let division = getDiv(ozfDivJSON, id);
      if (division != null) {
        userData = {
          id: id,
          league: "esea",
          data: { division: division },
          registered: true
        };
      } else {
        userData = { id: id, registered: false };
      }
    } else {
      userData = { id: id, registered: false };
    }
    resolve(userData);
  });

  function getDiv(divJSON, id) {
    if (divJSON) {
      let ids = Object.keys(divJSON);
      let idPos = ids.indexOf(id);

      if (idPos != -1) {
        let division = divJSON[ids[idPos]];
        if (division.includes("premier")) {
          return "ozf_prem";
        }
        if (division.includes("intermediate")) {
          return "ozf_im";
        }
        if (division.includes("open")) {
          return "ozf_open";
        }
      }
    }
    return null;
  }
}
