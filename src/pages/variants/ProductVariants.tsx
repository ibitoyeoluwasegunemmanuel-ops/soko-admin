import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Plus, Trash2, GripVertical, CheckCircle, Edit2 } from "lucide-react";

interface VariantOption { id: string; label: string; hex?: string; }
interface VariantType {
  id: string; name: string; slug: string; inputType: "swatch" | "button" | "dropdown";
  required: boolean; affectsPrice: boolean; affectsStock: boolean;
  options: VariantOption[];
  categories: string[]; // which product categories this applies to
}

const CATEGORIES = ["All Products", "Fashion", "Electronics", "Shoes", "Bags & Accessories", "Beauty", "Home & Decor", "Phones & Tablets", "Food & Drinks"];

const DEFAULT_VARIANTS: VariantType[] = [
  {
    id: "1", name: "Size", slug: "size", inputType: "button", required: false, affectsPrice: false, affectsStock: true,
    categories: ["Fashion", "Shoes"],
    options: [
      { id: "s1", label: "XS" }, { id: "s2", label: "S" }, { id: "s3", label: "M" },
      { id: "s4", label: "L" }, { id: "s5", label: "XL" }, { id: "s6", label: "XXL" },
      { id: "s7", label: "3XL" }, { id: "s8", label: "4XL" },
    ],
  },
  {
    id: "2", name: "Color", slug: "color", inputType: "swatch", required: false, affectsPrice: false, affectsStock: true,
    categories: ["Fashion", "Shoes", "Bags & Accessories"],
    options: [
      { id: "c1", label: "Black", hex: "#000000" }, { id: "c2", label: "White", hex: "#ffffff" },
      { id: "c3", label: "Red", hex: "#ef4444" }, { id: "c4", label: "Blue", hex: "#3b82f6" },
      { id: "c5", label: "Green", hex: "#10b981" }, { id: "c6", label: "Yellow", hex: "#f59e0b" },
      { id: "c7", label: "Pink", hex: "#ec4899" }, { id: "c8", label: "Purple", hex: "#7c3aed" },
      { id: "c9", label: "Navy", hex: "#1e3a5f" }, { id: "c10", label: "Brown", hex: "#92400e" },
    ],
  },
  {
    id: "3", name: "Storage", slug: "storage", inputType: "button", required: false, affectsPrice: true, affectsStock: true,
    categories: ["Electronics", "Phones & Tablets"],
    options: [
      { id: "st1", label: "64GB" }, { id: "st2", label: "128GB" },
      { id: "st3", label: "256GB" }, { id: "st4", label: "512GB" }, { id: "st5", label: "1TB" },
    ],
  },
  {
    id: "4", name: "Material", slug: "material", inputType: "dropdown", required: false, affectsPrice: true, affectsStock: false,
    categories: ["Fashion", "Bags & Accessories", "Home & Decor"],
    options: [
      { id: "m1", label: "Cotton" }, { id: "m2", label: "Polyester" }, { id: "m3", label: "Leather" },
      { id: "m4", label: "Denim" }, { id: "m5", label: "Silk" }, { id: "m6", label: "Linen" },
      { id: "m7", label: "Wool" },
    ],
  },
  {
    id: "5", name: "Shoe Size", slug: "shoe-size", inputType: "button", required: false, affectsPrice: false, affectsStock: true,
    categories: ["Shoes"],
    options: [
      { id: "ss36", label: "36" }, { id: "ss37", label: "37" }, { id: "ss38", label: "38" },
      { id: "ss39", label: "39" }, { id: "ss40", label: "40" }, { id: "ss41", label: "41" },
      { id: "ss42", label: "42" }, { id: "ss43", label: "43" }, { id: "ss44", label: "44" },
      { id: "ss45", label: "45" }, { id: "ss46", label: "46" },
    ],
  },
];

