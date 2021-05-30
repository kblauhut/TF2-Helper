let colors;
let querystrings;
let settings;
let region = "eu";

chrome.storage.sync.get(["colors", "querystrings", "settings"], result => {
	colors = result.colors;
	settings = result.settings;
	querystrings = result.querystrings;

	if (settings.divTags) {
		let style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = chrome.extension.getURL("res/css/divTag.css");
		document.head.appendChild(style);
		let table = document.getElementsByClassName(querystrings.table)[0];

		updatePlayers(table.childNodes[3].getElementsByTagName("tr"));
	}
});

function updatePlayers(players) {
	const idArray = getIds(players);
	const port = chrome.runtime.connect({ name: region });

	port.postMessage({ idArray });

	port.onMessage.addListener(data => {
		const dataMap = new Map();
		for (const d of data) {
			dataMap.set(d.id, d);
		}

		for (const player of players) {
			const userId = player.getAttribute("id").substring(7);

			if (userId && dataMap.has(userId)) {
				const playerInfo = dataMap.get(userId);

				if (playerInfo.registered) {
					updateUser(player, playerInfo.data.division, playerInfo.data.etf2lID);
				} else {
					updateUser(player, null, null);
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

		targetElement.appendChild(tag);
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
		case "special_gamer": {
			tag.style.background =
				"linear-gradient(153deg, rgba(227,21,223,1) 0%, rgba(95,97,206,1) 51%, rgba(0,212,255,1) 100%)";
			tag.innerText = "DIV1";
			break;
		}
		default:
			tag.style.background = colors.null;
			tag.innerText = "NEW";
	}
}

function getIds(players) {
	let idArray = [];
	for (let i = 0; i < players.length; i++) {
		let id = players[i].getAttribute("id").substring(7);
		idArray.push(id);
	}
	return idArray;
}
