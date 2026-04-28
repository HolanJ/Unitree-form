export default function PhotoUpload({ photos, setPhotos }) {
  const readPhoto = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, src: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (event) => {
    const files = [...event.target.files].slice(0, 12 - photos.length);
    const loaded = await Promise.all(files.map(readPhoto));
    setPhotos([...photos, ...loaded]);
    event.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <section className="paper-card">
      <div className="section-heading">
        <h3>Fotodokumentace</h3>
        <label className="file-button no-print">
          Přidat fotografie
          <input className="hidden" type="file" accept="image/*" multiple onChange={handleUpload} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.length === 0 ? (
          <p className="col-span-full rounded-lg border border-dashed border-mint-300 bg-white/60 p-5 text-center text-sm text-slate-500">
            Zatím nejsou přiložené žádné fotografie.
          </p>
        ) : (
          photos.map((photo, index) => (
            <article key={`${photo.name}-${index}`} className="overflow-hidden rounded-lg border border-mint-200 bg-white">
              <img className="aspect-[4/3] w-full object-cover" src={photo.src} alt={`Fotodokumentace ${index + 1}`} />
              <footer className="flex items-center justify-between gap-2 p-2 text-xs text-slate-500">
                <span className="truncate">{photo.name}</span>
                <button className="link-danger no-print" type="button" onClick={() => removePhoto(index)}>
                  Odebrat
                </button>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
