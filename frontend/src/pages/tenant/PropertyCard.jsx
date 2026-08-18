import PropertyImage from '../../components/common/PropertyImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/format.js';

/**
 * Request button state derived from the tenant's existing requests for this
 * property: null (not requested), PENDING, ACCEPTED, REJECTED.
 */
const REQUEST_LABEL = {
  PENDING: 'Requested',
  ACCEPTED: 'Accepted',
  REJECTED: 'Request Again',
};

export default function PropertyCard({ property, images = [], requestState, busy, onView, onRequest }) {
  const requested = Boolean(requestState);
  const canRequest = Boolean(property.ownerId) && !requested && requestState !== 'ACCEPTED';
  const primaryImage = images.find((i) => i.primary) || images[0] || null;

  return (
    <div className="property-card">
      <PropertyImage
        imageId={primaryImage?.id}
        alt={property.propertyName}
        className="thumb"
        style={{ height: 150 }}
      />

      <div className="body">
        <div className="prop-name">{property.propertyName}</div>
        <div className="prop-address">
          {[property.city, property.state].filter(Boolean).join(', ') || 'Location not specified'}
        </div>

        <div className="prop-rent">
          {formatCurrency(property.monthlyRent)}
          <span className="prop-rent-per">/mo</span>
        </div>
        <div className="prop-meta">
          <span title="Property type"><StatusBadge value={property.propertyType} /></span>
          <span title="Furnishing"><StatusBadge value={property.furnishing} /></span>
        </div>
        <div className="prop-facts">
          {property.bedrooms != null && <span>🛏 {property.bedrooms} BHK</span>}
          {property.bathrooms != null && <span>🛁 {property.bathrooms} Bath</span>}
          {property.areaSqft != null && <span>📐 {property.areaSqft} sq.ft</span>}
          {property.securityDeposit != null && (
            <span className="prop-deposit">Deposit {formatCurrency(property.securityDeposit)}</span>
          )}
        </div>
        {property.description && <p className="prop-desc">{property.description}</p>}
      </div>

      <div className="actions">
        <button className="btn btn-secondary btn-sm" onClick={() => onView(property)}>
          View Details
        </button>
        <button
          className="btn btn-primary btn-sm"
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
  );
}
