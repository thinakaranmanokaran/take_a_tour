/**
 * Code block with a copy button and dependency-free token colouring.
 *
 * A syntax highlighter would be ~100kB of JavaScript for marginal benefit in
 * a documentation site, so highlighting is done at build time with a small
 * regular-expression pass. It handles comments, strings, numbers, booleans and
 * property keys — enough to scan a snippet, and it cannot execute anything.
 *
 * The copy button is markup; the click is handled once per page by the
 * `CopyButtons` island (`src/components/CopyButtons.jsx`), so a hundred code
 * blocks cost exactly one hydrated component.
 */

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(source) {
  const patterns = [
    { cls: "tok-com", re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/y },
    { cls: "tok-str", re: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/y },
    { cls: "tok-bool", re: /\b(true|false|null|undefined)\b/y },
    { cls: "tok-num", re: /\b\d+(\.\d+)?\b/y },
    { cls: "tok-key", re: /([A-Za-z_$][\w$]*)(?=\s*:)/y },
  ];

  let out = "";
  let index = 0;

  while (index < source.length) {
    let matched = false;

    for (const { cls, re } of patterns) {
      re.lastIndex = index;
      const match = re.exec(source);
      if (match && match.index === index) {
        out += `<span class="${cls}">${escapeHtml(match[0])}</span>`;
        index += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      out += escapeHtml(source[index]);
      index += 1;
    }
  }

  return out;
}

export default function CodeBlock({ code, lang = "js", title }) {
  const highlighted = lang === "bash" ? escapeHtml(code) : highlight(code);

  return (
    <div className="code-block">
      {title ? (
        <div className="code-block__header">
          <span>{title}</span>
          <span className="code-block__lang">{lang}</span>
        </div>
      ) : null}
      <pre data-lang={lang} tabIndex={0} aria-label={`${lang} code sample`}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <button className="copy-button" type="button" data-copy aria-label="Copy code to clipboard">
        Copy
      </button>
    </div>
  );
}
