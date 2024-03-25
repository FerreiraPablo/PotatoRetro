export default class KeyGenerator {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678';

    constructor(chars) 
    {
        if (chars) this.chars = chars;
    }

    get(length = 32) 
    {
        var key = '';
        for (var i = length; i > 0; --i) key += this.chars[Math.floor(Math.random() * this.chars.length)];
        return key;
    }
}