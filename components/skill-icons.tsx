import {
  Brain,
  DatabaseSearch,
  SquareKanban,
  Workflow
} from "lucide-react";

type IconProps = {
  className?: string;
};

const iconMap = {
  "product-management": SquareKanban,
  "rag-system": DatabaseSearch,
  "agentic-engineering": Workflow,
  "mechanistic-interpretability": Brain
} as const;

export function SkillGlyph({
  id,
  className
}: {
  id: string;
  className?: string;
}) {
  const Icon = iconMap[id as keyof typeof iconMap] ?? Brain;
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}
