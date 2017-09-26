// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var { languages, CompletionItem, CompletionItemKind, Range } = require('vscode');
const gemoji = require('gemoji');
const twemoji = require('twemoji');

function registerProvider(context) {
  const disposable = languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems: (doc, position) => {
        const line = doc.lineAt(position.line);
        const pre = line.text.slice(0, position.character);
        // Handle case of: `:cat:|`
        const preExistingMatch = pre.match(/:[\w\d_\+\-]+:$/);
        // If there is a character before the color, require at least one character after it
        const preMatch = preExistingMatch || pre.match(/(?:\s|^)(:(:?)$)|(:(:?)[\w\d_\+\-]+?)$/);
        if (!preMatch) {
          return [];
        }
        const post = line.text.slice(position.character);
        const postMatch = post.match(/[\w\d_\+\-]*?:?/);
        const replacementSpan = new Range(
          position.translate(0, -(preMatch[1] || preMatch[3]).length),
          postMatch ? position.translate(0, postMatch[0].length) : position
        );
        return Object.keys(gemoji.name).map(key => {
          const item = new CompletionItem(`:${gemoji.name[key].name}:`, CompletionItemKind.Text);
          item.detail = gemoji.name[key].emoji;
          item.range = replacementSpan;
          return item;
        });
      },
    },
    ':'
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-md-blog" is now active!');

  registerProvider(context);

  return {
    extendMarkdownIt(md) {
      md.use(require('markdown-it-emoji'));
      md.renderer.rules.emoji = function(token, idx) {
        return twemoji.parse(token[idx].content);
      };

      md.use(require('markdown-it-task-checkbox'));

      const highlight = md.options.highlight;
      md.options.highlight = (code, lang) => {
        if (lang && lang.toLowerCase() === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return highlight(code, lang);
      };
      return md;
    },
  };
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
