import { AudioClip } from "cc"
interface ModifiedAudioClip extends AudioClip {
    playMusic(loop?: boolean): void;
    playEffect(loop?: boolean): void;
}
interface mp3Type {
    bgm?: ModifiedAudioClip;
    click?: ModifiedAudioClip;
}