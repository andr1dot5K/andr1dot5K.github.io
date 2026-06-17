document.addEventListener('DOMContentLoaded', function() {
    let detailButtons = document.querySelectorAll('.detail-button')
    detailButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            let details = this.nextElementSibling;
            if (details.style.display ==='none') {
                details.style.display = 'block';
                this.textContent = 'Скрыть';
            } else {
                details.style.display = 'none';
                this.textContent = 'Details';
            }
        });
    });
    let cards = document.querySelectorAll('.card');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            this.classList.toggle('cards-selected');
        });
    });
});