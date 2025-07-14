export class LoadingSpinnerComponent {
  static createSpinner(): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = 'translation-spinner';
    spinner.innerHTML = `
      <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="20" height="20">
        <circle class="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="50 30"></circle>
      </svg>
    `;
    return spinner;
  }
} 