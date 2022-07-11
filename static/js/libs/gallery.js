const GalleryClassName = 'gallery'; // задаємо клас для контейнера всієї галереї
const GallaryDraggableClassName = 'gallery-draggable'; // задаємо клас для курсорa-лапки
const GalleryLineClassName = 'gallery-line'; // задаємо клас для лінії(серії) слайдів
const GalleryLineContainerClassName = `gallery-line-container`; // задаємо клас для контейнера з лінією слайдів та стрілками
const GallerySlideClassName = 'gallery-slide'; // задаємо клас для самого слайда
const GalleryDotsClassName = 'gallery-dots'; // задаємо клас для крапок-навігації
const GalleryDotClassName = 'gallery-dot'; // задаємо клас для однієї крапки-навігації
const GalleryDotActiveClassName = 'gallery-dot-active'; // задаємо клас для активної крапки
const GalleryNavClassName = 'gallery-nav'; // задаємо клас для стрілок
const GalleryNavLeftClassName = 'gallery-nav-left'; // задаємо клас для лівої стрілки
const GalleryNavRightClassName = 'gallery-nav-right'; // задаємо клас для правої стрілки
const GalleryNavDisabledClassName = 'gallery-nav-disabled'; // задаємо клас для неактивної стрілки

// створюємо html-галерею через "Class" для можжливості додавання інших галерей
class Gallery {
    // передаємо в конструктор - основний створюваний елемент-обгортку та параметр для опцій (по замовчуванню-пустий обєкт)
    constructor(element, options={}) {
        this.containerNode = element;  // визначаємо перший основний параметр куда передаємо основний елемент-обгортку
        this.size = element.childElementCount;  // визначаємо кількість слайдів в галереї
        this.currentSlide = 0; // визначаємо слайд, який буде активний при запуску галереї
        this.currentSlideWasChanged = false; // визначаємо стан слайду при запуску галереї
        this.settings = { // визначаємо марджин між слайдами
            margin: options.margin || 0,
            dots: options.dots || false // якщо є крапки-слайди, то показувати, і навпаки
        }

        this.manageHTML =  this.manageHTML.bind(this); // прив'язуємо контекст для конструктора при виклику методу створ слайдів
        this.setParameters =  this.setParameters.bind(this); // прив'язуємо контекст для конструктора при виклику методу задання параметрів
        this.setEvents =  this.setEvents.bind(this); // прив'язуємо контекст для конструктора при виклику методу події
        this.resizeGallery = this.resizeGallery.bind(this); // прив'язуємо контекст для конструктора при перевизначенні параметрів у разі зміни розмірів вікна браузера
        this.startDrag = this.startDrag.bind(this); // прив'язуємо контекст для конструктора при початку перетягування
        this.stopDrag = this.stopDrag.bind(this); // прив'язуємо контекст для конструктора при закінченні перетягування
        this.dragging = this.dragging.bind(this); // будуть здійснюватись усі обрахунки переміщення слайдів
        this.setStylePosition = this.setStylePosition.bind(this);
        this.clickDots = this.clickDots.bind(this); // прив'язуємо контекст для конструктора при навігації по крапкам
        this.moveToLeft = this.moveToLeft.bind(this); // прив'язуємо контекст для конструктора при навігації по стрілкам
        this.moveToRight = this.moveToRight.bind(this); // прив'язуємо контекст для конструктора при навігац по стрілкам
        this.changeCurrentSlide = this.changeCurrentSlide.bind(this); // прив'язуємо контекст для конструктора при зміні поточного слайду
        this.changeActiveDotClass = this.changeActiveDotClass.bind(this); // прив'язуємо контекст для конструктора при зміні активної крапки-слайду
        this.changeDisabledNav = this.changeDisabledNav.bind(this); // прив'язуємо контекст для конструктора коли стрілка неактивна

        this.manageHTML();  // викликаємо метод створення слайдів (елементи-обгортки)
        this.setParameters(); // викликаємо метод для задання параметрів: ширини лінії слайдів та ширини самого слайда
        this.setEvents(); // викликаємо метод для виконання події
        // this.destroyEvents(); // виклик метода для очистки усіх подій при зміні розмірів вікна браузера
    }

