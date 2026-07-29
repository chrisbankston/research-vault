import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookMarked } from 'lucide-react';

interface AreaTopic {
  id: string;
  title: string;
  description: string;
}

interface AreaDetail {
  id: string;
  title: string;
  description: string;
  topics: AreaTopic[];
}

const AREAS: AreaDetail[] = [
  {
    id: '1',
    title: 'Home Improvement',
    description:
      'Deck building, roofing, siding, and structural renovation projects with best practices and materials.',
    topics: [
      {
        id: '1-1',
        title: 'Deck Construction',
        description: 'Framing, fastening, and finishing techniques for composite and wood decks.',
      },
      {
        id: '1-2',
        title: 'Roofing Materials',
        description: 'Compare asphalt, metal, and synthetic options by climate and lifespan.',
      },
    ],
  },
  {
    id: '2',
    title: 'Landscaping & Outdoor',
    description:
      'Fence installation, composite materials, garden design, and outdoor living spaces.',
    topics: [
      {
        id: '2-1',
        title: 'Outdoor Living',
        description: 'Patios, seating zones, and weather-resistant layout planning.',
      },
      {
        id: '2-2',
        title: 'Fence Systems',
        description: 'Material durability, privacy, and maintenance tradeoffs.',
      },
    ],
  },
  {
    id: '3',
    title: 'Building Codes & Permits',
    description:
      'Local regulations, permit requirements, inspections, and compliance documentation.',
    topics: [
      {
        id: '3-1',
        title: 'Permit Requirements',
        description: 'Municipal requirements and submission checklists by project type.',
      },
      {
        id: '3-2',
        title: 'Inspection Prep',
        description: 'How to prepare timelines and deliverables for final inspection.',
      },
    ],
  },
  {
    id: '4',
    title: 'Energy Efficiency',
    description:
      'Solar installation, HVAC systems, insulation, and sustainable home technologies.',
    topics: [
      {
        id: '4-1',
        title: 'Solar ROI',
        description: 'Evaluate payback windows and incentive programs for residential solar.',
      },
      {
        id: '4-2',
        title: 'Insulation Upgrades',
        description: 'Air sealing and insulation strategies that improve seasonal efficiency.',
      },
    ],
  },
  {
    id: '5',
    title: 'Contractors & Services',
    description:
      'Professional services, contractor reviews, pricing benchmarks, and vendor management.',
    topics: [
      {
        id: '5-1',
        title: 'Vendor Vetting',
        description: 'Credential checks, references, and bid comparison workflows.',
      },
      {
        id: '5-2',
        title: 'Scope Reviews',
        description: 'Define deliverables and acceptance criteria before signing contracts.',
      },
    ],
  },
  {
    id: '6',
    title: 'Budget & Finance',
    description: 'Project costs, ROI analysis, financing options, and expense tracking.',
    topics: [
      {
        id: '6-1',
        title: 'Cost Forecasting',
        description: 'Estimate labor, materials, and contingency with confidence ranges.',
      },
      {
        id: '6-2',
        title: 'Financing Models',
        description: 'Compare payment schedules, rates, and refinancing impact.',
      },
    ],
  },
];

export default async function AreaTopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const area = AREAS.find((entry) => entry.id === id);

  if (!area) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        href="/areas"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Workspaces
      </Link>

      <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-800/70 p-6">
        <h1 className="text-3xl font-bold text-white">{area.title}</h1>
        <p className="mt-2 text-slate-400">{area.description}</p>
      </div>

      <div className="space-y-4">
        {area.topics.map((topic) => (
          <article
            key={topic.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition-colors hover:border-blue-500"
          >
            <div className="mb-2 flex items-center gap-2 text-blue-300">
              <BookMarked size={16} />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]">Topic</span>
            </div>
            <h2 className="text-lg font-semibold text-white">{topic.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{topic.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
