(function () {
    // === НАСТРОЙКА ВИДЖЕТА ===
    const GITHUB_RAW_URL = "https://raw.githubusercontent.com/oulan1/ouAuth/refs/heads/main/users.txt";
    const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 1 месяц
    const VERSION = "v 0.6 BETA";

    // Стили виджета
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        html.ouauth-locked, html.ouauth-locked body {
            background-color: #050507 !important;
            height: 100%; min-height: 100dvh;
            overflow: hidden; overscroll-behavior-y: none;
            margin: 0; padding: 0;
        }

        .ouauth-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100dvh;
            background: rgba(10, 5, 15, 0.5);
            backdrop-filter: blur(50px) saturate(200%); -webkit-backdrop-filter: blur(50px) saturate(200%);
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif; transition: background 0.8s ease, opacity 0.5s ease;
            user-select: none; -webkit-user-select: none; touch-action: none;
            padding-bottom: env(safe-area-inset-bottom);
        }

        .ouauth-overlay.success-tint {
            background: rgba(40, 10, 70, 0.4);
            backdrop-filter: blur(60px) saturate(250%); -webkit-backdrop-filter: blur(60px) saturate(250%);
        }

        .ouauth-card {
            width: 85%; max-width: 320px; padding: 40px 30px;
            background: rgba(40, 30, 50, 0.25); border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 32px; text-align: center; color: #ffffff;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.9), inset 0 2px 10px rgba(255, 255, 255, 0.1), inset 0 -2px 10px rgba(168, 85, 247, 0.15);
            backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ouauth-card h2 {
            font-size: 32px; font-weight: 700; margin: 0 0 30px 0;
            background: linear-gradient(135deg, #ffffff, #c084fc, #8b5cf6);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            text-shadow: 0 10px 30px rgba(168, 85, 247, 0.4); letter-spacing: -1px;
        }

        .ouauth-input-group { margin-bottom: 20px; text-align: left; position: relative; }
        
        .ouauth-input-group input {
            width: 100%; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px; color: #fff; font-size: 15px;
            outline: none; box-sizing: border-box; transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .ouauth-input-group input:focus {
            background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.8); border-radius: 22px;
            box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.3), 0 10px 30px rgba(168, 85, 247, 0.2);
            transform: translateY(-2px);
        }

        .ouauth-btn {
            width: 100%; padding: 16px; margin-top: 10px;
            background: linear-gradient(135deg, rgba(168,85,247,0.8), rgba(99,102,241,0.8));
            border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; color: white; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: all 0.4s;
        }

        .ouauth-btn:hover {
            border-radius: 26px; transform: scale(1.03);
            background: linear-gradient(135deg, rgba(168,85,247,1), rgba(99,102,241,1));
            box-shadow: 0 20px 40px rgba(168, 85, 247, 0.5), inset 0 2px 4px rgba(255,255,255,0.6);
        }

        .ouauth-error { color: #ff4b4b; font-size: 13px; margin-top: 15px; display: none; font-weight: 500; }

        .ouauth-success-card {
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            color: #0f172a; padding: 35px 25px; border-radius: 32px;
            width: 85%; max-width: 320px; text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 40px 80px rgba(0, 0, 0, 0.7);
            animation: ouauthPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ouauth-success-card h3 { font-size: 22px; margin: 0 0 15px 0; font-weight: 700; color: #000; }
        .ouauth-success-card p { font-size: 15px; color: #334155; line-height: 1.5; margin: 0; }
        .ouauth-success-card span.highlight { color: #7c3aed; font-weight: 800; }

        @keyframes ouauthPop { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

        .ouauth-dynamic-island {
            position: fixed; top: 15px; left: 50%; transform: translateX(-50%);
            background: #000000; border-radius: 50px; display: flex; align-items: center; justify-content: center;
            overflow: hidden; z-index: 9999999; box-shadow: 0 15px 40px rgba(0,0,0,0.6);
            color: white; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
            animation: islandFlow 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .ouauth-island-text { opacity: 0; white-space: nowrap; animation: islandTextFade 5s ease forwards; }
        #ouAuthLoginColor { transition: color 0.5s ease, text-shadow 0.5s ease; }

        @keyframes islandFlow {
            0% { width: 15px; height: 15px; border-radius: 50%; }
            10% { width: 240px; height: 40px; border-radius: 20px; }
            85% { width: 240px; height: 40px; border-radius: 20px; }
            95% { width: 15px; height: 15px; border-radius: 50%; opacity: 1; }
            100% { width: 15px; height: 15px; border-radius: 50%; opacity: 0; }
        }
        @keyframes islandTextFade { 0%, 10% { opacity: 0; } 15%, 80% { opacity: 1; } 85%, 100% { opacity: 0; } }

        /* АДМИН ПАНЕЛЬ */
        .ouauth-admin-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100dvh;
            background: rgba(5, 5, 8, 0.85); backdrop-filter: blur(40px) saturate(150%); -webkit-backdrop-filter: blur(40px) saturate(150%);
            z-index: 10000000; font-family: 'JetBrains Mono', monospace; color: #fff;
            opacity: 0; transition: opacity 0.4s ease; display: none; padding: 30px; box-sizing: border-box;
        }
        .ouauth-admin-overlay.active { display: block; opacity: 1; }
        
        .ouadmin-top-left { position: absolute; top: 30px; left: 30px; font-size: 14px; line-height: 1.8; color: #a1a1aa; }
        .ouadmin-top-left span { color: #d8b4fe; font-weight: bold; text-shadow: 0 0 10px rgba(216, 180, 254, 0.5); }
        
        .ouadmin-bottom-left { position: absolute; bottom: 30px; left: 30px; font-size: 13px; color: #71717a; }
        .ouadmin-bottom-left div { margin-bottom: 8px; }

        .ouadmin-bottom-right { position: absolute; bottom: 30px; right: 30px; text-align: right; }
        .ouadmin-version { font-size: 13px; color: #71717a; margin-bottom: 18px; }
        
        .ouadmin-logout-btn {
            background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.3);
            color: #fca5a5; padding: 14px 24px; border-radius: 20px; cursor: pointer;
            font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; transition: all 0.4s;
        }
        .ouadmin-logout-btn:hover {
            background: rgba(220, 38, 38, 0.3); border-radius: 28px; color: #fff; transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
        }

        .ouadmin-close {
            position: absolute; top: 30px; right: 30px; width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.4s;
        }
        .ouadmin-close::before, .ouadmin-close::after { content: ''; position: absolute; width: 18px; height: 2px; background: #fff; border-radius: 2px; }
        .ouadmin-close::before { transform: rotate(45deg); } .ouadmin-close::after { transform: rotate(-45deg); }
        .ouadmin-close:hover { background: rgba(168, 85, 247, 0.3); border-color: rgba(168, 85, 247, 0.6); border-radius: 14px; transform: rotate(90deg) scale(1.1); }

        @media (max-width: 600px) {
            .ouauth-admin-overlay { padding: 20px; }
            .ouadmin-top-left { top: 20px; left: 20px; font-size: 13px; }
            .ouadmin-close { top: 20px; right: 20px; width: 38px; height: 38px; }
            .ouadmin-bottom-left { bottom: 100px; left: 20px; right: 20px; font-size: 12px; }
            .ouadmin-bottom-right { bottom: 20px; left: 20px; right: 20px; text-align: center; }
            .ouadmin-logout-btn { width: 100%; padding: 16px; }
            .ouadmin-version { margin-bottom: 12px; }
        }
    `;

    // Инъекция стилей происходит сразу
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Вспомогательные методы
    function decodeBase64(str) { try { return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch(e) { return atob(str); } }
    function generateSessionKey() { return 'ou-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); }
    function updateBatteryColor(el, battery) { const hue = Math.floor(battery.level * 120); el.style.color = `hsl(${hue}, 100%, 65%)`; el.style.textShadow = `0 0 12px hsl(${hue}, 100%, 40%)`; }

    function getFlagEmoji(countryCode) {
        if (!countryCode) return "🌐";
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
        return String.fromPoint(...codePoints);
    }

    let cachedGeoString = "Определение...";
    async function fetchGeoLocation() {
        try {
            const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode');
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (data.status === 'success') {
                cachedGeoString = `${getFlagEmoji(data.countryCode)} ${data.country}`;
            } else { cachedGeoString = "🌐 Unknown"; }
        } catch (e) { cachedGeoString = "🌐 Ошибка GEO"; }
        const geoEl = document.getElementById('ouadminGeo');
        if (geoEl) geoEl.innerText = cachedGeoString;
    }
    fetchGeoLocation();

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let os = "Неизвестная ОС", browser = "Неизвестный браузер";
        if (/windows phone/i.test(ua)) os = "Windows Phone";
        else if (/win/i.test(ua)) os = "Windows";
        else if (/android/i.test(ua)) os = "Android";
        else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) os = "iOS";
        else if (/mac/i.test(ua)) os = "macOS";
        else if (/linux/i.test(ua)) os = "Linux";
        
        if (/edg/i.test(ua)) browser = "Edge";
        else if (/opr|opera/i.test(ua)) browser = "Opera";
        else if (/chrome|crios/i.test(ua)) browser = "Chrome";
        else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
        else if (/safari/i.test(ua)) browser = "Safari";
        
        return `${os} | ${browser} ${/mobile/i.test(ua) ? "(Мобильное)" : "(ПК)"}`;
    }

    // === ОСНОВНАЯ ЛОГИКА ===
    function initWidget() {
        const sessionStr = localStorage.getItem("ouAuth_session");
        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            if (Date.now() - session.timestamp < SESSION_LIFETIME_MS) {
                session.timestamp = Date.now();
                if(!session.key) session.key = generateSessionKey();
                localStorage.setItem("ouAuth_session", JSON.stringify(session));
                
                const island = document.createElement("div");
                island.className = "ouauth-dynamic-island";
                island.innerHTML = `<span class="ouauth-island-text">С возвращением, <span id="ouAuthLoginColor">${session.login}</span>!</span>`;
                document.body.appendChild(island);
                
                const loginEl = document.getElementById("ouAuthLoginColor");
                if ('getBattery' in navigator) {
                    navigator.getBattery().then(battery => {
                        updateBatteryColor(loginEl, battery);
                        battery.addEventListener('levelchange', () => updateBatteryColor(loginEl, battery));
                    }).catch(() => { loginEl.style.color = "#d8b4fe"; });
                } else {
                    loginEl.style.color = "#d8b4fe"; loginEl.style.textShadow = "0 0 10px rgba(216, 180, 254, 0.5)";
                }
                setTimeout(() => island.remove(), 5500);

                initAdminTriggers();
                return;
            }
        }

        // Запуск интерфейса блокировки
        document.documentElement.classList.add('ouauth-locked');
        
        const overlay = document.createElement("div");
        overlay.className = "ouauth-overlay";
        overlay.innerHTML = `
            <div class="ouauth-card" id="ouauthCard">
                <h2>ouAuth</h2>
                <div class="ouauth-input-group"><input type="text" id="ouauthLogin" placeholder="Логин" autocomplete="off"></div>
                <div class="ouauth-input-group"><input type="password" id="ouauthPassword" placeholder="Пароль"></div>
                <button class="ouauth-btn" id="ouauthSubmit">Войти</button>
                <div class="ouauth-error" id="ouauthError">Неверный логин или пароль</div>
            </div>
        `;
        document.body.prepend(overlay);

        overlay.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
        overlay.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && e.maxTouchPoints > 1) e.preventDefault(); });
        overlay.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
        overlay.addEventListener('copy', (e) => e.preventDefault());
        overlay.addEventListener('contextmenu', (e) => e.preventDefault());

        const submitBtn = document.getElementById("ouauthSubmit");
        const errorEl = document.getElementById("ouauthError");

        submitBtn.addEventListener("click", async () => {
            const inputLogin = document.getElementById("ouauthLogin").value.trim();
            const inputPass = document.getElementById("ouauthPassword").value.trim();
            if (!inputLogin || !inputPass) return;

            const startTime = performance.now();
            submitBtn.innerText = "Проверка..."; submitBtn.disabled = true;

            try {
                const response = await fetch(`${GITHUB_RAW_URL}?t=${Date.now()}`);
                if (!response.ok) throw new Error();
                const rawBase64 = await response.text();
                const decodedText = decodeBase64(rawBase64.trim());
                
                let isAuthenticated = false;
                for (let line of decodedText.split(/\r?\n/)) {
                    const parts = line.split(" - ");
                    if (parts.length === 2 && parts[0].trim() === inputLogin && parts[1].trim() === inputPass) {
                        isAuthenticated = true; break;
                    }
                }

                if (isAuthenticated) {
                    const totalTimeMs = (performance.now() - startTime).toFixed(0);
                    const displayTime = totalTimeMs < 1000 ? `${totalTimeMs} мс` : `${(totalTimeMs/1000).toFixed(2)} сек`;

                    localStorage.setItem("ouAuth_session", JSON.stringify({ login: inputLogin, timestamp: Date.now(), loginTime: Date.now(), key: generateSessionKey() }));

                    const card = document.getElementById("ouauthCard");
                    card.style.opacity = "0"; card.style.transform = "scale(0.8) translateY(20px)";
                    
                    setTimeout(() => {
                        card.remove();
                        overlay.classList.add("success-tint");
                        const successCard = document.createElement("div");
                        successCard.className = "ouauth-success-card";
                        successCard.innerHTML = `
                            <h3>Привет, ${inputLogin}!</h3>
                            <p>Успешный вход за <b>${displayTime}</b></p>
                        `;
                        overlay.appendChild(successCard);

                        setTimeout(() => {
                            overlay.style.opacity = "0";
                            setTimeout(() => {
                                overlay.remove();
                                document.documentElement.classList.remove('ouauth-locked');
                                initAdminTriggers();
                            }, 500);
                        }, 4000); 
                    }, 500);
                } else {
                    errorEl.innerText = "Неверный логин или пароль"; errorEl.style.display = "block";
                    submitBtn.innerText = "Войти"; submitBtn.disabled = false;
                }
            } catch (err) {
                errorEl.innerText = "Ошибка сервера авторизации"; errorEl.style.display = "block";
                submitBtn.innerText = "Войти"; submitBtn.disabled = false;
            }
        });
    }

    let adminOverlay = null; let clockFrame = null;

    function initAdminTriggers() {
        let rCount = 0; let rTimeout;
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') {
                rCount++; clearTimeout(rTimeout);
                rTimeout = setTimeout(() => rCount = 0, 1500);
                if (rCount === 5) { rCount = 0; openAdminPanel(); }
            } else { rCount = 0; }
        });

        let tapCount = 0; let lastTapTime = 0; let activeQuadrant = -1;
        function getQuadrant(x, y) {
            const midX = window.innerWidth / 2, midY = window.innerHeight / 2;
            if (x < midX && y < midY) return 1; if (x >= midX && y < midY) return 2;
            if (x < midX && y >= midY) return 3; return 4;
        }

        window.addEventListener('pointerdown', (e) => {
            const now = Date.now(); const currentQuadrant = getQuadrant(e.clientX, e.clientY);
            if (now - lastTapTime > 400 || currentQuadrant !== activeQuadrant) {
                tapCount = 1; activeQuadrant = currentQuadrant;
            } else { tapCount++; }
            lastTapTime = now;
            if (tapCount === 15) { tapCount = 0; openAdminPanel(); }
        });
    }

    function formatTime(ms) {
        let totalSec = Math.floor(ms / 1000), h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
        return `${h}ч ${m}м ${s}с`;
    }

    function openAdminPanel() {
        if (adminOverlay) return;
        const session = JSON.parse(localStorage.getItem("ouAuth_session"));
        if (!session) return;

        adminOverlay = document.createElement('div');
        adminOverlay.className = 'ouauth-admin-overlay';
        
        adminOverlay.innerHTML = `
            <div class="ouadmin-close" id="ouadminClose"></div>
            <div class="ouadmin-top-left">
                <div>Профиль: <span>${session.login}</span></div>
                <div>Сессия длится: <span id="ouadminUptime">0ч 0м 0с</span></div>
                <br>
                <div id="ouadminDate">--.--.----</div>
                <div id="ouadminClock">00:00:00:000</div>
            </div>
            <div class="ouadmin-bottom-left">
                <div>Session Key:<br>${session.key}</div>
                <div style="margin-top:10px; color:#a1a1aa;">Устройство: ${getDeviceInfo()}</div>
                <div style="margin-top:4px; color:#d8b4fe; font-weight:bold;" id="ouadminGeo">${cachedGeoString}</div>
            </div>
            <div class="ouadmin-bottom-right">
                <div class="ouadmin-version">${VERSION}</div>
                <button class="ouadmin-logout-btn" id="ouadminLogout">Выйти из аккаунта</button>
            </div>
        `;
        document.body.appendChild(adminOverlay);
        setTimeout(() => adminOverlay.classList.add('active'), 10);

        function updateClock() {
            if (!document.getElementById('ouadminClock')) return;
            const now = new Date();
            document.getElementById('ouadminDate').innerText = now.toLocaleDateString('ru-RU');
            document.getElementById('ouadminClock').innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}:${String(now.getMilliseconds()).padStart(3, '0')}`;
            document.getElementById('ouadminUptime').innerText = formatTime(Date.now() - (session.loginTime || session.timestamp));
            clockFrame = requestAnimationFrame(updateClock);
        }
        updateClock();

        document.getElementById('ouadminClose').addEventListener('click', closeAdminPanel);
        
        document.getElementById('ouadminLogout').addEventListener('click', () => {
            localStorage.removeItem("ouAuth_session");
            window.location.replace(window.location.pathname + "?reset=" + new Date().getTime());
        });
    }

    function closeAdminPanel() {
        if (!adminOverlay) return;
        adminOverlay.classList.remove('active');
        cancelAnimationFrame(clockFrame);
        setTimeout(() => { adminOverlay.remove(); adminOverlay = null; }, 400);
    }

    // ЖЁСТКИЙ ЦИКЛИЧЕСКИЙ МОНИТОРИНГ BODY (Решает проблему file:///)
    const bodyCheckInterval = setInterval(() => {
        if (document && document.body) {
            clearInterval(bodyCheckInterval);
            initWidget();
        }
    }, 5); // Проверяем каждые 5 миллисекунд до победного конца
})();