    // визначаємо склад основного елементу-обгортки
    manageHTML() {
        this.containerNode.classList.add(GalleryClassName); // додаємо клас "GalleryClassName" в контейнер 
        // змінюємо внутрішній контекст html-елемента (контейнера із лінією слайдів)
        this.containerNode.innerHTML = `
            <div class="${GalleryLineContainerClassName}">
                <!-- задаємо клас для контейнера із лінією слайдів -->
                <div class="${GalleryLineClassName}">
                    <!-- поміщаємо туди основний html-елемент (слайди) -->
                    ${this.containerNode.innerHTML}
                </div>
            </div>
            
            <div class="${GalleryNavClassName}">
                <button class="${GalleryNavLeftClassName}">Left</button>
                <button class="${GalleryNavRightClassName}">Right</button>
            </div>
            <div class="${GalleryDotsClassName}"></div>
        `;

        // визначаємо змінну(ноду) для контейнера в якому є лінія слайдів та стрілки
        this.lineContainerNode = this.containerNode.querySelector(`.${GalleryLineContainerClassName}`);
        // визначаємо змінну(ноду) для лінії/серії слайдів
        this.lineNode = this.containerNode.querySelector(`.${GalleryLineClassName}`);
        // визначаємо змінну(ноду) для крапок-навігації
        this.dotsNode = this.containerNode.querySelector(`.${GalleryDotsClassName}`);

        /* визначаємо змінну для самих слайдів - пробігаючи по всіх "дітях" (this.lineNode), робимо з них масив щоб використати метод масивів "map", потім беремо кожен елемент і викликаємо для нього функцію (wrapElementByDiv): */
        this.slideNodes = Array.from(this.lineNode.children).map(childNode =>
            wrapElementByDiv({
                element: childNode,
                className: GallerySlideClassName
            })
        );

        if(this.settings.dots) { // якщо є налаштування з крапками-слайдами, то
            this.dotsNode = this.containerNode.querySelector(`.${GalleryDotsClassName}`); // додаємо крапки-навігації

            // додаємо всередину стільки крапок-навігації, скільки маємо слайдів та одночасно визначаємо активну крапку-слайд
            this.dotsNode.innerHTML = Array.from(Array(this.size).keys()).map(key => (
                `<button class="${GalleryDotClassName} ${key === this.currentSlide ? GalleryDotActiveClassName : ''}"></button>`
            )).join('');
            
            // треба витягнути ноди для того щоб далі задати їм подію
            this.dotNodes = this.dotsNode.querySelectorAll(`.${GalleryDotClassName}`);
        }

        this.navLeft = this.containerNode.querySelector(`.${GalleryNavLeftClassName}`);
        this.navRight = this.containerNode.querySelector(`.${GalleryNavRightClassName}`);

    }

    // визначаємо склад другого параметра - опції
    setParameters() {
        // задаємо ширину самої контейнер-gallery
        const coordsLineContainer = this.lineContainerNode.getBoundingClientRect(); // отримуємо усі координати контейнер-gallery
        this.width = coordsLineContainer.width; // беремо тільки ширину контейнер-gallery
        this.maximumX = -(this.size - 1) * (this.width + this.settings.margin); // для велечини "важкості" відриву крайніх слайдів
        this.x = -this.currentSlide * (this.width + this.settings.margin); // збережемо здвиг слайда в окрему властивість "x"

        this.resetStyleTransition(); // щоб затирало все і не було глюка появи слайдів один під одним

        // задаємо ширину лінії слайдів: кількість слайдів (this.size) * ширину слайда (this.width)
        this.lineNode.style.width = `${this.size * (this.width + this.settings.margin)}px`;
        this.setStylePosition(); // щоб затирало все і не було глюка появи слайдів один під одним

        if(this.settings.dots) {
            this.changeActiveDotClass(); // щоб появлявся активний клас для крапок
        }

        this.changeDisabledNav(); // щоб появлявся клас неактивних крайніх стрілок

        /* задаємо ширину самого слайда: пробігаємось по кожному слайду методом forEach, перед цим перетворивши slideNodes в масив, та присвоюємо велечину ширини слайда: */
        Array.from(this.slideNodes).forEach(slideNode => {
            slideNode.style.width = `${this.width}px`;
            slideNode.style.marginRight = `${this.settings.margin}px`;
        });
    }

