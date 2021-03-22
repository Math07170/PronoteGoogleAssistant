const pronote = require('pronote-api');

// Exemple
const url = new String();
const username = new String();
const password = new String();
const cas = new String();
const session = new pronote.PronoteSession();

async function pronoteInstance(url, username, password, cas){
        this.url = url;
        this.username = username;
        this.password = password;
        this.cas = cas;
        this.session = await pronote.login(this.url, this.username, this.password, this.cas);

}

module.exports = pronoteInstance;