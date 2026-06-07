const swiper = new Swiper('.swiper', {
    slidesPerView: 1.5,
    spaceBetween: 30,

    centeredSlides: true,

    loop: true,

    pagination: {
        el: '.swiper-pagination',
    },

    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    }
});