    // визначаємо подію на випадок зміни галереї клієнтом у вікні браузера
    setEvents() {
        // шоб не викликалось дууууже багато раз огортаємо в функцію "debounce"
        this.debouncedResizeGallery = debounce(this.resizeGallery);
        window.addEventListener('resize', this.debouncedResizeGallery);

        this.lineNode.addEventListener('pointerdown', this.startDrag); // починаємо перетягування
        window.addEventListener('pointerup', this.stopDrag); // зупиняємо перетягування (відпускаємо мишку)
        window.addEventListener('pointercansel', this.stopDrag); // щоб забрати баг замирання перелистування

        if(this.settings.dots) {
            // задаємо подію на крапки та стрілки навігації
            this.dotsNode.addEventListener('click', this.clickDots);
        }

        this.navLeft.addEventListener('click', this.moveToLeft);
        this.navRight.addEventListener('click', this.moveToRight);
    }

    // обов'язково також метод для очистки події перевизначення вікна браузера
    destroyEvents() {
        window.removeEventListener('resize', this.debouncedResizeGallery);
        this.lineNode.removeEventListener('pointerdown', this.startDrag); // починаємо перетягування
        window.removeEventListener('pointerup', this.stopDrag); // зупиняємо перетягування (відпускаємо мишку)
        window.removeEventListener('pointercansel', this.stopDrag); // щоб забрати баг замирання перелистування

        if(this.settings.dots) {
            // видаляємо подію на кнопках навігації
            this.dotNode.removeEventListener('click', this.clickDots);
        }

        this.navLeft.removeEventListener('click', this.moveToLeft);
        this.navRight.removeEventListener('click', this.moveToRight);
    }

    /* перевизначаємо/перераховуємо те, що було встановлено при запуску галереї: ширину галереї та ширину самого слайда */
    resizeGallery() {
        this.setParameters();
    }

    startDrag(evt) {
        this.currentSlideWasChanged = false; // встановлюємо прапорець стану слайду до початку його заміни
        this.clickX = evt.pageX; // цікавить тільки рух по горизонталі, тому тільки вісь Х
        this.startX = this.x; // зберігаємо стартову позицію на якій закінчили перетягувати слайд

        this.resetStyleTransition(); // для плавної заміни слайдів

        this.containerNode.classList.add(GallaryDraggableClassName); // додаємо клас щоб створити курсор-лапку
        window.addEventListener('pointermove', this.dragging);
    }

    stopDrag() {
        window.removeEventListener('pointermove', this.dragging);

        this.containerNode.classList.remove(GallaryDraggableClassName); // видаляєм клас щоб припинити дію курсор-лапки
        this.changeCurrentSlide();
    }

    dragging(evt) {
        this.dragX = evt.pageX;
        const dragShift = this.dragX - this.clickX;
        const easing = dragShift / 5; // для створення ефекту "важкості" відриву крайніх слайдів від краю
        // Math.min - важкість відриву першого слайду; Math.max - важкість відриву останнього слайду
        this.x = Math.max(Math.min(this.startX + dragShift, easing), this.maximumX + easing ); // при перетягуванні ми додаєм до стартової позиції здвиг

        this.setStylePosition();

        // встановлення повного/цілковитого переходу на наступний слайд а не тільки його частини
        // в одному напрямку:
        if(
            dragShift > 20 && // якщо здвиг не більше 20рх то це хтось ненароком зачіпив
            dragShift > 0 && // якщо робимо таки здвиг
            !this.currentSlideWasChanged && // щоби цей здвиг(умова currentSlide > 0) не застосовувати безкінечно
            this.currentSlide > 0 // якщо змінюємо поточний слайд
        ) { 
            this.currentSlideWasChanged = true; // умова коли змінюємо поточний слайд
            this.currentSlide = this.currentSlide - 1; // віднімаємо один слайд
        }
        // і в зворотному напрямку:
        if(dragShift < -20 && dragShift < 0 && !this.currentSlideWasChanged && this.currentSlide < this.size - 1) {
            this.currentSlideWasChanged = true; // умова коли змінюємо поточний слайд
            this.currentSlide = this.currentSlide + 1; // додаємо один слайд
        }
    }

