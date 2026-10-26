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
   2. APP STATE
   ========================================================= */
const state = {
    channels: [],
    currentCategory: "All",
    currentCountry: "all",
    searchQuery: "",
    sortBy: "default",
    player: { id: "", name: "", logo: "", url: "", hls: null },
    chat: { interval: null, viewerCount: 0 }
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
    btnChat: document.getElementById("btnChat")
};

/* =========================================================
   4. SIDE DRAWER (3-DOT MENU) LOGIC
   ========================================================= */
const drawer = document.getElementById("sideDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");

if (document.getElementById("openDrawer")) {
    document.getElementById("openDrawer").addEventListener("click", () => {
        drawer.classList.add("open");
        drawerOverlay.classList.add("show");
    });
}

function closeDrawer() {
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("show");
}

if (document.getElementById("closeDrawer")) {
    document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);
}

// Search & Filters Syncing
const drawerSearch = document.getElementById("drawerSearch");
const mainSearch = document.getElementById("mainSearch");

if (drawerSearch && mainSearch) {
    drawerSearch.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        mainSearch.value = state.searchQuery;
        renderGrid();
    });
    mainSearch.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        drawerSearch.value = state.searchQuery;
        renderGrid();
    });
}

if (document.getElementById("drawerSort")) {
    document.getElementById("drawerSort").addEventListener("change", (e) => { state.sortBy = e.target.value; renderGrid(); });
    document.getElementById("drawerCountry").addEventListener("change", (e) => { state.currentCountry = e.target.value; renderGrid(); closeDrawer(); });
    document.getElementById("drawerCategory").addEventListener("change", (e) => { state.currentCategory = e.target.value; renderGrid(); closeDrawer(); });
}

/* =========================================================
   5. PAKISTANI & DISNEY CHANNELS (FIXED HTTPS LINKS)
   ========================================================= */
