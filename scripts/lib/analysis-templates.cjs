/**
 * Analysis text for projects that arrive without any: team composition,
 * the problems to fix, and a build path. Keyed by domain slug.
 */
const TEMPLATES = {
  'ai-computing': {
    team: [['ML engineer', 2], ['Data engineer', 1], ['ML platform engineer', 1], ['Product lead', 1]],
    issues:
      'The hard part is data and evaluation, not the model: labelled local data, a benchmark buyers trust, and inference costs low enough to undercut imported tools.',
    build:
      'Start with one narrow, measurable workflow with a human in the loop, prove the gain, then widen the dataset and the product.'
  },
  robotics: {
    team: [['Robotics engineer', 2], ['Embedded engineer', 1], ['Mechanical designer', 1], ['Controls engineer', 1]],
    issues:
      'Robots fail on the boring parts: repeatability, spare parts, maintenance and operator training. Uptime and a local repair path matter more than the demo.',
    build:
      'Build one work cell end to end, measure cycle time and failure rate for a month, then standardise the cell before selling it.'
  },
  'manufacturing-3d': {
    team: [['Production/process engineer', 2], ['Automation engineer', 1], ['Mechanical designer', 1], ['Quality engineer', 1]],
    issues:
      'The constraint is the process window: tolerances, material supply and certification. Quality has to hold at production speed with consumables sourced locally.',
    build:
      'Prototype on one machine, qualify the output against a customer specification, then duplicate the qualified process.'
  },
  'biotech-healthtech': {
    team: [['Biomedical engineer', 1], ['Molecular biologist', 1], ['Regulatory specialist', 1], ['Clinical lead', 1]],
    issues:
      'Evidence and regulation decide the outcome: a validated assay or device, documented traceability, and a regulatory path before hospitals will buy.',
    build:
      'Run a small validation study against the current standard, publish the protocol, then seek the clearance the market requires.'
  },
  medtech: {
    team: [['Biomedical engineer', 2], ['Regulatory specialist', 1], ['Hardware engineer', 1], ['Clinical advisor', 1]],
    issues:
      'Clinical adoption depends on validation and certification. Clinical evidence, a maintenance plan and a reimbursement path are all prerequisites.',
    build:
      'Co-design with one clinic, validate on a small cohort, then harden the device for certification.'
  },
  semiconductors: {
    team: [['Chip designer', 2], ['Verification engineer', 1], ['Embedded engineer', 1], ['Test engineer', 1]],
    issues:
      'Tape-out, packaging and test cost dominate. A verified design, a foundry path and a test plan are needed before the first silicon.',
    build:
      'Prototype on an FPGA, verify against the reference workload, then commit to a shuttle run.'
  },
  cybersecurity: {
    team: [['Security engineer', 2], ['Backend engineer', 1], ['Compliance analyst', 1]],
    issues:
      'Trust is the product: independent testing, a clear incident process and compliance evidence are required before enterprises deploy it.',
    build:
      'Deploy in one controlled environment, run a red-team exercise, publish the results, then expand.'
  },
  'cloud-iot': {
    team: [['Backend engineer', 1], ['IoT engineer', 1], ['Frontend engineer', 1], ['DevOps engineer', 1]],
    issues:
      'Devices multiply support cost. Connectivity, firmware updates and data ownership have to stay under control at the lowest price point.',
    build:
      'Ship a reference deployment with ten devices, measure uptime and support load, then productise the stack.'
  },
  'drones-autonomy': {
    team: [['Aerospace engineer', 1], ['Autonomy engineer', 1], ['Embedded engineer', 1], ['Flight operations lead', 1]],
    issues:
      'Airworthiness and authorisation gate the market: flight hours, fail-safe behaviour and a permit path are the real milestones.',
    build:
      'Fly a bounded mission set, log every failure, then formalise the safety case.'
  },
  'energy-storage': {
    team: [['Electrical engineer', 2], ['Materials/chemistry engineer', 1], ['Power systems engineer', 1]],
    issues:
      'Cost per kWh and cycle life decide viability. Measured degradation data and a supply chain for cells and electronics are missing today.',
    build:
      'Test a single module through accelerated cycles, publish the degradation curve, then scale the pack.'
  },
  cleantech: {
    team: [['Environmental engineer', 2], ['Process engineer', 1], ['Operations lead', 1]],
    issues:
      'The economics depend on input quality and disposal costs. Throughput and output quality have to be proven on real waste streams.',
    build:
      'Run a pilot on one waste stream, measure yield and residue, then size the industrial unit.'
  },
  'agritech-foodtech': {
    team: [['Agronomist', 1], ['Hardware engineer', 1], ['Data analyst', 1], ['Field operations lead', 1]],
    issues:
      'Field conditions break laboratory assumptions: a full season of data, a maintenance model farmers can follow and a price that fits farm margins are needed.',
    build:
      'Deploy on a handful of farms for one season, compare yield and water use against a control, then scale.'
  },
  'space-aerospace': {
    team: [['Aerospace engineer', 2], ['Systems engineer', 1], ['RF engineer', 1]],
    issues:
      'Launch and qualification costs are unforgiving. Components must be qualified, a launch slot secured and the link budget proven.',
    build:
      'Qualify the payload on the ground, fly a demonstration mission, then sell the service.'
  },
  'nanotech-materials': {
    team: [['Materials scientist', 2], ['Process engineer', 1], ['Metrology engineer', 1]],
    issues:
      'Reproducibility is the barrier: a stable process, metrology you can trust and a first industrial customer willing to qualify the material.',
    build:
      'Fix the process on a pilot line, characterise the output, then run a customer qualification batch.'
  },
  'law-social-impact': {
    team: [['Policy analyst', 1], ['Product lead', 1], ['Community manager', 1], ['Developer', 1]],
    issues:
      'Adoption depends on institutional buy-in: the service has to work inside existing procedures, with a funding line after the pilot.',
    build:
      'Pilot with one institution, document the process change, then secure a funding line.'
  },
  'other-deep-tech': {
    team: [['Founder/lead', 1], ['Technical lead', 1], ['Engineer', 1], ['Operations lead', 1]],
    issues:
      'The risk is focus: one customer segment, proven willingness to pay, and a build small enough to reach a first sale.',
    build:
      'Build the smallest version that solves one customer problem, sell it, then extend.'
  }
};

function templateFor(domain) {
  return TEMPLATES[domain] || TEMPLATES['other-deep-tech'];
}

module.exports = { TEMPLATES, templateFor };
