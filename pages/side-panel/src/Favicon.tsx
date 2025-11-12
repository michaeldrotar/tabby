type FaviconProps = {
  pageUrl?: string;
  size?: number | string;
} & Pick<React.JSX.IntrinsicElements['img'], 'alt' | 'className'>;

const Favicon = ({ pageUrl, size, ...imageProps }: FaviconProps) => {
  // const pageUrl = "https://www.example.com"; // Replace with the actual page URL
  const src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl || '')}&size=${size || '32'}`;

  const faviconImage = document.createElement('img');
  faviconImage.src = src;
  document.body.appendChild(faviconImage); // Or append it to your desired element
  return (
    <img
      src={src}
      alt="favicon"
      {...imageProps}
      style={{ ...(size ? { height: `${size}px`, width: `${size}px` } : {}) }}
    />
  );
};

export { Favicon };
