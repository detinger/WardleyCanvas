// /reference — Wardley concepts, notation and the climate, doctrine and
// gameplay catalogs (Section 3.2), with attribution (Section 7.4).

import PageLayout from '@/components/shell/PageLayout';
import { CLIMATE_CATALOG, CLIMATE_CATEGORIES } from '@/analysis/climate-catalog';
import { DOCTRINE_CATALOG, DOCTRINE_PHASES } from '@/analysis/doctrine-catalog';
import { GAMEPLAY_CATALOG, GAMEPLAY_CATEGORIES } from '@/analysis/gameplay-catalog';
import { WARDLEY_CATALOG_PROVENANCE } from '@/analysis/catalog-meta';
import { DEFAULT_EVOLUTION_LABELS } from '@/domain/types';

const NOTATION: [string, string, string][] = [
  ['Anchor', 'anchor User [0.95, 0.5]', 'Who has the need. Sits at the top of the map, at high visibility.'],
  ['Component', 'component Tea [0.6, 0.8]', 'Something in the value chain. Coordinates are [visibility, evolution], both 0–1.'],
  ['Dependency', 'Tea Cup->Tea', '“A depends on B”: A needs B in order to work. Read the arrow towards the thing depended on.'],
  ['Flow', 'Shop+>Payments', 'Something that moves between components, such as money or data. Optional label: Shop+\'money\'>Payments.'],
  ['Evolve', 'evolve Kettle 0.7 as Electric Kettle', 'An expected or proposed movement towards commodity. A direction, not a date.'],
  ['Inertia', 'inertia Kettle', 'Resistance to change within the organisation, such as sunk investment or skills.'],
  ['Sourcing', 'build Kettle / buy Tea / outsource Power', 'How a component is obtained.'],
  ['Pipeline', 'pipeline Kettle [0.3, 0.7]', 'A family of related components spanning a range of evolution.'],
  ['Market / submap', 'market Tea Market [0.5, 0.7]', 'A market, or a component that is itself described by another map.'],
  ['Note / annotation', 'annotation 1 [0.5, 0.5] Why this matters', 'Observations written directly on the map.'],
];

const STAGES: [string, string][] = [
  [DEFAULT_EVOLUTION_LABELS[0], 'New, rare, poorly understood and changing fast. Exploration and experimentation fit best.'],
  [DEFAULT_EVOLUTION_LABELS[1], 'Built by a few for their own use; learning is still high and every implementation differs.'],
  [DEFAULT_EVOLUTION_LABELS[2], 'Bought from vendors who compete on features; increasingly well understood.'],
  [DEFAULT_EVOLUTION_LABELS[3], 'Standardised, widespread and stable; competition is on cost and reliability.'],
];

const INDEX = [
  { id: 'notation', label: 'Notation' },
  { id: 'evolution', label: 'Evolution stages' },
  { id: 'climate', label: `Climatic patterns (${CLIMATE_CATALOG.length})` },
  { id: 'doctrine', label: `Doctrine (${DOCTRINE_CATALOG.length})` },
  { id: 'gameplay', label: `Gameplay (${GAMEPLAY_CATALOG.length})` },
  { id: 'attribution', label: 'Sources and licence' },
];

