import { useEffect, useMemo, useRef, useState } from 'react';
import PropertyImage from '../../components/common/PropertyImage.jsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — matches the backend limit
const MAX_IMAGES = 10; // matches the backend limit

export default function PhotoUploader({
  existing = [],
  newFiles = [],
  onAddFiles,
  onRemoveNew,
  onRemoveExisting,
  onSetPrimary,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  const objectUrls = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => () => objectUrls.forEach((u) => URL.revokeObjectURL(u)), [objectUrls]);

  const atLimit = existing.length + newFiles.length >= MAX_IMAGES;

  const acceptFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const problems = [];
    const accepted = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        problems.push(`"${f.name}" is not an allowed image type. Use JPG, PNG, WEBP or GIF.`);
        continue;
      }
      if (f.size > MAX_SIZE_BYTES) {
        problems.push(`"${f.name}" exceeds the 5 MB size limit.`);
        continue;
      }
      const duplicate = [...newFiles, ...accepted].some(
        (x) => x.name === f.name && x.size === f.size
      );
      if (duplicate) {
        problems.push(`"${f.name}" is already added.`);
        continue;
      }
      if (existing.length + newFiles.length + accepted.length >= MAX_IMAGES) {
        problems.push(`You can upload at most ${MAX_IMAGES} photos per property.`);
        break;
      }
      accepted.push(f);
    }

    setErrors(problems);
    if (accepted.length) onAddFiles(accepted);
  };

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled && !atLimit) acceptFiles(e.dataTransfer.files);
  };

  return (
    <div className="form-group">
      <label className="form-label">Property Photos</label>

      <div
        className={`dropzone ${dragOver ? 'dragover' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon">🖼️</div>
        <div className="dropzone-title">Drag &amp; drop photos here</div>
        <div className="form-hint">JPG, PNG, WEBP or GIF · up to 5 MB each · max {MAX_IMAGES} photos</div>
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-8"
          onClick={openPicker}
          disabled={disabled || atLimit}
        >
          {atLimit ? 'Photo limit reached' : 'Choose Photos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="hidden-input"
          onChange={(e) => {
            acceptFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error mt-8" style={{ marginBottom: 0 }}>
          {errors.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}

      {(existing.length > 0 || newFiles.length > 0) && (
        <div className="photo-grid mt-16">
          {existing.map((img) => (
            <div className="photo-preview" key={img.id}>
              <PropertyImage imageId={img.id} alt={img.filename} style={{ height: 88 }} />
              {img.primary && <span className="photo-cover">Cover</span>}
              <div className="photo-actions">
                {!img.primary && (
                  <button
                    type="button"
                    className="photo-btn"
                    title="Make cover photo"
                    disabled={disabled}
                    onClick={() => onSetPrimary(img.id)}
                  >
                    ⭐
                  </button>
                )}
                <button
                  type="button"
                  className="photo-btn photo-btn-remove"
                  title="Remove photo"
                  disabled={disabled}
                  onClick={() => onRemoveExisting(img)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {newFiles.map((file, i) => (
            <div className="photo-preview" key={`${file.name}-${file.size}-${i}`}>
              <img src={objectUrls[i]} alt={file.name} style={{ width: '100%', height: 88, objectFit: 'cover' }} />
              <span className="photo-new">New</span>
              <div className="photo-actions">
                <button
                  type="button"
                  className="photo-btn photo-btn-remove"
                  title="Remove photo"
                  disabled={disabled}
                  onClick={() => onRemoveNew(i)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
