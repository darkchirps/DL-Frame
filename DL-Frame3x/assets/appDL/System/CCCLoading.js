//隐藏进度条
(function () {
    function hideProgressBar() {
        const splashElement = document.getElementById('splash');
        if (splashElement) {
            splashElement.style.display = 'none';
        }
    }
    if (typeof cc !== 'undefined') {
        hideProgressBar();
    }
})();

// (function () {
//     // 自定义背景元素
//     let backgroundDiv;
//     // 添加全屏背景层，并置于cocos画布层上面
//     function addFullScreenBackground() {
//         const gameContainer = document.getElementById('Cocos3dGameContainer');
//         const gameCanvas = document.getElementById('GameCanvas');
//         if (gameContainer && gameCanvas) {
//             backgroundDiv = document.createElement('div');
//             Object.assign(backgroundDiv.style, {
//                 position: 'absolute',
//                 top: '0',
//                 left: '0',
//                 width: '100%',
//                 height: '100%',
//                 backgroundColor: '#ADD8E6', // 设置背景颜色为浅蓝色
//                 zIndex: '0' // 确保背景在cocos画布节点层的上面，cocos画布层默认为-1
//             });
//             gameContainer.style.position = 'relative'; // 确保容器是相对定位的，以便背景能够覆盖整个容器
//             gameContainer.insertBefore(backgroundDiv, gameCanvas); // 将背景插入到 canvas 之前
//             // 添加初始化文字
//             addInitializationText();
//         }
//     }
//     // 添加初始化文字并进行美化
//     function addInitializationText() {
//         const initText = document.createElement('div');
//         initText.innerText = 'Cocos Creator游戏引擎初始化中...';
//         Object.assign(initText.style, {
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)', // 横竖居中
//             color: '#FFFFFF', // 设置文字颜色为白色
//             fontSize: '16px', // 设置字体大小
//             fontFamily: 'Arial, sans-serif', // 设置字体
//             padding: '10px 20px', // 设置内边距
//             backgroundColor: 'rgba(0, 0, 0, 0.5)', // 设置背景颜色为半透明黑色
//             borderRadius: '10px', // 设置圆角
//             boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // 设置阴影
//             zIndex: '1' // 确保文字在背景层的前面
//         });
//         backgroundDiv.appendChild(initText);
//     }
//     // 隐藏进度条
//     function hideProgressBar() {
//         const splashElement = document.getElementById('splash');
//         if (splashElement) splashElement.style.display = 'none';
//     }
//     // 隐藏背景
//     function hideBackgroundDiv() {
//         if (backgroundDiv) backgroundDiv.style.display = 'none';
//     }
//     if (typeof cc !== 'undefined' && !cc.EDITOR) {
//         addFullScreenBackground();
//         hideProgressBar();
//         // 只监听一次，渲染过程之前所触发的事件。
//         cc.director.once(cc.Director.EVENT_BEFORE_DRAW, hideBackgroundDiv);
//     }
// })();