import fs from 'fs';

export default class DataStorage {
    obfuscate = false;

    constructor(storageFilePath) {
        this.storageFilePath = storageFilePath;
    }

    save(data) {
        fs.writeFileSync(this.storageFilePath, this.process(JSON.stringify(data)));
    }

    load() {
        if(fs.existsSync(this.storageFilePath)) {
            var data = fs.readFileSync(this.storageFilePath);
            try {
                return JSON.parse(this.process(data, true));
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    process(data, rollback = false) {
        if(this.obfuscate) {
            if(rollback) {
                Buffer.from(data.toString(), 'base64').toString('ascii')
            } else {
                Buffer.from(data.toString()).toString('base64')
            }
        } else {
            return data.toString();
        }
    }
}