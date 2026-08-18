import { useEffect, useMemo, useState } from 'react';
import PropertyImage from '../../components/common/PropertyImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/format.js';

const REQUEST_LABEL = {
  PENDING: 'Requested',
  ACCEPTED: 'Accepted',
  REJECTED: 'Request Again',
};

export default function PropertyDetailsModal({ property, images = [], requestState, busy, onRequest, onClose }) {
  const [activeId, setActiveId] = useState(null);

  // Default to the primary image (or the first one) whenever the modal opens.
  useEffect(() => {
    if (images.length) {
      const primary = images.find((i) => i.primary) || images[0];
      setActiveId(primary.id);
    } else {
      setActiveId(null);
    }
  }, [property?.id, images]);

  const activeImage = images.find((i) => i.id === activeId) || images[0] || null;
  const ordered = useMemo(
    () => [...images].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0) || a.sortOrder - b.sortOrder),
    [images]
  );

  if (!property) return null;

  const requested = Boolean(requestState);
  const canRequest = Boolean(property.ownerId) && !requested && requestState !== 'ACCEPTED';
  const index = ordered.findIndex((i) => i.id === activeImage?.id);

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{property.propertyName}</div>
            <div className="card-subtitle">
              {[property.address, property.city, property.state, property.pincode]
                .filter(Boolean)
                .join(', ') || 'Location not specified'}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Gallery */}
        <div className="gallery mt-16">
          <div className="gallery-main">
            <PropertyImage imageId={activeImage?.id} alt={property.propertyName} style={{ height: 300 }} />
            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav gallery-prev"
                  onClick={() => setActiveId(ordered[(index - 1 + ordered.length) % ordered.length].id)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gallery-nav gallery-next"
                  onClick={() => setActiveId(ordered[(index + 1) % ordered.length].id)}
                >
                  ›
                </button>
              </>
            )}
          </div>
          {ordered.length > 1 && (
            <div className="gallery-thumbs">
              {ordered.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`gallery-thumb ${img.id === activeImage?.id ? 'active' : ''}`}
                  onClick={() => setActiveId(img.id)}
                >
                  <PropertyImage imageId={img.id} alt={img.filename} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-list mt-24">
          <div className="detail-item">
            <div className="detail-label">Monthly Rent</div>
            <div className="detail-value">{formatCurrency(property.monthlyRent)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Security Deposit</div>
            <div className="detail-value">{formatCurrency(property.securityDeposit)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Property Type</div>
            <div className="detail-value"><StatusBadge value={property.propertyType} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Furnishing</div>
            <div className="detail-value"><StatusBadge value={property.furnishing} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Bedrooms</div>
            <div className="detail-value">{property.bedrooms ?? '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Bathrooms</div>
            <div className="detail-value">{property.bathrooms ?? '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Area</div>
            <div className="detail-value">{property.areaSqft ? `${property.areaSqft} sq.ft` : '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Total Units</div>
            <div className="detail-value">{property.totalUnits ?? '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><StatusBadge value={property.status} /></div>
          </div>
        </div>

        {property.description && <p className="muted mt-16">{property.description}</p>}

        <div className="modal-actions mt-24">
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Close
          </button>
          <button
            className="btn btn-primary"
            disabled={busy || !canRequest}
            title={
              !property.ownerId
                ? 'This property is not accepting requests'
                : requestState === 'ACCEPTED'
                  ? 'Request already accepted'
                  : requested
                    ? 'A request is already pending for this property'
                    : undefined
            }
            onClick={() => onRequest(property)}
          >
            {busy ? 'Sending…' : requested ? REQUEST_LABEL[requestState] : 'Request to Rent'}
          </button>
        </div>
      </div>
    </div>
  );
}
