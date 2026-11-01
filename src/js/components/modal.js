/**
 * Accessible Modal Dialog Component.
 */
class ModalManager {
  constructor() {
    this.activeOverlay = null;
    this.onCloseCallback = null;
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  open({ title, content, footer = '', size = 'medium', onOpen, onClose }) {
    this.close(); // Close any currently open modal

    const container = document.getElementById('modal-container') || document.body;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const maxWidth = size === 'large' ? '800px' : size === 'small' ? '440px' : '620px';

    overlay.innerHTML = `
      <div class="modal-card" style="max-width: ${maxWidth};">
        <div class="modal-header">
          <h3 class="card-title">${title}</h3>
          <button class="btn btn-icon modal-close-btn" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    // Click outside backdrop to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    const closeBtn = overlay.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    container.appendChild(overlay);
    this.activeOverlay = overlay;
    this.onCloseCallback = onClose;

    document.addEventListener('keydown', this.boundKeyDown);

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }

    if (typeof onOpen === 'function') {
      onOpen(overlay);
    }
  }

  close() {
    if (this.activeOverlay) {
      document.removeEventListener('keydown', this.boundKeyDown);
      this.activeOverlay.remove();
      this.activeOverlay = null;
      if (typeof this.onCloseCallback === 'function') {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Promise-based confirmation dialog.
   */
  confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const footerHtml = `
        <button class="btn btn-secondary modal-cancel-btn">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">${confirmText}</button>
      `;

      this.open({
        title,
        content: `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`,
        footer: footerHtml,
        size: 'small',
        onOpen: (modalEl) => {
          modalEl.querySelector('.modal-confirm-btn').addEventListener('click', () => {
            this.close();
            resolve(true);
          });
          modalEl.querySelector('.modal-cancel-btn').addEventListener('click', () => {
            this.close();
            resolve(false);
          });
        },
        onClose: () => {
          resolve(false);
        }
      });
    });
  }
}

export const modal = new ModalManager();
