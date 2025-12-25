import { Calendar, Tag, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { UpdateData, ContentBlock } from '@/types/update';

interface UpdatePreviewProps {
  data: UpdateData;
  authorName?: string;
}

export const UpdatePreview = ({ data, authorName = 'Yönetici' }: UpdatePreviewProps) => {
  const formatDate = () => {
    if (data.published_at) {
      return new Date(data.published_at).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderFormattedText = (text: string) => {
    // Escape HTML entities first to prevent XSS
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // Escape HTML first, then apply markdown transformations
    let formatted = escapeHtml(text);
    
    // Handle bold (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italic (*text*)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Handle inline code (`text`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>');
    
    // Sanitize the final output with DOMPurify
    const sanitized = DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'em', 'code'],
      ALLOWED_ATTR: ['class'],
    });
    
    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'font-display text-3xl md:text-4xl font-bold text-foreground italic mt-8 mb-4 first:mt-0',
          2: 'font-display text-2xl md:text-3xl font-bold text-foreground italic mt-8 mb-4',
          3: 'font-display text-xl md:text-2xl font-bold text-foreground italic mt-6 mb-3',
        };
        return (
          <HeadingTag className={headingClasses[block.level || 1]}>
            {block.content as string}
          </HeadingTag>
        );

      case 'subheading':
        return (
          <h3 className="font-display text-xl font-semibold text-primary italic mt-6 mb-3">
            {block.content as string}
          </h3>
        );

      case 'paragraph':
        return (
          <p className="text-foreground/70 leading-relaxed mb-4">
            {renderFormattedText(block.content as string)}
          </p>
        );

      case 'list':
        return (
          <ul className="space-y-3 mb-6">
            {(block.content as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>{renderFormattedText(item)}</span>
              </li>
            ))}
          </ul>
        );

      case 'image':
        return (
          <div className="my-6 rounded-lg overflow-hidden border border-border/30">
            <img
              src={block.content as string}
              alt=""
              className="w-full"
            />
          </div>
        );

      case 'code':
        return (
          <pre className="my-6 p-4 bg-muted rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-foreground/80">
              {block.content as string}
            </code>
          </pre>
        );

      case 'quote':
        return (
          <blockquote className="my-6 pl-4 border-l-4 border-primary italic text-foreground/70">
            {block.content as string}
          </blockquote>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Hero Image */}
      {data.cover_image_url && (
        <div className="relative w-full h-[40vh] overflow-hidden rounded-xl mb-8">
          <img
            src={data.cover_image_url}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      {/* Title Section */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground italic leading-tight mb-3">
          {data.title || 'Başlık Girilmedi'}
        </h1>

        {data.subtitle && (
          <p className="text-foreground/60 text-lg mb-4">
            {data.subtitle}
          </p>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/50">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-sm">
            <Tag className="w-3.5 h-3.5" />
            {data.category === 'update' ? 'Güncelleme' : 'Haber'}
          </span>

          {data.version && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-foreground/5 border border-foreground/10 rounded-sm">
              {data.version}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {authorName}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card/30 border border-border/30 rounded-xl p-6 md:p-8">
        {data.content.length > 0 ? (
          <div className="prose prose-invert max-w-none">
            {data.content.map((block) => (
              <div key={block.id}>{renderBlock(block)}</div>
            ))}
          </div>
        ) : (
          <p className="text-foreground/50 text-center py-8">
            Henüz içerik eklenmedi.
          </p>
        )}
      </div>
    </div>
  );
};
