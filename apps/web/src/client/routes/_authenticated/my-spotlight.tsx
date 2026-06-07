import { useState, useEffect, useRef } from "react";
import { useMySpotlight, useSaveMySpotlight } from "../../hooks/useCoaches";
import type { CoachSpotlight, CoachPlan, CoachMedia } from "../../types";

const EMPTY: CoachSpotlight = {
  email: "", fullName: "", photoUrl: "", tagline: "", bio: "",
  specialties: [], certifications: [], yearsExperience: 0,
  coverPhoto: "", accentColor: "", socials: {}, plans: [], gallery: [], published: false,
};

function newPlan(): CoachPlan {
  return { id: crypto.randomUUID(), name: "", price: 0, cadence: "month", description: "", features: [], popular: false };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
}

function ChipEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (next: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) { setDraft(""); return; }
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <div className="form-label">
      <span>{label}</span>
      <div className="chip-input-row">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn-secondary chip-add-btn" onClick={add}>Add</button>
      </div>
      {items.length > 0 && (
        <div className="coach-chips coach-chips-editable">
          {items.map((it) => (
            <span key={it} className="coach-chip">
              {it}
              <button type="button" className="coach-chip-x" onClick={() => onChange(items.filter(x => x !== it))} aria-label={`Remove ${it}`}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanEditor({ plans, onChange }: { plans: CoachPlan[]; onChange: (next: CoachPlan[]) => void }) {
  const update = (i: number, patch: Partial<CoachPlan>) =>
    onChange(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(plans.filter((_, idx) => idx !== i));

  return (
    <div className="form-label">
      <span>Plans &amp; Pricing</span>
      <div className="plan-editor-list">
        {plans.map((plan, i) => (
          <div key={plan.id} className={`plan-editor-card ${plan.popular ? "is-popular" : ""}`}>
            <div className="plan-editor-head">
              <input
                className="plan-editor-name"
                value={plan.name}
                placeholder="Plan name (e.g. Momentum)"
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <button type="button" className="coach-chip-x" aria-label="Remove plan" onClick={() => remove(i)}>×</button>
            </div>
            <div className="plan-editor-price-row">
              <span className="plan-editor-dollar">$</span>
              <input
                type="number"
                min={0}
                value={plan.price || ""}
                placeholder="0"
                onChange={(e) => update(i, { price: Number(e.target.value) })}
              />
              <span>/</span>
              <select value={plan.cadence} onChange={(e) => update(i, { cadence: e.target.value })}>
                <option value="month">month</option>
                <option value="week">week</option>
                <option value="session">session</option>
                <option value="program">program</option>
              </select>
            </div>
            <input
              value={plan.description}
              placeholder="One-line description"
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <ChipEditor
              label="Features"
              items={plan.features}
              placeholder="e.g. Weekly check-ins"
              onChange={(v) => update(i, { features: v })}
            />
            <label className="plan-editor-popular">
              <input type="checkbox" checked={plan.popular} onChange={(e) => update(i, { popular: e.target.checked })} />
              Highlight as “Most popular”
            </label>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary chip-add-btn" onClick={() => onChange([...plans, newPlan()])}>
        + Add plan
      </button>
    </div>
  );
}

function GalleryEditor({ gallery, onChange }: { gallery: CoachMedia[]; onChange: (next: CoachMedia[]) => void }) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const update = (i: number, patch: Partial<CoachMedia>) =>
    onChange(gallery.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => onChange(gallery.filter((_, idx) => idx !== i));

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 2 * 1024 * 1024) { alert(`${file.name} is over 2MB`); return; }
      const reader = new FileReader();
      reader.onload = () => onChange([...gallery, { type: "photo", url: reader.result as string, caption: "" }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function addVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    onChange([...gallery, { type: "video", url, caption: "" }]);
    setVideoUrl("");
  }

  return (
    <div className="form-label">
      <span>Gallery — photos &amp; videos</span>
      <div className="gallery-add-row">
        <button type="button" className="btn-secondary" onClick={() => photoRef.current?.click()}>+ Photo</button>
        <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: "none" }} />
        <input
          className="gallery-video-input"
          value={videoUrl}
          placeholder="Paste a YouTube / Vimeo / video URL"
          onChange={(e) => setVideoUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVideo(); } }}
        />
        <button type="button" className="btn-secondary chip-add-btn" onClick={addVideo}>Add video</button>
      </div>
      {gallery.length > 0 && (
        <div className="gallery-editor-grid">
          {gallery.map((m, i) => (
            <div key={i} className="gallery-editor-item">
              {m.type === "photo"
                ? <img src={m.url} alt="" />
                : <div className="gallery-editor-video">▷ <span>{m.url}</span></div>}
              <input
                value={m.caption}
                placeholder="Caption"
                onChange={(e) => update(i, { caption: e.target.value })}
              />
              <button type="button" className="coach-chip-x gallery-editor-x" aria-label="Remove" onClick={() => remove(i)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MySpotlightPage() {
  const { data, isLoading } = useMySpotlight();
  const save = useSaveMySpotlight();
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CoachSpotlight>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const set = <K extends keyof CoachSpotlight>(field: K, value: CoachSpotlight[K]) =>
    setForm((f) => ({ ...f, [field]: value }));
  const setSocial = (key: keyof CoachSpotlight["socials"], value: string) =>
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }));

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => set("coverPhoto", reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSave() {
    save.mutate(form, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } });
  }

  if (isLoading) return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-card" />
    </div>
  );

  const accent = form.accentColor || "var(--accent)";

  return (
    <div className="page my-spotlight" style={{ ["--coach-accent" as string]: accent }}>
      <h1>My Spotlight</h1>
      <p className="coaches-sub" style={{ marginTop: -4 }}>
        This is how you advertise yourself to the gym. Toggle <strong>Published</strong> to appear in the coach showcase.
      </p>

      <div className="spotlight-layout">
        {/* Editor */}
        <div className="card">
          <div className="form-stack">
            <div className="publish-row">
              <div>
                <span className="form-label-text">Published</span>
                <span className="publish-hint">{form.published ? "Visible in the showcase" : "Hidden — only you can see this"}</span>
              </div>
              <button
                type="button"
                className={`spotlight-toggle ${form.published ? "on" : ""}`}
                onClick={() => set("published", !form.published)}
                aria-pressed={form.published}
              >
                <span className="spotlight-knob" />
              </button>
            </div>

            <div className="cover-upload" onClick={() => coverRef.current?.click()}>
              {form.coverPhoto
                ? <img src={form.coverPhoto} alt="Cover" className="cover-preview" />
                : <div className="cover-placeholder">Tap to upload a hero / cover image</div>}
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
            </div>
            {form.coverPhoto && (
              <button type="button" className="btn-link cover-remove" onClick={() => set("coverPhoto", "")}>Remove cover</button>
            )}

            <label className="form-label">
              Tagline
              <input value={form.tagline} maxLength={120} placeholder="Building unbreakable athletes…" onChange={(e) => set("tagline", e.target.value)} />
            </label>

            <label className="form-label">
              Bio
              <textarea rows={6} value={form.bio} placeholder="Tell clients who you are and how you train." onChange={(e) => set("bio", e.target.value)} />
            </label>

            <ChipEditor label="Specialties" items={form.specialties} placeholder="e.g. Strength" onChange={(v) => set("specialties", v)} />
            <ChipEditor label="Certifications" items={form.certifications} placeholder="e.g. NASM-CPT" onChange={(v) => set("certifications", v)} />

            <label className="form-label">
              Years of experience
              <input type="number" min={0} value={form.yearsExperience || ""} onChange={(e) => set("yearsExperience", Number(e.target.value))} />
            </label>

            <label className="form-label">
              Accent color
              <span className="color-row">
                <input className="color-swatch" type="color" value={form.accentColor || "#CBFF2E"} onChange={(e) => set("accentColor", e.target.value)} />
                <input value={form.accentColor} placeholder="#CBFF2E" onChange={(e) => set("accentColor", e.target.value)} />
                {form.accentColor && (
                  <button type="button" className="btn-link" onClick={() => set("accentColor", "")}>reset</button>
                )}
              </span>
            </label>

            <label className="form-label">
              Instagram
              <input value={form.socials.instagram || ""} placeholder="handle" onChange={(e) => setSocial("instagram", e.target.value)} />
            </label>
            <label className="form-label">
              Website
              <input value={form.socials.website || ""} placeholder="https://…" onChange={(e) => setSocial("website", e.target.value)} />
            </label>
            <label className="form-label">
              YouTube
              <input value={form.socials.youtube || ""} placeholder="@channel" onChange={(e) => setSocial("youtube", e.target.value)} />
            </label>

            <GalleryEditor gallery={form.gallery} onChange={(v) => set("gallery", v)} />
            <PlanEditor plans={form.plans} onChange={(v) => set("plans", v)} />

            <button className={saved ? "btn-success" : "btn-primary"} onClick={handleSave} disabled={save.isPending}>
              {saved ? "Saved!" : save.isPending ? "Saving…" : "Save Spotlight"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="spotlight-preview-wrap">
          <span className="preview-eyebrow">Live preview</span>
          <div className="coach-card preview-card" style={{ ["--coach-accent" as string]: accent }}>
            <div className="coach-card-glow" />
            <div className="coach-card-avatar">
              {form.photoUrl
                ? <img src={form.photoUrl} alt={form.fullName} />
                : <span>{initials(form.fullName)}</span>}
            </div>
            <div className="coach-card-body">
              <h3 className="coach-card-name">{form.fullName || "Your name"}</h3>
              <p className="coach-card-tagline">{form.tagline || "Your tagline appears here"}</p>
              <div className="coach-chips">
                {form.specialties.slice(0, 3).map((s) => <span key={s} className="coach-chip">{s}</span>)}
              </div>
            </div>
            <div className="coach-card-foot">
              <span className="coach-years"><strong>{form.yearsExperience}</strong> yrs experience</span>
              <span className="coach-card-arrow" aria-hidden>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
