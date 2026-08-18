import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyService, propertyImageService } from '../../services/propertyService.js';
import { useToast } from '../../context/ToastContext.jsx';
import PhotoUploader from './PhotoUploader.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const EMPTY = {
  propertyName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  totalUnits: '',
  monthlyRent: '',
  securityDeposit: '',
  description: '',
  propertyType: 'APARTMENT',
  bedrooms: '',
  bathrooms: '',
  furnishing: 'UNFURNISHED',
  areaSqft: '',
};

const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function PropertyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Photos
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([propertyService.getById(id), propertyImageService.getByProperty(id)])
      .then(([p, imgs]) => {
        const prop = p.data;
        setForm({
          propertyName: prop.propertyName || '',
          address: prop.address || '',
          city: prop.city || '',
          state: prop.state || '',
          pincode: prop.pincode || '',
          totalUnits: prop.totalUnits ?? '',
          monthlyRent: prop.monthlyRent ?? '',
          securityDeposit: prop.securityDeposit ?? '',
          description: prop.description || '',
          propertyType: prop.propertyType || 'APARTMENT',
          bedrooms: prop.bedrooms ?? '',
          bathrooms: prop.bathrooms ?? '',
          furnishing: prop.furnishing || 'UNFURNISHED',
          areaSqft: prop.areaSqft ?? '',
        });
        setExistingImages(imgs.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const uploadNewPhotos = async (propertyId) => {
    if (!newFiles.length) return null;
    const hasCover = existingImages.some((img) => img.primary);
    let firstError = null;
    for (let i = 0; i < newFiles.length; i++) {
      setUploadProgress({ current: i + 1, total: newFiles.length });
      try {
        await propertyImageService.upload(
          propertyId,
          newFiles[i],
          // First photo becomes the cover when there is no cover yet.
          i === 0 && !hasCover
        );
      } catch (err) {
        firstError = firstError || err.message;
        break;
      }
    }
    setUploadProgress(null);
    return firstError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload = {
      propertyName: form.propertyName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      // total_units is NOT NULL in the backend schema; default to 1 when blank.
      totalUnits: toNum(form.totalUnits) ?? 1,
      monthlyRent: toNum(form.monthlyRent),
      securityDeposit: toNum(form.securityDeposit),
      description: form.description.trim(),
      propertyType: form.propertyType,
      bedrooms: toNum(form.bedrooms),
      bathrooms: toNum(form.bathrooms),
      furnishing: form.furnishing,
      areaSqft: toNum(form.areaSqft),
    };
    try {
      let propertyId;
      if (isEdit) {
        await propertyService.update(id, payload);
        propertyId = id;
        toast.success('Property updated.');
      } else {
        const res = await propertyService.create(payload);
        propertyId = res.data.id;
        toast.success('Property created.');
      }

      const uploadError = await uploadNewPhotos(propertyId);
      if (uploadError) {
        toast.error(`Property saved, but some photos could not be uploaded: ${uploadError}`);
      }
      navigate('/app/owner/properties');
    } catch (err) {
      setError(err.message || 'Could not save property.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveExisting = async () => {
    if (!deleteTarget) return;
    setImageBusy(true);
    try {
      await propertyImageService.remove(deleteTarget.id);
      setExistingImages((imgs) => imgs.filter((img) => img.id !== deleteTarget.id));
      toast.success('Photo removed.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Could not remove photo.');
    } finally {
      setImageBusy(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    setImageBusy(true);
    try {
      await propertyImageService.setPrimary(imageId);
      setExistingImages((imgs) =>
        imgs.map((img) => ({ ...img, primary: img.id === imageId }))
      );
      toast.success('Cover photo updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update cover photo.');
    } finally {
      setImageBusy(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading property…" />;

  const savingLabel =
    uploadProgress && uploadProgress.total > 0
      ? `Uploading photos (${uploadProgress.current}/${uploadProgress.total})…`
      : busy
        ? 'Saving…'
        : isEdit
          ? 'Save Changes'
          : 'Create Property';

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="card-title">{isEdit ? 'Edit Property' : 'Add Property'}</div>
      <div className="card-subtitle">
        {isEdit ? 'Update the details of your property.' : 'List a new property on SmartLease.'}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Property name *</label>
          <input name="propertyName" className="form-control" value={form.propertyName} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Address</label>
            <input name="address" className="form-control" value={form.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input name="pincode" className="form-control" value={form.pincode} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input name="city" className="form-control" value={form.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input name="state" className="form-control" value={form.state} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monthly Rent (₹) *</label>
            <input name="monthlyRent" type="number" min="0" step="0.01" className="form-control" value={form.monthlyRent} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Security Deposit (₹)</label>
            <input name="securityDeposit" type="number" min="0" step="0.01" className="form-control" value={form.securityDeposit} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Property Type</label>
            <select name="propertyType" className="form-control" value={form.propertyType} onChange={handleChange}>
              <option value="APARTMENT">Apartment</option>
              <option value="INDEPENDENT_HOUSE">Independent House</option>
              <option value="VILLA">Villa</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="PG_HOSTEL">PG / Hostel</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Furnishing</label>
            <select name="furnishing" className="form-control" value={form.furnishing} onChange={handleChange}>
              <option value="FURNISHED">Furnished</option>
              <option value="SEMI_FURNISHED">Semi-furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bedrooms</label>
            <input name="bedrooms" type="number" min="0" className="form-control" value={form.bedrooms} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Bathrooms</label>
            <input name="bathrooms" type="number" min="0" className="form-control" value={form.bathrooms} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Total Units</label>
            <input name="totalUnits" type="number" min="0" className="form-control" value={form.totalUnits} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Area (sq.ft)</label>
            <input name="areaSqft" type="number" min="0" className="form-control" value={form.areaSqft} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={form.description} onChange={handleChange} />
        </div>

        <hr className="section-divider" />
        <PhotoUploader
          existing={existingImages}
          newFiles={newFiles}
          disabled={busy}
          onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
          onRemoveNew={(index) => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
          onRemoveExisting={(img) => setDeleteTarget(img)}
          onSetPrimary={handleSetPrimary}
        />

        <div className="flex gap-8 mt-16">
          <button className="btn btn-primary" disabled={busy || imageBusy}>
            {savingLabel}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/app/owner/properties')} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove photo?"
        message={`This will permanently delete "${deleteTarget?.filename || 'this photo'}". This action cannot be undone.`}
        danger
        busy={imageBusy}
        onConfirm={handleRemoveExisting}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
