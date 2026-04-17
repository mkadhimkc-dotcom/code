/* 🎀 TOAST NOTIFICATIONS 🎀 */
.app-toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--kitty-pink);
    color: var(--kitty-white);
    font-weight: 900;
    font-size: 0.95rem;
    padding: 12px 20px;
    border: 3px solid var(--kitty-black);
    border-radius: 16px;
    box-shadow: 4px 4px 0px var(--kitty-black);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s, transform 0.3s;
    z-index: 9999;
    max-width: 85%;
    text-align: center;
}

.app-toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* 🎀 STREAK COUNTER 🎀 */
.calendar-streak {
    text-align: center;
    font-size: 1rem;
    font-weight: 900;
    color: var(--kitty-red);
    background: #fff8e1;
    border: 2px dashed var(--kitty-yellow);
    border-radius: 12px;
    padding: 8px 12px;
    margin-bottom: 0.75rem;
}
