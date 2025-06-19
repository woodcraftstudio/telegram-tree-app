document.addEventListener('DOMContentLoaded', () => {
    const webApp = Telegram.WebApp;
    
    // Инициализация приложения
    webApp.ready();
    webApp.expand();
    webApp.enableClosingConfirmation();
    
    // Элементы интерфейса
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
    const steps = document.querySelectorAll('.step');
    
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
            steps[0].classList.add('active');
            steps[1].classList.add('active');
            steps[2].classList.remove('active');
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
            title: `Посадка ${selectedOption.trees} деревьев`,
            description: "Экологический проект по восстановлению лесов",
            currency: "XTR", // Код валюты для Telegram Stars
            prices: [
                { label: "Посадка деревьев", amount: selectedOption.stars * 100 }
            ],
            payload: JSON.stringify({
                userId: webApp.initDataUnsafe.user?.id,
                trees: selectedOption.trees,
                stars: selectedOption.stars
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
        steps[2].classList.add('active');
        
        // Сохраняем данные о покупке
        savePurchase();
        
        // Показываем уведомление
        webApp.showPopup({
            title: 'Посадка оплачена! 🌳',
            message: `Вы посадили ${selectedOption.trees} деревьев. Отчёт придёт в течение недели.`,
            buttons: [{ type: 'close' }]
        });
    }
    
    // Функция сохранения покупки
    function savePurchase() {
        const purchaseData = {
            userId: webApp.initDataUnsafe.user?.id,
            user: webApp.initDataUnsafe.user?.username || `id${webApp.initDataUnsafe.user?.id}`,
            trees: selectedOption.trees,
            stars: selectedOption.stars,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // В реальном приложении здесь будет отправка на сервер
        console.log('Покупка сохранена:', purchaseData);
        
        // Сохраняем в локальное хранилище Telegram
        webApp.CloudStorage.setItem('last_purchase', JSON.stringify(purchaseData));
        
        // Здесь бы мы отправили данные на сервер для обработки
        // sendPurchaseToServer(purchaseData);
    }
    
    // Инициализация темы
    function initTheme() {
        document.body.classList.toggle('dark', webApp.colorScheme === 'dark');
    }
    
    // Инициализация приложения
    initUser();
    initTheme();
    webApp.onEvent('themeChanged', initTheme);
});