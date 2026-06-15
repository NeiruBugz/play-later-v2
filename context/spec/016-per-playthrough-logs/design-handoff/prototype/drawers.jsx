/* SavePoint — Per-Playthrough Logs: right-side drawers.
   Drawer shell + Add/Edit playthrough form + Log session form.
   Depends on kit.jsx + playthroughs.jsx globals. */

/* ============================== DRAWER SHELL ============================== */
function Drawer({ open, onClose, eyebrow, title, children, footer, width = 460 }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <aside role="dialog" aria-modal="true" aria-label={title}
        style={{ position: "relative", width, maxWidth: "94vw", height: "100%", background: "var(--card)", borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-4)", display: "flex", flexDirection: "column", animation: "sp-slide-in var(--duration-slow) var(--ease-out-expo)" }}>        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "22px 24px 16px", borderBottom: "1px solid color-mix(in oklch, var(--border) 60%, transparent)" }}>
          <div>
            {eyebrow ? <p className="terminal-label" style={{ margin: "0 0 6px" }}>{eyebrow}</p> : null}
            <h2 className="heading-sm" style={{ margin: 0 }}>{title}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ height: 34, width: 34, flexShrink: 0 }} aria-label="Close">
            <Icon name="X" size={18} />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>{children}</div>
        {footer ? (
          <footer style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid color-mix(in oklch, var(--border) 60%, transparent)", background: "color-mix(in oklch, var(--card) 70%, var(--background))" }}>
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/* ============================== FORM PRIMITIVES ============================== */
function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span className="caption" style={{ textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted-foreground)", fontWeight: 600 }}>{label}</span>
      {children}
      {hint ? <span className="body-xs" style={{ color: "var(--muted-foreground)" }}>{hint}</span> : null}
    </label>
  );
}
const inputStyle = {
  width: "100%", background: "var(--background)", border: "1px solid var(--input)",
  borderRadius: "var(--radius-btn)", padding: "9px 12px", color: "var(--foreground)",
  font: "inherit", fontSize: ".875rem", outline: "none",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={(e) => (e.target.style.borderColor = "var(--ring)")}
    onBlur={(e) => (e.target.style.borderColor = "var(--input)")} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.55, ...(props.style || {}) }}
    onFocus={(e) => (e.target.style.borderColor = "var(--ring)")}
    onBlur={(e) => (e.target.style.borderColor = "var(--input)")} />;
}
function Segmented({ options, value, onChange, size = "md" }) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, padding: 4, background: "var(--muted)", borderRadius: "var(--radius-btn)" }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} className="body-xs"
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: size === "sm" ? "5px 10px" : "7px 12px",
              borderRadius: "calc(var(--radius-btn) - 1px)", border: 0, fontWeight: 600,
              background: active ? "var(--card)" : "transparent",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: active ? "var(--shadow-paper-sm)" : "none" }}>
            {o.icon ? <Icon name={o.icon} size={13} /> : null}{label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================== ADD / EDIT PLAYTHROUGH ============================== */
function toISO(display) {
  // "Apr 10, 2020" -> "2020-04-10"
  if (!display) return "";
  const m = display.match(/^(\w+)\s+(\d+),\s+(\d+)$/);
  if (!m) return "";
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[1]) + 1;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

function AddEditPlaythroughForm({ initial, isFirst, framing, onSave, submitRef }) {
  const editing = !!initial;
  const [kind, setKind] = React.useState(initial?.kind ?? (isFirst ? "first" : "replay"));
  const [platform, setPlatform] = React.useState(initial?.platform ?? "PS5");
  const [status, setStatus] = React.useState(initial?.status ?? "PLAYING");
  const [start, setStart] = React.useState(toISO(initial?.start) || "");
  const [end, setEnd] = React.useState(toISO(initial?.end) || "");
  const [hours, setHours] = React.useState(initial?.hours ?? "");
  const [rating, setRating] = React.useState(initial?.rating ?? null);
  const [completion, setCompletion] = React.useState(initial?.completion ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  const previewLabel = runLabel({ kind, ordinal: initial?.ordinal ?? (isFirst ? 1 : 2) }, framing);

  React.useEffect(() => {
    submitRef.current.submit = () => onSave({
      ...(initial || {}),
      kind, platform, status,
      start: start ? fmtDate(start) : "",
      end: status === "PLAYING" ? "" : (end ? fmtDate(end) : ""),
      hours: Number(hours) || 0,
      rating,
      completion: completion.trim(),
      notes: notes.trim(),
    });
  });

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "color-mix(in oklch, var(--primary) 7%, transparent)", borderRadius: "var(--radius-card)", border: "1px solid color-mix(in oklch, var(--primary) 18%, transparent)" }}>
          <RunMarker status={status} size={28} ring={false} />
          <div>
            <p className="body-sm" style={{ margin: 0, fontWeight: 600 }}>{previewLabel}</p>
            <p className="body-xs" style={{ margin: "1px 0 0", color: "var(--muted-foreground)" }}>Final Fantasy VII Remake</p>
          </div>
        </div>

        {!editing ? (
          <Field label="Type">
            <Segmented value={kind} onChange={setKind}
              options={[{ value: "first", label: "First playthrough" }, { value: "replay", label: "Replay" }]} />
          </Field>
        ) : null}

        <Field label="Platform">
          <Segmented value={platform} onChange={setPlatform} size="sm"
            options={PLATFORM_KEYS.map((k) => ({ value: k, label: PLATFORM[k].label }))} />
        </Field>

        <Field label="Status">
          <Segmented value={status} onChange={setStatus}
            options={[
              { value: "PLAYING", label: "Playing", icon: "Gamepad2" },
              { value: "FINISHED", label: "Finished", icon: "CheckCircle" },
              { value: "ABANDONED", label: "Abandoned", icon: "Archive" },
            ]} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Started"><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Finished" hint={status === "PLAYING" ? "Still playing" : null}>
            <TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} disabled={status === "PLAYING"}
              style={status === "PLAYING" ? { opacity: .45, pointerEvents: "none" } : {}} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
          <Field label="Playtime" hint="hours"><TextInput type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" /></Field>
          <Field label="Completion" hint="e.g. Platinum, 100%, Story"><TextInput value={completion} onChange={(e) => setCompletion(e.target.value)} placeholder="optional" /></Field>
        </div>

        <Field label="Rating" hint="How was this run? Optional.">
          <div style={{ paddingTop: 2 }}><RatingInput value={rating} onChange={setRating} /></div>
        </Field>

        <Field label="Notes" hint="What made this run its own thing? Reflections can come later.">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A line on how this playthrough went…" />
        </Field>
      </div>
    </>
  );
}

