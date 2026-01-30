import { _decorator, CCClass, Color, Component, Graphics, Node, Size, UITransform } from 'cc';
import { QRCode } from './QRCode';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('GraphicsQRCode')
@requireComponent(Graphics)
export class GraphicsQRCode extends Component {
    @property({
        tooltip: "生成二维码的字符串"
    })
    string = "Hello World!";

    @property({
        tooltip: "二维码背景色"
    })
    backColor: Color = new Color().fromHEX("#FFFFFF");

    @property({
        tooltip: "二维码颜色"
    })
    foreColor: Color = new Color().fromHEX("#000000");

    @property({
        tooltip: "二维码边距"
    })
    margin = 10;

    @property({
        tooltip: "二维码节点大小"
    })
    size: Size = new Size(200, 200);

    onLoad() {
        this.node.getComponent(UITransform).setContentSize(this.size);
        this.createQRCode();
    }

    createQRCode(viewSize?: Size) {
        const nodeTransform = this.node.getComponent(UITransform);
        if (viewSize) nodeTransform.setContentSize(viewSize);

        const graphics = this.node.getComponent(Graphics);
        graphics.clear();
        //背景色
        graphics.fillColor = this.backColor;
        let width = nodeTransform.width;
        let offsetX = -width * nodeTransform.anchorX;
        let offsetY = -width * nodeTransform.anchorY;
        graphics.rect(offsetX, offsetY, width, width);
        graphics.fill();
        graphics.close();
        //生成二维码数据
        let qrcode = new QRCode(-1, 2);
        qrcode.addData(this.string);
        qrcode.make();
        graphics.fillColor = this.foreColor;
        let size = width - this.margin * 2;
        let num = qrcode.getModuleCount();

        let tileW = size / num;
        let tileH = size / num;
        let w = Math.ceil(tileW);
        let h = Math.ceil(tileH);
        for (let row = 0; row < num; row++) {
            for (let col = 0; col < num; col++) {
                if (qrcode.isDark(row, col)) {
                    graphics.rect(offsetX + this.margin + col * tileW, offsetX + size - tileH - Math.round(row * tileH) + this.margin, w, h);
                    graphics.fill();
                }
            }
        }
    }
}


