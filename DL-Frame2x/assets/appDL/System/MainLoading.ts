/*******************************************************************************
 * 描述:    加载时间过长显示
*******************************************************************************/
const { ccclass, property } = cc._decorator;
@ccclass
export class MainLoading extends cc.Component {
    //假设要加载页面的时间为0.5s 但是不立即显示加载圈 所以这里设置0.2s 显示加载圈 避免一打开就显示加载圈影响体验 这里的数值可以根据自己的项目调整 如果在这个时间内加载完成了 则不会显示加载圈
    timer: number = 0.2;
    showBool: boolean = false;

    onEnable(): void {
        this.node.opacity = 0;
        this.timer = 0.2;
        this.showBool = true;
    }
    update(dt: number): void {
        if (!this.showBool) return;
        this.timer -= dt;
        if (this.timer <= 0) {
            this.node.opacity = 255;
            this.node.angle += dt * 150;
        }
    }
}
