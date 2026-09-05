import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GripVertical, X, Plus, Sliders, CheckCircle2, AlertTriangle, Save, Sparkles, Layers, Trash2, ChevronDown, ChevronUp, Copy, ArrowUp, ArrowDown, BookmarkPlus, BookOpen, Download, Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SchemeComponent, AggregationRule, GradingScheme, Subject } from "@/types";
import { normalizeScheme } from "@/utils/grading-engine";
import { TemplateService } from "@/services/template-service";
import { SubjectService } from "@/services/subject-service";
import { TemplateMarketplaceModal } from "@/components/subjects/template-marketplace-modal";
import { toast } from "sonner";

const defaultHierarchicalComponents: SchemeComponent[] = [
  {
    id: "c1",
    name: "Sessional Tests",
    weightPct: 40,
    rule: "average",
    assessments: [
      { id: "st1", name: "Sessional Test 1 (ST1)", maxMarks: 25 },
      { id: "st2", name: "Sessional Test 2 (ST2)", maxMarks: 25 },
    ],
  },
  {
    id: "c2",
    name: "Assignments & Quizzes",
    weightPct: 10,
    rule: "best_n",
    bestN: 2,
    assessments: [
      { id: "q1", name: "Quiz 1", maxMarks: 10 },
      { id: "q2", name: "Quiz 2", maxMarks: 10 },
      { id: "q3", name: "Quiz 3", maxMarks: 10 },
    ],
  },
  {
    id: "c3",
    name: "End Term Examination (ETE)",
    weightPct: 50,
    rule: "average",
    assessments: [{ id: "ete", name: "Final ETE Paper", maxMarks: 100 }],
  },
];

