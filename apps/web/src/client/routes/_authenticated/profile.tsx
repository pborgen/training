import { useState, useEffect } from "react";
import { useProfile, useSaveProfile } from "../../hooks/useProfile";
import type { UserProfile } from "../../types";

const EMPTY: UserProfile = { fullName: "", age: 0, gender: "", heightCm: 0, weightKg: 0, activityLevel: "moderate", units: "lbs" };

export function ProfilePage() {
  const { data, isLoading } = useProfile();
  const save = useSaveProfile();
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

  if (isLoading) return <div className="page"><p className="hint">Loading...</p></div>;

  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="card">
        <div className="form-stack">
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
