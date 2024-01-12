var scriptElement = document.createElement('script');
scriptElement.src = chrome.runtime.getURL('background.js');
document.body.appendChild(scriptElement);

var linkElement = document.createElement('link');
linkElement.setAttribute('rel', 'stylesheet');
linkElement.setAttribute('href', chrome.runtime.getURL('styles.css'));
document.head.appendChild(linkElement);

console.log('Injected background.js in spotify tab');