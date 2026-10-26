/* =========================================================
   1. THEME (DARK/LIGHT MODE) TOGGLE
   ========================================================= */
const themeToggleBtn = document.getElementById("themeToggle");
const htmlTag = document.documentElement;
let currentTheme = localStorage.getItem("hfxtv_theme") || "dark";

htmlTag.setAttribute("data-theme", currentTheme);
if(themeToggleBtn) themeToggleBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";

if(themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        htmlTag.setAttribute("data-theme", currentTheme);
        themeToggleBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
        localStorage.setItem("hfxtv_theme", currentTheme);
    });
}

/* =========================================================
   2. APP STATE (GLOBAL VARIABLES)
   ========================================================= */
const state = {
    allChannels: [],       // Saare 10,000+ channels yahan save honge
    filteredChannels: [],  // Jo channels filter ke baad screen par aayenge
    currentCategory: "All",
    currentCountry: "all",
    searchQuery: "",
    sortBy: "default",
    player: { id: "", name: "", logo: "", url: "", hls: null },
    chat: { interval: null, viewerCount: 0 },
    itemsPerPage: 100,     // Ek baar mein 100 channels dikhayenge taake fast chale
    currentPage: 1
};

/* =========================================================
   3. DOM ELEMENTS
   ========================================================= */
const DOM = {
    grid: document.getElementById("channelGrid"),
    trendingScroll: document.getElementById("trendingScroll"),
    player: document.getElementById("videoPlayer"),
    placeholder: document.getElementById("playerPlaceholder"),
    placeholderLogo: document.getElementById("placeholderLogo"),
    placeholderTitle: document.getElementById("placeholderTitle"),
    placeholderSubtitle: document.getElementById("placeholderSubtitle"),
    overlay: document.getElementById("playerOverlay"),
    nowPlaying: document.getElementById("nowPlaying"),
    authOverlay: document.getElementById("authOverlay"),
    chatDrawer: document.getElementById("chatDrawer"),
    chatMessages: document.getElementById("chatMessages"),
    chatInput: document.getElementById("chatInput"),
    chatSend: document.getElementById("chatSend"),
    btnChat: document.getElementById("btnChat"),
    drawer: document.getElementById("sideDrawer"),
    drawerOverlay: document.getElementById("drawerOverlay")
};

/* =========================================================
   4. SIDE DRAWER (3-DOT MENU) LOGIC
   ========================================================= */
if (document.getElementById("openDrawer")) {
    document.getElementById("openDrawer").addEventListener("click", () => {
        DOM.drawer.classList.add("open");
        DOM.drawerOverlay.classList.add("show");
    });
}

function closeDrawer() {
    DOM.drawer.classList.remove("open");
    DOM.drawerOverlay.classList.remove("show");
}

if (document.getElementById("closeDrawer")) {
    document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
    DOM.drawerOverlay.addEventListener("click", closeDrawer);
}

// Search Syncing (Drawer aur Main Header dono se search ho sake)
const drawerSearch = document.getElementById("drawerSearch");
const mainSearch = document.getElementById("mainSearch");

if (drawerSearch && mainSearch) {
    drawerSearch.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        mainSearch.value = state.searchQuery;
        applyFilters();
    });
    mainSearch.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        drawerSearch.value = state.searchQuery;
        applyFilters();
    });
}

// Filter Syncing (Sort, Country, Category)
if (document.getElementById("drawerSort")) {
    document.getElementById("drawerSort").addEventListener("change", (e) => { 
        state.sortBy = e.target.value; 
        applyFilters(); 
    });
    document.getElementById("drawerCountry").addEventListener("change", (e) => { 
        state.currentCountry = e.target.value; 
        applyFilters(); 
        closeDrawer(); 
    });
    document.getElementById("drawerCategory").addEventListener("change", (e) => { 
        state.currentCategory = e.target.value; 
        applyFilters(); 
        closeDrawer(); 
    });
}

/* =========================================================
   5. M3U PARSER FUNCTION (Reads the big file)
   ========================================================= */
