// Gives all <details> elements smooth dropdown tweens
// Selects all the elements with the class
document.querySelectorAll(".info-details").forEach((details) => {
    const summary = details.querySelector("summary");
    const content = details.querySelector(".details-content");

    // Hooks up the event listener
    summary.addEventListener("click", (event) => {
        event.preventDefault();

        if (!details.open) {
            details.open = true;
            content.style.height = "0px";

            requestAnimationFrame(() => {
                content.style.height = `${content.scrollHeight}px`;
            });

            content.addEventListener("transitionend", function finishOpening() {
                content.style.height = "auto";
            }, { once: true });
        } else {
            content.style.height = `${content.scrollHeight}px`;

            requestAnimationFrame(() => {
                content.style.height = "0px";
            });

            content.addEventListener("transitionend", function finishClosing() {
                details.open = false;
            }, { once: true });
        }
    });
});