// This function automatically opens the <details> element with the corresponding id of the link the user clicked from another (concept) page.
function openDetailsFromHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));

    if (!id) return;

    const target = document.getElementById(id);

    if (!target) return;

    const details = target.matches("details")
        ? target
        : target.closest("details");

    if (details) {
        details.open = true;

        const content = details.querySelector(".details-content");

        if (content) {
            content.style.height = "auto";
        }
    }

    requestAnimationFrame(() => {
        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    });
}

// Hooks up the event listeners
window.addEventListener("DOMContentLoaded", openDetailsFromHash);
window.addEventListener("hashchange", openDetailsFromHash);