function parseM3U(m3uContent) {
    const lines = m3uContent.split(/\r?\n/);
    const channels = [];
    let currentChannel = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Extract Channel Name (Text after the last comma)
            const commaIndex = line.lastIndexOf(',');
            const name = commaIndex > -1 ? line.substring(commaIndex + 1).trim() : 'Unknown Channel';
            
            // Extract Logo (tvg-logo="...")
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const logo = logoMatch ? logoMatch[1] : '';
            
            // Extract Category (group-title="...")
            const groupMatch = line.match(/group-title="([^"]*)"/);
            let category = groupMatch && groupMatch[1] ? groupMatch[1].toLowerCase().trim() : 'general';
            
            // Extract Country (tvg-country="...")
            const countryMatch = line.match(/tvg-country="([^"]*)"/);
            let country = countryMatch && countryMatch[1] ? countryMatch[1].toUpperCase().trim() : '';

            currentChannel = {
                id: name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 7),
                name: name,
                logo: logo,
                categories: [category],
                country: country,
                streams: [],
                status: 'unknown'
            };
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
            if (currentChannel) {
                currentChannel.streams.push({ url: line });
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
    }
    return channels;
}

/* =========================================================
   6. LOAD CHANNELS (Fetching from your M3U link)
   ========================================================= */
async function loadChannels() {
    const M3U_URL = "https://iptv-org.github.io/iptv/index.m3u";
    
    // Show loading screen
    DOM.grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--primary);">
            <h2 style="font-size:2rem; margin-bottom:10px;">⏳</h2>
            <h3>Loading All Channels...</h3>
            <p style="color:var(--text-muted); font-size:0.9rem;">Please wait, downloading 10,000+ channels from server...</p>
        </div>`;

    try {
        const response = await fetch(M3U_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const m3uText = await response.text();
        const parsedChannels = parseM3U(m3uText);

        if (parsedChannels.length === 0) throw new Error("No channels parsed");

        // Save all channels to state
        state.allChannels = parsedChannels;
        
        // Populate the dropdowns with all available countries and categories
        updateDropdowns(parsedChannels);
        
        // Show them on screen
        applyFilters();
        renderTrending();

    } catch (e) {
        console.error(e);
        DOM.grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                <h2 style="font-size:4rem; margin-bottom:10px; opacity:0.5;">📡</h2>
                <h3 style="font-size:1.5rem; color:#fff;">Failed to load channels</h3>
                <p style="margin-top:10px;">Server is not responding or internet issue.</p>
                <button onclick="loadChannels()" style="margin-top:20px; padding:10px 20px; background:var(--primary); border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Try Again</button>
            </div>`;
    }
}

/* =========================================================
   7. DYNAMIC DROPDOWNS (Country & Category)
   ========================================================= */
function updateDropdowns(channels) {
    const dCountry = document.getElementById("drawerCountry");
    const dCategory = document.getElementById("drawerCategory");
    if (!dCountry || !dCategory) return;

    // Extract unique countries and categories
    const countries = [...new Set(channels.map(c => c.country).filter(Boolean))].sort();
    const categories = [...new Set(channels.flatMap(c => c.categories).filter(Boolean))].sort();

    // Add Countries
    dCountry.innerHTML = '<option value="all">🌍 All Countries</option>';
    const flags = { 'PK': '🇵🇰', 'IN': '🇮🇳', 'US': '🇺🇸', 'UK': '🇬🇧', 'SA': '🇸🇦', 'AE': '🇦🇪', 'CA': '🇨🇦', 'AU': '🇦🇺' };
    countries.forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = `${flags[code] || '🌐'} ${code}`;
        dCountry.appendChild(opt);
    });

    // Add Categories
    dCategory.innerHTML = '<option value="All">All Categories</option>';
    categories.forEach(cat => {
        // Capitalize first letter of category
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = catName;
        dCategory.appendChild(opt);
    });
}

/* =========================================================
   8. FILTERING & RENDERING (With Load More Logic)
   ========================================================= */
