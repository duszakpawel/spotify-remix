(() => {
  let ppCheckbox: HTMLInputElement;
  let ppButton: HTMLButtonElement;
  let ppOffPath: HTMLElement;
  let ppOnPath: HTMLElement;

  let ppRevCheckbox: HTMLInputElement;
  let ppRevButton: HTMLButtonElement;
  let ppRevOffPath: HTMLElement;
  let ppRevOnPath: HTMLElement;

  let sliderInput: HTMLInputElement;
  let sliderMin: HTMLInputElement;
  let sliderMax: HTMLInputElement;
  let speedResetBtn;

  let spsMain: HTMLDivElement;
  let spsControls: HTMLDivElement;

  let icon: HTMLElement;
  let iconSpan: HTMLElement;

  let source: MediaElementAudioSourceNode;
  let audioContext: AudioContext; 
  let convolver: ConvolverNode;
  let showMain = false;
  let reverbInitialized = false;

  const baseCreateElement = document.createElement;
  let spotifyPlaybackEl: HTMLMediaElement | undefined;

  // spotify hides their player in Shadow DOM so this is the only way to grab reference to that control
  document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
    const element = baseCreateElement.apply(document, arguments as any);
    if (tagName === 'video' || tagName === 'audio') {
      spotifyPlaybackEl = element as HTMLMediaElement;
      console.log('Found spotify player element:', spotifyPlaybackEl);
      init();
    }
    return element;
  };

  const injectHtml = (): void => {
    const sps: HTMLElement | null = document.querySelector('#sps');
    if (sps) {
      sps.remove();
    }

    spsControls = document.createElement('div');
    spsControls.id = 'sps-controls';
    spsControls.style.display = 'block';
    spsControls.innerHTML = `
    <div class="sps-common">
      <span class="sps-header">
        Playback Speed
      </span>
      <div style="flex-grow: 1;">
      </div>
    </div>
    <div class="sps-common">
      <span id="sps-speed-min" style="line-height: 32px;">
        0.5x
      </span>
      <input id="sps-input-slider" name="sps-slider" type="range" min="0.5" max="2" step="0.01" style="margin: 0px 0.75rem; background-size: 33.3333% 100%;">
      <span id="sps-speed-max" style="line-height: 32px;">
        2x
      </span>
    </div>
    <div class="sps-common">
      <button id="sps-pp" class="sps-icon-active" style="font-size: 16px; background-color: transparent; display: flex; flex-wrap: nowrap; align-items: center; user-select: none;">
      <input name="sps-pp" type="checkbox" style="display: none">
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1.27rem" height="1.125rem" preserveAspectRatio="xMidYMid meet" viewBox="0 0 576 512">
        <path class="pp-off" fill="currentColor" d="M384 64H192C85.961 64 0 149.961 0 256s85.961 192 192 192h192c106.039 0 192-85.961 192-192S490.039 64 384 64zM64 256c0-70.741 57.249-128 128-128c70.741 0 128 57.249 128 128c0 70.741-57.249 128-128 128c-70.741 0-128-57.249-128-128zm320 128h-48.905c65.217-72.858 65.236-183.12 0-256H384c70.741 0 128 57.249 128 128c0 70.74-57.249 128-128 128z" style="display: none" />
        <path class="pp-on" fill="currentColor" d="M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320c-70.8 0-128-57.3-128-128c0-70.8 57.3-128 128-128c70.8 0 128 57.3 128 128c0 70.8-57.3 128-128 128z" style="display: none" />
      </svg>
      <span style="margin-left: 0.5rem; line-height: 1;">
        Preserve Pitch
      </span>
      </button>
      <div style="flex-grow: 1;">
      </div>
      <button id="sps-reset-btn" class="sps-text-button">1x</button>
    </div>
    <div class="sps-common">
      <button id="sps-pp-rev" class="sps-icon-active" style="font-size: 16px; background-color: transparent; display: flex; flex-wrap: nowrap; align-items: center; user-select: none;">
      <input name="sps-pp-rev" type="checkbox" style="display: none">
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1.27rem" height="1.125rem" preserveAspectRatio="xMidYMid meet" viewBox="0 0 576 512">
        <path class="pp-off-rev" fill="currentColor" d="M384 64H192C85.961 64 0 149.961 0 256s85.961 192 192 192h192c106.039 0 192-85.961 192-192S490.039 64 384 64zM64 256c0-70.741 57.249-128 128-128c70.741 0 128 57.249 128 128c0 70.741-57.249 128-128 128c-70.741 0-128-57.249-128-128zm320 128h-48.905c65.217-72.858 65.236-183.12 0-256H384c70.741 0 128 57.249 128 128c0 70.74-57.249 128-128 128z" style="display: none" />
        <path class="pp-on-rev" fill="currentColor" d="M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320c-70.8 0-128-57.3-128-128c0-70.8 57.3-128 128-128c70.8 0 128 57.3 128 128c0 70.8-57.3 128-128 128z" style="display: none" />
      </svg>
      <span style="margin-left: 0.5rem; line-height: 1;">
        Reverb
      </span>
      </button>
    </div>
    `;

    spsMain = document.createElement('div');
    spsMain.id = 'sps-main';
    spsMain.style.display = 'none';

    spsMain.appendChild(spsControls);

    const spsIcon = document.createElement('div');
    spsIcon.id = 'sps-icon';
    spsIcon.setAttribute('class', 'sps-hover-white');
    spsIcon.innerHTML = `
    <svg preserveAspectRatio="xMidYMid meet" width="2rem" height="2rem" viewBox="0 0 24 24" fill="currentColor" style="padding: 0.375rem;">
      <path d="M13 2.05v2c4.39.54 7.5 4.53 6.96 8.92c-.46 3.64-3.32 6.53-6.96 6.96v2c5.5-.55 9.5-5.43 8.95-10.93c-.45-4.75-4.22-8.5-8.95-8.97v.02M5.67 19.74A9.994 9.994 0 0 0 11 22v-2a8.002 8.002 0 0 1-3.9-1.63l-1.43 1.37m1.43-14c1.12-.9 2.47-1.48 3.9-1.68v-2c-1.95.19-3.81.94-5.33 2.2L7.1 5.74M5.69 7.1L4.26 5.67A9.885 9.885 0 0 0 2.05 11h2c.19-1.42.75-2.77 1.64-3.9M4.06 13h-2c.2 1.96.97 3.81 2.21 5.33l1.42-1.43A8.002 8.002 0 0 1 4.06 13M10 16.5l6-4.5l-6-4.5v9z" fill="currentColor">
      </path>
    </svg>
      <span id="sps-icon-text" style="margin-top: -0.125rem; font-size: 0.6875rem;">
        1.00x
      </span>`;

    const appEl = document.createElement('div');
    appEl.id = 'sps';
    appEl.appendChild(spsMain);
    appEl.appendChild(spsIcon);

    const muteButton: HTMLButtonElement | null = document.querySelector('button[aria-describedby="volume-icon"]');
    if (!muteButton || !muteButton.parentNode || !muteButton.parentNode.parentNode) {
        console.error('Nie można znaleźć przycisku wyciszenia.');
        return;
    }

    const volumeBarContainer: HTMLElement = muteButton.parentNode.parentNode as HTMLElement;

    volumeBarContainer.insertBefore(
      appEl,
      volumeBarContainer.firstChild
    );
  };

  const updatePpRevStyles = () => {
    if (ppRevCheckbox.checked) {
      ppRevButton.classList.add('sps-icon-active');
      ppRevButton.classList.remove('sps-hover-white');
      ppRevOffPath.style.display = 'none';
      ppRevOnPath.style.display = 'block';
    } else {
      ppRevButton.classList.remove('sps-icon-active');
      ppRevButton.classList.add('sps-hover-white');
      ppRevOffPath.style.display = 'block';
      ppRevOnPath.style.display = 'none';
    }
  }

  const setValues = () => {
    const val = Number(sliderInput.value);
    const min = 0.5;
    const max = 2;
    const pp = ppCheckbox.checked;

    iconSpan.innerHTML = `${val.toFixed(2)}x`;
    sliderInput.style.backgroundSize = `${((val - min) * 100) / (max - min)}% 100%`;

    if (pp) {
      ppButton.classList.add('sps-icon-active');
      ppButton.classList.remove('sps-hover-white');
      ppOffPath.style.display = 'none';
      ppOnPath.style.display = 'block';
    } else {
      ppButton.classList.remove('sps-icon-active');
      ppButton.classList.add('sps-hover-white');
      ppOffPath.style.display = 'block';
      ppOnPath.style.display = 'none';
    }

    (spotifyPlaybackEl as any).playbackRate = { source: 'sps', value: val };
    (spotifyPlaybackEl as any).preservesPitch = pp;
  };

  let initReverb = () => {
    audioContext = new AudioContext();
    source = audioContext.createMediaElementSource(spotifyPlaybackEl);
    convolver = audioContext.createConvolver();

    fetch('https://cdn.freesound.org/previews/192/192294_3276562-lq.mp3').then((value) => {
      value.arrayBuffer().then((arrayBufferValue) => {
        audioContext.decodeAudioData(arrayBufferValue, (audioBuffer) => {
          convolver.buffer = audioBuffer;
        });
      });
    });

    source.connect(convolver);
    convolver.connect(audioContext.destination);
  };

  let disableReverbAndCleanup = () => {
    convolver.disconnect();
    
    source.connect(audioContext.destination);
    updatePpRevStyles();
  }
  let enableReverb =() => {
    if(!reverbInitialized){
      initReverb();
    }
    else {
      source.disconnect();
      source.connect(convolver);
      convolver.connect(audioContext.destination);
    }
    reverbInitialized = true;
    updatePpRevStyles();
  }

  const toggleShowMain = () => {
    showMain = !showMain;
    if (showMain) {
      spsMain.style.display = 'block';
    } else {
      spsMain.style.display = 'none';
    }
    document.querySelector('#sps-icon').classList.toggle('sps-icon-active');
  };

  const addJS = () => {
    ppCheckbox = document.querySelector('input[name="sps-pp"]') as HTMLInputElement;
    ppButton = document.querySelector('button#sps-pp') as HTMLButtonElement;
    ppOffPath = document.querySelector('path.pp-off') as HTMLElement;
    ppOnPath = document.querySelector('path.pp-on') as HTMLElement;

    ppRevCheckbox = document.querySelector('input[name="sps-pp-rev"]') as HTMLInputElement;
    ppRevButton = document.querySelector('button#sps-pp-rev') as HTMLButtonElement;
    ppRevOffPath = document.querySelector('path.pp-off-rev') as HTMLElement;
    ppRevOnPath = document.querySelector('path.pp-on-rev') as HTMLElement;

    sliderInput = document.querySelector('input[name="sps-slider"]') as HTMLInputElement;
    sliderMin = document.querySelector('span#sps-speed-min') as HTMLInputElement;
    sliderMax = document.querySelector('span#sps-speed-max') as HTMLInputElement;
    speedResetBtn = document.querySelector('button#sps-reset-btn');

    spsMain = document.querySelector('#sps-main') as HTMLDivElement;
    spsControls = document.querySelector('#sps-controls') as HTMLDivElement;

    icon = document.querySelector('#sps-icon') as HTMLElement;
    iconSpan = document.querySelector('#sps-icon-text') as HTMLElement;

    let lastSpeed = 1;
    let lastPp = true;
    let lastPpRev = false;
    let lastMin = 0.5;
    let lastMax = 2;

    ppCheckbox.checked = lastPp;
    ppRevCheckbox.checked = lastPpRev;

    sliderInput.value = lastSpeed.toString();
    sliderInput.dispatchEvent(new Event('input'));
    sliderInput.min = lastMin.toString();
    sliderInput.max = lastMax.toString();
    sliderMin.innerHTML = `${lastMin}x`;
    sliderMax.innerHTML = `${lastMax}x`;

    sliderInput.oninput = setValues;
    ppCheckbox.oninput = setValues;

    speedResetBtn.onclick = () => {
      if (Number(sliderInput.max) < 1) {
        sliderInput.max = '1';
        sliderMax.innerHTML = `2x`;
      }
      if (Number(sliderInput.min) > 1) {
        sliderInput.min = '1';
        sliderMin.innerHTML = `0.5x`;
      }
      sliderInput.value = '1';
      setValues();
    };
    icon.onclick = toggleShowMain;

    ppButton.onclick = () => {
      ppCheckbox.checked = !ppCheckbox.checked;
      setValues();
    };

    ppRevButton.onclick = () => {
      ppRevCheckbox.checked = !ppRevCheckbox.checked;
      if(ppRevCheckbox.checked) {
        enableReverb();
      } else {
        disableReverbAndCleanup();
      }
    };


    if (spotifyPlaybackEl instanceof HTMLMediaElement) {

      const playbackRateDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate') as PropertyDescriptor;
      Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
        set(value) {
          if (value.source !== 'sps') {
            playbackRateDescriptor.set!.call(this, Number(sliderInput.value));
          } else {
            playbackRateDescriptor.set!.call(this, value.value);
          }
        },
      });
    }

    setValues();
  };

  function init() {
    injectHtml();
    addJS();
    updatePpRevStyles();
  }
})();