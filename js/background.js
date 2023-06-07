let tab_id;
let target_url;
let refresh_timeout;
let refresh_interval;
const refresh_menus = [];

function reloadTab(tabId) {
    chrome.tabs.executeScript(tabId, {code: 'window.location.reload();'});
}

function startRefreshUntilSuccess(info, tab) {
    stopRefreshing();

    target_url = tab.url;
    tab_id = tab.id;

    reloadTab(tab_id);
}

function startRefreshEveryX(info, tab) {
    stopRefreshing();

    const menu = refresh_menus.filter((a) => {
        return a.id === info.menuItemId;
    })[0];

    if (!menu) return;

    tab_id = tab.id;

    refresh_interval = setInterval(() => {
        reloadTab(tab_id);
    }, menu.duration * 1000);
}

function stopRefreshing(info, tab) {
    clearInterval(refresh_interval);
    clearTimeout(refresh_timeout);

    tab_id = null;
    target_url = null;
    refresh_interval = null;
    refresh_timeout = null;
}

const parent = chrome.contextMenus.create({"title": "AutoRefresh"});
chrome.contextMenus.create({"title": "Until success (HTTP 200)", "parentId": parent, "onclick": startRefreshUntilSuccess});
const parent2 = chrome.contextMenus.create({"title": "Every", "parentId": parent});
chrome.contextMenus.create({"title": "Stop", "parentId": parent, "onclick": stopRefreshing});

refresh_menus.push({id: chrome.contextMenus.create({"title": "5 seconds", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 5});
refresh_menus.push({id: chrome.contextMenus.create({"title": "30 seconds", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 30});
refresh_menus.push({id: chrome.contextMenus.create({"title": "60 seconds", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 60});
refresh_menus.push({id: chrome.contextMenus.create({"title": "5 minutes", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 5 * 60});
refresh_menus.push({id: chrome.contextMenus.create({"title": "15 minutes", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 15 * 60});
refresh_menus.push({id: chrome.contextMenus.create({"title": "60 minutes", "parentId": parent2, "onclick": startRefreshEveryX}), duration: 60 * 60});

chrome.webRequest.onCompleted.addListener((details) => {
    if (!target_url || details.url !== target_url) return;

    if (details.statusCode !== 200) {
        refresh_timeout = setTimeout(() => {
            console.log('target page didnt load properly, refresh');
            reloadTab(tab_id);
        }, 3000)
    } else {
        target_url = null;
        tab_id = null;
        console.log('target page loaded fine - bail');
    }

}, { urls: ["<all_urls>"] });