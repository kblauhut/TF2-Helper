chrome.runtime.onInstalled.addListener(async () => await loadSettings());

async function loadSettings() {
	const res = await fetch(chrome.extension.getURL("/res/cfg/config.json"));
	const { colors, querystrings, settings } = await res.json();

	chrome.storage.sync.set({
		colors: colors,
		querystrings: querystrings,
		settings: settings
	});
}
