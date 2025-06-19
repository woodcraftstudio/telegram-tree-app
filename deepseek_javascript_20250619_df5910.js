document.addEventListener('DOMContentLoaded', () => {
    const webApp = Telegram.WebApp;
    
    // Инициализация приложения
    webApp.ready();
    webApp.expand();
    webApp.enableClosingConfirmation();
    
    // Получаем элементы DOM
    const options = document.querySelectorAll('.option');
    const actionSection = document.getElementById('actionSection');
    const selectedTreesSpan = document.getElementById('selectedTrees');
    const selectedStarsSpan = document.getElementById('selectedStars');
    const confirmedTreesSpan = document.getElementById('confirmedTrees');
    const payButton = document.getElementById('payButton');
    const loader = document.getElementById('loader');
    const confirmation = document.getElementById('confirmation');
    const userBalance = document.getElementById('userBalance');
    const balanceInfo = document.getElementById('balanceInfo');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Данные пользователя
    let userStars = 0;
    let selectedOption = null;
    
    // Инициализация пользователя
    function initUser() {
        // В реальном приложении здесь будет запрос к серверу
        // Для демо используем случайный баланс
        userStars = Math.floor(Math.random() * 1000) + 50;
        
        userBalance.innerHTML = `★ Ваш баланс: ${userStars}`;
        balanceInfo.textContent = `${userStars} ★`;
        
        // Обработка deep link
        handleDeepLink();
    }
    
    // Обработка глубокой ссылки
    function handleDeepLink() {
        const initData = webApp.initDataUnsafe;
        if (initData.start_param) {
            const params = initData.start_param.split('_');
            if (params[0] === 'plant') {
                const treeCount = parseInt(params[1]);
                const option = document.querySelector(`.option[data-trees="${treeCount}"]`);
                if (option) {
                    option.click();
                }
            }
        }
    }
    
    // Обработка выбора варианта
    options.forEach(option => {
        option.addEventListener('click', () => {
            // Сброс предыдущего выбора
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Установка нового выбора
            option.classList.add('selected');
            selectedOption = {
                trees: parseInt(option.dataset.trees),
                stars: parseInt(option.dataset.stars)
            };
            
            // Обновление информации
            selectedTreesSpan.textContent = selectedOption.trees;
            selectedStarsSpan.textContent = selectedOption.stars;
            
            // Проверка баланса
            if (userStars < selectedOption.stars) {
                payButton.disabled = true;
                payButton.innerHTML = 'Недостаточно звёзд ★';
            } else {
                payButton.disabled = false;
                payButton.innerHTML = `Оплатить ${selectedOption.stars} ★`;
            }
            
            // Показ секции оплаты
            actionSection.style.display = 'block';
            confirmation.style.display = 'none';
            
            // Обновление индикатора шагов
            step1.classList.add('active');
            step2.classList.add('active');
            step3.classList.remove('active');
        });
    });
    
    // Обработка оплаты звездами
    payButton.addEventListener('click', () => {
        if (!selectedOption) return;
        
        // Показываем загрузку
        loader.style.display = 'block';
        payButton.disabled = true;
        
        // Формируем платежную транзакцию для Telegram Stars
        const paymentData = {
            title: `Посадка ${selectedOption.trees} ${getTreeWord(selectedOption.trees)}`,
            description: "Экологический проект по восстановлению лесов",
            currency: "XTR", // Код валюты для Telegram Stars
            prices: [
                { 
                    label: `Посадка ${selectedOption.trees} ${getTreeWord(selectedOption.trees)}`, 
                    amount: selectedOption.stars * 100 
                }
            ],
            payload: JSON.stringify({
                userId: webApp.initDataUnsafe.user?.id,
                trees: selectedOption.trees,
                stars: selectedOption.stars,
                timestamp: Date.now()
            })
        };
        
        // Открываем платежное окно
        webApp.openInvoice(paymentData, (status) => {
            loader.style.display = 'none';
            
            if (status === 'paid') {
                // Успешная оплата
                handleSuccessfulPayment();
            } else {
                // Проблема с оплатой
                webApp.showPopup({
                    title: 'Оплата не завершена',
                    message: 'Попробуйте снова или выберите другой вариант',
                    buttons: [{ type: 'ok' }]
                });
                payButton.disabled = false;
            }
        });
    });
    
    // Получение правильной формы слова "дерево"
    function getTreeWord(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'деревьев';
        if (lastDigit === 1) return 'дерево';
        if (lastDigit >= 2 && lastDigit <= 4) return 'дерева';
        return 'деревьев';
    }
    
    // Обработка успешной оплаты
    function handleSuccessfulPayment() {
        // Обновляем баланс (в реальном приложении - запрос к серверу)
        userStars -= selectedOption.stars;
        userBalance.innerHTML = `★ Ваш баланс: ${userStars}`;
        balanceInfo.textContent = `${userStars} ★`;
        
        // Показываем подтверждение
        actionSection.style.display = 'none';
        confirmedTreesSpan.textContent = selectedOption.trees;
        confirmation.style.display = 'block';
        
        // Обновление индикатора шагов
        step3.classList.add('active');
        
        // Сохраняем данные о покупке
        savePurchase();
        
        // Показываем уведомление
        webApp.showPopup({
            title: 'Посадка оплачена! 🌳',
            message: `Вы посадили ${selectedOption.trees} ${getTreeWord(selectedOption.trees)}. Отчёт придёт в течение недели.`,
            buttons: [{ type: 'close' }]
        });
        
        // Закрытие приложения через 15 секунд
        setTimeout(() => {
            webApp.close();
        }, 15000);
    }
    
    // Функция сохранения покупки
    function savePurchase() {
        const user = webApp.initDataUnsafe.user;
        const purchaseData = {
            userId: user?.id,
            username: user?.username || `id${user?.id}`,
            firstName: user?.first_name,
            lastName: user?.last_name,
            trees: selectedOption.trees,
            stars: selectedOption.stars,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // В реальном приложении здесь будет отправка на сервер
        console.log('Покупка сохранена:', purchaseData);
        
        // Сохраняем в локальное хранилище Telegram
        webApp.CloudStorage.setItem('last_purchase', JSON.stringify(purchaseData));
        
        // Отправляем данные в Telegram (для обработки ботом)
        webApp.sendData(JSON.stringify({
            action: 'tree_purchase',
            ...purchaseData
        }));
    }
    
    // Инициализация темы
    function initTheme() {
        document.body.classList.toggle('dark', webApp.colorScheme === 'dark');
    }
    
    // Инициализация приложения
    initUser();
    initTheme();
    webApp.onEvent('themeChanged', initTheme);
    
    // Обработка сообщений от бота
    webApp.onEvent('messageSent', (eventData) => {
        console.log('Сообщение отправлено в Telegram:', eventData);
    });
});