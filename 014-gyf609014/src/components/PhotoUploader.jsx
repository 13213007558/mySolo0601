import { useRef, useState } from 'react';

export default function PhotoUploader({ photos = [], onChange, maxPhotos = 5 }) {
  const inputRef = useRef(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - photos.length;
    const toAdd = files.slice(0, remaining);

    Promise.all(
      toAdd.map(file =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        })
      )
    ).then(newPhotos => {
      onChange && onChange([...photos, ...newPhotos]);
    });

    e.target.value = '';
  };

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange && onChange(updated);
  };

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-item">
            <img
              src={photo}
              alt={`照片${index + 1}`}
              className="photo-thumb"
              onClick={() => setPreviewPhoto(photo)}
            />
            <button
              type="button"
              className="photo-remove"
              onClick={() => removePhoto(index)}
              title="删除"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <div className="photo-add" onClick={() => inputRef.current?.click()}>
            <span className="add-icon">+</span>
            <span className="add-text">添加照片</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="photo-input"
        onChange={handleFileChange}
      />

      {previewPhoto && (
        <div className="photo-preview-modal" onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto} alt="预览" className="preview-image" />
          <button className="preview-close" onClick={() => setPreviewPhoto(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
