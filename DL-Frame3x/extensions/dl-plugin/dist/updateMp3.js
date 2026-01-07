const fs = require('fs');

const mp3Name = require("../config.json").mp3Name;
const audioDir = Editor.Project.path + mp3Name;

function updateMp3() {
    let content = `import { AudioClip } from "cc"\n`;
    content += `interface ModifiedAudioClip extends AudioClip {
    playMusic(loop?: boolean): void;
    playEffect(loop?: boolean): void;
}\ninterface mp3Type {`;

    for (let i = 0; i < mp3Name.length; i++) {
        let audioDir = Editor.Project.path + mp3Name[i];
        let files = fs.readdirSync(audioDir);
        files.forEach(file => {
            if (file.endsWith('.mp3')) {
                const name = file.replace('.mp3', '');
                content += `\n    ${name}?: ModifiedAudioClip;`;
            }
        });
    }
    content += `\n}`;

    fs.writeFileSync(Editor.Project.path + '/type_mp3.d.ts', content);
}

exports.updateMp3 = updateMp3;