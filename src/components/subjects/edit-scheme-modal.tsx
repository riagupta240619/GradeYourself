import { useState, useEffect } from "react";
import { X, Plus, Layers, AlertTriangle, Save, ChevronDown, ChevronUp, Copy, Trash2, ArrowUp, ArrowDown, Sparkles, BookmarkPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SchemeComponent, AggregationRule, Subject, GradingScheme } from "@/types";
import { normalizeScheme } from "@/utils/grading-engine";
import { SubjectService } from "@/services/subject-service";
import { TemplateService } from "@/services/template-service";
import { toast } from "sonner";

interface EditSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSchemeUpdated: () => void;
}

export function EditSchemeModal({ isOpen, onClose, subject, onSchemeUpdated }: EditSchemeModalProps) {
  const [components, setComponents] = useState<SchemeComponent[]>([]);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<GradingScheme[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (subject?.scheme) {
      const norm = normalizeScheme(subject.scheme);
      setComponents(norm.components || []);
    }
  }, [subject]);

  useEffect(() => {
    if (isOpen) {
      TemplateService.getTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [isOpen]);

  if (!isOpen || !subject) return null;

  const totalWeight = components.reduce((sum, c) => sum + (Number(c.weightPct) || 0), 0);

  // Validation checks
  const weightValid = totalWeight === 100;
  let validationError: string | null = null;

  if (!weightValid) {
    validationError = `Total weight must equal 100% (Current: ${totalWeight}%).`;
  } else {
    for (const comp of components) {
      if (!comp.name || comp.name.trim() === "") {
        validationError = "All components must have a valid name.";
        break;
      }
      if (comp.assessments.length === 0) {
        validationError = `Component "${comp.name}" must contain at least 1 assessment.`;
        break;
      }
      const astNames = new Set<string>();
      for (const ast of comp.assessments) {
        if (!ast.name || ast.name.trim() === "") {
          validationError = `An assessment inside "${comp.name}" is missing a name.`;
          break;
        }
        if (astNames.has(ast.name.toLowerCase().trim())) {
          validationError = `Duplicate assessment name "${ast.name}" inside component "${comp.name}".`;
          break;
        }
        astNames.add(ast.name.toLowerCase().trim());

        if (!ast.maxMarks || Number(ast.maxMarks) <= 0) {
          validationError = `Assessment "${ast.name}" must have max marks > 0.`;
          break;
        }
      }
      if (comp.rule === "best_n" && comp.bestN && comp.bestN > comp.assessments.length) {
        validationError = `Best N (${comp.bestN}) cannot exceed assessment count (${comp.assessments.length}) in "${comp.name}".`;
        break;
      }
      if (validationError) break;
    }
  }

  function toggleCollapse(id: string) {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateComponent(id: string, field: keyof SchemeComponent, value: any) {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function removeComponent(id: string) {
    if (components.length <= 1) {
      toast.error("Subject must have at least one component.");
      return;
    }
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }

  function duplicateComponent(comp: SchemeComponent) {
    const newComp: SchemeComponent = {
      ...comp,
      id: crypto.randomUUID(),
      name: `${comp.name} (Copy)`,
      assessments: comp.assessments.map((a) => ({ ...a, id: crypto.randomUUID() })),
    };
    setComponents((prev) => [...prev, newComp]);
    toast.info(`Duplicated component "${comp.name}"`);
  }

  function moveComponent(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= components.length) return;
    const next = [...components];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setComponents(next);
  }

  function addComponent() {
    const newComp: SchemeComponent = {
      id: crypto.randomUUID(),
      name: "New Component",
      weightPct: 10,
      rule: "average",
      assessments: [{ id: crypto.randomUUID(), name: "Assessment 1", maxMarks: 50 }],
    };
    setComponents((prev) => [...prev, newComp]);
  }

  function addAssessment(compIdx: number) {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== compIdx) return c;
        return {
          ...c,
          assessments: [
            ...c.assessments,
            { id: crypto.randomUUID(), name: `Assessment ${c.assessments.length + 1}`, maxMarks: 25 },
          ],
        };
      })
    );
  }

  function updateAssessment(compIdx: number, astId: string, field: "name" | "maxMarks", value: any) {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== compIdx) return c;
        return {
          ...c,
          assessments: c.assessments.map((a) => (a.id === astId ? { ...a, [field]: value } : a)),
        };
      })
    );
  }

  function duplicateAssessment(compIdx: number, ast: { id: string; name: string; maxMarks: number }) {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== compIdx) return c;
        return {
          ...c,
          assessments: [...c.assessments, { ...ast, id: crypto.randomUUID(), name: `${ast.name} (Copy)` }],
        };
      })
    );
  }

  function removeAssessment(compIdx: number, astId: string) {
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== compIdx) return c;
        if (c.assessments.length <= 1) {
          toast.error("Component must contain at least 1 assessment.");
          return c;
        }
        return {
          ...c,
          assessments: c.assessments.filter((a) => a.id !== astId),
        };
      })
    );
  }

  function moveAssessment(compIdx: number, astIdx: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? astIdx - 1 : astIdx + 1;
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx !== compIdx) return c;
        if (targetIdx < 0 || targetIdx >= c.assessments.length) return c;
        const nextAst = [...c.assessments];
        const temp = nextAst[astIdx];
        nextAst[astIdx] = nextAst[targetIdx];
        nextAst[targetIdx] = temp;
        return { ...c, assessments: nextAst };
      })
    );
  }

  function applyTemplate(tmpl: GradingScheme) {
    const norm = normalizeScheme(tmpl);
    setComponents(norm.components || []);
    toast.success(`Applied template "${tmpl.name}"`);
  }

  async function handleSaveScheme() {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const targetId = subject?.id || subject?._id;
    if (!targetId) return;

    setSaving(true);
    try {
      await SubjectService.updateSubject(targetId, {
        scheme: { components },
      });
      toast.success("Evaluation Scheme updated successfully!", { id: "scheme-save-toast" });
      onSchemeUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update evaluation scheme:", err);
      toast.error("Failed to update scheme. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCustomTemplate() {
    if (!templateName || templateName.trim() === "") {
      toast.error("Template name is required.");
      return;
    }
    try {
      await TemplateService.createTemplate({
        name: templateName.trim(),
        university: "My Custom Templates",
        components,
      });
      toast.success(`Saved template "${templateName}"!`);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      TemplateService.getTemplates().then(setTemplates);
    } catch (err) {
      console.error("Failed to create template:", err);
      toast.error("Failed to save template.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <Layers size={20} className="text-purple-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Edit Evaluation Scheme</h2>
              <p className="text-xs text-zinc-400">{subject.name} • Configure components, weights, & rules</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={weightValid ? "success" : "danger"}>
              Total: {totalWeight}% {weightValid ? "✓ Valid" : "(Must equal 100%)"}
            </Badge>
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-slate-900 dark:text-white transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Quick Apply Templates Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="font-semibold text-purple-200">Load Preset Template:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const tmpl = templates.find((t) => (t.id || (t as any)._id) === e.target.value);
                  if (tmpl) applyTemplate(tmpl);
                }}
                defaultValue=""
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              >
                <option value="" disabled>
                  Select University / Custom Template...
                </option>
                {templates.map((t) => (
                  <option key={t.id || (t as any)._id} value={t.id || (t as any)._id}>
                    {t.name} ({t.university})
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-purple-600 dark:text-purple-300 border-purple-500/30" onClick={() => setShowSaveTemplateModal(true)}>
                <BookmarkPlus size={14} /> Save As Template
              </Button>
            </div>
          </div>

          {/* Validation Banner if invalid */}
          {validationError && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 font-semibold">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Components List */}
          <div className="flex flex-col gap-4">
            {components.map((comp, compIdx) => {
              const isCollapsed = collapsedMap[comp.id];

              return (
                <Card key={comp.id} className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/70 overflow-hidden shadow-lg">
                  <CardHeader className="bg-white dark:bg-zinc-950 p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <button onClick={() => toggleCollapse(comp.id)} className="text-zinc-400 hover:text-slate-900 dark:text-white p-1">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                      <input
                        className="bg-transparent font-extrabold text-slate-900 dark:text-white text-sm focus:outline-none placeholder-slate-400 dark:placeholder-zinc-500 w-full"
                        value={comp.name}
                        onChange={(e) => updateComponent(comp.id, "name", e.target.value)}
                        placeholder="Component Name..."
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Aggregation Rule */}
                      <select
                        value={comp.rule}
                        onChange={(e) => updateComponent(comp.id, "rule", e.target.value as AggregationRule)}
                        className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 outline-none focus:border-purple-500"
                      >
                        <option value="average">Average</option>
                        <option value="sum">Sum Marks</option>
                        <option value="highest">Highest Score</option>
                        <option value="best_n">Best N Scores</option>
                        <option value="lowest">Lowest Score</option>
                      </select>

                      {comp.rule === "best_n" && (
                        <input
                          type="number"
                          min={1}
                          max={comp.assessments.length}
                          value={comp.bestN || 1}
                          onChange={(e) => updateComponent(comp.id, "bestN", Math.max(1, Number(e.target.value)))}
                          className="w-12 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2 py-1 text-center font-mono font-bold text-emerald-400 outline-none"
                          title="Best N count"
                        />
                      )}

                      {/* Weight % */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">Weight:</span>
                        <input
                          type="number"
                          value={comp.weightPct}
                          onChange={(e) => updateComponent(comp.id, "weightPct", Number(e.target.value))}
                          className="w-14 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2 py-1 text-center font-mono font-bold text-purple-400 focus:border-purple-500 outline-none"
                        />
                        <span className="font-mono text-purple-600 dark:text-purple-300 font-bold">%</span>
                      </div>

                      {/* Action buttons: Move Up, Move Down, Duplicate, Remove */}
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-2">
                        <button onClick={() => moveComponent(compIdx, "up")} disabled={compIdx === 0} className="p-1 text-zinc-500 hover:text-slate-900 dark:text-white disabled:opacity-30">
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => moveComponent(compIdx, "down")} disabled={compIdx === components.length - 1} className="p-1 text-zinc-500 hover:text-slate-900 dark:text-white disabled:opacity-30">
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => duplicateComponent(comp)} className="p-1 text-zinc-500 hover:text-purple-600 dark:text-purple-300" title="Duplicate Component">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => removeComponent(comp.id)} className="p-1 text-zinc-500 hover:text-rose-400" title="Delete Component">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="p-4 flex flex-col gap-2 bg-white/80 dark:bg-zinc-900/60">
                      {comp.assessments.map((ast, astIdx) => (
                        <div key={ast.id} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-zinc-950/80 px-3.5 py-2 text-xs">
                          <input
                            type="text"
                            className="flex-1 bg-transparent font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none text-xs"
                            value={ast.name}
                            onChange={(e) => updateAssessment(compIdx, ast.id, "name", e.target.value)}
                            placeholder="Assessment Name (ST1, Quiz 1...)"
                          />

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Max Marks:</span>
                            <input
                              type="number"
                              className="w-16 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2 py-1 text-center font-mono font-bold text-slate-900 dark:text-white focus:border-purple-500 outline-none"
                              value={ast.maxMarks}
                              onChange={(e) => updateAssessment(compIdx, ast.id, "maxMarks", Number(e.target.value))}
                            />
                          </div>

                          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-2">
                            <button onClick={() => moveAssessment(compIdx, astIdx, "up")} disabled={astIdx === 0} className="p-1 text-zinc-500 hover:text-slate-900 dark:text-white disabled:opacity-30">
                              <ArrowUp size={13} />
                            </button>
                            <button onClick={() => moveAssessment(compIdx, astIdx, "down")} disabled={astIdx === comp.assessments.length - 1} className="p-1 text-zinc-500 hover:text-slate-900 dark:text-white disabled:opacity-30">
                              <ArrowDown size={13} />
                            </button>
                            <button onClick={() => duplicateAssessment(compIdx, ast)} className="p-1 text-zinc-500 hover:text-purple-600 dark:text-purple-300">
                              <Copy size={13} />
                            </button>
                            <button onClick={() => removeAssessment(compIdx, ast.id)} className="p-1 text-zinc-500 hover:text-rose-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" size="sm" className="mt-2 w-fit gap-1 text-xs text-purple-600 dark:text-purple-300 border-purple-500/20" onClick={() => addAssessment(compIdx)}>
                        <Plus size={13} /> Add Assessment
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="w-fit gap-2 font-bold py-2 px-4" onClick={addComponent}>
            <Plus size={15} /> Add New Component
          </Button>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button variant="primary" size="sm" disabled={!weightValid || !!validationError || saving} onClick={handleSaveScheme} className="gap-2 font-bold px-6">
            <Save size={15} /> {saving ? "Saving Scheme..." : "Save Evaluation Scheme"}
          </Button>
        </div>
      </div>

      {/* Save Template Nested Sub-Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Save Scheme as Reusable Template</h3>
            <p className="text-xs text-zinc-400">Enter a descriptive name for this evaluation scheme template.</p>
            <input
              type="text"
              placeholder="e.g. Chitkara ST + ETE Scheme"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateCustomTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
