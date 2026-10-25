import { describe, it, expect } from 'vitest';
import { markdownToHtml } from '../markdown';

describe('markdownToHtml', () => {
  it('renders headings, paragraphs and inline formatting', () => {
    expect(markdownToHtml('## Title\n\nSome **bold** and *italic* and `code`\ncontinued.')).toBe(
      '<h2>Title</h2>\n<p>Some <strong>bold</strong> and <em>italic</em> and <code>code</code> continued.</p>'
    );
  });

  it('renders bullet and numbered lists', () => {
    expect(markdownToHtml('- one\n- two\n\n1. first\n2. second')).toBe(
      '<ul><li>one</li><li>two</li></ul>\n<ol><li>first</li><li>second</li></ol>'
    );
  });

  it('joins wrapped list items', () => {
    expect(markdownToHtml('- a long item\n  that wraps')).toBe('<ul><li>a long item that wraps</li></ul>');
  });

  it('escapes markup so content cannot inject HTML', () => {
    const html = markdownToHtml('<script>alert(1)</script>\n\n- <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/<script|<img/);
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders every published lesson without raw list markers', async () => {
    const { ALL_MODULES } = await import('../content');
    for (const m of ALL_MODULES) {
      const html = markdownToHtml(m.explanation);
      expect(html).not.toMatch(/<p>- /);
      expect(html).toMatch(/<h2>/);
    }
  });
});
