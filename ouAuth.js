(function () {
    // === НАСТРОЙКА ВИДЖЕТА ===
    const GITHUB_RAW_URL = "ЗАМЕНИ_НА_СВОЮ_ССЫЛКУ_НА_RAW_TXT_ФАЙЛ";
    const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 1 месяц

    // Стили для Liquid Glass, анимаций и блокировок
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .ouauth-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 10, 12, 0.85);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            transition: background 0.8s ease, opacity 0.5s ease;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }

        /* Фиолетовый тинт при успешном входе */
        .ouauth-overlay.success-tint {
            background: rgba(25, 10, 45, 0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        /* Главная карточка (Liquid Glass) */
        .ouauth-card {
            width: 90%;
            max-width: 400px;
            padding: 35px 30px;
            background: linear-gradient(135deg, rgba(30, 30, 35, 0.7), rgba(20, 20, 25, 0.85)) padding-box,
                        linear-gradient(135deg, #a855f7, #6366f1) border-box;
            border: 2px solid transparent;
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.1);
            text-align: center;
            color: #ffffff;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(1);
        }

        .ouauth-card h2 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 25px 0;
            background: linear-gradient(135deg, #fff, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }

        .ouauth-input-group {
            margin-bottom: 18px;
            text-align: left;
        }

        .ouauth-input-group input {
            width: 100%;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            outline: none;
            box-sizing: border-box;
            transition: all 0.3s ease;
        }

        .ouauth-input-group input:focus {
            border-color: #a855f7;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
        }

        .ouauth-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
            margin-top: 10px;
        }

        .ouauth-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
        }

        .ouauth-error {
            color: #ef4444;
            font-size: 13px;
            margin-top: 12px;
            display: none;
            font-weight: 500;
        }

        /* Белая карточка успеха */
        .ouauth-success-card {
            background: #ffffff;
            color: #0f172a;
            padding: 30px 25px;
            border-radius: 16px;
            width: 90%;
            max-width: 380px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
            animation: ouauthPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .ouauth-success-card h3 {
            font-size: 22px;
            margin: 0 0 12px 0;
            font-weight: 700;
        }

        .ouauth-success-card p {
            font-size: 14px;
            color: #475569;
            line-height: 1.5;
            margin: 0;
        }

        .ouauth-success-card span.highlight {
            color: #7c3aed;
            font-weight: 600;
        }

        @keyframes ouauthPop {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;

    // Инъекция стилей в head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Безопасное декодирование Base64 с поддержкой UTF-8 Кириллицы
    function decodeBase64(str) {
        try {
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch(e) {
            return atob(str); // Фолбэк, если строка была не UTF-8
        }
    }

    // Проверка сессии
    const session = JSON.parse(localStorage.getItem("ouAuth_session"));
    if (session && (Date.now() - session.timestamp < SESSION_LIFETIME_MS)) {
        // Продлеваем сессию, так как пользователь зашел в течение месяца
        session.timestamp = Date.now();
        localStorage.setItem("ouAuth_session", JSON.stringify(session));
        return; // Просто пускаем на сайт без вызова окон
    }

    // Инициализация DOM элементов виджета
    const overlay = document.createElement("div");
    overlay.className = "ouauth-overlay";
    
    overlay.innerHTML = `
        <div class="ouauth-card" id="ouauthCard">
            <h2>ouAuth</h2>
            <div class="ouauth-input-group">
                <input type="text" id="ouauthLogin" placeholder="Логин" autocomplete="off">
            </div>
            <div class="ouauth-input-group">
                <input type="password" id="ouauthPassword" placeholder="Пароль">
            </div>
            <button class="ouauth-btn" id="ouauthSubmit">Войти</button>
            <div class="ouauth-error" id="ouauthError">Неверный логин или пароль</div>
        </div>
    `;

    document.body.prepend(overlay);

    // Жесткий запрет зума и копирования внутри оверлея
    overlay.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    overlay.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && e.maxTouchPoints > 1) e.preventDefault(); });
    overlay.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    overlay.addEventListener('copy', (e) => e.preventDefault());
    overlay.addEventListener('contextmenu', (e) => e.preventDefault());

    // Логика аутентификации
    const submitBtn = document.getElementById("ouauthSubmit");
    const errorEl = document.getElementById("ouauthError");

    submitBtn.addEventListener("click", async () => {
        const inputLogin = document.getElementById("ouauthLogin").value.trim();
        const inputPass = document.getElementById("ouauthPassword").value.trim();
        
        if (!inputLogin || !inputPass) return;

        const startTime = performance.now();
        submitBtn.innerText = "Проверка...";
        submitBtn.disabled = true;

        try {
            // Добавляем timestamp к URL, чтобы обойти кэширование GitHub (Realtime)
            const response = await fetch(`${GITHUB_RAW_URL}?t=${Date.now()}`);
            if (!response.ok) throw new Error();

            const rawBase64 = await response.text();
            const decodedText = decodeBase64(rawBase64.trim());
            
            // Парсинг строк формата "логин - пароль"
            const lines = decodedText.split(/\r?\n/);
            let isAuthenticated = false;

            for (let line of lines) {
                const parts = line.split(" - ");
                if (parts.length === 2) {
                    const fileLogin = parts[0].trim();
                    const filePass = parts[1].trim();

                    if (fileLogin === inputLogin && filePass === inputPass) {
                        isAuthenticated = true;
                        break;
                    }
                }
            }

            if (isAuthenticated) {
                const endTime = performance.now();
                const totalTimeMs = (endTime - startTime).toFixed(0);
                const displayTime = totalTimeMs < 1000 ? `${totalTimeMs} мс` : `${(totalTimeMs/1000).toFixed(2)} сек`;

                // Сохраняем сессию
                localStorage.setItem("ouAuth_session", JSON.stringify({
                    login: inputLogin,
                    timestamp: Date.now()
                }));

                // Запуск красивой анимации успеха
                const card = document.getElementById("ouauthCard");
                card.style.opacity = "0";
                card.style.transform = "scale(0.9)";
                
                setTimeout(() => {
                    card.remove();
                    overlay.classList.add("success-tint");

                    const successCard = document.createElement("div");
                    successCard.className = "ouauth-success-card";
                    successCard.innerHTML = `
                        <h3>Добро пожаловать, ${inputLogin}!</h3>
                        <p><span class="highlight">ouAuth</span> соединил вас с сайтом<br>${window.location.hostname}<br>за <b>${displayTime}</b></p>
                    `;
                    overlay.appendChild(successCard);

                    // Финальное плавное исчезновение всего оверлея через 3 секунды
                    setTimeout(() => {
                        overlay.style.opacity = "0";
                        setTimeout(() => overlay.remove(), 500);
                    }, 3000);

                }, 400);

            } else {
                showError();
            }

        } catch (err) {
            showError("Ошибка соединения с сервером авторизации");
        }
    });

    function showError(msg = "Неверный логин или пароль") {
        errorEl.innerText = msg;
        errorEl.style.display = "block";
        submitBtn.innerText = "Войти";
        submitBtn.disabled = false;
    }
})();