export default function ReferencePage() {
  return (
    <PageLayout eyebrow="Learn" title="Reference" intro="Notation, evolution and the catalogs used by the analysis layers. Catalog entries are definitions; assessments on your maps are your own assertions.">
      <div className="reference">
        <nav aria-label="Reference contents" className="reference__index">
          <ul>
            {INDEX.map((i) => <li key={i.id}><a href={`#${i.id}`}>{i.label}</a></li>)}
          </ul>
        </nav>
        <article className="reference__article">
          <section id="notation" aria-labelledby="notation-h">
            <h2 id="notation-h">Notation</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">Element</th><th scope="col">Maps-as-code</th><th scope="col">Meaning</th></tr></thead>
                <tbody>
                  {NOTATION.map(([name, code, meaning]) => (
                    <tr key={name}><th scope="row">{name}</th><td><code>{code}</code></td><td>{meaning}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="evolution" aria-labelledby="evolution-h">
            <h2 id="evolution-h">Evolution stages</h2>
            <p>The horizontal axis describes how mature and widespread a component is in the market, left to right. Positions are judgements, not measurements, and never a timeline.</p>
            <dl>
              {STAGES.map(([stage, text]) => (<div key={stage}><dt>{stage}</dt><dd>{text}</dd></div>))}
            </dl>
          </section>

          <section id="climate" aria-labelledby="climate-h">
            <h2 id="climate-h">Climatic patterns</h2>
            <p>External forces that affect every player. Use them as questions to ask of a map.</p>
            {CLIMATE_CATEGORIES.map((cat) => (
              <div key={cat}>
                <h3 style={{ textTransform: 'capitalize' }}>{cat}</h3>
                {CLIMATE_CATALOG.filter((e) => e.category === cat).map((e) => (
                  <div key={e.id} className="ref-entry">
                    <h4>{e.shortTitle} <span className="ref-id">{e.id} · v{e.version}</span></h4>
                    <p>{e.description}</p>
                    <p className="ref-label">Questions to ask</p>
                    <ul>{e.assessmentPrompts.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section id="doctrine" aria-labelledby="doctrine-h">
            <h2 id="doctrine-h">Doctrine</h2>
            <p>Generally useful operating principles, grouped in phases. Assess them honestly with evidence; they are not a score.</p>
            {DOCTRINE_PHASES.map((ph) => (
              <div key={ph.phase}>
                <h3>Phase {ph.phase}: {ph.label}</h3>
                {DOCTRINE_CATALOG.filter((e) => e.phase === ph.phase).map((e) => (
                  <div key={e.id} className="ref-entry">
                    <h4>{e.shortTitle} <span className="ref-id">{e.id} · {e.category}</span></h4>
                    <p>{e.definition}</p>
                    <p className="ref-label">In practice when</p>
                    <ul>{e.observableSignals.map((x) => <li key={x}>{x}</li>)}</ul>
                    <p className="ref-label">Absent when</p>
                    <ul>{e.counterSignals.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section id="gameplay" aria-labelledby="gameplay-h">
            <h2 id="gameplay-h">Gameplay</h2>
            <p>Context-specific moves. On a map they are hypotheses that need rationale, signals, stop conditions, risks and a deliberate ethical and legal review — never instructions.</p>
            {GAMEPLAY_CATEGORIES.map((cat) => {
              const entries = GAMEPLAY_CATALOG.filter((e) => e.category === cat.id);
              if (entries.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3>{cat.label}</h3>
                  {entries.map((e) => (
                    <div key={e.id} className="ref-entry">
                      <h4>{e.shortTitle} <span className="ref-id">{e.id} · v{e.version}</span></h4>
                      <p>{e.description}</p>
                      <p><strong>Intended effect:</strong> {e.intendedEffect}</p>
                      {e.caution && <p role="note" className="ref-caution"><strong>Caution:</strong> {e.caution}</p>}
                      <p className="ref-label">Prerequisites</p>
                      <ul>{e.prerequisites.map((x) => <li key={x}>{x}</li>)}</ul>
                      <p className="ref-label">Risks</p>
                      <ul>{e.risks.map((x) => <li key={x}>{x}</li>)}</ul>
                      <p className="ref-label">Counterplays</p>
                      <ul>{e.counterplays.map((x) => <li key={x}>{x}</li>)}</ul>
                      <p className="ref-label">Ethical and legal review</p>
                      <ul>{e.ethicalReviewPrompts.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  ))}
                </div>
              );
            })}
          </section>

          <section id="attribution" aria-labelledby="attribution-h">
            <h2 id="attribution-h">Sources and licence</h2>
            <p>
              Catalog definitions are adapted and rewritten from <a href={WARDLEY_CATALOG_PROVENANCE.sourceUrl} target="_blank" rel="noopener noreferrer">Wardley Maps</a> by
              Simon Wardley, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
              These adaptations are shared under the same licence. This product is not affiliated with or endorsed by Simon Wardley.
              The maps-as-code syntax follows <a href="https://docs.onlinewardleymaps.com/" target="_blank" rel="noopener noreferrer">OnlineWardleyMaps</a>.
            </p>
            <p className="ref-id">Catalog provenance reviewed {WARDLEY_CATALOG_PROVENANCE.lastReviewed}. See the repository notice for third-party software licences.</p>
          </section>
        </article>
      </div>
    </PageLayout>
  );
}
