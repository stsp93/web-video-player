const video = document.querySelector('video');
const videoPlayer = document.querySelector('.video-player');
const videoControls = document.querySelector('.video-controls');
const videoTitle = document.querySelector('.video-title');
const videoInput = document.querySelector('.choose-video');
const subsInput = document.querySelector('.choose-subs');

const playBtn = document.querySelector('.play-pause-btn');
const themeBtn = document.querySelector('.theme');
const colorInput = document.querySelector('.color-input');
const rootEl = document.querySelector(':root');
const fullscreenBtn = document.querySelector('.fullscreen-btn');
const pipBtn = document.querySelector('.pip-btn');
const volumeBtn = document.querySelector('.volume-btn');
const volumeSlider = document.querySelector('.volume-slider');
const currentTimeEl = document.querySelector('.current-time');
const totalTimeEl = document.querySelector('.total-time');
const captionsBtn = document.querySelector('.captions-btn');
const replayBtn = document.querySelector('.replay-btn');
const playbackSpeedBtn = document.querySelector('.playback-speed-btn');
const captionsEl = document.querySelector('track');
const timelineContainer = document.querySelector('.timeline-container');
const previewTime = document.querySelector('.preview-time');

if (navigator.userAgent.includes('Firefox')) {
    pipBtn.style.display = 'none'
}

if(localStorage.getItem('volume')) video.volume = localStorage.getItem('volume')


// LISTENERS

// Change Theme

function handleDarkTheme(darkTheme) {
    if(darkTheme) {
        themeBtn.classList.add('dark')
        rootEl.style.setProperty('--background-color','#111');
        rootEl.style.setProperty('--color','#fff');
    } else {
        themeBtn.classList.remove('dark')
        rootEl.style.setProperty('--background-color','#fff');
        rootEl.style.setProperty('--color','#444');
    }
}

let darkTheme = JSON.parse(localStorage.getItem('theme'));
handleDarkTheme(darkTheme)
themeBtn.addEventListener('click', () => {
    darkTheme = !darkTheme;
    localStorage.setItem('theme', darkTheme);
    handleDarkTheme(darkTheme)
})

if(localStorage.getItem('color')) rootEl.style.setProperty('--theme-color', localStorage.getItem('color'))

colorInput.addEventListener('change', (e) => {
    rootEl.style.setProperty('--theme-color', e.target.value)
    localStorage.setItem('color', e.target.value);
})

// Load files

videoInput.addEventListener('change', () => {
    const media = URL.createObjectURL(videoInput.files[0]);
    videoTitle.textContent = videoInput.files[0].name;
    video.src = media
    timelineContainer.style.setProperty('--preview-progress', 0);
    timelineContainer.style.setProperty('--progress-position', 0);
})

subsInput.addEventListener('change', () => {
    captionsEl.src = URL.createObjectURL(subsInput.files[0])
    handleCaptions();
})

document.addEventListener('keydown', (e) => {
    if (e.key === ' ') togglePlay();
    if (e.key === 'ArrowRight') skip(5);
    if (e.key === 'ArrowLeft') skip(-5);
});

// Play functionality

function togglePlay() {
    if (video.getAttribute('src') === '') {
        return videoInput.click()
    }

    video.paused ? video.play() : video.pause();

}

[playBtn, video].forEach(el => {
    el.addEventListener('click', () => {
        togglePlay();
    })
});

video.addEventListener('play', () => {
    videoPlayer.classList.remove('paused');
});
video.addEventListener('pause', () => {
    videoPlayer.classList.add('paused');
});

// Screen functionality

function handleFullscreen() {
    if (document.fullscreenElement == null) {
        if (!navigator.userAgent.includes('Firefox')) {
            document.exitPictureInPicture()
        }
        videoPlayer.requestFullscreen()
        let el = document.querySelector(':focus');
        if (el) el.blur();
    } else {
        document.exitFullscreen()
    }
}

function handlePiP() {
    if (videoPlayer.classList.contains('pip')) {
        document.exitPictureInPicture()
    } else {
        video.requestPictureInPicture();
    }
}

fullscreenBtn.addEventListener('click', handleFullscreen)
video.addEventListener('dblclick', handleFullscreen)

document.addEventListener('fullscreenchange', () => {
    videoPlayer.classList.toggle('fullscreen');
})

video.addEventListener('enterpictureinpicture', () => {
    videoPlayer.classList.add('pip')
})
video.addEventListener('leavepictureinpicture', () => {
    videoPlayer.classList.remove('pip')
})