/* ============================== LOG SESSION ============================== */
function LogSessionForm({ playthroughs, targetId, framing, onSave, submitRef }) {
  const [ptId, setPtId] = React.useState(targetId ?? playthroughs[0]?.id);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = React.useState("");
  const [body, setBody] = React.useState("");
  React.useEffect(() => {
    submitRef.current.submit = () => onSave({ ptId, date: fmtDate(date), hours: Number(hours) || 0, body: body.trim() });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Attach to playthrough" hint="This entry threads into that run's timeline.">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {playthroughs.map((pt) => {
            const active = ptId === pt.id;
            return (
              <button key={pt.id} type="button" onClick={() => setPtId(pt.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", textAlign: "left", cursor: "pointer",
                  background: active ? "color-mix(in oklch, var(--primary) 9%, transparent)" : "transparent",
                  border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 40%, transparent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-card)", color: "inherit" }}>
                <RunMarker status={pt.status} size={24} ring={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="body-sm" style={{ margin: 0, fontWeight: 600 }}>{runLabel(pt, framing)}</p>
                  <p className="body-xs" style={{ margin: "1px 0 0", color: "var(--muted-foreground)" }}>{pt.platform} · {pt.start}{pt.end ? ` → ${pt.end}` : ""}</p>
                </div>
                {active ? <Icon name="Check" size={16} style={{ color: "var(--primary)" }} /> : null}
              </button>
            );
          })}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 14 }}>
        <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Playtime" hint="hours"><TextInput type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" /></Field>
      </div>

      <Field label="Thoughts" hint="Optional — playtime alone is a perfectly good entry.">
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened this session?" />
      </Field>

    </div>
  );
}

Object.assign(window, {
  Drawer, Field, TextInput, TextArea, Segmented,
  AddEditPlaythroughForm, LogSessionForm,
});
