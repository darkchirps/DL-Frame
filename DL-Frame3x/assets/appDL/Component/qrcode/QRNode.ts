import { QRCode } from "./QRCode";
import { _decorator, Component, Graphics, UITransform, Color } from 'cc';
import { QRErrorCorrectLevel } from "./QRConst";
const { ccclass, property } = _decorator;

@ccclass('QRTTT')
export default class QRTTT extends Component{



    start(){
        let node = this.node
        var qrcode = new QRCode(-1, QRErrorCorrectLevel.L);
        qrcode.addData('https://forum.cocos.org/u/firewoof');		
        qrcode.make();
    
        var ctx = node.getComponent(Graphics)!;
        ctx.fillColor = Color.WHITE;		
        var tileW = node.getComponent(UITransform)!.width / qrcode.getModuleCount();
        var tileH = node.getComponent(UITransform)!.height / qrcode.getModuleCount();
    
        // draw in the Graphics
        for (var row = 0; row < qrcode.getModuleCount(); row++) {
            for (var col = 0; col < qrcode.getModuleCount(); col++) {
                if (qrcode.isDark(row, col)) {					
                    var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
                    var h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
                    ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
                    ctx.fill();
                } else {
                    // ctx.fillColor = cc.Color.WHITE;
                }
                var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
            }
        }
    }











}

