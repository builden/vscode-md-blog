module.exports = class EmojiProvider {
  constructor() {
    this._emojiMap = null;
  }

  get emojis() {
    return this.emojiMap.values();
  }

  lookup(name) {
    return this.emojiMap.get(name.toLowerCase());
  }

  get emojiMap() {
    if (!this._emojiMap) {
      const gemoji = require('gemoji');
      this._emojiMap = new Map();
      for (const key of Object.keys(gemoji.name)) {
        const entry = gemoji.name[key];
        if (!this._emojiMap.has(entry.name)) {
          this._emojiMap.set(entry.name, entry);
        }
      }
    }
    return this._emojiMap;
  }
};