    clickDots(evt) {
        const dotNode = evt.target.closest('button'); // визначили елемент по якому клікнули
        if(!dotNode) { // клікнули не по крапці а десь інде
            return;
        }
        // визначаєм порядковий номер крапки по якій клікнули
        let dotNumber;
        for(let i = 0; i < this.dotNodes.length; i++) {
            if(this.dotNodes[i] === dotNode) { // якщо поточна крапка збігається з тою по якій клікнули
                dotNumber = i; // зберігаємо ключ
                break; // перериваємо цикл
            }
        }
        // якщо отриманий ключ збігається з поточним слайдом, то робити нічого нетреба
        if(dotNumber === this.currentSlide) {
            return;
        }

        // для отримання плавного переходу на великі скачки щоб пропорційно збільшити саме час плавного переходу
        const countSwipes = Math.abs(this.currentSlide - dotNumber); // отримаємо ціле число

        // в інакшому разі 
        this.currentSlide = dotNumber;
        this.changeCurrentSlide(countSwipes);
    }

    moveToLeft() {
        if(this.currentSlide <= 0) { // якщо в ліво дойшли до кінця
            return;
        }
        this.currentSlide = this.currentSlide - 1;
        this.changeCurrentSlide();
    }

    moveToRight() {
        if(this.currentSlide >= this.size - 1) { // якщо в право дойшли до кінця
            return;
        }
        this.currentSlide = this.currentSlide + 1;
        this.changeCurrentSlide();
    }

    changeCurrentSlide(countSwipes) {
        this.x = -this.currentSlide * (this.width + this.settings.margin); // зробимо перевизначення зміни по "x"
        this.setStyleTransition(countSwipes); // для плавної заміни слайдів та плавності між віддаленими слайдами
        this.setStylePosition(); // змінимо стиль під змінену позицію
        if(this.settings.dots) {
            this.changeActiveDotClass(); // для зміни активної крапки
        }
        this.changeDisabledNav(); // для неактивної стрілки
    }

    changeActiveDotClass() {
        // видаляємо у всії крапок-слайдів active-клас
        for(let i = 0; i < this.dotNodes.length; i++) { // пробігаємось по всіх крапках-слайдах
            this.dotNodes[i].classList.remove(GalleryDotActiveClassName); // видаляємо клас
        }
        // додаємо тепер active-клас до поточної крапки-слайду
        this.dotNodes[this.currentSlide].classList.add(GalleryDotActiveClassName);
    }

    changeDisabledNav() {
        if(this.currentSlide <= 0) { // якщо це ліва стрілка
            this.navLeft.classList.add(GalleryNavDisabledClassName) // то додаємо клас для деактивації
        } else {
            this.navLeft.classList.remove(GalleryNavDisabledClassName) // видаляємо клас для деактивації
        }
        if(this.currentSlide >= this.size - 1) { // якщо це права стрілка
            this.navRight.classList.add(GalleryNavDisabledClassName) // то додаємо клас для деактивації
        } else {
            this.navRight.classList.remove(GalleryNavDisabledClassName) // видаляємо клас для деактивації
        }
    }
    

    setStylePosition() {
        this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
    }

    setStyleTransition(countSwipes = 1) { // для плавної заміни слайдів при відпусканні кнопки та плавності переходу між слайдами та збільшення пропорційного часу плавності переходу між віддаленими слайдами
        this.lineNode.style.transition = `all ${0.25 * countSwipes}s ease 0s`;
    }

    resetStyleTransition() { // для плавної заміни слайдів на початку
        this.lineNode.style.transition = `all 0s ease 0s`;
    };
}

// HELPERS:

// функція створення обгортки
function wrapElementByDiv({element, className}) {
    const wrapperNode = document.createElement('div'); // створюємо новий елемент "div"
    wrapperNode.classList.add(className); // задаємо цьому елементу клас

    // створюємо безпосередню обгортку
    element.parentNode.insertBefore(wrapperNode, element); // визначаємо місце вставки
    wrapperNode.appendChild(element); // додаємо обгортку

    return wrapperNode; // отримуємо елемент
}

// функція для виклику іншої функції з проміжком часу
function debounce(func, time=100) {
    let timer;
    return function(event) {
        clearTimeout(timer);
        timer = setTimeout(func, time, event);
    }
}
