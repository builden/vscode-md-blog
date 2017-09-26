// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var { languages, commands, CompletionItem, CompletionItemKind, Range, window } = require('vscode');
const twemoji = require('twemoji');
const EmojiProvider = require('./EmojiProvider');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function saveClipboardImageToFileAndGetPath(imagePath, cb) {
  if (!imagePath) cb('input imagePath is null');
  const platform = process.platform;
  if (platform === 'win32') {
    const scriptPath = path.join(__dirname, './paste-tools/pc.ps1');
    let command = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    let powershellExisted = fs.existsSync(command);
    if (!powershellExisted) {
      command = 'powershell';
    }

    const powershell = spawn(command, [
      '-noprofile',
      '-noninteractive',
      '-nologo',
      '-sta',
      '-executionpolicy',
      'unrestricted',
      '-windowstyle',
      'hidden',
      '-file',
      scriptPath,
      imagePath,
    ]);
    powershell.on('error', function(e) {
      if (e.code == 'ENOENT') {
        cb(`The powershell command is not in you PATH environment variables.Please add it and retry.`);
      } else {
        cb(e);
      }
    });
    powershell.on('exit', function(code, signal) {
      // console.log('exit', code, signal);
    });
    powershell.stdout.on('data', function(data) {
      cb(null, imagePath, data.toString().trim());
    });
  } else if (platform === 'darwin') {
    let scriptPath = path.join(__dirname, '../../res/mac.applescript');

    let ascript = spawn('osascript', [scriptPath, imagePath]);
    ascript.on('error', function(e) {
      cb(e);
    });
    ascript.on('exit', function(code, signal) {
      // console.log('exit',code,signal);
    });
    ascript.stdout.on('data', function(data) {
      cb(null, imagePath, data.toString().trim());
    });
  } else {
    // linux
    let scriptPath = path.join(__dirname, '../../res/linux.sh');

    let ascript = spawn('sh', [scriptPath, imagePath]);
    ascript.on('error', function(e) {
      cb(e);
    });
    ascript.on('exit', function(code, signal) {
      // console.log('exit',code,signal);
    });
    ascript.stdout.on('data', function(data) {
      let result = data.toString().trim();
      if (result == 'no xclip') {
        cb('You need to install xclip command first.');
        return;
      }
      cb(null, imagePath, result);
    });
  }
}

function registerProvider(context) {
  const emojiProvider = new EmojiProvider();
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
        return Array.from(emojiProvider.emojis).map(x => {
          const item = new CompletionItem(`:${x.name}:`, CompletionItemKind.Text);
          item.detail = x.emoji;
          item.range = replacementSpan;
          return item;
        });
      },
    },
    ':'
  );

  context.subscriptions.push(disposable);
}

function registerCommand(context) {
  let disposable = commands.registerCommand('extension.pasteImage', () => {
    // add(1, 2);
    saveClipboardImageToFileAndGetPath('D:\\1.png', (err, imagePath) => {
      if (err) return window.showErrorMessage(e);
      console.log('save succ', imagePath);
    });
  });
  context.subscriptions.push(disposable);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-md-blog" is now active!');
  registerProvider(context);
  registerCommand(context);

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
