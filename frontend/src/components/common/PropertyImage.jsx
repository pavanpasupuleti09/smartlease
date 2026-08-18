import AuthenticatedImage from './AuthenticatedImage.jsx';

/**
 * Renders a property photo fetched through the authenticated axios client.
 * Shows a branded SmartLease placeholder while the image loads, if it fails,
 * or when there is no image to show.
 */
export default function PropertyImage({ imageId, alt = '', style, className }) {
  return (
    <div className={`prop-img ${className || ''}`} style={style}>
      {imageId ? (
        <AuthenticatedImage
          imageId={imageId}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          fallback={<Placeholder alt={alt} />}
        />
      ) : (
        <Placeholder alt={alt} />
      )}
    </div>
  );
}

function Placeholder({ alt }) {
  return (
    <div className="prop-img-placeholder" role="img" aria-label={alt || 'Property'}>
      <span className="placeholder-house">🏠</span>
      <span className="placeholder-brand">SmartLease</span>
    </div>
  );
}
