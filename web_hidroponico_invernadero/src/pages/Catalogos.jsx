import { useEffect, useState } from "react";
import { listPlagas, createPlaga, updatePlaga, deletePlaga } from "../services/plagas";
import { listEnfermedades, createEnfermedad, updateEnfermedad, deleteEnfermedad } from "../services/enfermedades";

const PAGE_SIZE = 10;
const TIPOS_PATOGENO = ["hongo", "bacteria", "virus", "nematodo", "oomiceto", "fitoplasma", "otro"];

export default function Catalogos() {
    const [tab, setTab] = useState("plagas");
    return (
        <div className="container-fluid" id="pageCatalogos">
            <div className="d-sm-flex align-items-center justify-content-between mb-3">
                <h1 className="h3 mb-0 text-success"><i className="fa-solid fa-book me-2" /> Catálogos</h1>
            </div>
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "plagas" ? "active" : ""}`} onClick={() => setTab("plagas")}>Plagas</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "enfermedades" ? "active" : ""}`} onClick={() => setTab("enfermedades")}>Enfermedades</button>
                </li>
            </ul>
            {tab === "plagas" ? <PlagasCrud /> : <EnfermedadesCrud />}
        </div>
    );
}

/* ==================== PLAGAS ==================== */
function PlagasCrud() {
    const [q, setQ] = useState("");
    const [applied, setApplied] = useState({ q: "" });
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState(initPlagaForm());

    useEffect(() => {
        (async () => {
            try {
                setLoading(true); setErr(null);
                const res = await listPlagas({ q: applied.q, page, pageSize: PAGE_SIZE });
                setData({ items: res.items || [], total: res.total || 0 });
            } catch (e) { setErr(msg(e)); } finally { setLoading(false); }
        })();
    }, [applied, page]);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

    function openNew() { setEdit(null); setForm(initPlagaForm()); openModal("modalPlaga"); }
    function openEdit(it) {
        setEdit(it);
        setForm({
            nombreComun: it.nombreComun || "",
            nombreCientifico: it.nombreCientifico || "",
            cicloVida: it.cicloVida || "",
            descripcion: it.descripcion || "",
            fotoUrl: it.fotoUrl || "",
            partesAfectadas: it.partesAfectadas || "",
            temporada: it.temporada || "",
            nivelRiesgo: it.nivelRiesgo ?? 0
        });
        openModal("modalPlaga");
    }

    async function save() {
        try {
            validateNivel(form.nivelRiesgo);
            const payload = mapPlagaPayload(form);
            if (edit) await updatePlaga(edit.id, payload);
            else await createPlaga(payload);
            closeModal("modalPlaga");
            setPage(1);
            setApplied((s) => ({ ...s })); // reload
        } catch (e) { alert(msg(e)); }
    }
    async function remove(id) {
        if (!confirm("¿Eliminar plaga?")) return;
        try { await deletePlaga(id); setPage(1); setApplied((s) => ({ ...s })); }
        catch (e) { alert(msg(e)); }
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
                {/* Filtros */}
                <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-6">
                        <label className="form-label small">Buscar</label>
                        <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre común / científico / partes / temporada" />
                    </div>
                    <div className="col-md-6 text-end">
                        <button className="btn btn-success me-2" onClick={() => { setApplied({ q }); setPage(1); }}>
                            <i className="fa-solid fa-filter me-1" /> Aplicar
                        </button>
                        <button className="btn btn-outline-success" onClick={() => { setQ(""); setApplied({ q: "" }); setPage(1); }}>
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="m-0 text-success">Plagas ({data.total})</h6>
                    <button className="btn btn-sm btn-success" onClick={openNew}><i className="fa fa-plus me-1" /> Nuevo</button>
                </div>

                {/* Tabla */}
                {loading ? <div className="text-muted">Cargando…</div>
                    : err ? <div className="alert alert-danger">{err}</div>
                        : data.items.length === 0 ? <div className="text-muted">Sin resultados</div>
                            : (
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 80 }}>ID</th>
                                                <th>Nombre común</th>
                                                <th>Nombre científico</th>
                                                <th>Partes afectadas</th>
                                                <th>Temporada</th>
                                                <th>Nivel</th>
                                                <th style={{ width: 120 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((it) => (
                                                <tr key={it.id}>
                                                    <td>{it.id}</td>
                                                    <td>{it.nombreComun}</td>
                                                    <td className="text-muted">{it.nombreCientifico || "—"}</td>
                                                    <td className="text-muted">{it.partesAfectadas || "—"}</td>
                                                    <td className="text-muted">{it.temporada || "—"}</td>
                                                    <td><span className="badge bg-success-subtle text-success">{it.nivelRiesgo}</span></td>
                                                    <td className="text-end">
                                                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => openEdit(it)}><i className="fa fa-pen" /></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(it.id)}><i className="fa fa-trash" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                }

                {/* Paginación */}
                {totalPages > 1 && <Pager page={page} totalPages={totalPages} setPage={setPage} />}
            </div>

            {/* Modal */}
            <Modal id="modalPlaga" title={edit ? "Editar plaga" : "Nueva plaga"} onSave={save}>
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label small">Nombre común *</label>
                        <input className="form-control" value={form.nombreComun} onChange={e => setForm(s => ({ ...s, nombreComun: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Nombre científico</label>
                        <input className="form-control" value={form.nombreCientifico} onChange={e => setForm(s => ({ ...s, nombreCientifico: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Ciclo de vida</label>
                        <input className="form-control" value={form.cicloVida} onChange={e => setForm(s => ({ ...s, cicloVida: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Foto (URL)</label>
                        <input className="form-control" value={form.fotoUrl} onChange={e => setForm(s => ({ ...s, fotoUrl: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Partes afectadas</label>
                        <input className="form-control" value={form.partesAfectadas} onChange={e => setForm(s => ({ ...s, partesAfectadas: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Temporada</label>
                        <input className="form-control" value={form.temporada} onChange={e => setForm(s => ({ ...s, temporada: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Nivel riesgo (0-5)</label>
                        <input type="number" min="0" max="5" className="form-control" value={form.nivelRiesgo} onChange={e => setForm(s => ({ ...s, nivelRiesgo: Number(e.target.value) }))} />
                    </div>
                    <div className="col-12">
                        <label className="form-label small">Descripción</label>
                        <textarea rows={3} className="form-control" value={form.descripcion} onChange={e => setForm(s => ({ ...s, descripcion: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ==================== ENFERMEDADES ==================== */
function EnfermedadesCrud() {
    const [q, setQ] = useState("");
    const [applied, setApplied] = useState({ q: "" });
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState(initEnferForm());

    useEffect(() => {
        (async () => {
            try {
                setLoading(true); setErr(null);
                const res = await listEnfermedades({ q: applied.q, page, pageSize: PAGE_SIZE });
                setData({ items: res.items || [], total: res.total || 0 });
            } catch (e) { setErr(msg(e)); } finally { setLoading(false); }
        })();
    }, [applied, page]);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));

    function openNew() { setEdit(null); setForm(initEnferForm()); openModal("modalEnfer"); }
    function openEdit(it) {
        setEdit(it);
        setForm({
            nombreComun: it.nombreComun || "",
            agenteCausal: it.agenteCausal || "",
            tipoPatogeno: it.tipoPatogeno || "",
            descripcion: it.descripcion || "",
            fotoUrl: it.fotoUrl || "",
            partesAfectadas: it.partesAfectadas || "",
            temporada: it.temporada || "",
            nivelRiesgo: it.nivelRiesgo ?? 0
        });
        openModal("modalEnfer");
    }

    async function save() {
        try {
            validateNivel(form.nivelRiesgo);
            validateTipo(form.tipoPatogeno);
            const payload = mapEnferPayload(form);
            if (edit) await updateEnfermedad(edit.id, payload);
            else await createEnfermedad(payload);
            closeModal("modalEnfer");
            setPage(1);
            setApplied((s) => ({ ...s }));
        } catch (e) { alert(msg(e)); }
    }
    async function remove(id) {
        if (!confirm("¿Eliminar enfermedad?")) return;
        try { await deleteEnfermedad(id); setPage(1); setApplied((s) => ({ ...s })); }
        catch (e) { alert(msg(e)); }
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
                {/* Filtros */}
                <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-6">
                        <label className="form-label small">Buscar</label>
                        <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre común / agente / tipo / partes / temporada" />
                    </div>
                    <div className="col-md-6 text-end">
                        <button className="btn btn-success me-2" onClick={() => { setApplied({ q }); setPage(1); }}>
                            <i className="fa-solid fa-filter me-1" /> Aplicar
                        </button>
                        <button className="btn btn-outline-success" onClick={() => { setQ(""); setApplied({ q: "" }); setPage(1); }}>
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="m-0 text-success">Enfermedades ({data.total})</h6>
                    <button className="btn btn-sm btn-success" onClick={openNew}><i className="fa fa-plus me-1" /> Nuevo</button>
                </div>

                {/* Tabla */}
                {loading ? <div className="text-muted">Cargando…</div>
                    : err ? <div className="alert alert-danger">{err}</div>
                        : data.items.length === 0 ? <div className="text-muted">Sin resultados</div>
                            : (
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 80 }}>ID</th>
                                                <th>Nombre común</th>
                                                <th>Agente causal</th>
                                                <th>Tipo</th>
                                                <th>Partes afectadas</th>
                                                <th>Temporada</th>
                                                <th>Nivel</th>
                                                <th style={{ width: 120 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((it) => (
                                                <tr key={it.id}>
                                                    <td>{it.id}</td>
                                                    <td>{it.nombreComun}</td>
                                                    <td className="text-muted">{it.agenteCausal || "—"}</td>
                                                    <td className="text-muted text-capitalize">{it.tipoPatogeno || "—"}</td>
                                                    <td className="text-muted">{it.partesAfectadas || "—"}</td>
                                                    <td className="text-muted">{it.temporada || "—"}</td>
                                                    <td><span className="badge bg-success-subtle text-success">{it.nivelRiesgo}</span></td>
                                                    <td className="text-end">
                                                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => openEdit(it)}><i className="fa fa-pen" /></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(it.id)}><i className="fa fa-trash" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                }

                {/* Paginación */}
                {totalPages > 1 && <Pager page={page} totalPages={totalPages} setPage={setPage} />}
            </div>

            {/* Modal */}
            <Modal id="modalEnfer" title={edit ? "Editar enfermedad" : "Nueva enfermedad"} onSave={save}>
                <div className="row g-2">
                    <div className="col-md-6">
                        <label className="form-label small">Nombre común *</label>
                        <input className="form-control" value={form.nombreComun} onChange={e => setForm(s => ({ ...s, nombreComun: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Agente causal</label>
                        <input className="form-control" value={form.agenteCausal} onChange={e => setForm(s => ({ ...s, agenteCausal: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Tipo patógeno</label>
                        <select className="form-select" value={form.tipoPatogeno} onChange={e => setForm(s => ({ ...s, tipoPatogeno: e.target.value }))}>
                            <option value="">(Seleccione)</option>
                            {TIPOS_PATOGENO.map(t => <option key={t} value={t}>{ucfirst(t)}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Foto (URL)</label>
                        <input className="form-control" value={form.fotoUrl} onChange={e => setForm(s => ({ ...s, fotoUrl: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small">Partes afectadas</label>
                        <input className="form-control" value={form.partesAfectadas} onChange={e => setForm(s => ({ ...s, partesAfectadas: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Temporada</label>
                        <input className="form-control" value={form.temporada} onChange={e => setForm(s => ({ ...s, temporada: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Nivel riesgo (0-5)</label>
                        <input type="number" min="0" max="5" className="form-control" value={form.nivelRiesgo} onChange={e => setForm(s => ({ ...s, nivelRiesgo: Number(e.target.value) }))} />
                    </div>
                    <div className="col-12">
                        <label className="form-label small">Descripción</label>
                        <textarea rows={3} className="form-control" value={form.descripcion} onChange={e => setForm(s => ({ ...s, descripcion: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* --------------- componentes/ayudas --------------- */
function Modal({ id, title, onSave, children }) {
    return (
        <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content border-0 rounded-3">
                    <div className="modal-header">
                        <h5 className="modal-title text-success">{title}</h5>
                        <button className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
                    </div>
                    <div className="modal-body">{children}</div>
                    <div className="modal-footer">
                        <button className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button className="btn btn-success" onClick={onSave}><i className="fa fa-save me-1" /> Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
function Pager({ page, totalPages, setPage }) {
    return (
        <nav className="mt-2">
            <ul className="pagination pagination-sm justify-content-center">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button>
                </li>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                    </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button>
                </li>
            </ul>
        </nav>
    );
}
function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const m = window.bootstrap?.Modal.getOrCreateInstance(el);
    m.show();
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const m = window.bootstrap?.Modal.getOrCreateInstance(el);
    m.hide();
}
function msg(e) { return e?.message || "Error"; }
function ucfirst(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function initPlagaForm() {
    return { nombreComun: "", nombreCientifico: "", cicloVida: "", descripcion: "", fotoUrl: "", partesAfectadas: "", temporada: "", nivelRiesgo: 0 };
}
function initEnferForm() {
    return { nombreComun: "", agenteCausal: "", tipoPatogeno: "", descripcion: "", fotoUrl: "", partesAfectadas: "", temporada: "", nivelRiesgo: 0 };
}
function validateNivel(n) {
    if (n < 0 || n > 5) throw new Error("Nivel de riesgo debe estar entre 0 y 5.");
}
function validateTipo(t) {
    if (!t) return; // opcional
    const ok = ["hongo", "bacteria", "virus", "nematodo", "oomiceto", "fitoplasma", "otro"].includes(t.toLowerCase());
    if (!ok) throw new Error("Tipo patógeno inválido.");
}
function mapPlagaPayload(f) {
    return {
        nombreComun: f.nombreComun?.trim(),
        nombreCientifico: f.nombreCientifico?.trim() || null,
        cicloVida: f.cicloVida?.trim() || null,
        descripcion: f.descripcion || null,
        fotoUrl: f.fotoUrl?.trim() || null,
        partesAfectadas: f.partesAfectadas?.trim() || null,
        temporada: f.temporada?.trim() || null,
        nivelRiesgo: Number(f.nivelRiesgo ?? 0)
    };
}
function mapEnferPayload(f) {
    return {
        nombreComun: f.nombreComun?.trim(),
        agenteCausal: f.agenteCausal?.trim() || null,
        tipoPatogeno: f.tipoPatogeno?.trim() || null,
        descripcion: f.descripcion || null,
        fotoUrl: f.fotoUrl?.trim() || null,
        partesAfectadas: f.partesAfectadas?.trim() || null,
        temporada: f.temporada?.trim() || null,
        nivelRiesgo: Number(f.nivelRiesgo ?? 0)
    };
}