export function AssessmentBuilderPage() {
  const [components, setComponents] = useState<SchemeComponent[]>(defaultHierarchicalComponents);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  useEffect(() => {
    SubjectService.getCurrentSubjects()
      .then((subs) => {
        setCurrentSubjects(subs || []);
        if (subs && subs.length > 0) {
          setSelectedSubjectId(subs[0].id || subs[0]._id || "");
        }
      })
      .catch(() => setCurrentSubjects([]));
  }, []);

  const total = components.reduce((sum, c) => sum + (Number(c.weightPct) || 0), 0);
  const weightValid = total === 100;

  let validationError: string | null = null;
  if (!weightValid) {
    validationError = `Total weight must equal 100% (Current: ${total}%).`;
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
      toast.error("Scheme must have at least one component.");
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

  function handleCreateNewScheme() {
    setComponents([
      {
        id: crypto.randomUUID(),
        name: "Component 1",
        weightPct: 50,
        rule: "average",
        assessments: [{ id: crypto.randomUUID(), name: "Assessment 1", maxMarks: 50 }],
      },
      {
        id: crypto.randomUUID(),
        name: "Component 2",
        weightPct: 50,
        rule: "average",
        assessments: [{ id: crypto.randomUUID(), name: "Final Assessment", maxMarks: 100 }],
      },
    ]);
    toast.info("Started new blank evaluation scheme.");
  }

  function handleImportTemplate(tmpl: GradingScheme) {
    const norm = normalizeScheme(tmpl);
    setComponents(norm.components || []);
  }

  function addComponent() {
    setComponents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Evaluation Component",
        weightPct: 10,
        rule: "average",
        assessments: [{ id: crypto.randomUUID(), name: "Assessment 1", maxMarks: 50 }],
      },
    ]);
  }

  function addAssessment(componentId: string) {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== componentId) return c;
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

  function updateAssessment(componentId: string, assessmentId: string, field: "name" | "maxMarks", value: any) {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          assessments: c.assessments.map((a) => (a.id === assessmentId ? { ...a, [field]: value } : a)),
        };
      })
    );
  }

  function removeAssessment(componentId: string, assessmentId: string) {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== componentId) return c;
        if (c.assessments.length <= 1) {
          toast.error("A component must contain at least one assessment.");
          return c;
        }
        return {
          ...c,
          assessments: c.assessments.filter((a) => a.id !== assessmentId),
        };
      })
    );
  }

  async function handleSaveTemplate() {
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
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error("Failed to save template.");
    }
  }

  function handleSaveScheme() {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    toast.success("Hierarchical Assessment Scheme specification saved successfully!", { id: "scheme-save-toast" });
  }

  async function handleAssignToSubject() {
    if (!selectedSubjectId) {
      toast.error("Please select a subject.");
      return;
    }
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await SubjectService.updateSubject(selectedSubjectId, {
        scheme: { components },
      });
      const targetSubj = currentSubjects.find((s) => (s.id || s._id) === selectedSubjectId);
      toast.success(`Evaluation scheme assigned to "${targetSubj?.name || "Subject"}"!`, { id: "assign-scheme-toast" });
      setShowAssignModal(false);
    } catch (err) {
      console.error("Failed to assign scheme to subject:", err);
      toast.error("Failed to assign scheme to subject.");
    }
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8 pb-10">
      {/* Header with Two Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-600 dark:text-purple-300 mb-2">
            <Sliders size={12} className="text-purple-400" /> Universal Scheme Architect
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-900 dark:text-white">Assessment Scheme Builder</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Build, import, and configure evaluation schemes for any university
          </p>
        </div>

        {/* Primary Action Buttons of Equal Importance */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            variant="outline"
            className="gap-2 text-xs font-bold"
            onClick={handleCreateNewScheme}
          >
            <Plus size={15} /> Create New Scheme
          </Button>

          <Button
            size="md"
            variant="primary"
            className="gap-2 text-xs font-bold shadow-lg shadow-purple-600/30"
            onClick={() => setIsMarketplaceOpen(true)}
          >
            <BookOpen size={15} /> 📚 Browse Templates
          </Button>
        </div>
      </div>

      {/* Editor Weight Validation Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Badge tone={weightValid ? "success" : "danger"}>
            Total Weight: {total}% {weightValid ? "✓ Ready" : "(Must equal 100%)"}
          </Badge>
          {validationError && (
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle size={14} /> {validationError}
            </span>
          )}
        </div>

        <Button size="sm" variant="outline" onClick={addComponent} className="gap-1.5 text-xs">
          <Plus size={14} /> Add Component
        </Button>
      </div>

      {/* Component Cards Editor */}
      <div className="space-y-6">
        {components.map((comp, compIdx) => {
          const isCollapsed = collapsedMap[comp.id];

          return (
            <Card key={comp.id} className="border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/90 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-zinc-900/80 p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full sm:w-auto">
                  <GripVertical size={18} className="text-slate-400 dark:text-zinc-500 cursor-grab hover:text-slate-600 shrink-0" />
                  <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs font-bold">#{compIdx + 1}</span>
                  <input
                    className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 text-slate-900 dark:text-white font-extrabold text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 w-full max-w-xs"
                    value={comp.name}
                    onChange={(e) => updateComponent(comp.id, "name", e.target.value)}
                    placeholder="Component Name..."
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-purple-700 dark:text-purple-300 font-semibold">
                    <span>Weight:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-16 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/20 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-bold text-center outline-none focus:border-purple-600"
                      value={comp.weightPct}
                      onChange={(e) => updateComponent(comp.id, "weightPct", Number(e.target.value))}
                    />
                    <span>%</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveComponent(compIdx, "up")}
                      disabled={compIdx === 0}
                      className="p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveComponent(compIdx, "down")}
                      disabled={compIdx === components.length - 1}
                      className="p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button onClick={() => duplicateComponent(comp)} className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => removeComponent(comp.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => toggleCollapse(comp.id)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="p-5 space-y-4 bg-slate-50 dark:bg-zinc-950/60">
                  {/* Aggregation Rule Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-semibold">Aggregation Rule:</span>
                      <select
                        value={comp.rule}
                        onChange={(e) => updateComponent(comp.id, "rule", e.target.value as AggregationRule)}
                        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono outline-none focus:border-purple-500"
                      >
                        <option value="average">Average (Mean of all assessments)</option>
                        <option value="sum">Sum (Total marks obtained / total max)</option>
                        <option value="highest">Highest Score Only</option>
                        <option value="best_n">Best N Scores</option>
                        <option value="lowest">Lowest Score</option>
                      </select>
                    </div>

                    {comp.rule === "best_n" && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-300 font-semibold">Count Best N:</span>
                        <input
                          type="number"
                          min={1}
                          max={comp.assessments.length}
                          value={comp.bestN || 1}
                          onChange={(e) => updateComponent(comp.id, "bestN", Number(e.target.value))}
                          className="w-14 bg-white dark:bg-zinc-950 border border-white/20 rounded px-2 py-1 text-slate-900 dark:text-white font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Assessments List */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                      Assessments in {comp.name} ({comp.assessments.length})
                    </span>

                    {comp.assessments.map((ast, astIdx) => (
                      <div key={ast.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 p-3 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 text-xs">
                        <input
                          className="bg-transparent text-slate-900 dark:text-white font-semibold outline-none focus:border-b focus:border-purple-500 flex-1"
                          value={ast.name}
                          onChange={(e) => updateAssessment(comp.id, ast.id, "name", e.target.value)}
                          placeholder="Assessment Name..."
                        />

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-400">Max:</span>
                            <input
                              type="number"
                              min={1}
                              className="w-16 bg-white dark:bg-zinc-950 border border-white/20 rounded px-2 py-1 text-slate-900 dark:text-white font-bold text-center"
                              value={ast.maxMarks}
                              onChange={(e) => updateAssessment(comp.id, ast.id, "maxMarks", Number(e.target.value))}
                            />
                            <span className="text-zinc-500">Marks</span>
                          </div>

                          <button onClick={() => removeAssessment(comp.id, ast.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button size="sm" variant="outline" onClick={() => addAssessment(comp.id)} className="gap-1.5 text-xs">
                    <Plus size={14} /> Add Assessment to {comp.name}
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Triple Save Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-950/90 border border-purple-500/30">
        <Button variant="outline" size="md" className="gap-2 text-xs" onClick={() => setShowSaveTemplateModal(true)}>
          <BookmarkPlus size={15} /> Save as New Template
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="md" className="gap-2 text-xs" onClick={() => setShowAssignModal(true)}>
            <Layers3 size={15} /> Assign to Subject
          </Button>

          <Button variant="primary" size="md" className="gap-2 text-xs font-bold shadow-lg shadow-purple-600/30" onClick={handleSaveScheme}>
            <Save size={15} /> Save as My Scheme
          </Button>
        </div>
      </div>

      {/* Embedded Marketplace Overlay Modal */}
      <TemplateMarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onSelectTemplate={handleImportTemplate}
      />

      {/* Save Template Dialog */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Save Scheme as New Template</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Enter a title to save this configuration to your local templates.</p>
            <input
              className="w-full bg-white dark:bg-zinc-900 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              placeholder="e.g., Chitkara ST 40/60 Scheme"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveTemplate}>
                Save Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Subject Dialog */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950 p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Assign Evaluation Scheme to Subject</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Select a current semester course to apply this custom scheme.</p>
            {currentSubjects.length === 0 ? (
              <p className="text-xs text-amber-400">No active semester subjects found.</p>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              >
                {currentSubjects.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.name} ({s.code || "Course"})
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={handleAssignToSubject} disabled={currentSubjects.length === 0}>
                Assign Scheme
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
