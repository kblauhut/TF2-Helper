const userDataCache = new Map();
const requestQueue = [];
const openRequests = [];

let eseaDivJSON;
let ozfDivJSON;

chrome.runtime.onConnect.addListener(port => {
	// Promise.all so that we don't do weird blocking of event loop and all that
	// not fun stuff...
	port.onMessage.addListener(
		async ({ idArray }) => await Promise.all(idArray.map(id => returnData(id, port)))
	);
});

async function returnData(id, port) {
	let userData;

	const isCached = userDataCache.has(id);

	if (isCached) return port.postMessage({ user: userDataCache.get(id) });

	if (requestQueue.indexOf(id) !== -1) openRequests.push({ id: id, port: port });
	else {
		requestQueue.push(id);

		switch (port.name) {
			case "eu": {
				userData = await etf2lUserData(id);
				if (userData.registered === false || userData.data.division === null)
					userData = await rglUserData(id);
				break;
			}

			case "na": {
				userData = await rglUserData(id);
				if (userData.registered === false || userData.data.division === null)
					userData = await etf2lUserData(id);
				break;
			}

			default: {
				userData = await rglUserData(id);
				if (userData.registered === false || userData.data.division === null)
					userData = await etf2lUserData(id);
				break;
			}
		}

		requestQueue.splice(requestQueue.indexOf(id), 1);

		// Don't put more than 512 entries in this cache, PLEASE
		userDataCache.size < 512 && userDataCache.set(id, userData);

		port.postMessage({ user: userData });
		userDataUpdated(id, userData);
	}
}

function userDataUpdated(id, userData) {
	for (let i = 0; i < openRequests.length; i++) {
		if (openRequests[i].id === id) {
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
	const response = await fetch(url, { headers });

	if (!response.ok) return null;

	return await response.json();
}

function etf2lUserData(id) {
	return new Promise(async resolve => {
		console.log(`Getting ETF2L data for ${id}`);
		const userURL = `http://api.etf2l.org/player/${id}`;
		const resultURL = `http://api.etf2l.org/player/${id}/results/1?since=0`;

		/*
			Honestly, I don't know why I need to return resolve here...
			For some reason, without `return resolve()` I will get a runtime TypeError.
			No idea, and I really hope that's just me not understanding promises.
		*/
		const userJSON = await request(userURL);
		if (userJSON === null) return resolve({ registered: false, id });

		const resultJSON = await request(resultURL);
		if (resultJSON === null) return resolve({ registered: false, id });

		const name = userJSON.player.name;
		const etf2lID = userJSON.player.id;
		const team = getTeam(resultJSON);
		const division = getDiv(resultJSON);

		resolve({
			id: id,
			league: "etf2l",
			registered: true,
			data: { name, team, division, etf2lID }
		});
	});

	function getTeam(resultJSON) {
		if (resultJSON.results === null) return null;

		for (let i = 0; i < resultJSON.results.length; i++) {
			const clan1 = resultJSON.results[i].clan1;
			const clan2 = resultJSON.results[i].clan2;
			const category = resultJSON.results[i].competition.category;
			const tier = resultJSON.results[i].division.tier;

			if (category === "6v6 Season" && tier != null) {
				return clan1.was_in_team === 1 ? clan1.name : clan2.name;
			}
		}
	}

	function getDiv({ results }) {
		if (!results) return null;

		for (const result of results) {
			const tier = result.division.tier;
			const tierName = result.division.name;
			const competitionName = result.competition.name;
			const category = result.competition.category;
			const clan1 = result.clan1;
			const clan2 = result.clan2;

			// This if looks like aids... I know.
			if (
				tier &&
				(category.includes("6v6 Season") ||
					(category.includes("6v6 Season") && competitionName.includes("Playoffs"))) &&
				(clan1.was_in_team === 1 || clan2.was_in_team === 1)
			) {
				// :(
				if (tierName.includes("Prem")) return "etf2l_prem";
				if (tierName.includes("Division 1")) return "etf2l_div1";
				if (tierName.includes("High")) return "etf2l_div1";
				if (tierName.includes("Division 2")) return "etf2l_div2";
				if (tierName.includes("Division 3")) return "etf2l_div3";
				if (tierName.includes("Mid")) return "etf2l_mid";
				if (tierName.includes("Low")) return "etf2l_low";
				if (tierName.includes("Open")) return "etf2l_open";
				return null;
			}
		}
	}
}

function rglUserData(id) {
	return new Promise(async resolve => {
		console.log(`Getting RGL data for ${id}`);

		const apiUrl = `https://rgl.payload.tf/api/v1/profiles/${id}/experience?formats=sixes&disableCache=true`;
		const req = await fetch(apiUrl);

		if (!req.ok) return resolve({ id, registered: false });

		const { data: userJSON } = await req.json();
		const name = userJSON.name;
		const division = getDiv(userJSON);

		resolve({
			id: id,
			league: "rgl",
			registered: true,
			data: { name, division }
		});
	});

	function getDiv(playerObj) {
		switch (playerObj?.experience?.[0]?.div) {
			case "invite":
				return "rgl_inv";
			case "div-2":
				return "rgl_adv";
			case "div-1":
				return "rgl_adv";
			case "advanced":
				return "rgl_adv";
			case "main":
				return "rgl_main";
			case "intermediate":
				return "rgl_im";
			case "open":
				return "rgl_open";
			case "newcomer":
				return "rgl_new";
			default:
				return null;
		}
	}
}
