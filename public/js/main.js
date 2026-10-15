const grid = document.querySelector('#photo-grid');
const errorNotice = document.querySelector('#gallery-error');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxClose = document.querySelector('#lightbox-close');
const lightboxPrev = document.querySelector('#lightbox-prev');
const lightboxNext = document.querySelector('#lightbox-next');

let photos = [];
let activeIndex = 0;

function startBackgroundMusicOnGesture() {
  const music = document.querySelector('#background-music');
  if (!music) return;

  const events = ['pointerdown', 'touchstart', 'keydown'];
  let started = false;
  let pending = false;

  const start = () => {
    if (started || pending) return;
    pending = true;
    music.volume = 0.38;

    let playback;
    try {
      playback = music.play();
    } catch {
      pending = false;
      return;
    }

    const onStarted = () => {
      started = true;
      pending = false;
      events.forEach((eventName) => document.removeEventListener(eventName, start));
    };

    if (playback && typeof playback.then === 'function') {
      playback.then(onStarted).catch(() => {
        pending = false;
      });
    } else {
      onStarted();
    }
  };

  events.forEach((eventName) => {
    document.addEventListener(eventName, start, { passive: true });
  });
}

startBackgroundMusicOnGesture();

function makePhotoCard(photo, index) {
  const item = document.createElement('figure');
  item.className = 'photo-item';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'photo-item-button';
  button.setAttribute('aria-label', `Foto ${index + 1} — böyük ölçüdə aç`);
  button.addEventListener('click', () => openPhoto(index));

  const image = document.createElement('img');
  image.src = photo.src;
  image.alt = `Yusif və Fatmanın fotosu ${index + 1}`;
  image.width = photo.width;
  image.height = photo.height;
  image.loading = 'lazy';
  image.decoding = 'async';

  button.append(image);
  item.append(button);
  return item;
}

function renderPhotos() {
  const fragment = document.createDocumentFragment();
  photos.forEach((photo, index) => fragment.append(makePhotoCard(photo, index)));
  grid.replaceChildren(fragment);
  grid.setAttribute('aria-busy', 'false');
}

function showPhoto(index) {
  activeIndex = (index + photos.length) % photos.length;
  const photo = photos[activeIndex];
  lightboxImage.src = photo.src;
  lightboxImage.alt = `Yusif və Fatmanın fotosu ${activeIndex + 1}`;
}

function openPhoto(index) {
  if (!photos.length) return;
  showPhoto(index);
  if (!lightbox.open) lightbox.showModal();
}

lightboxClose.addEventListener('click', () => lightbox.close());
lightboxPrev.addEventListener('click', () => showPhoto(activeIndex - 1));
lightboxNext.addEventListener('click', () => showPhoto(activeIndex + 1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
window.addEventListener('keydown', (event) => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
  if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
});

fetch('/data/photos.json')
  .then((response) => {
    if (!response.ok) throw new Error(`Photo manifest returned ${response.status}`);
    return response.json();
  })
  .then((data) => {
    photos = data.filter((photo) => photo.album === '2');
    if (!photos.length) throw new Error('No photos are available');
    renderPhotos();
  })
  .catch((error) => {
    console.error('Could not load the photo catalog:', error);
    grid.setAttribute('aria-busy', 'false');
    grid.replaceChildren();
    errorNotice.hidden = false;
  });
