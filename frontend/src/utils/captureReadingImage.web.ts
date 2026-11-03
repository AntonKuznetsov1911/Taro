import type { View } from 'react-native';
import html2canvas from 'html2canvas';

export async function captureReadingImage(view: View, width: number, height: number): Promise<string> {
  const element = view as unknown as HTMLElement;
  const sourceNodes = [element, ...element.querySelectorAll<HTMLElement>('*')];
  const canvas = await html2canvas(element, {
    logging: false,
    scale: width / element.getBoundingClientRect().width,
    onclone: (_document, clone) => {
      // React Native Web inserts style rules at runtime. Keep the computed
      // styles when the preview is moved into the capture document.
      const clonedNodes = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
      sourceNodes.forEach((node, index) => {
        const computed = getComputedStyle(node);
        const target = clonedNodes[index];
        for (const property of computed) {
          target.style.setProperty(property, computed.getPropertyValue(property));
        }
      });
    },
  });
  const image = document.createElement('canvas');
  image.width = width;
  image.height = height;
  const context = image.getContext('2d');
  if (!context) throw new Error('Cannot create an image canvas');
  context.drawImage(canvas, 0, 0, width, height);
  return image.toDataURL('image/png');
}
