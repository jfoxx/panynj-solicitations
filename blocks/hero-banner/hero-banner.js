export default function decorate(block) {
  // Title-only banner variant: no background image present.
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