export function ProductVariants() {
  const [variants, setVariants] = useState<VariantType[]>(DEFAULT_VARIANTS);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOption, setNewOption] = useState<Record<string, string>>({});
  const [newVariant, setNewVariant] = useState<Partial<VariantType>>({ name: "", slug: "", inputType: "button", required: false, affectsPrice: false, affectsStock: true, options: [], categories: [] });

  function slugify(name: string) { return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

  function addOption(variantId: string) {
    const label = newOption[variantId]?.trim();
    if (!label) return;
    setVariants(prev => prev.map(v => v.id === variantId
      ? { ...v, options: [...v.options, { id: Date.now().toString(), label }] }
      : v
    ));
    setNewOption(p => ({ ...p, [variantId]: "" }));
  }

  function removeOption(variantId: string, optionId: string) {
    setVariants(prev => prev.map(v => v.id === variantId
      ? { ...v, options: v.options.filter(o => o.id !== optionId) }
      : v
    ));
  }

  function toggleCategory(variantId: string, cat: string) {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      const cats = v.categories.includes(cat)
        ? v.categories.filter(c => c !== cat)
        : [...v.categories, cat];
      return { ...v, categories: cats };
    }));
  }

  function toggleFlag(variantId: string, flag: "required" | "affectsPrice" | "affectsStock") {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [flag]: !v[flag] } : v));
  }

  function deleteVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id));
  }

  function addVariant() {
    if (!newVariant.name) return;
    setVariants(prev => [...prev, {
      id: Date.now().toString(),
      name: newVariant.name!,
      slug: newVariant.slug || slugify(newVariant.name!),
      inputType: newVariant.inputType as "swatch" | "button" | "dropdown",
      required: newVariant.required ?? false,
      affectsPrice: newVariant.affectsPrice ?? false,
      affectsStock: newVariant.affectsStock ?? true,
      options: [],
      categories: newVariant.categories ?? [],
    }]);
    setNewVariant({ name: "", slug: "", inputType: "button", required: false, affectsPrice: false, affectsStock: true, options: [], categories: [] });
    setShowNew(false);
  }

  async function saveAll() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "product_variants", value: variants });
    setSaving(false);
  }

  const INPUT_TYPE_LABELS = { swatch: "Color Swatches", button: "Button Grid", dropdown: "Dropdown Select" };

  return (
    <div>
      <PageHeader title="Product Variants" sub="Configure variant types (size, color, material) that sellers use when listing products">
        <button onClick={() => setShowNew(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> New Variant Type
        </button>
        <button onClick={saveAll} disabled={saving} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving…" : "Save All"}
        </button>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, fontSize: 13, color: "var(--muted)" }}>
          These variant types appear in the seller's product listing form. Sellers pick which variants apply to their product, then add stock per combination (e.g. Red + M = 5 units).
        </div>

        {variants.map(v => (
          <div key={v.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: editing === v.id ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setEditing(editing === v.id ? null : v.id)}>
              <GripVertical size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{v.name}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>/{v.slug}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{INPUT_TYPE_LABELS[v.inputType]}</span>
                  {v.affectsPrice && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Affects Price</span>}
                  {v.affectsStock && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Tracks Stock</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                  {v.options.length} options · {v.categories.length === 0 ? "All categories" : v.categories.join(", ")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); deleteVariant(v.id); }} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Expanded editor */}
            {editing === v.id && (
              <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Flags */}
                <div style={{ display: "flex", gap: 12 }}>
                  {([
                    { key: "required" as const, label: "Required", desc: "Sellers must set this variant" },
                    { key: "affectsPrice" as const, label: "Affects Price", desc: "Each option can have a price delta" },
                    { key: "affectsStock" as const, label: "Tracks Stock", desc: "Stock tracked per option" },
                  ]).map(flag => (
                    <div key={flag.key} onClick={() => toggleFlag(v.id, flag.key)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${v[flag.key] ? "rgba(124,58,237,0.4)" : "var(--border)"}`, background: v[flag.key] ? "rgba(124,58,237,0.08)" : "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: v[flag.key] ? "#7c3aed" : "transparent", border: `2px solid ${v[flag.key] ? "#7c3aed" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {v[flag.key] && <CheckCircle size={10} style={{ color: "#fff" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: v[flag.key] ? "#a78bfa" : "var(--text)" }}>{flag.label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{flag.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Display type */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Display Style</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["button","swatch","dropdown"] as const).map(type => (
                      <div key={type} onClick={() => setVariants(prev => prev.map(vv => vv.id === v.id ? { ...vv, inputType: type } : vv))}
                        style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${v.inputType === type ? "rgba(124,58,237,0.5)" : "var(--border)"}`, background: v.inputType === type ? "rgba(124,58,237,0.1)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: v.inputType === type ? "#a78bfa" : "var(--muted)" }}>
                        {INPUT_TYPE_LABELS[type]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Apply To Categories</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CATEGORIES.filter(c => c !== "All Products").map(cat => (
                      <div key={cat} onClick={() => toggleCategory(v.id, cat)}
                        style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${v.categories.includes(cat) ? "rgba(124,58,237,0.5)" : "var(--border)"}`, background: v.categories.includes(cat) ? "rgba(124,58,237,0.1)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: v.categories.includes(cat) ? "#a78bfa" : "var(--muted)" }}>
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>Options ({v.options.length})</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {v.options.map(opt => (
                      <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
                        {opt.hex && <div style={{ width: 14, height: 14, borderRadius: "50%", background: opt.hex, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{opt.label}</span>
                        <button onClick={() => removeOption(v.id, opt.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newOption[v.id] ?? ""}
                      onChange={e => setNewOption(p => ({ ...p, [v.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addOption(v.id)}
                      placeholder={v.inputType === "swatch" ? "e.g. Coral Pink" : "e.g. XL"}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}
                    />
                    <button onClick={() => addOption(v.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Variant Modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, width: 440 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>New Variant Type</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Name (shown to sellers)</label>
              <input value={newVariant.name ?? ""} onChange={e => setNewVariant(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                placeholder="e.g. Size, Color, Material"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Slug (auto-generated)</label>
              <input value={newVariant.slug ?? ""} onChange={e => setNewVariant(p => ({ ...p, slug: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 13, fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Display Style</label>
              <select value={newVariant.inputType} onChange={e => setNewVariant(p => ({ ...p, inputType: e.target.value as any }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}>
                <option value="button">Button Grid (e.g. S / M / L)</option>
                <option value="swatch">Color Swatches</option>
                <option value="dropdown">Dropdown Select</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={addVariant} disabled={!newVariant.name} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create Variant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
