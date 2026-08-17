import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { propertyService, propertyImageService } from '../../services/propertyService.js';
import AuthenticatedImage from '../../components/common/AuthenticatedImage.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function OwnerPropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([propertyService.getById(id), propertyImageService.getByProperty(id)])
      .then(([p, imgs]) => {
        setProperty(p.data);
        setImages(imgs.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading property…" />;
  if (error) return <ErrorState message={error} />;
  if (!property) return <ErrorState message="Property not found." />;

  const primaryImage = images.find((i) => i.primary) || images[0];

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title">{property.propertyName}</div>
        <div className="card-subtitle">
          {[property.address, property.city, property.state, property.pincode].filter(Boolean).join(', ')}
        </div>

        {primaryImage && (
          <AuthenticatedImage
            imageId={primaryImage.id}
            alt={property.propertyName}
            style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 16, display: 'block' }}
          />
        )}

        <div className="detail-list mt-16">
          <div className="detail-item">
            <div className="detail-label">Monthly Rent</div>
            <div className="detail-value">{formatCurrency(property.monthlyRent)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Deposit</div>
            <div className="detail-value">{formatCurrency(property.securityDeposit)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><StatusBadge value={property.status} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Type</div>
            <div className="detail-value"><StatusBadge value={property.propertyType} /></div>
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
            <div className="detail-label">Units</div>
            <div className="detail-value">{property.totalUnits ?? '—'}</div>
          </div>
        </div>

        {property.description && <p className="muted mt-16">{property.description}</p>}

        <div className="flex gap-8 mt-24">
          <Link className="btn btn-primary" to={`/app/owner/properties/${property.id}/edit`}>
            Edit Property
          </Link>
          <Link className="btn btn-secondary" to="/app/owner/properties">
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Owner</div>
        <div className="detail-list mt-16">
          <div className="detail-item">
            <div className="detail-label">Owner Name</div>
            <div className="detail-value">{property.ownerName || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Owner ID</div>
            <div className="detail-value">#{property.ownerId || '—'}</div>
          </div>
        </div>
        <hr className="section-divider" />
        <div className="card-title">Images</div>
        <div className="card-subtitle">{images.length} image(s) uploaded</div>
        {images.length === 0 ? (
          <div className="alert alert-info mt-16">No images uploaded for this property.</div>
        ) : (
          <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
            {images.map((img) => (
              <AuthenticatedImage
                key={img.id}
                imageId={img.id}
                alt={img.filename}
                style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
