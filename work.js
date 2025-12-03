const API_KEY = "YOUR_API_KEY_HERE";

const symbols = [
    { symbol: "NVDA", zone: "America/New_York", enabled: true, lastData: null },
    { symbol: "GOOGL", zone: "America/New_York", enabled: true, lastData: null },
    { symbol: "LMT", zone: "America/New_York", enabled: true, lastData: null },
    { symbol: "BLK", zone: "America/New_York", enabled: true, lastData: null },
    { symbol: "JPM", zone: "America/New_York", enabled: true, lastData: null }
];


// ---------------- API FETCH ----------------
async function fetchEquity(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data["Global Quote"] || null;
}

// ---------------- TIME ----------------
function getLocalTime(timeZone) {
    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: timeZone
    }).format(new Date());
}

// ---------------- TOGGLE ----------------
function toggleStock(index) {
    symbols[index].enabled = !symbols[index].enabled;

    const btn = document.getElementById(`toggle-${index}`);
    btn.innerText = symbols[index].enabled ? "ON" : "OFF";
    btn.style.background = symbols[index].enabled ? "#00c853" : "#b71c1c";
}

// ---------------- ROW RENDER ----------------
function renderRow(item, index) {
    const time = getLocalTime(item.zone);
    const data = item.lastData;

    const price = parseFloat(data?.["05. price"]);
    const open = parseFloat(data?.["02. open"]);
    const close = parseFloat(data?.["08. previous close"]);

    const high = data?.["03. high"] || "N/A";
    const low = data?.["04. low"] || "N/A";
    const change = data?.["10. change percent"] || "N/A";
    const divYield = data?.["08. dividend yield"] || "N/A";

    // PRICE COLOR
    let priceColor = "#ffffff";
    if (!isNaN(price) && !isNaN(open)) priceColor = price >= open ? "#00e676" : "#ff1744";

    // TREND
    let trendText = "N/A";
    let trendColor = "#ffffff";
    if (!isNaN(price) && !isNaN(open)) {
        if (price > open) { trendText = "Bullish"; trendColor = "#00e676"; }
        else if (price < open) { trendText = "Bearish"; trendColor = "#ff1744"; }
        else trendText = "Neutral";
    }

    // TRADINGVIEW LINK
    // If symbol ends with .NS (for NSE), replace . with %2E for URL
    let tvSymbol = item.symbol.replace(".", "%2E");
    let graphURL = `https://www.tradingview.com/symbols/${tvSymbol}/`;

    return `
    <tr>
        <td>
            ${item.symbol}<br>
            <small id="time-${index}">${time} (${item.zone})</small><br>
            <button 
                id="toggle-${index}"
                onclick="toggleStock(${index})"
                style="margin-top:6px;padding:4px 10px;border:none;color:white;
                background:${item.enabled ? "#00c853" : "#b71c1c"};cursor:pointer;">
                ${item.enabled ? "ON" : "OFF"}
            </button>
        </td>
        <td style="color:${priceColor}; font-weight:bold;">${price || "N/A"}</td>
        <td>${open || "N/A"}</td>
        <td>${close || "N/A"}</td>
        <td style="color:${trendColor}; font-weight:bold;">${trendText}</td>
        <td>${high}</td>
        <td>${low}</td>
        <td>${divYield}</td>
        <td><a href="${graphURL}" target="_blank">View</a></td>
    </tr>`;
}

// ---------------- LOAD DATA ----------------
async function loadData(fetchIfClosed=false) {
    const table = document.getElementById("stock-table");
    table.innerHTML = "";

    for (let i = 0; i < symbols.length; i++) {
        const item = symbols[i];

        // FETCH LOGIC
        if (item.enabled || fetchIfClosed) {
            const result = await fetchEquity(item.symbol);
            if (result) item.lastData = result;
        }

        table.innerHTML += renderRow(item, i);
    }
}

// ---------------- TICKING CLOCK ----------------
function tickClocks() {
    for (let i = 0; i < symbols.length; i++) {
        const timeEl = document.getElementById(`time-${i}`);
        if (timeEl) {
            timeEl.innerText = `${getLocalTime(symbols[i].zone)} (${symbols[i].zone})`;
        }
    }
}
setInterval(tickClocks, 1000);

// ---------------- MARKET STATUS ----------------
function isMarketOpen() {
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= 13 && hour <= 20; // US market 13:00-20:00 UTC
}

function marketStatus() {
    document.getElementById("market-status").innerText =
        "Market (US): " + (isMarketOpen() ? "OPEN" : "CLOSED");
}

// ---------------- INITIAL LOAD ----------------
marketStatus();
loadData(fetchIfClosed = !isMarketOpen());

// ---------------- AUTO REFRESH ----------------
setInterval(() => {
    marketStatus();
    loadData();
}, 60000);
