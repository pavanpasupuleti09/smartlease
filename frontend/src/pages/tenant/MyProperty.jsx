import { useEffect, useState } from 'react';
import { useTenantData } from '../../hooks/useTenantData.js';
import { propertyImageService } from '../../services/propertyService.js';
import AuthenticatedImage from '../../components/common/AuthenticatedImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function MyProperty() {
  const { lease, property, loading, error, refetch } = useTenantData();
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (property) {
      propertyImageService
        .getByProperty(property.id)
        .then((res) => setImages(res.data || []))
        .catch(() => setImages([]));
    }
  }, [property]);

  if (loading) return <LoadingSpinner label="Loading your property…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  if (!property || !lease) {
    return (
      <div className="card">
        <div className="state-block">
          <div className="state-icon">🏠</div>
          <div className="state-title">No property assigned</div>
          <div className="state-sub">You don&apos;t have an active lease yet.</div>
        </div>
      </div>
    );
  }

  const primaryImage = images.find((i) => i.primary) || images[0];

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">{property.propertyName}</div>
        <div className="card-subtitle">
          {[property.address, property.city, property.state, property.pincode]
            .filter(Boolean)
            .join(', ')}
        </div>

        {primaryImage && (
          <AuthenticatedImage
            imageId={primaryImage.id}
            alt={property.propertyName}
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              borderRadius: 8,
              marginBottom: 16,
              display: 'block',
            }}
          />
        )}

        <div className="detail-list mt-16">
          <div className="detail-item">
            <div className="detail-label">Monthly Rent</div>
            <div className="detail-value">{formatCurrency(property.monthlyRent)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Deposit</div>
            <div className="detail-value">{formatCurrency(lease.securityDeposit)}</div>
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
            <div className="detail-value">
              {property.areaSqft ? `${property.areaSqft} sq.ft` : '—'}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Type</div>
            <div className="detail-value"><StatusBadge value={property.propertyType} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Furnishing</div>
            <div className="detail-value"><StatusBadge value={property.furnishing} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Total Units</div>
            <div className="detail-value">{property.totalUnits ?? '—'}</div>
          </div>
        </div>

        {property.description && (
          <p className="muted mt-16">{property.description}</p>
        )}
      </div>

      <div>
        <div className="card mb-16">
          <div className="card-title">Lease Information</div>
          <div className="card-subtitle">Your current lease agreement</div>
          <div className="detail-list mt-16">
            <div className="detail-item">
              <div className="detail-label">Status</div>
              <div className="detail-value"><StatusBadge value={lease.status} /></div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Start Date</div>
              <div className="detail-value">{formatDate(lease.startDate)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">End Date</div>
              <div className="detail-value">{formatDate(lease.endDate)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Monthly Rent</div>
              <div className="detail-value">{formatCurrency(lease.monthlyRent)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Owner Information</div>
          <div className="card-subtitle">
            {property.ownerName || 'Owner details not available'}
          </div>
          {property.ownerId && (
            <div className="detail-list mt-16">
              <div className="detail-item">
                <div className="detail-label">Owner ID</div>
                <div className="detail-value">#{property.ownerId}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