pipBtn.addEventListener('click', handlePiP)


// Fullscreen cursor/action hide/show

function debounce(func, timeout) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

const functionToRunAfterInactivity = () => {
    if (!video.paused) {
        videoControls.style.opacity = 0
        videoTitle.style.opacity = 0
        video.style.cursor = 'none'
    }
};

document.addEventListener("mousemove", debounce(functionToRunAfterInactivity, 2000));
video.addEventListener("mousemove", () => {
    videoTitle.style.opacity = 1
    videoControls.style.opacity = 1
    video.style.cursor = 'default'

    const captions = video.textTracks[0];

});



// Volume

function handleVolume() {
    video.muted = !video.muted;
}

volumeSlider.addEventListener('input', (e) => {
    video.volume = e.target.value;
    video.muted = e.target.value === 0;
});

volumeBtn.addEventListener('click', handleVolume);

video.addEventListener('volumechange', () => {
    volumeSlider.value = video.volume;
    localStorage.setItem('volume', video.volume)
    let volumeLevel;

    if (video.muted || video.volume === 0) {
        volumeSlider.value = 0
        volumeLevel = 'muted'
    } else if (video.volume > 0.5) {
        volumeLevel = 'high'
    } else {
        volumeLevel = 'low'
    }

    videoPlayer.dataset.volume = volumeLevel;
});

// Duration
function formatVideoTime(inputTime) {
    const seconds = Math.floor(parseFloat(inputTime));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    if (hours === 0) {
        return `${formattedMinutes}:${formattedSeconds}`
    }

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function skip(seconds) {
    video.currentTime += seconds;
    if (video.currentTime !== video.duration) {
        replayBtn.style.display = 'none'
    }
}

video.addEventListener('loadeddata', () => {
    totalTimeEl.textContent = formatVideoTime(video.duration);
});

video.addEventListener('timeupdate', () => {
    currentTimeEl.textContent = formatVideoTime(video.currentTime);
    const percent = video.currentTime / video.duration;
    timelineContainer.style.setProperty('--progress-position', percent);
    if (video.currentTime === video.duration) {
        replayBtn.style.display = 'flex'
    }
})


// CAPTIONS


function handleCaptions() {
    const captions = video.textTracks[0];


    if (captions.mode === 'showing') {
        captions.mode = 'hidden'
        videoPlayer.classList.remove('captions');
    } else {
        captions.mode = 'showing'
        videoPlayer.classList.add('captions');
    }
}


captionsBtn.addEventListener('click', handleCaptions)


// Playback

function changePlaybackSpeed() {
    let newRate = video.playbackRate + 0.25
    if (newRate > 2.5) newRate = 0.5
    video.playbackRate = newRate;
    playbackSpeedBtn.textContent = `${newRate}x`
}

playbackSpeedBtn.addEventListener('click', changePlaybackSpeed)


// Timeline

function handleTimelineUpd(e) {
    const rect = timelineContainer.getBoundingClientRect()
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width

    video.currentTime = video.duration * percent;

    if (isDragging) {
        e.preventDefault()
        timelineContainer.style.setProperty('--progress-position', percent)
    }

    if (video.currentTime !== video.duration) {
        replayBtn.style.display = 'none'
    }
}
let isDragging = false;
function toggleDragging(e) {
    const rect = timelineContainer.getBoundingClientRect()
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width
    isDragging = (e.buttons & 1) === 1
    videoPlayer.classList.toggle('dragging', isDragging)

    if (isDragging) {
        wasPaused = video.paused;
        video.pause()
    } else {
        video.currentTime = percent * video.duration
        if (!wasPaused) video.play();
    }

    handleTimelineUpd(e);
}

function goToTimeline(e) {
    const rect = timelineContainer.getBoundingClientRect()
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width
    timelineContainer.style.setProperty('--progress-position', percent);
    video.currentTime = video.duration * percent;
}

timelineContainer.addEventListener('mousedown', toggleDragging);
document.addEventListener('mouseup', (e) => {
    if (isDragging) toggleDragging(e);
});

timelineContainer.addEventListener('mousemove', (e) => {
    if (isDragging) handleTimelineUpd(e);
    const rect = timelineContainer.getBoundingClientRect()
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width

    timelineContainer.style.setProperty('--preview-progress', percent);
    previewTime.textContent = formatVideoTime(video.duration * percent);
})

// Replay

replayBtn.addEventListener('click', () => {
    replayBtn.style.display = 'none'
    video.currentTime = 0
    video.play()
})

// Save state

