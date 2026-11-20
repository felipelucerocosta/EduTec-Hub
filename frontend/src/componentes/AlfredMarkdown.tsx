import React, { useState } from 'react';

interface MarkdownProps {
  content: string;
}

export const AlfredMarkdown: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Dividir el contenido en bloques: código, fórmulas o texto markdown
  const blocks: Array<{ type: 'code' | 'math' | 'text'; content: string; lang?: string }> = [];

  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      lang: match[1] || 'plaintext',
      content: match[2].trimEnd()
    });
    lastIndex = codeRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <div className="alfred-markdown-body">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content} language={block.lang || 'code'} />;
        }
        return <TextRenderer key={idx} text={block.content} />;
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="alfred-code-container">
      <div className="alfred-code-header">
        <span className="alfred-code-lang">
          <i className="bx bx-code-alt"></i> {language}
        </span>
        <button className="alfred-code-copy-btn" onClick={handleCopy} title="Copiar código">
          <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`}></i>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="alfred-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Dividir por líneas para procesar listas, encabezados y párrafos
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={key} className="alfred-ol">{listItems}</ol>);
      } else {
        elements.push(<ul key={key} className="alfred-ul">{listItems}</ul>);
      }
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Detección de bloque matemático delimitado por $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      flushList(`flush-${i}`);
      const formula = trimmed.slice(2, -2).trim();
      elements.push(
        <div key={i} className="alfred-math-block">
          <code>{formula}</code>
        </div>
      );
      return;
    }

    // Encabezados
    if (trimmed.startsWith('### ')) {
      flushList(`flush-${i}`);
      elements.push(<h4 key={i} className="alfred-h4">{renderInline(trimmed.slice(4))}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList(`flush-${i}`);
      elements.push(<h3 key={i} className="alfred-h3">{renderInline(trimmed.slice(3))}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList(`flush-${i}`);
      elements.push(<h2 key={i} className="alfred-h2">{renderInline(trimmed.slice(2))}</h2>);
      return;
    }

    // Listas no ordenadas (- o *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList(`flush-${i}`);
        inList = true;
        listType = 'ul';
      }
      listItems.push(<li key={`li-${i}`}>{renderInline(trimmed.slice(2))}</li>);
      return;
    }

    // Listas ordenadas (1. 2. etc.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList(`flush-${i}`);
        inList = true;
        listType = 'ol';
      }
      listItems.push(<li key={`li-${i}`}>{renderInline(olMatch[2])}</li>);
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList(`flush-${i}`);
      elements.push(
        <blockquote key={i} className="alfred-blockquote">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Línea en blanco o párrafo normal
    flushList(`flush-${i}`);
    if (trimmed.length > 0) {
      elements.push(<p key={i} className="alfred-p">{renderInline(line)}</p>);
    }
  });

  flushList(`flush-final`);

  return <>{elements}</>;
};

// Renderizado inline para negritas, cursivas, código inline y fórmulas inline
function renderInline(text: string): React.ReactNode[] {
  // Regex para: `código`, $fórmula$, **negrita**, *cursiva*
  const tokenRegex = /(`[^`]+`|\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="alfred-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <span key={index} className="alfred-inline-math">
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

export default AlfredMarkdown;