async function loadChannels() {
    try {
        // Yahan saare Pakistani aur Disney channels ki list hai (HTTPS links ke sath)
        const customChannels = [
            // --- PAKISTANI CHANNELS ---
            { 
                id: "geo_news", 
                name: "Geo News", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/2/2e/Geo_News_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/geonews/playlist.m3u8" }] 
            },
            { 
                id: "ary_digital", 
                name: "ARY Digital", 
                country: "PK", 
                categories: ["entertainment"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/5/5e/ARY_Digital_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/arydigital/playlist.m3u8" }] 
            },
            { 
                id: "hum_tv", 
                name: "Hum TV", 
                country: "PK", 
                categories: ["entertainment"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/3/3c/Hum_TV_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/humtv/playlist.m3u8" }] 
            },
            { 
                id: "dunya_news", 
                name: "Dunya News", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/3/3c/Dunya_News_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/dunyanews/playlist.m3u8" }] 
            },
            { 
                id: "samaa_tv", 
                name: "Samaa TV", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/1/1c/Samaa_TV_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/samaatv/playlist.m3u8" }] 
            },
            { 
                id: "ary_news", 
                name: "ARY News", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/8/8b/ARY_News_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/arynews/playlist.m3u8" }] 
            },
            { 
                id: "express_news", 
                name: "Express News", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/8/8b/Express_News_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/express/playlist.m3u8" }] 
            },
            { 
                id: "aaj_news", 
                name: "Aaj News", 
                country: "PK", 
                categories: ["news"], 
                logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Aaj_News_Logo.png", 
                streams: [{ url: "https://jk3lz9n2.rocketcdn.me/aajnews/playlist.m3u8" }] 
            },

            // --- DISNEY CHANNELS ---
            { 
                id: "disney_channel", 
                name: "Disney Channel", 
                country: "US", 
                categories: ["kids"], 
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Disney_Channel_logo_%282014%29.svg/512px-Disney_Channel_logo_%282014%29.svg.png", 
                streams: [{ url: "https://streaming.disney.com/disney/index.m3u8" }] // Updated to a secure link
            },
            { 
                id: "disney_jr", 
                name: "Disney Junior", 
                country: "US", 
                categories: ["kids"], 
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Disney_Junior_Logo.svg/512px-Disney_Junior_Logo.svg.png", 
                streams: [{ url: "https://streaming.disney.com/disneyjr/index.m3u8" }] 
            }
        ];

        state.channels = customChannels;

        renderTrending();
        renderGrid();

    } catch (e) {
        DOM.grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                <h2 style="font-size:4rem; margin-bottom:10px; opacity:0.5;">📡</h2>
                <h3 style="font-size:1.5rem; color:#fff;">Server Offline</h3>
                <p style="margin-top:10px;">Could not connect to HF X TV Network.<br>Please check your internet connection.</p>
            </div>`;
    }
}

/* =========================================================
   6. RENDER FUNCTIONS
   ========================================================= */
function renderTrending() {
    DOM.trendingScroll.innerHTML = "";
    let list = state.channels.slice(0, 5);
    list.forEach(ch => {
        const card = document.createElement("div");
        card.className = "trending-card";
        const logo = ch.logo ? `<img src="${ch.logo}" class="trending-thumb" onerror="this.style.display='none'">` : `<div class="trending-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">📺</div>`;
        card.innerHTML = `${logo}<div class="trending-name">${ch.name}</div>`;
        card.onclick = () => playChannel(ch);
        DOM.trendingScroll.appendChild(card);
    });
}

function renderGrid() {
    let list = [...state.channels];

    if (state.currentCategory !== "All") list = list.filter(c => c.categories.includes(state.currentCategory));
    if (state.currentCountry !== "all") list = list.filter(c => c.country === state.currentCountry);
    if (state.searchQuery) list = list.filter(c => c.name.toLowerCase().includes(state.searchQuery.toLowerCase()));

    if (state.sortBy === "asc") list.sort((a,b) => a.name.localeCompare(b.name));
    else if (state.sortBy === "desc") list.sort((a,b) => b.name.localeCompare(a.name));

    DOM.grid.innerHTML = "";
    
    if(list.length === 0) {
        DOM.grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">No channels found.</div>`;
        return;
    }

    list.forEach(ch => {
        const card = document.createElement("div");
        card.className = "channel-card";
        
        // Lock Icon Logic
        let lockIcon = "";
        if (ch.status === "unlocked") lockIcon = `<div class="status-icon unlocked">🔓</div>`;
        else if (ch.status === "locked") lockIcon = `<div class="status-icon locked">🔒</div>`;

        const logo = ch.logo ? `<img src="${ch.logo}" class="channel-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : `<div class="channel-logo-fallback" style="display:flex; background:var(--primary);">${ch.name.charAt(0)}</div>`;
        
        card.innerHTML = `${lockIcon}${logo}<div class="channel-name">${ch.name}</div>`;
        card.onclick = () => playChannel(ch);
        DOM.grid.appendChild(card);
    });
}

/* =========================================================
   7. PLAYER LOGIC & LOCKS
   ========================================================= */
function playChannel(ch) {
    if(state.player.hls) state.player.hls.destroy();
    
    state.player = { id: ch.id, name: ch.name, logo: ch.logo, url: ch.streams[0].url, hls: null };
    
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
            ch.status = "unlocked";
            renderGrid(); 
        });

        state.player.hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                DOM.overlay.classList.remove("loading");
                DOM.placeholder.classList.remove("hide");
                DOM.placeholderTitle.textContent = "Stream Offline";
                DOM.placeholderSubtitle.textContent = "This channel is currently not available.";
                ch.status = "locked";
                renderGrid();
            }
        });
    } else {
        DOM.player.src = ch.streams[0].url;
        DOM.player.addEventListener('loadedmetadata', () => {
            DOM.overlay.classList.remove("loading");
            DOM.player.play();
            ch.status = "unlocked";
            renderGrid();
        });
        DOM.player.addEventListener('error', () => {
            DOM.overlay.classList.remove("loading");
            ch.status = "locked";
            renderGrid();
        });
    }
}

if(document.getElementById("btnStop")) {
    document.getElementById("btnStop").onclick = () => {
        if(state.player.hls) state.player.hls.destroy();
        DOM.player.pause();
        DOM.player.removeAttribute("src");
        DOM.player.load();
        DOM.placeholder.classList.remove("hide");
        if(state.player.name) {
            DOM.placeholderLogo.src = state.player.logo || "https://files.catbox.moe/1txg48.jpg";
            DOM.placeholderTitle.textContent = state.player.name;
            DOM.placeholderSubtitle.textContent = "Stream Stopped.";
        }
        DOM.nowPlaying.textContent = "No channel selected";
    };
}

if(document.getElementById("btnMute")) {
    document.getElementById("btnMute").onclick = (e) => {
        DOM.player.muted = !DOM.player.muted;
        e.currentTarget.innerHTML = DOM.player.muted ? '🔇 Unmute' : '🔊 Mute';
    };
}

if(document.getElementById("btnReload")) {
    document.getElementById("btnReload").onclick = () => {
        if(state.player.url) DOM.player.play();
    };
}

/* =========================================================
   8. LIVE CHAT
   ========================================================= */
if(DOM.btnChat) {
    DOM.btnChat.onclick = () => {
        DOM.chatDrawer.classList.toggle("show");
        if(DOM.chatDrawer.classList.contains("show") && !state.chat.interval) {
            startChat();
        } else if(!DOM.chatDrawer.classList.contains("show")) {
            clearInterval(state.chat.interval);
            state.chat.interval = null;
        }
    };
}
if(document.getElementById("closeChat")) {
    document.getElementById("closeChat").onclick = DOM.btnChat.onclick;
}

function startChat() {
    DOM.chatMessages.innerHTML = "";
    const msgs = ["Mashallah ❤️", "Love from PK 🇵🇰", "Nice quality", "Kya baat hai!", "Salam sab ko 👋"];
    state.chat.interval = setInterval(() => {
        const msg = document.createElement("div");
        msg.className = "chat-msg other";
        msg.innerHTML = `<div class="chat-bubble">${msgs[Math.floor(Math.random()*msgs.length)]}</div>`;
        DOM.chatMessages.appendChild(msg);
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }, 3000);
}

if(DOM.chatSend) {
    DOM.chatSend.onclick = () => {
        const txt = DOM.chatInput.value.trim();
        if(!txt) return;
        const msg = document.createElement("div");
        msg.className = "chat-msg user";
        msg.innerHTML = `<div class="chat-bubble">${txt}</div>`;
        DOM.chatMessages.appendChild(msg);
        DOM.chatInput.value = "";
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    };
}

/* =========================================================
   9. AUTHENTICATION & VIBRATION
   ========================================================= */
let usersDB = JSON.parse(localStorage.getItem("hfxtv_users")) || [];
let loggedInUser = localStorage.getItem("hfxtv_logged");

if(loggedInUser) {
    DOM.authOverlay.classList.add("hide");
    document.getElementById("profileMenu").style.display = "flex";
    document.getElementById("profileEmail").textContent = loggedInUser;
    document.getElementById("profileAvatar").textContent = loggedInUser.charAt(0).toUpperCase();
}

if(document.getElementById("goToLogin")) {
    document.getElementById("goToLogin").addEventListener("click", () => {
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    });
}

if(document.getElementById("goToSignup")) {
    document.getElementById("goToSignup").addEventListener("click", () => {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signupForm").style.display = "block";
    });
}

if(document.getElementById("btnSignup")) {
    document.getElementById("btnSignup").addEventListener("click", () => {
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const pass = document.getElementById("signupPass").value.trim();

        if(!name || !email || !pass) return alert("Please fill all fields.");
        if(usersDB.find(u => u.email === email)) return alert("Email already registered.");

        usersDB.push({ name, email, pass });
        localStorage.setItem("hfxtv_users", JSON.stringify(usersDB));
        alert("Account created! Please login.");
        
        document.getElementById("loginEmail").value = email;
        document.getElementById("goToLogin").click();
    });
}

if(document.getElementById("btnLogin")) {
    document.getElementById("btnLogin").addEventListener("click", () => {
        const email = document.getElementById("loginEmail").value.trim();
        const pass = document.getElementById("loginPass").value.trim();

        if(!email || !pass) return alert("Please fill all fields.");

        const user = usersDB.find(u => u.email === email && u.pass === pass);
        
        if(user) {
            localStorage.setItem("hfxtv_logged", email);
            DOM.authOverlay.classList.add("hide");
            document.getElementById("profileMenu").style.display = "flex";
            document.getElementById("profileEmail").textContent = email;
            document.getElementById("profileAvatar").textContent = email.charAt(0).toUpperCase();
        } else {
            // 🔴 VIBRATION ON WRONG PASSWORD 🔴
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            alert("Invalid Email or Password.");
        }
    });
}

if(document.getElementById("profileMenu")) {
    document.getElementById("profileMenu").onclick = () => document.getElementById("profileDropdown").classList.toggle("show");
}
if(document.getElementById("btnLogout")) {
    document.getElementById("btnLogout").onclick = () => { 
        localStorage.removeItem("hfxtv_logged"); 
        location.reload(); 
    };
}

/* =========================================================
   10. INIT APP
   ========================================================= */
loadChannels();
