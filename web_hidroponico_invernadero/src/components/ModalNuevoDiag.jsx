import { useEffect, useRef, useState } from "react";
import { createDiagnostico } from "../services/diagnosticos";
import { getPlagas, getEnfermedades } from "../services/catalogos";

// Heurística simple por nombre de archivo para “simular” IA
function guessByFilename(n = "") {
    const s = n.toLowerCase();
    if (s.includes("plaga_4") || s.includes("whitefly") || s.includes("mosca")) {
        return { tipo: "plaga", nameHint: "mosca" }; // mosca blanca
    }
    if (s.includes("plaga_3") || s.includes("roya") || s.includes("rust")) {
        return { tipo: "enfermedad", nameHint: "roya" };
    }
    // por defecto mancha angular
    return { tipo: "enfermedad", nameHint: "mancha" };
}

function toUtc(localYmdHm) {
    if (!localYmdHm) return new Date().toISOString();
    const d = new Date(localYmdHm);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

export default function ModalNuevoDiag({ onCreated }) {
    const fileRef = useRef(null);

    const [preview, setPreview] = useState(null);
    const [filename, setFilename] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [errors, setErrors] = useState([]);

    // catálogos
    const [plagas, setPlagas] = useState([]);
    const [enfermedades, setEnfermedades] = useState([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [catError, setCatError] = useState(null);

    // Form principal
    const [form, setForm] = useState({
        inspectorId: "",           // opcional
        fechaMuestreo: new Date().toISOString().slice(0, 16), // datetime-local
        etapaFenologica: "V2",
        tipo: "",                  // "plaga" | "enfermedad"
        plagaId: "",               // requerido si tipo = plaga
        enfermedadId: "",          // requerido si tipo = enfermedad
        severidad: "2",            // 0..5
        notas: "",
    });

    // Cargar catálogos desde la API
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingCatalogs(true);
                const [p, e] = await Promise.all([getPlagas(), getEnfermedades()]);
                if (!alive) return;
                setPlagas(Array.isArray(p) ? p : []);
                setEnfermedades(Array.isArray(e) ? e : []);
            } catch (err) {
                setCatError(err.message || "Error cargando catálogos.");
            } finally {
                setLoadingCatalogs(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Subida de foto
    function onFileChange(e) {
        const f = e.target.files?.[0];
        if (!f) {
            setPreview(null);
            setFilename("");
            return;
        }
        setFilename(f.name);
        const r = new FileReader();
        r.onload = () => setPreview(r.result);
        r.readAsDataURL(f);
    }

    // Clasificar (simulación IA) usando catálogos reales
    function handleClassify() {
        const g = guessByFilename(filename || "foto.jpg");

        if (g.tipo === "plaga") {
            const found = plagas.find(p =>
                p.nombre.toLowerCase().includes(g.nameHint)
            );
            const defId = found?.id ?? plagas[0]?.id ?? "";
            setForm((s) => ({
                ...s,
                tipo: "plaga",
                plagaId: s.plagaId || defId,
                enfermedadId: "",
                severidad: "2",
                notas:
                    s.notas ||
                    "Adultos y ninfas en envés; presencia de melaza. Evaluar control biológico.",
            }));
            setMsg(`Clasificación simulada: Plaga (${found?.nombre || "—"}).`);
        } else {
            const found = enfermedades.find(e =>
                e.nombre.toLowerCase().includes(g.nameHint)
            );
            const defId = found?.id ?? enfermedades[0]?.id ?? "";
            const esRoya = (found?.nombre || "").toLowerCase().includes("roya");
            setForm((s) => ({
                ...s,
                tipo: "enfermedad",
                enfermedadId: s.enfermedadId || defId,
                plagaId: "",
                severidad: esRoya ? "2" : "3",
                notas:
                    s.notas ||
                    (esRoya
                        ? "Pústulas anaranjadas en el haz; mejorar ventilación."
                        : "Lesiones angulares delimitadas por venas; humedad alta reciente."),
            }));
            setMsg(`Clasificación simulada: Enfermedad (${found?.nombre || "—"}).`);
        }
    }

    // Validación mínima antes de POST
    function validate() {
        const errs = [];
        if (!preview) errs.push("Sube una foto (requerida).");
        if (!form.tipo) errs.push("Selecciona el Tipo (o usa 'Clasificar').");
        if (form.tipo === "plaga" && !form.plagaId)
            errs.push("Selecciona una Plaga.");
        if (form.tipo === "enfermedad" && !form.enfermedadId)
            errs.push("Selecciona una Enfermedad.");
        const sevNum = Number(form.severidad);
        if (Number.isNaN(sevNum) || sevNum < 0 || sevNum > 5)
            errs.push("Severidad debe estar entre 0 y 5.");
        setErrors(errs);
        return errs.length === 0;
    }

    // Guardar → POST
    async function handleSave() {
        try {
            setMsg(null);
            setErrors([]);
            if (!validate()) return;

            const payload = {
                tipo: form.tipo, // el backend acepta string por el JsonStringEnumConverter
                inspectorId: form.inspectorId ? Number(form.inspectorId) : null,
                fotoDiagnostico: preview || null,
                fechaMuestreo: toUtc(form.fechaMuestreo),
                etapaFenologica: form.etapaFenologica || null,
                plagaId: form.tipo === "plaga" ? Number(form.plagaId) : null,
                enfermedadId:
                    form.tipo === "enfermedad" ? Number(form.enfermedadId) : null,
                severidad: Number(form.severidad),
                notas: form.notas || null,
            };

            setLoading(true);
            const creado = await createDiagnostico(payload);

            if (typeof onCreated === "function") onCreated(creado);

            setMsg("Diagnóstico creado correctamente.");
            setTimeout(() => {
                const el = document.getElementById("modalNuevoDiag");
                if (el && window.bootstrap?.Modal) {
                    const inst =
                        window.bootstrap.Modal.getInstance(el) ||
                        new window.bootstrap.Modal(el);
                    inst.hide();
                }
                // limpiar
                setPreview(null);
                setFilename("");
                if (fileRef.current) fileRef.current.value = "";
                setForm({
                    inspectorId: "",
                    fechaMuestreo: new Date().toISOString().slice(0, 16),
                    etapaFenologica: "V2",
                    tipo: "",
                    plagaId: "",
                    enfermedadId: "",
                    severidad: "2",
                    notas: "",
                });
            }, 700);
        } catch (err) {
            setMsg(
                (err && err.message) ||
                "Error al crear diagnóstico. Verifica plagaId/enfermedadId."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal fade" id="modalNuevoDiag" tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content border-0 rounded-4 shadow-lg">
                    <div className="modal-header bg-white">
                        <h5 className="modal-title text-success d-flex align-items-center">
                            <i className="fa-solid fa-microscope me-2" />
                            Nuevo diagnóstico (simulado)
                        </h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" />
                    </div>

                    <div className="modal-body">
                        {/* Estado de catálogos */}
                        {loadingCatalogs && (
                            <div className="alert alert-info py-2">
                                Cargando catálogos de plagas y enfermedades…
                            </div>
                        )}
                        {catError && (
                            <div className="alert alert-danger py-2">
                                {catError}
                            </div>
                        )}

                        {/* Foto */}
                        <div className="mb-3">
                            <label className="fw-semibold">
                                Foto de la hoja / planta <span className="text-danger">*</span>
                            </label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={onFileChange}
                                disabled={loadingCatalogs}
                            />
                            {preview && (
                                <div className="mt-2">
                                    <img
                                        src={preview}
                                        alt="preview"
                                        className="img-fluid rounded shadow-sm"
                                        style={{ maxHeight: 260 }}
                                    />
                                </div>
                            )}

                            <div className="d-flex gap-2 mt-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm"
                                    onClick={handleClassify}
                                    disabled={loadingCatalogs || (!filename && !preview)}
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles me-1" />
                                    Clasificar (simulación)
                                </button>
                            </div>
                            <div className="form-text">
                                La clasificación simulada asigna Tipo y selecciona un elemento del catálogo.
                            </div>
                        </div>

                        {/* Inspector + Fecha + Etapa */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">InspectorId (opcional)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={form.inspectorId}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, inspectorId: e.target.value }))
                                    }
                                    disabled={loadingCatalogs}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Fecha muestreo</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={form.fechaMuestreo}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, fechaMuestreo: e.target.value }))
                                    }
                                    disabled={loadingCatalogs}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Etapa fenológica</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.etapaFenologica}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, etapaFenologica: e.target.value }))
                                    }
                                    disabled={loadingCatalogs}
                                />
                            </div>
                        </div>

                        {/* Tipo + Combos */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Tipo</label>
                                <select
                                    className="form-select"
                                    value={form.tipo}
                                    onChange={(e) => {
                                        const tipo = e.target.value;
                                        setForm((s) => ({
                                            ...s,
                                            tipo,
                                            plagaId: tipo === "plaga" ? (plagas[0]?.id ?? "") : "",
                                            enfermedadId:
                                                tipo === "enfermedad" ? (enfermedades[0]?.id ?? "") : "",
                                        }));
                                    }}
                                    disabled={loadingCatalogs}
                                >
                                    <option value="">Seleccione…</option>
                                    <option value="plaga">Plaga</option>
                                    <option value="enfermedad">Enfermedad</option>
                                </select>
                            </div>

                            {/* Plaga */}
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Plaga</label>
                                <select
                                    className="form-select"
                                    value={form.plagaId}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, plagaId: e.target.value }))
                                    }
                                    disabled={loadingCatalogs || form.tipo !== "plaga"}
                                >
                                    <option value="">Seleccione plaga…</option>
                                    {plagas.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}{p.extra ? ` — ${p.extra}` : ""} (Id {p.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Enfermedad */}
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Enfermedad</label>
                                <select
                                    className="form-select"
                                    value={form.enfermedadId}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, enfermedadId: e.target.value }))
                                    }
                                    disabled={loadingCatalogs || form.tipo !== "enfermedad"}
                                >
                                    <option value="">Seleccione enfermedad…</option>
                                    {enfermedades.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.nombre}{e.extra ? ` — ${e.extra}` : ""} (Id {e.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Severidad + Notas */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label small">Severidad (0–5)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    className="form-control"
                                    value={form.severidad}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, severidad: e.target.value }))
                                    }
                                    disabled={loadingCatalogs}
                                />
                            </div>
                            <div className="col-md-8 mb-3">
                                <label className="form-label small">Notas</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={form.notas}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, notas: e.target.value }))
                                    }
                                    disabled={loadingCatalogs}
                                />
                            </div>
                        </div>

                        {/* Errores / Mensajes */}
                        {errors.length > 0 && (
                            <div className="alert alert-danger py-2">
                                <ul className="mb-0">
                                    {errors.map((er, i) => (
                                        <li key={i}>{er}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {msg && <div className="alert alert-info py-2">{msg}</div>}
                    </div>

                    <div className="modal-footer bg-white">
                        <button type="button" className="btn btn-outline-success" data-bs-dismiss="modal" disabled={loading}>
                            Cancelar
                        </button>
                        <button className="btn btn-success" onClick={handleSave} disabled={loading || loadingCatalogs}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Guardando…
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-floppy-disk me-1" />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
