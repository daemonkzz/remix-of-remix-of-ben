import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Info, Quote, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface RuleContentRendererProps {
  content: string;
  searchQuery?: string;
}

// Parse and render rule content with special formatting
export const RuleContentRenderer: React.FC<RuleContentRendererProps> = ({
  content,
  searchQuery,
}) => {
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  const toggleDetail = (index: number) => {
    setExpandedDetails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Split content into lines for processing
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];
  let detailIndex = 0;

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 my-3 ml-1">
          {currentListItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
              <span className="text-foreground/80 text-sm leading-relaxed">
                {renderInlineFormatting(item, searchQuery)}
              </span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Bullet point list (• or -)
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      const itemText = trimmed.slice(1).trim();
      currentListItems.push(itemText);
      return;
    }

    // Quote format (''...'' or "...")
    const quoteMatch = trimmed.match(/^[''""](.+)[''""]$/);
    if (quoteMatch) {
      flushList();
      elements.push(
        <QuoteBlock key={`quote-${lineIndex}`} text={quoteMatch[1]} searchQuery={searchQuery} />
      );
      return;
    }

    // Note format (Not: ...)
    if (trimmed.startsWith("Not:") || trimmed.startsWith("NOT:")) {
      flushList();
      const noteText = trimmed.slice(4).trim();
      elements.push(
        <NoteBlock key={`note-${lineIndex}`} text={noteText} searchQuery={searchQuery} />
      );
      return;
    }

    // Example format (Örnek: ... or Örnekler:)
    if (trimmed.startsWith("Örnek:") || trimmed.startsWith("ÖRNEK:")) {
      flushList();
      const exampleText = trimmed.slice(6).trim();
      elements.push(
        <ExampleBlock key={`example-${lineIndex}`} text={exampleText} searchQuery={searchQuery} />
      );
      return;
    }

    if (trimmed.startsWith("Örnekler:") || trimmed.startsWith("ÖRNEKLER:")) {
      flushList();
      elements.push(
        <ExampleHeader key={`examples-header-${lineIndex}`} />
      );
      return;
    }

    // Collapsible detail section (lines starting with [...] or content after examples)
    if (trimmed.startsWith("[") && trimmed.includes("]")) {
      flushList();
      const currentDetailIndex = detailIndex++;
      const title = trimmed.match(/\[(.+?)\]/)?.[1] || "Detaylar";
      const detailContent = trimmed.slice(trimmed.indexOf("]") + 1).trim();
      
      elements.push(
        <CollapsibleDetail
          key={`detail-${currentDetailIndex}`}
          title={title}
          content={detailContent}
          isExpanded={expandedDetails.has(currentDetailIndex)}
          onToggle={() => toggleDetail(currentDetailIndex)}
          searchQuery={searchQuery}
        />
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${lineIndex}`} className="text-foreground/80 text-sm leading-relaxed mb-2">
        {renderInlineFormatting(trimmed, searchQuery)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
};

// Render inline formatting (**bold**, etc.)
const renderInlineFormatting = (text: string, searchQuery?: string): React.ReactNode => {
  // First handle bold text
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  
  return boldParts.map((part, index) => {
    // Odd indices are bold content
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {searchQuery ? <HighlightSearch text={part} query={searchQuery} /> : part}
        </strong>
      );
    }
    return searchQuery ? <HighlightSearch key={index} text={part} query={searchQuery} /> : part;
  });
};

// Quote Block Component
const QuoteBlock: React.FC<{ text: string; searchQuery?: string }> = ({ text, searchQuery }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="relative my-4 pl-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary/50 rounded-r-lg"
  >
    <Quote className="absolute -left-3 -top-2 w-5 h-5 text-primary/40" />
    <p className="text-foreground/90 text-sm italic leading-relaxed">
      {renderInlineFormatting(text, searchQuery)}
    </p>
  </motion.div>
);

// Note Block Component
const NoteBlock: React.FC<{ text: string; searchQuery?: string }> = ({ text, searchQuery }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="my-4 p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
      <Info className="w-4 h-4 text-amber-500" />
    </div>
    <div>
      <span className="text-amber-500 font-semibold text-xs uppercase tracking-wider">Not</span>
      <p className="text-foreground/80 text-sm mt-1 leading-relaxed">
        {renderInlineFormatting(text, searchQuery)}
      </p>
    </div>
  </motion.div>
);

// Example Block Component
const ExampleBlock: React.FC<{ text: string; searchQuery?: string }> = ({ text, searchQuery }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="my-3 p-3 bg-secondary/50 border border-border/30 rounded-lg flex items-start gap-3"
  >
    <Lightbulb className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
    <div>
      <span className="text-primary/80 font-medium text-xs uppercase tracking-wider">Örnek</span>
      <p className="text-foreground/70 text-sm mt-0.5 leading-relaxed">
        {renderInlineFormatting(text, searchQuery)}
      </p>
    </div>
  </motion.div>
);

// Example Header Component
const ExampleHeader: React.FC = () => (
  <div className="flex items-center gap-2 my-3 text-primary/80">
    <Lightbulb className="w-4 h-4" />
    <span className="font-medium text-sm uppercase tracking-wider">Örnekler</span>
  </div>
);

// Collapsible Detail Component
const CollapsibleDetail: React.FC<{
  title: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery?: string;
}> = ({ title, content, isExpanded, onToggle, searchQuery }) => (
  <div className="my-3 rounded-lg border border-border/30 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center justify-between text-left"
    >
      <span className="text-foreground/80 text-sm font-medium">{title}</span>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-4 h-4 text-foreground/50" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 bg-secondary/20 border-t border-border/20">
            <p className="text-foreground/70 text-sm leading-relaxed">
              {renderInlineFormatting(content, searchQuery)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Highlight Search Component
const HighlightSearch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-primary/30 text-primary font-medium px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export default RuleContentRenderer;