function applyFilters() {
    let list = [...state.allChannels];

    // 1. Filter by Category
    if (state.currentCategory !== "All") {
        list = list.filter(c => c.categories.includes(state.currentCategory));
    }
    // 2. Filter by Country
    if (state.currentCountry !== "all") {
        list = list.filter(c => c.country === state.currentCountry);
    }
    // 3. Filter by Search Query
    if (state.searchQuery) {
        list = list.filter(c => c.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
    }

    // 4. Sorting
    if (state.sortBy === "asc") list.sort((a,b) => a.name.localeCompare(b.name));
    else if (state.sortBy === "desc") list.sort((a,b) => b.name.localeCompare(a.name));

    state.filteredChannels = list;
    state.currentPage = 1; // Reset to page 1 whenever a filter is applied
    renderGrid();
}

function renderGrid() {
    DOM.grid.innerHTML = "";
    
    if (state.filteredChannels.length === 0) {
        DOM.grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">No channels found.</div>`;
        return;
    }

    // Calculate which items to show (Pagination)
    const endIndex = state.currentPage * state.itemsPerPage;
    const itemsToRender = state.filteredChannels.slice(0, endIndex);

    itemsToRender.forEach(ch => {
        const card = document.createElement("div");
        card.className = "channel-card";
        
        // Lock/Unlock Icon Logic
        let lockIcon = "";
        if (ch.status === "unlocked") lockIcon = `<div class="status-icon unlocked">🔓</div>`;
        else if (ch.status === "locked") lockIcon = `<div class="status-icon locked">🔒</div>`;

        // Fallback for broken logos
        const logo = ch.logo ? `<img src="${ch.logo}" class="channel-logo" onload="this.style.display='block'" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : `<div class="channel-logo-fallback" style="display:flex; background:var(--primary);">${ch.name.charAt(0)}</div>`;
        
        card.innerHTML = `${lockIcon}${logo}<div class="channel-name">${ch.name}</div>`;
        card.onclick = () => playChannel(ch);
        DOM.grid.appendChild(card);
    });

    // Add "Load More" button if there are more channels left
    if (endIndex < state.filteredChannels.length) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "tool-btn";
        loadMoreBtn.style.gridColumn = "1/-1";
        loadMoreBtn.style.margin = "20px auto";
        loadMoreBtn.style.padding = "12px 30px";
        loadMoreBtn.style.width = "fit-content";
        loadMoreBtn.style.fontSize = "1rem";
        loadMoreBtn.textContent = `Load More Channels (${state.filteredChannels.length - endIndex} remaining)`;
        loadMoreBtn.onclick = () => {
            state.currentPage++;
            renderGrid();
        };
        DOM.grid.appendChild(loadMoreBtn);
    }
}

function renderTrending() {
    DOM.trendingScroll.innerHTML = "";
    // Pick 5 random channels that have a logo to show in trending
    let list = state.allChannels.filter(c => c.logo).sort(() => 0.5 - Math.random()).slice(0, 5);
    
    list.forEach(ch => {
        const card = document.createElement("div");
        card.className = "trending-card";
        card.innerHTML = `<img src="${ch.logo}" class="trending-thumb" onerror="this.style.display='none'"><div class="trending-name">${ch.name}</div>`;
        card.onclick = () => playChannel(ch);
        DOM.trendingScroll.appendChild(card);
    });
}

/* =========================================================
   9. PLAYER LOGIC & LOCKS
   ========================================================= */
function playChannel(ch) {
    if(state.player.hls) state.player.hls.destroy();
    
    state.player = { id: ch.id, name: ch.name, logo: ch.logo, url: ch.streams[0].url, hls: null, channelRef: ch };
    
    DOM.placeholder.classList.add("hide");
    DOM.nowPlaying.innerHTML = `Playing: <b>${ch.name}</b>`;
    DOM.overlay.classList.add("loading");

    if (Hls.isSupported()) {
        state.player.hls = new Hls();
        state.player.hls.loadSource(ch.streams[0].url);
        state.player.hls.attachMedia(DOM.player);
        
        state.player.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            DOM.overlay.classList.remove("loading");
            DOM.player.play();
            ch.status = "unlocked"; // Mark as working
        });

        state.player.hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                DOM.overlay.classList.remove("loading");
                DOM.placeholder.classList.remove("hide");
                DOM.placeholderTitle.textContent = "Stream Offline";
                DOM.placeholderSubtitle.textContent = "This channel is currently not available.";
                ch.status = "locked"; // Mark as broken
            }
        });
    } else {
        DOM.player.src = ch.streams[0].url;
        DOM.player.addEventListener('loadedmetadata', () => {
            DOM.overlay.classList.remove("loading");
            DOM.player.play();
            ch.status = "unlocked";
        });
        DOM.player.addEventListener('error', () => {
            DOM.overlay.classList.remove("loading");
            ch.status = "locked";
        });
    }
}

/* =========================================================
   10. CONTROLS & CHAT & AUTH 
   ========================================================= */
if(document.getElementById("btnStop")) document.getElementById("btnStop").onclick = () => {
    if(state.player.hls) state.player.hls.destroy();
    DOM.player.pause(); DOM.player.removeAttribute("src"); DOM.player.load();
    DOM.placeholder.classList.remove("hide");
    if(state.player.name) {
        DOM.placeholderLogo.src = state.player.logo || "https://files.catbox.moe/1txg48.jpg";
        DOM.placeholderTitle.textContent = state.player.name;
        DOM.placeholderSubtitle.textContent = "Stream Stopped.";
    }
    DOM.nowPlaying.textContent = "No channel selected";
};

if(document.getElementById("btnMute")) document.getElementById("btnMute").onclick = (e) => {
    DOM.player.muted = !DOM.player.muted;
    e.currentTarget.innerHTML = DOM.player.muted ? '🔇 Unmute' : '🔊 Mute';
};

if(document.getElementById("btnReload")) document.getElementById("btnReload").onclick = () => {
    if(state.player.url) DOM.player.play();
};

if(DOM.btnChat) DOM.btnChat.onclick = () => {
    DOM.chatDrawer.classList.toggle("show");
    if(DOM.chatDrawer.classList.contains("show") && !state.chat.interval) startChat();
    else if(!DOM.chatDrawer.classList.contains("show")) { clearInterval(state.chat.interval); state.chat.interval = null; }
};
if(document.getElementById("closeChat")) document.getElementById("closeChat").onclick = DOM.btnChat.onclick;

function startChat() {
    DOM.chatMessages.innerHTML = "";
    const msgs = ["Mashallah ❤️", "Love from PK 🇵🇰", "Nice quality", "Kya baat hai!", "Salam sab ko 👋"];
    state.chat.interval = setInterval(() => {
        const msg = document.createElement("div"); msg.className = "chat-msg other";
        msg.innerHTML = `<div class="chat-bubble">${msgs[Math.floor(Math.random()*msgs.length)]}</div>`;
        DOM.chatMessages.appendChild(msg); DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }, 3000);
}
if(DOM.chatSend) DOM.chatSend.onclick = () => {
    const txt = DOM.chatInput.value.trim(); if(!txt) return;
    const msg = document.createElement("div"); msg.className = "chat-msg user";
    msg.innerHTML = `<div class="chat-bubble">${txt}</div>`;
    DOM.chatMessages.appendChild(msg); DOM.chatInput.value = ""; DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
};

// Auth & Vibration
let usersDB = JSON.parse(localStorage.getItem("hfxtv_users")) || [];
let loggedInUser = localStorage.getItem("hfxtv_logged");
if(loggedInUser) {
    DOM.authOverlay.classList.add("hide");
    document.getElementById("profileMenu").style.display = "flex";
    document.getElementById("profileEmail").textContent = loggedInUser;
    document.getElementById("profileAvatar").textContent = loggedInUser.charAt(0).toUpperCase();
}
if(document.getElementById("goToLogin")) document.getElementById("goToLogin").addEventListener("click", () => { document.getElementById("signupForm").style.display = "none"; document.getElementById("loginForm").style.display = "block"; });
if(document.getElementById("goToSignup")) document.getElementById("goToSignup").addEventListener("click", () => { document.getElementById("loginForm").style.display = "none"; document.getElementById("signupForm").style.display = "block"; });
if(document.getElementById("btnSignup")) document.getElementById("btnSignup").addEventListener("click", () => {
    const name = document.getElementById("signupName").value.trim(), email = document.getElementById("signupEmail").value.trim(), pass = document.getElementById("signupPass").value.trim();
    if(!name || !email || !pass) return alert("Please fill all fields.");
    if(usersDB.find(u => u.email === email)) return alert("Email already registered.");
    usersDB.push({ name, email, pass }); localStorage.setItem("hfxtv_users", JSON.stringify(usersDB));
    alert("Account created! Please login."); document.getElementById("loginEmail").value = email; document.getElementById("goToLogin").click();
});
if(document.getElementById("btnLogin")) document.getElementById("btnLogin").addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value.trim(), pass = document.getElementById("loginPass").value.trim();
    if(!email || !pass) return alert("Please fill all fields.");
    const user = usersDB.find(u => u.email === email && u.pass === pass);
    if(user) {
        localStorage.setItem("hfxtv_logged", email);
        DOM.authOverlay.classList.add("hide");
        document.getElementById("profileMenu").style.display = "flex";
        document.getElementById("profileEmail").textContent = email;
        document.getElementById("profileAvatar").textContent = email.charAt(0).toUpperCase();
    } else {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        alert("Invalid Email or Password.");
    }
});
if(document.getElementById("profileMenu")) document.getElementById("profileMenu").onclick = () => document.getElementById("profileDropdown").classList.toggle("show");
if(document.getElementById("btnLogout")) document.getElementById("btnLogout").onclick = () => { localStorage.removeItem("hfxtv_logged"); location.reload(); };

/* =========================================================
   11. INIT APP
   ========================================================= */
loadChannels();
