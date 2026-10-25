import { LearningModule } from '../types';
import { REVIEWED_META, solution } from './helpers';

const REFERENCE_LINKS = [
  {
    id: 'wardley-maps-book',
    label: 'Simon Wardley — Wardley Maps (free online book)',
    url: 'https://archive.learnwardleymapping.com/book.html',
  },
];

const incidentStatus: LearningModule = {
  id: 'case-saas-incident-status',
  index: 9,
  title: 'SaaS incident status service',
  tagline: 'Start with a user need and trace a small, visible value chain.',
  conceptIds: ['anchor', 'user-need', 'value-chain'],
  caseStudy: { number: 1, guidance: 'Guided', estimatedMinutes: 20, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The situation

A business-to-business SaaS company suffers a production incident. Support engineers need to answer customers quickly, but operational facts are spread across dashboards, chat, and monitoring tools. The company is considering a customer-facing incident status service.

Your task is not to design screens. First map the need: **give support engineers a trustworthy, current account of an incident**. Then trace what that visible outcome depends on. A status dashboard may depend on an incident event stream, monitoring agents, and commodity compute and networking.

## What to notice

The customer-facing page is visible, but most of the capability that makes it trustworthy is not. A polished page without reliable incident data has little value. This first case is deliberately guided: the anchor and first visible component are already present, and you complete the chain beneath them.
`,
  examples: [
    {
      id: 'status-service-slice',
      title: 'A thin incident-status value chain',
      description: 'A support engineer depends on trustworthy status, which depends on increasingly invisible operational components.',
      owmSource: `title Incident status service

anchor Support Engineer [0.95, 0.30]
component Trustworthy Incident Status [0.86, 0.34]
component Status Dashboard [0.75, 0.42]
component Incident Event Stream [0.55, 0.58]
component Monitoring Agents [0.34, 0.72]
component Compute and Network [0.18, 0.92]

Support Engineer->Trustworthy Incident Status
Trustworthy Incident Status->Status Dashboard
Status Dashboard->Incident Event Stream
Incident Event Stream->Monitoring Agents
Monitoring Agents->Compute and Network`,
      annotations: [
        'The anchor is a specific role in a specific situation, not a generic “user”.',
        'Trustworthy status describes the outcome; the dashboard is only one way to deliver it.',
        'Monitoring and infrastructure are essential but less visible to the support engineer.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-saas-incident-status',
    version: 1,
    title: 'Complete the incident-status chain',
    objective: 'Turn the starter into a connected map with a clear user need and at least four supporting components.',
    conceptIds: ['anchor', 'user-need', 'dependency'],
    starterOwm: `title Incident status service

anchor Support Engineer [0.95, 0.30]
component Trustworthy Incident Status [0.86, 0.34]
Support Engineer->Trustworthy Incident Status`,
    instructions: [
      { id: 's1', instruction: 'Select Support Engineer and describe the need: answer customers with accurate incident information without searching several tools.' },
      { id: 's2', instruction: 'Add a visible way to deliver that outcome, such as a status dashboard or status API.' },
      { id: 's3', instruction: 'Add the operational data source and monitoring capability beneath it.' },
      { id: 's4', instruction: 'Connect every component into one value chain and check your map.' },
    ],
    validators: [
      { id: 'v1-anchor', kind: 'has-anchor', minCount: 1, description: 'The map has a user anchor', rationale: 'The chain needs a defined person or role whose need gives the map purpose.' },
      { id: 'v2-components', kind: 'has-component', minCount: 4, description: 'The map has at least four components', rationale: 'A useful first case should expose the visible service and several supporting capabilities.' },
      { id: 'v3-dependencies', kind: 'has-dependency', minCount: 4, description: 'The map has at least four dependencies', rationale: 'Dependencies turn a component list into an explanation of how value is delivered.' },
      { id: 'v4-connected', kind: 'is-connected', description: 'Every component belongs to the user’s value chain', rationale: 'Disconnected technology has no explained role in this case.' },
      { id: 'v5-need', kind: 'anchor-has-description', description: 'The anchor description states the need', rationale: 'Writing the need prevents the dashboard itself from becoming the purpose.' },
    ],
    hints: [
      { level: 1, text: 'Ask what the support engineer must know, then what produces that information.' },
      { level: 2, text: 'A useful middle chain is Status Dashboard → Incident Event Stream → Monitoring Agents.' },
      { level: 3, text: 'Commodity compute and networking can sit at the bottom because the monitoring capability depends on them.' },
    ],
    rubric: [
      { id: 'r1', description: 'The anchor describes a real support situation rather than a software feature', reflectionOnly: true },
      { id: 'r2', description: 'Visibility decreases as the chain moves away from the user', reflectionOnly: true },
      { id: 'r3', description: 'Every component has a clear reason to be in scope', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Would the value chain change if the primary user were the affected customer rather than the support engineer?',
      'Which component creates trust, and which merely presents information?',
    ],
    sampleSolution: {
      explanation: 'One possible answer separates the need for trustworthy status from the dashboard used to present it.',
      build: solution(
        `title Incident status service
anchor Support Engineer [0.95, 0.30]
component Trustworthy Incident Status [0.86, 0.34]
component Status Dashboard [0.75, 0.42]
component Incident Event Stream [0.55, 0.58]
component Monitoring Agents [0.34, 0.72]
component Compute and Network [0.18, 0.92]
Support Engineer->Trustworthy Incident Status
Trustworthy Incident Status->Status Dashboard
Status Dashboard->Incident Event Stream
Incident Event Stream->Monitoring Agents
Monitoring Agents->Compute and Network`,
        (map, id) => {
          map.elements.find((element) => element.id === id('Support Engineer'))!.description =
            'Needs to answer customers with accurate, current incident information without searching several tools.';
        }
      ),
    },
  },
  reflectionPrompts: [
    'Why is “trustworthy incident status” a better starting point than “build a status page”?',
    'What did the dependency chain reveal that a feature list would not?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

const deliveryPlatform: LearningModule = {
  id: 'case-software-delivery-platform',
  index: 10,
  title: 'Software delivery platform',
  tagline: 'Map a branching value chain and place capabilities by market evolution.',
  conceptIds: ['dependency', 'value-chain', 'evolution'],
  caseStudy: { number: 2, guidance: 'Guided', estimatedMinutes: 25, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The situation

An internal platform team wants product teams to release changes safely several times a day. Today each team maintains a different collection of scripts, build machines, and deployment steps.

Map the outcome **a safe, repeatable release**, then the portal or API that exposes it. Beneath that, show orchestration, build workers, an artifact registry, and compute. Some components form branches: orchestration may depend on both workers and a registry.

## What to notice

Evolution is about the market, not the organisation’s skill. A team may operate a highly customised compute cluster, but compute itself is broadly available as a commodity. The deployment experience may be more distinctive, while registries and build execution are increasingly standard products or utilities.
`,
  examples: [
    {
      id: 'delivery-platform-example',
      title: 'A platform with branching dependencies',
      description: 'The deployment orchestrator needs both execution capacity and a place to store versioned artifacts.',
      owmSource: `title Software delivery platform
anchor Product Team [0.95, 0.25]
component Safe Repeatable Release [0.86, 0.30]
component Deployment Portal [0.76, 0.38]
component Pipeline Orchestrator [0.58, 0.52]
component Build Workers [0.40, 0.78]
component Artifact Registry [0.35, 0.76]
component Compute [0.18, 0.94]
Product Team->Safe Repeatable Release
Safe Repeatable Release->Deployment Portal
Deployment Portal->Pipeline Orchestrator
Pipeline Orchestrator->Build Workers
Pipeline Orchestrator->Artifact Registry
Build Workers->Compute
Artifact Registry->Compute`,
      annotations: [
        'The portal is visible to product teams; workers and storage are mostly invisible.',
        'The chain branches because orchestration depends on two different lower-level capabilities.',
        'Compute sits far right because market availability—not internal implementation—determines evolution.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-software-delivery-platform',
    version: 1,
    title: 'Finish the delivery platform map',
    objective: 'Complete a connected, branching platform map and spread its components across at least two evolution stages.',
    conceptIds: ['dependency', 'branching-chain', 'evolution'],
    starterOwm: `title Software delivery platform
anchor Product Team [0.95, 0.25]
component Safe Repeatable Release [0.86, 0.30]
component Deployment Portal [0.76, 0.38]
component Pipeline Orchestrator [0.58, 0.52]
component Compute [0.18, 0.94]
Product Team->Safe Repeatable Release
Safe Repeatable Release->Deployment Portal
Deployment Portal->Pipeline Orchestrator`,
    instructions: [
      { id: 's1', instruction: 'Add build execution and artifact storage as separate components beneath the orchestrator.' },
      { id: 's2', instruction: 'Connect both branches and their shared infrastructure so every component is reachable from Product Team.' },
      { id: 's3', instruction: 'Place the user-facing platform capabilities left of commodity infrastructure.' },
      { id: 's4', instruction: 'Describe one component with the evidence or reasoning behind its evolution position.' },
    ],
    validators: [
      { id: 'v1-components', kind: 'has-component', minCount: 6, description: 'The platform map has at least six components', rationale: 'The case needs enough structure to expose the orchestration, execution, storage, and infrastructure layers.' },
      { id: 'v2-dependencies', kind: 'has-dependency', minCount: 6, description: 'The map has at least six dependencies', rationale: 'A delivery platform is a connected system with branches, not a linear feature list.' },
      { id: 'v3-connected', kind: 'is-connected', description: 'Every platform component serves the product team', rationale: 'Connectivity makes the scope and purpose of each platform component explicit.' },
      { id: 'v4-stages', kind: 'multi-stage', description: 'Components span multiple evolution stages', rationale: 'Treating every platform capability as equally novel leads to inappropriate engineering choices.' },
      { id: 'v5-description', kind: 'component-has-description', description: 'At least one component explains its placement', rationale: 'A position is a judgement; recording why makes it open to challenge.' },
    ],
    hints: [
      { level: 1, text: 'What two things does an orchestrator need after it receives a deployment request?' },
      { level: 2, text: 'Add Build Workers and Artifact Registry as two branches from Pipeline Orchestrator.' },
      { level: 3, text: 'Both branches can ultimately depend on commodity Compute.' },
    ],
    rubric: [
      { id: 'r1', description: 'The map contains at least one genuine branch rather than only a straight line', reflectionOnly: true },
      { id: 'r2', description: 'Commodity infrastructure is placed according to market maturity', reflectionOnly: true },
      { id: 'r3', description: 'The component description gives a reason, observation, or uncertainty', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which components should the platform team build, buy, or consume as a utility?',
      'Where could standardisation reduce cognitive load for product teams?',
    ],
    sampleSolution: {
      explanation: 'This answer shows a branching chain and treats compute as a commodity rather than a source of differentiation.',
      build: solution(
        `title Software delivery platform
anchor Product Team [0.95, 0.25]
component Safe Repeatable Release [0.86, 0.30]
component Deployment Portal [0.76, 0.38]
component Pipeline Orchestrator [0.58, 0.52]
component Build Workers [0.40, 0.78]
component Artifact Registry [0.35, 0.76]
component Compute [0.18, 0.94]
Product Team->Safe Repeatable Release
Safe Repeatable Release->Deployment Portal
Deployment Portal->Pipeline Orchestrator
Pipeline Orchestrator->Build Workers
Pipeline Orchestrator->Artifact Registry
Build Workers->Compute
Artifact Registry->Compute`,
        (map, id) => {
          map.elements.find((element) => element.id === id('Compute'))!.description =
            'Equivalent elastic compute is available from several providers, so the market is mature even if our configuration is specialised.';
        }
      ),
    },
  },
  reflectionPrompts: [
    'How did branching dependencies change your understanding of the platform?',
    'Which apparently custom capability is actually available as a product or utility?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

const managedDatabase: LearningModule = {
  id: 'case-managed-database-service',
  index: 11,
  title: 'Managed database service',
  tagline: 'Use movement and annotations to turn a current-state map into a strategic conversation.',
  conceptIds: ['evolution', 'movement', 'annotation'],
  caseStudy: { number: 3, guidance: 'Supported', estimatedMinutes: 30, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The situation

A cloud provider operates a managed relational database. Application teams value dependable data access and automated recovery, but the provider still maintains a custom database engine and bespoke backup tooling.

The current map is already connected. Your job is to inspect it, identify capabilities under evolutionary pressure, and draw plausible movement. An evolve arrow is not a roadmap promise: it is a hypothesis about how the market and the component may change.

## What to notice

Movement needs a reason. Vendor competition, open standards, customer expectations, or a growing product ecosystem may push a component rightward. Add an annotation for a question the team must investigate, and describe one component so another reviewer can understand your judgement.
`,
  examples: [
    {
      id: 'managed-database-example',
      title: 'Current state and a proposed movement',
      description: 'The visible database API depends on engine, recovery automation, and commodity infrastructure.',
      owmSource: `title Managed database service
anchor Application Team [0.95, 0.34]
component Dependable Data Access [0.86, 0.32]
component Database API [0.74, 0.48]
component Database Engine [0.55, 0.58]
component Backup Automation [0.38, 0.70]
component Compute and Storage [0.18, 0.93]
Application Team->Dependable Data Access
Dependable Data Access->Database API
Database API->Database Engine
Database Engine->Backup Automation
Database Engine->Compute and Storage
Backup Automation->Compute and Storage
evolve Database Engine 0.78
evolve Backup Automation 0.88`,
      annotations: [
        'The arrows express a proposed future, not guaranteed delivery dates.',
        'The engine and backup capability can evolve at different rates.',
        'The team should test whether customers value engine differentiation or operational reliability.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-managed-database-service',
    version: 1,
    title: 'Explain how the database landscape may move',
    objective: 'Add two proposed movements, explain at least one, and annotate an uncertainty that the team should investigate.',
    conceptIds: ['evolution-movement', 'rationale', 'annotation'],
    starterOwm: `title Managed database service
anchor Application Team [0.95, 0.34]
component Dependable Data Access [0.86, 0.32]
component Database API [0.74, 0.48]
component Database Engine [0.55, 0.58]
component Backup Automation [0.38, 0.70]
component Compute and Storage [0.18, 0.93]
Application Team->Dependable Data Access
Dependable Data Access->Database API
Database API->Database Engine
Database Engine->Backup Automation
Database Engine->Compute and Storage
Backup Automation->Compute and Storage`,
    instructions: [
      { id: 's1', instruction: 'Review the evolution positions and move anything you believe is misplaced.' },
      { id: 's2', instruction: 'Add evolve arrows to two capabilities under market pressure.' },
      { id: 's3', instruction: 'Give at least one arrow a rationale based on an external observation or assumption.' },
      { id: 's4', instruction: 'Add a numbered note for an uncertainty, and describe one component whose position is debatable.' },
    ],
    validators: [
      { id: 'v1-stages', kind: 'multi-stage', description: 'The landscape spans more than one evolution stage', rationale: 'The case should distinguish emerging differentiation from mature utilities.' },
      { id: 'v2-movements', kind: 'has-evolution-movement', minCount: 2, description: 'Two components have proposed movement', rationale: 'Related capabilities often evolve at different rates, which creates strategic choices.' },
      { id: 'v3-rationale', kind: 'evolution-has-rationale', description: 'At least one movement explains why', rationale: 'A movement without a rationale cannot be challenged or monitored.' },
      { id: 'v4-note', kind: 'has-annotation', minCount: 1, description: 'The map records an uncertainty', rationale: 'Annotations keep important questions beside the part of the landscape they concern.' },
      { id: 'v5-description', kind: 'component-has-description', description: 'A component explains a placement judgement', rationale: 'Reviewers need to know what evidence or assumption shaped the position.' },
    ],
    hints: [
      { level: 1, text: 'Look for capabilities that many database vendors now offer in similar form.' },
      { level: 2, text: 'Database Engine and Backup Automation are reasonable candidates for rightward movement.' },
      { level: 3, text: 'A useful annotation asks whether users value a unique engine or dependable operations more.' },
    ],
    rubric: [
      { id: 'r1', description: 'Movement rationales refer to market forces or observable assumptions', reflectionOnly: true },
      { id: 'r2', description: 'The annotation is a real question rather than a restatement of the map', reflectionOnly: true },
      { id: 'r3', description: 'The map separates current position from proposed movement', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'What evidence would make you move the database engine further right?',
      'Where should the provider invest if engine technology becomes less differentiating?',
    ],
    sampleSolution: {
      explanation: 'One possible answer expects engine and backup capabilities to mature while keeping dependable data access as the visible outcome.',
      build: solution(
        `title Managed database service
anchor Application Team [0.95, 0.34]
component Dependable Data Access [0.86, 0.32]
component Database API [0.74, 0.48]
component Database Engine [0.55, 0.58]
component Backup Automation [0.38, 0.70]
component Compute and Storage [0.18, 0.93]
Application Team->Dependable Data Access
Dependable Data Access->Database API
Database API->Database Engine
Database Engine->Backup Automation
Database Engine->Compute and Storage
Backup Automation->Compute and Storage
evolve Database Engine 0.78
evolve Backup Automation 0.88`,
        (map, id) => {
          map.evolutions.find((movement) => movement.elementId === id('Database Engine'))!.rationale =
            'Open engines and managed competitors are making core database capability less distinctive.';
          map.elements.find((element) => element.id === id('Database API'))!.description =
            'The stable interface is visible to application teams and may matter more than the engine behind it.';
          map.annotations.push({ id: 'case-3-note', text: 'Do customers choose us for the engine or for operational reliability?', x: 0.48, y: 0.64, number: 1 });
        }
      ),
    },
  },
  reflectionPrompts: [
    'Which movement is most uncertain, and how would you test it?',
    'What new capability could be built if database operations become a commodity?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

const identityModernisation: LearningModule = {
  id: 'case-identity-modernisation',
  index: 12,
  title: 'Enterprise identity modernisation',
  tagline: 'Expose inertia and assess the external pressure behind a modernisation choice.',
  conceptIds: ['inertia', 'climate', 'movement'],
  caseStudy: { number: 4, guidance: 'Supported', estimatedMinutes: 35, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The situation

A software company uses a custom identity directory, local access rules, and manual account provisioning across its products. Customers now expect single sign-on, rapid offboarding, and auditable access. Mature identity providers exist, but years of product-specific integration make change difficult.

This case introduces **inertia**: resistance caused by sunk cost, skills, contracts, identity, or fear of disruption. Inertia does not mean a team is irrational. It names a force that can prevent a component moving even when the market has evolved.

## What to notice

Mark where resistance actually lives. The directory may have technical inertia, while product integrations and operating practices may create even stronger organisational inertia. Then assess one climatic pattern with a rationale. The point is not to declare migration inevitable, but to make pressure and resistance visible together.
`,
  examples: [
    {
      id: 'identity-modernisation-example',
      title: 'Identity capability under pressure',
      description: 'Mature external identity services create rightward pressure while custom integrations resist movement.',
      owmSource: `title Enterprise identity modernisation
anchor Security Administrator [0.95, 0.30]
component Controlled Employee Access [0.86, 0.34]
component Access Portal [0.75, 0.48]
component Product Integrations [0.58, 0.42]
component Identity Directory [0.48, 0.38]
component Provisioning Workflow [0.42, 0.45]
component Hosting [0.18, 0.92]
Security Administrator->Controlled Employee Access
Controlled Employee Access->Access Portal
Access Portal->Product Integrations
Product Integrations->Identity Directory
Identity Directory->Provisioning Workflow
Identity Directory->Hosting
evolve Identity Directory 0.82
evolve Provisioning Workflow 0.78`,
      annotations: [
        'Product integrations can create more inertia than the directory software itself.',
        'A movement arrow should name the assumption behind adopting a mature identity service.',
        'The map keeps customer expectation, market pressure, and internal resistance separate.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-identity-modernisation',
    version: 1,
    title: 'Map pressure and resistance in identity',
    objective: 'Identify at least two sources of inertia, propose two movements, and assess one climatic pattern with a rationale.',
    conceptIds: ['inertia', 'climate-assessment', 'evolution-movement'],
    starterOwm: `title Enterprise identity modernisation
anchor Security Administrator [0.95, 0.30]
component Controlled Employee Access [0.86, 0.34]
component Access Portal [0.75, 0.48]
component Product Integrations [0.58, 0.42]
component Identity Directory [0.48, 0.38]
component Provisioning Workflow [0.42, 0.45]
component Hosting [0.18, 0.92]
Security Administrator->Controlled Employee Access
Controlled Employee Access->Access Portal
Access Portal->Product Integrations
Product Integrations->Identity Directory
Identity Directory->Provisioning Workflow
Identity Directory->Hosting`,
    instructions: [
      { id: 's1', instruction: 'Mark at least two components with inertia and use their descriptions or a note to identify what resists change.' },
      { id: 's2', instruction: 'Add two evolve arrows that describe a plausible move toward mature identity services.' },
      { id: 's3', instruction: 'Give one movement a rationale that states the assumption behind it.' },
      { id: 's4', instruction: 'Open Analysis → Climate and assess a relevant pattern, such as past success creating inertia, with a case-specific rationale.' },
    ],
    validators: [
      { id: 'v1-inertia', kind: 'has-inertia', minCount: 2, description: 'At least two components are marked with inertia', rationale: 'Modernisation risk is distributed across technology, integration, process, and organisational identity.' },
      { id: 'v2-movements', kind: 'has-evolution-movement', minCount: 2, description: 'Two components have proposed movement', rationale: 'A credible modernisation view includes related capabilities rather than treating identity as one box.' },
      { id: 'v3-rationale', kind: 'evolution-has-rationale', description: 'At least one movement names its assumption', rationale: 'The assumption determines what evidence should be monitored before committing.' },
      { id: 'v4-climate', kind: 'has-climate-assessment', minCount: 1, description: 'A climatic pattern is assessed with a rationale', rationale: 'External pressure should be distinguished from an internal preference to modernise.' },
      { id: 'v5-note', kind: 'has-annotation', minCount: 1, description: 'The map records a modernisation risk or question', rationale: 'Keeping a risk beside the map helps reviewers challenge the proposed movement.' },
    ],
    hints: [
      { level: 1, text: 'Look for sunk integration effort, specialist skills, operational habits, and fear of access disruption.' },
      { level: 2, text: 'Product Integrations and Identity Directory are plausible places to mark inertia.' },
      { level: 3, text: 'In Climate, “Past success creates inertia” fits if you explain exactly what prior investment now resists change.' },
    ],
    rubric: [
      { id: 'r1', description: 'Inertia is explained as a specific force, not used as a label for people who disagree', reflectionOnly: true },
      { id: 'r2', description: 'The climate rationale refers to this identity landscape', reflectionOnly: true },
      { id: 'r3', description: 'The movement does not imply that migration is guaranteed or risk-free', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which source of inertia would be hardest to reduce, and why?',
      'What signal would tell you that the market pressure has been overestimated?',
    ],
    sampleSolution: {
      explanation: 'This answer treats integrations and the directory as separate sources of inertia and frames migration as a hypothesis.',
      build: solution(
        `title Enterprise identity modernisation
anchor Security Administrator [0.95, 0.30]
component Controlled Employee Access [0.86, 0.34]
component Access Portal [0.75, 0.48]
component Product Integrations [0.58, 0.42]
component Identity Directory [0.48, 0.38]
component Provisioning Workflow [0.42, 0.45]
component Hosting [0.18, 0.92]
Security Administrator->Controlled Employee Access
Controlled Employee Access->Access Portal
Access Portal->Product Integrations
Product Integrations->Identity Directory
Identity Directory->Provisioning Workflow
Identity Directory->Hosting
evolve Identity Directory 0.82
evolve Provisioning Workflow 0.78`,
        (map, id) => {
          map.elements.find((element) => element.id === id('Product Integrations'))!.inertia = true;
          map.elements.find((element) => element.id === id('Identity Directory'))!.inertia = true;
          map.evolutions.find((movement) => movement.elementId === id('Identity Directory'))!.rationale =
            'Assumes mature providers meet our audit, availability, and migration requirements.';
          map.annotations.push({ id: 'case-4-note', text: 'Risk: product-specific access rules may not survive migration unchanged.', x: 0.40, y: 0.62, number: 1 });
          map.analysis.climate.push({
            id: 'case-4-climate', catalogId: 'cp-003', appliesToIds: [id('Identity Directory'), id('Product Integrations')],
            state: 'applies', rationale: 'Years of bespoke integration and operational familiarity create resistance even as identity services mature.',
            evidenceIds: [], confidence: 'medium', owner: 'Identity programme',
          });
        }
      ),
    },
  },
  reflectionPrompts: [
    'How would you separate technical migration risk from organisational inertia?',
    'Which assumption should be tested before selecting an identity provider?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

const aiCodeReview: LearningModule = {
  id: 'case-ai-code-review',
  index: 13,
  title: 'AI-assisted code review',
  tagline: 'Connect evidence, climate, doctrine, and a gameplay hypothesis to an emerging product map.',
  conceptIds: ['evidence', 'climate', 'doctrine', 'gameplay'],
  caseStudy: { number: 5, guidance: 'Supported', estimatedMinutes: 40, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The situation

A developer-tools company is considering AI-assisted code review. Engineering leaders want shorter review queues without lowering safety or teaching developers to ignore uncertain suggestions. Foundation models and compute are broadly available, while repository context, evaluation, and workflow integration may still create differentiation.

Build enough of the landscape to distinguish the user-visible review outcome from model access and commodity infrastructure. Then add evidence and assess the strategic context. A catalog pattern is only useful when its rationale refers to this map.

## What to notice

The hypothesis must be testable. Record a leading signal, a risk, and a stop condition. “AI will improve productivity” is not a strategy. “If repository-aware suggestions reduce median review time without increasing escaped defects, expand the pilot” is a claim a team can observe and reject.
`,
  examples: [
    {
      id: 'ai-review-example',
      title: 'AI review as a value chain, not a model demo',
      description: 'The differentiated capability combines workflow context and evaluation on top of increasingly available model infrastructure.',
      owmSource: `title AI-assisted code review
anchor Engineering Lead [0.95, 0.28]
component Faster Safe Reviews [0.87, 0.30]
component Review Workflow [0.77, 0.42]
component Repository Context [0.60, 0.38]
component Suggestion Evaluation [0.52, 0.32]
component Model API [0.38, 0.76]
component Source Repository [0.30, 0.82]
component Compute [0.16, 0.94]
Engineering Lead->Faster Safe Reviews
Faster Safe Reviews->Review Workflow
Review Workflow->Repository Context
Review Workflow->Suggestion Evaluation
Repository Context->Source Repository
Suggestion Evaluation->Model API
Model API->Compute`,
      annotations: [
        'The model API is not the user need and may not remain differentiating.',
        'Repository context and evaluation are separate because they carry different evidence and risks.',
        'A responsible hypothesis includes quality signals and stop conditions, not only speed.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-ai-code-review',
    version: 1,
    title: 'Form a testable AI product strategy',
    objective: 'Complete the map, add evidence-backed strategic assessments, and write a gameplay hypothesis with a signal, risk, and stop condition.',
    conceptIds: ['evidence', 'climate-assessment', 'doctrine-assessment', 'gameplay-hypothesis'],
    starterOwm: `title AI-assisted code review
anchor Engineering Lead [0.95, 0.28]
component Faster Safe Reviews [0.87, 0.30]
component Review Workflow [0.77, 0.42]
component Model API [0.38, 0.76]
component Compute [0.16, 0.94]
Engineering Lead->Faster Safe Reviews
Faster Safe Reviews->Review Workflow
Review Workflow->Model API
Model API->Compute`,
    instructions: [
      { id: 's1', instruction: 'Complete the value chain with the context and evaluation capabilities needed for safe suggestions.' },
      { id: 's2', instruction: 'Add an evidence record for an observation you would gather during a pilot.' },
      { id: 's3', instruction: 'Assess one climate pattern and one doctrine principle, each with a case-specific rationale; link at least one assessment to the evidence.' },
      { id: 's4', instruction: 'Add a gameplay hypothesis with intended effect, rationale, leading signal, risk, and stop condition.' },
    ],
    validators: [
      { id: 'v1-components', kind: 'has-component', minCount: 7, description: 'The map contains at least seven components', rationale: 'A strategy needs the workflow, context, evaluation, model, repository, and infrastructure—not only an AI endpoint.' },
      { id: 'v2-connected', kind: 'is-connected', description: 'Every component serves the review outcome', rationale: 'Connecting the chain exposes why each technical capability is in scope.' },
      { id: 'v3-stages', kind: 'multi-stage', description: 'The map distinguishes emerging and mature capabilities', rationale: 'Treating model access, compute, evaluation, and workflow as equally mature obscures where differentiation may exist.' },
      { id: 'v4-climate', kind: 'has-climate-assessment', minCount: 1, description: 'A climatic pattern is assessed with a rationale', rationale: 'Market pressure should be stated explicitly rather than smuggled into a technology recommendation.' },
      { id: 'v5-doctrine', kind: 'has-doctrine-assessment', minCount: 1, description: 'A doctrine principle is assessed with a rationale', rationale: 'Operating practice shapes whether the experiment can produce trustworthy learning.' },
      { id: 'v6-gameplay', kind: 'has-gameplay-hypothesis', minCount: 1, description: 'A hypothesis includes a rationale, signal, and risk', rationale: 'A strategy should be observable and revisable rather than a confident prediction.' },
      { id: 'v7-evidence', kind: 'assessment-has-evidence', description: 'At least one assessment is linked to evidence', rationale: 'Evidence makes strategic claims inspectable and gives the team a reason to update the map.' },
      { id: 'v8-stop', kind: 'custom', description: 'The hypothesis includes a stop condition', rationale: 'A pre-agreed stop condition limits harm and prevents escalating commitment.', nextStep: 'Add a concrete condition that would stop or redesign the pilot.', predicate: (map) => map.analysis.gameplay.some((item) => (item.stopConditions ?? []).some((value) => value.trim())) },
    ],
    hints: [
      { level: 1, text: 'Separate repository context and suggestion evaluation; they are different capabilities with different risks.' },
      { level: 2, text: 'Evidence could be a pilot observation such as review time, acceptance rate, or escaped-defect rate.' },
      { level: 3, text: 'A useful hypothesis tests faster reviews against a safety measure and stops if quality worsens.' },
    ],
    rubric: [
      { id: 'r1', description: 'Evidence describes an observation, not a belief about AI', reflectionOnly: true },
      { id: 'r2', description: 'The hypothesis balances speed with a quality or safety measure', reflectionOnly: true },
      { id: 'r3', description: 'The gameplay does not assume a guaranteed outcome', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which part of the chain is genuinely differentiating today, and how might that change?',
      'What evidence would cause you to abandon the product direction?',
    ],
    sampleSolution: {
      explanation: 'This answer treats model access as a product-like dependency and differentiates through context, evaluation, and workflow learning.',
      build: solution(
        `title AI-assisted code review
anchor Engineering Lead [0.95, 0.28]
component Faster Safe Reviews [0.87, 0.30]
component Review Workflow [0.77, 0.42]
component Repository Context [0.60, 0.38]
component Suggestion Evaluation [0.52, 0.32]
component Model API [0.38, 0.76]
component Source Repository [0.30, 0.82]
component Compute [0.16, 0.94]
Engineering Lead->Faster Safe Reviews
Faster Safe Reviews->Review Workflow
Review Workflow->Repository Context
Review Workflow->Suggestion Evaluation
Repository Context->Source Repository
Suggestion Evaluation->Model API
Model API->Compute`,
        (map, id) => {
          map.analysis.evidence.push({
            id: 'case-5-evidence', claim: 'In a four-team pilot, median review wait fell while escaped defects remained at the prior baseline.',
            sourceLabel: 'Four-week internal pilot', confidence: 'medium', observedAt: '2026-10-01',
          });
          map.analysis.climate.push({
            id: 'case-5-climate', catalogId: 'cp-002', appliesToIds: [id('Model API')], state: 'applies',
            rationale: 'Multiple providers now expose comparable model APIs, increasing pressure on model access to commoditise.',
            evidenceIds: ['case-5-evidence'], confidence: 'medium',
          });
          map.analysis.doctrine.push({
            id: 'case-5-doctrine', catalogId: 'dc-103', appliesToIds: [id('Review Workflow')], state: 'applies',
            rationale: 'The pilot measures the current workflow and quality baseline before committing to a product direction.',
            evidenceIds: [], confidence: 'medium', capabilityState: 'practiced',
          });
          map.analysis.gameplay.push({
            id: 'case-5-gameplay', catalogId: 'gp-003', appliesToIds: [id('Review Workflow'), id('Repository Context')], state: 'considering',
            rationale: 'Differentiate in the visible review experience and repository context while consuming model access as a product.',
            evidenceIds: ['case-5-evidence'], confidence: 'medium', category: 'user-perception',
            intendedEffect: 'Reduce review delay without weakening code quality.',
            leadingSignals: ['Median review wait falls by at least 20% in the pilot'],
            risks: ['Developers may over-trust plausible but unsafe suggestions'],
            ethicalNotes: 'Do not use individual acceptance rates as employee performance measures.',
            stopConditions: ['Escaped defects rise above the pre-pilot baseline'], humanReviewed: true,
          });
        }
      ),
    },
  },
  reflectionPrompts: [
    'How would you update this map if model APIs became interchangeable commodities?',
    'Which measure protects users from optimising only for review speed?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

const securityCapstone: LearningModule = {
  id: 'case-security-response-capstone',
  index: 14,
  title: 'Security incident response capstone',
  tagline: 'Build a defensible map from a brief with minimal scaffolding.',
  conceptIds: ['independent-mapping', 'value-chain', 'evolution', 'movement'],
  caseStudy: { number: 6, guidance: 'Independent', estimatedMinutes: 45, industry: 'IT' },
  published: true,
  meta: { ...REVIEWED_META, version: 1 },
  explanation: `
## The brief

A mid-sized software company wants to reduce the time between a security signal and a contained incident. Security analysts currently receive alerts from many products, investigate context manually, coordinate in chat, and execute containment through separate administrative tools. Leadership is considering an internal response platform.

Create the map as if you were preparing a strategy conversation. Decide who the primary user is and describe their need. Choose the components, connect the chain, and place each component by visibility and market evolution. Record at least one important uncertainty and one plausible movement.

## Your responsibility

This capstone intentionally does not provide a starter map or prescribed component names. The checks only test observable structure. They cannot tell you whether your scope, labels, positions, or strategic judgement are correct. Use the rubric and reflection to review those decisions yourself—the same discipline you will need when mapping your own organisation.
`,
  examples: [
    {
      id: 'security-response-slice',
      title: 'One possible decomposition—not a template to copy',
      description: 'This small slice shows how a response outcome can branch into investigation and containment capabilities.',
      owmSource: `title Security response slice
anchor Security Analyst [0.95, 0.26]
component Fast Safe Containment [0.86, 0.30]
component Response Workspace [0.76, 0.40]
component Investigation Context [0.58, 0.42]
component Containment Actions [0.55, 0.55]
component Security Event Store [0.36, 0.78]
component Cloud Infrastructure [0.16, 0.94]
Security Analyst->Fast Safe Containment
Fast Safe Containment->Response Workspace
Response Workspace->Investigation Context
Response Workspace->Containment Actions
Investigation Context->Security Event Store
Containment Actions->Cloud Infrastructure
Security Event Store->Cloud Infrastructure`,
      annotations: [
        'The outcome is expressed independently from the proposed response workspace.',
        'Investigation and containment form separate branches with different maturity and risk.',
        'Your own answer may use a different anchor, boundary, and decomposition.',
      ],
    },
  ],
  challenge: {
    id: 'challenge-case-security-response-capstone',
    version: 1,
    title: 'Create the map from the brief',
    objective: 'Independently create and justify a complete Wardley Map for the security-response situation.',
    conceptIds: ['independent-mapping', 'anchor', 'dependency', 'evolution', 'annotation'],
    instructions: [
      { id: 's1', instruction: 'Read the brief, choose a primary user and scope, then create the map without copying the example.' },
      { id: 's2', instruction: 'Review every dependency and evolution position. Add descriptions wherever another person would need your reasoning.' },
      { id: 's3', instruction: 'Record at least two uncertainties or observations as notes and draw one plausible movement with a rationale.' },
      { id: 's4', instruction: 'Run the checks, then use the rubric to challenge the quality of your own map before completing the reflection.' },
    ],
    validators: [
      { id: 'v1-anchor', kind: 'has-anchor', minCount: 1, description: 'The map has a primary user or stakeholder', rationale: 'The capstone needs an explicit perspective and purpose.' },
      { id: 'v2-need', kind: 'anchor-has-description', description: 'The anchor description states the need', rationale: 'A precise need keeps the map focused on the situation rather than the proposed platform.' },
      { id: 'v3-components', kind: 'has-component', minCount: 7, description: 'The landscape has at least seven components', rationale: 'A capstone map should expose enough structure for a meaningful strategic conversation.' },
      { id: 'v4-dependencies', kind: 'has-dependency', minCount: 7, description: 'The map has at least seven dependencies', rationale: 'The relationships reveal how visible outcomes depend on lower-level capabilities.' },
      { id: 'v5-connected', kind: 'is-connected', description: 'Every component is connected to the user’s value chain', rationale: 'Anything disconnected either lacks a reason to be in scope or needs an explicit relationship.' },
      { id: 'v6-stages', kind: 'multi-stage', description: 'Components span multiple evolution stages', rationale: 'Different maturity should lead to different management and sourcing conversations.' },
      { id: 'v7-description', kind: 'component-has-description', description: 'At least one component records mapping rationale', rationale: 'A defensible map exposes important judgements so others can challenge them.' },
      { id: 'v8-notes', kind: 'has-annotation', minCount: 2, description: 'At least two uncertainties or observations are recorded', rationale: 'Maps are learning tools; important unknowns should remain visible.' },
      { id: 'v9-movement', kind: 'has-evolution-movement', minCount: 1, description: 'The map proposes at least one movement', rationale: 'A movement turns the current landscape into a testable strategic conversation.' },
      { id: 'v10-rationale', kind: 'evolution-has-rationale', description: 'The proposed movement explains why', rationale: 'A rationale makes the movement falsifiable rather than aspirational.' },
    ],
    hints: [
      { level: 1, text: 'Start with the outcome an analyst needs during an incident, not with the response platform leadership has proposed.' },
      { level: 2, text: 'Look for at least two branches: building investigation context and executing safe containment.' },
      { level: 3, text: 'If you are stuck, narrate one incident from signal to containment and turn each necessary capability into a candidate component.' },
    ],
    rubric: [
      { id: 'r1', description: 'The scope is narrow enough to discuss but broad enough to reveal meaningful dependencies', reflectionOnly: true },
      { id: 'r2', description: 'Component names describe capabilities or outcomes rather than vendor products', reflectionOnly: true },
      { id: 'r3', description: 'Evolution positions reflect external market maturity rather than internal quality', reflectionOnly: true },
      { id: 'r4', description: 'The proposed movement has an observable assumption or signal', reflectionOnly: true },
      { id: 'r5', description: 'You could explain and defend the map to someone who disagrees with it', reflectionOnly: true },
    ],
    reflectionPrompts: [
      'Which judgement on your map are you least confident about, and what evidence would improve it?',
      'What did you deliberately leave outside the map’s boundary?',
      'What is the first strategic conversation this map should trigger?',
    ],
    sampleSolution: {
      explanation: 'This is one defensible decomposition. A different anchor, boundary, or component set can be equally valid if the reasoning is explicit.',
      build: solution(
        `title Security incident response platform
anchor Security Analyst [0.95, 0.26]
component Fast Safe Containment [0.86, 0.30]
component Response Workspace [0.76, 0.40]
component Investigation Context [0.58, 0.42]
component Containment Actions [0.55, 0.55]
component Alert Triage [0.50, 0.62]
component Asset Inventory [0.38, 0.72]
component Security Event Store [0.34, 0.80]
component Cloud Infrastructure [0.16, 0.94]
Security Analyst->Fast Safe Containment
Fast Safe Containment->Response Workspace
Response Workspace->Investigation Context
Response Workspace->Containment Actions
Investigation Context->Alert Triage
Investigation Context->Asset Inventory
Alert Triage->Security Event Store
Containment Actions->Cloud Infrastructure
Security Event Store->Cloud Infrastructure
evolve Alert Triage 0.78`,
        (map, id) => {
          map.elements.find((element) => element.id === id('Security Analyst'))!.description =
            'Needs to understand and contain a credible incident quickly without causing avoidable business disruption.';
          map.elements.find((element) => element.id === id('Investigation Context'))!.description =
            'Combines identity, asset, and event context; its correct boundary and maturity need validation with analysts.';
          map.evolutions.find((movement) => movement.elementId === id('Alert Triage'))!.rationale =
            'Assumes standard enrichment and correlation become reliable enough to consume as a product.';
          map.annotations.push(
            { id: 'case-6-note-1', text: 'Uncertainty: which containment actions can be safely automated?', x: 0.50, y: 0.48, number: 1 },
            { id: 'case-6-note-2', text: 'Observation needed: measure time spent gathering asset and identity context.', x: 0.30, y: 0.66, number: 2 }
          );
        }
      ),
    },
  },
  reflectionPrompts: [
    'What part of creating this map can you now repeat in your own context?',
    'When you make your next map, who should challenge your assumptions?',
  ],
  conceptLinks: REFERENCE_LINKS,
};

export const IT_CASE_STUDIES: LearningModule[] = [
  incidentStatus,
  deliveryPlatform,
  managedDatabase,
  identityModernisation,
  aiCodeReview,
  securityCapstone,
];
