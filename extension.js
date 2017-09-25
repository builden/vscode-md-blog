// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
const twemoji = require('twemoji');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-md-blog" is now active!'
  );

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
    }
  };
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
