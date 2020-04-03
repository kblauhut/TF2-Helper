let colors;
let querystrings;
let settings;
let region = document.URL.substring(
    document.URL.indexOf("/") + 2,
    document.URL.indexOf("/") + 4
);

chrome.storage.sync.get(["colors", "querystrings", "settings"], function (
    result
) {
    colors = result.colors;
    settings = result.settings;
    querystrings = result.querystrings;
    let draftTables = document.getElementsByClassName(querystrings.draftTables);
    let queueTables = document.getElementsByClassName(querystrings.queueTables);
    let queue = document.getElementsByClassName(querystrings.queue);
    if (settings.divTags)
        document.addEventListener("loaded", function (event) {
            let style = document.createElement("link");
            style.rel = "stylesheet";
            style.type = "text/css";
            style.href = chrome.extension.getURL("res/css/divTag.css");
            document.head.appendChild(style);

            for (let i = 0; i < queueTables.length; i++) {
                updateTable(
                    queueTables[i].getElementsByClassName(querystrings.queuePlayerElement)
                );
                addMutationObserver(queueTables[i], "queue");
            }
            for (let j = 0; j < draftTables.length; j++) {
                updateTable(
                    draftTables[j].getElementsByClassName(querystrings.draftPlayerElement)
                );
                addMutationObserver(draftTables[j], "draft");
            }
        });
});

function addMutationObserver(target, type) {
    let config = {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true
    };
    if (type == "draft")
        config = { childList: true, attributes: true, subtree: true };

    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (type == "queue") {
                queueMutation(mutation, target);
            } else {
                draftMutation(mutation, target);
            }
        });
    });
    observer.observe(target, config);

    function queueMutation(mutation, target) {
        if (
            mutation.removedNodes[0] != undefined &&
            mutation.removedNodes[0].nodeName == "PAPER-ICON-ITEM"
        ) {
            updateTable(
                target.getElementsByClassName(querystrings.queuePlayerElement)
            );
        }
        if (
            mutation.addedNodes[1] != undefined &&
            mutation.addedNodes[1].nodeName == "PAPER-ICON-ITEM"
        ) {
            updateTable([mutation.addedNodes[1]]);
        }
    }

    function draftMutation(mutation, target) {
        if (
            mutation.addedNodes[1] != undefined &&
            mutation.addedNodes[1].nodeName == "PAPER-ICON-ITEM"
        ) {
            updateTable([mutation.addedNodes[1]]);
        }
        if (
            mutation.type == "childList" &&
            mutation.target.className == querystrings.button
        ) {
            updateTable([mutation.target.parentNode]);
        }
    }
}

function updateTable(elements) {
    let idArray = getIds(elements);
    let port = chrome.runtime.connect({ name: region });
    port.postMessage({ idArray: idArray });
    port.onMessage.addListener(function (msg) {
        for (let i = 0; i < elements.length; i++) {
            elementID = elements[i].children[1].firstElementChild
                .getAttribute("href")
                .substring(8);
            if (elementID != null && elementID != undefined) {
                if (msg.user.id == elementID) {
                    if (msg.user.registered) {
                        updateUser(
                            elements[i],
                            msg.user.data.division,
                            msg.user.data.etf2lID
                        );
                    } else {
                        updateUser(elements[i], null, null);
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
        case "ETF2L-PREM":
            tag.style.background = colors.prem;
            tag.innerText = "PREM";
            break;
        case "ETF2L-DIV1":
            tag.style.background = colors.div1;
            tag.innerText = "DIV1";
            break;
        case "ETF2L-DIV2":
            tag.style.background = colors.div2;
            tag.innerText = "DIV2";
            break;
        case "ETF2L-DIV3":
            tag.style.background = colors.div3;
            tag.innerText = "DIV3";
            break;
        case "ETF2L-MID":
            tag.style.background = colors.mid;
            tag.innerText = "MID";
            break;
        case "ETF2L-LOW":
            tag.style.background = colors.low;
            tag.innerText = "LOW";
            break;
        case "ETF2L-OPEN":
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
        case null:
            tag.style.background = colors.null;
            tag.innerText = "NEW";
            break;
    }
}

function getIds(targetTable) {
    let idArray = [];
    for (let i = 0; i < targetTable.length; i++) {
        let id = targetTable[i].children[1].firstElementChild
            .getAttribute("href")
            .substring(8);
        if (!idArray.includes(id)) {
            idArray.push(id);
        }
    }
    return idArray;
}
