import { useEffect, useState } from 'react';
import api from '../../services/api.js';

/**
 * The backend requires authentication on image-file endpoints, so a plain <img>
 * tag (which cannot send the Authorization header) would get a 401. This
 * component fetches the file through the axios client and renders an object URL.
 */
export default function AuthenticatedImage({ imageId, alt = '', style, fallback = null }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);

    api
      .get(`/properties/images/${imageId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (failed) return fallback;
  // While the authenticated fetch is in flight, render the fallback (if any)
  // so callers can show a placeholder instead of an empty gap.
  if (!url) return fallback;
  return <img src={url} alt={alt} style={style} />;
}
