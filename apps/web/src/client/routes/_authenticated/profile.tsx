import { useState, useEffect, useRef } from "react";
import { useProfile, useSaveProfile, useUploadPhoto } from "../../hooks/useProfile";
import type { UserProfile } from "../../types";

const EMPTY: UserProfile = { fullName: "", age: 0, gender: "", heightCm: 0, weightKg: 0, activityLevel: "moderate", units: "lbs" };

export function ProfilePage() {
  const { data, isLoading } = useProfile();
  const save = useSaveProfile();
  const uploadPhoto = useUploadPhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<UserProfile>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (field: keyof UserProfile, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSave() {
    save.mutate(form, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
    });
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      uploadPhoto.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  if (isLoading) return <div className="page"><p className="hint">Loading...</p></div>;

  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="card">
        <div className="form-stack">
          <div className="photo-upload" onClick={() => fileRef.current?.click()}>
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Profile" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
            <span className="photo-label">
              {uploadPhoto.isPending ? "Uploading..." : "Tap to upload photo"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: "none" }}
            />
          </div>

          <label className="form-label">
            Full Name
            <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </label>
          <label className="form-label">
            Age
            <input type="number" value={form.age || ""} onChange={(e) => set("age", Number(e.target.value))} />
          </label>
          <label className="form-label">
            Gender
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="form-label">
            Height (cm)
            <input type="number" value={form.heightCm || ""} onChange={(e) => set("heightCm", Number(e.target.value))} />
          </label>
          <label className="form-label">
            Weight ({form.units || "lbs"})
            <input type="number" value={form.weightKg || ""} onChange={(e) => set("weightKg", Number(e.target.value))} />
          </label>
          <label className="form-label">
            Activity Level
            <select value={form.activityLevel} onChange={(e) => set("activityLevel", e.target.value)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </label>

          <div>
            <span className="form-label-text">Units</span>
            <div className="unit-toggle">
              <button className={form.units === "lbs" ? "active" : ""} onClick={() => set("units", "lbs")}>lbs</button>
              <button className={form.units === "kg" ? "active" : ""} onClick={() => set("units", "kg")}>kg</button>
            </div>
          </div>

          <button className={saved ? "btn-success" : "btn-primary"} onClick={handleSave} disabled={save.isPending}>
            {saved ? "Saved!" : save.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
