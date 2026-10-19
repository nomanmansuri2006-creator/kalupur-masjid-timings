// ==============================================================================
// TOAST NOTIFICATION UTILITY
// ==============================================================================

export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Detect and translate technical network errors
  let friendlyMessage = message || '';
  if (
    typeof friendlyMessage === 'string' &&
    (friendlyMessage.includes('Failed to fetch') ||
      friendlyMessage.includes('NetworkError') ||
      friendlyMessage.includes('fetch'))
  ) {
    friendlyMessage = `Cannot reach Supabase database (${message}). Please check your internet connection and verify your configuration in js/config.js.`;
    duration = 7000;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const textSpan = document.createElement('span');
  textSpan.textContent = friendlyMessage;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#ffffff';
  closeBtn.style.fontSize = '1.2rem';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '0 0.25rem';
  closeBtn.onclick = () => {
    toast.remove();
  };

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}
