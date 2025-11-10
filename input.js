// 输入控制系统 - 处理键盘和触屏输入
class InputController {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.joystick = { x: 0, y: 0, active: false };
        this.fireButton = { pressed: false };
        this.isMobile = false;

        this.init();
    }

    init() {
        // 检测设备类型
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 触屏事件
        if (this.isMobile) {
            this.setupTouchControls();
        }

        // 防止默认触摸行为
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('#mobileControls') || e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#mobileControls') || e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // 键盘事件处理
    handleKeyDown(e) {
        this.keys[e.code] = true;

        // 空格键射击
        if (e.code === 'Space') {
            e.preventDefault();
            this.fireButton.pressed = true;
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;

        if (e.code === 'Space') {
            this.fireButton.pressed = false;
        }
    }

    // 设置触屏控制
    setupTouchControls() {
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystickKnob');
        const fireBtn = document.getElementById('fireBtn');

        let joystickActive = false;
        let joystickRect;

        // 摇杆控制
        const startJoystick = (e) => {
            e.preventDefault();
            joystickActive = true;
            joystickRect = joystick.getBoundingClientRect();
            this.updateJoystick(e);
        };

        const moveJoystick = (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            this.updateJoystick(e);
        };

        const endJoystick = (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            joystickActive = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            this.joystick.active = false;

            // 重置摇杆位置
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        };

        // 更新摇杆状态
        this.updateJoystick = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const centerX = joystickRect.left + joystickRect.width / 2;
            const centerY = joystickRect.top + joystickRect.height / 2;

            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;

            // 限制摇杆移动范围
            const maxDistance = joystickRect.width / 2 - 25;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }

            // 更新摇杆视觉效果
            joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

            // 更新输入状态
            this.joystick.x = deltaX / maxDistance;
            this.joystick.y = deltaY / maxDistance;
            this.joystick.active = true;
        };

        // 摇杆事件监听
        joystick.addEventListener('touchstart', startJoystick, { passive: false });
        document.addEventListener('touchmove', moveJoystick, { passive: false });
        document.addEventListener('touchend', endJoystick, { passive: false });

        // 射击按钮控制
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.fireButton.pressed = true;
            fireBtn.style.transform = 'scale(0.9)';
        }, { passive: false });

        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.fireButton.pressed = false;
            fireBtn.style.transform = 'scale(1)';
        }, { passive: false });

        // 鼠标事件（用于桌面端测试）
        joystick.addEventListener('mousedown', startJoystick);
        document.addEventListener('mousemove', moveJoystick);
        document.addEventListener('mouseup', endJoystick);

        fireBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.fireButton.pressed = true;
            fireBtn.style.transform = 'scale(0.9)';
        });

        fireBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.fireButton.pressed = false;
            fireBtn.style.transform = 'scale(1)';
        });
    }

    // 获取移动方向
    getMovementDirection() {
        let x = 0;
        let y = 0;

        if (this.isMobile && this.joystick.active) {
            // 移动端使用摇杆
            x = this.joystick.x;
            y = this.joystick.y;
        } else {
            // PC端使用键盘
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) x = -1;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) x = 1;
            if (this.keys['ArrowUp'] || this.keys['KeyW']) y = -1;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) y = 1;
        }

        // 归一化对角线移动
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    // 检查射击按钮状态
    isFirePressed() {
        return this.fireButton.pressed;
    }

    // 重置所有输入
    reset() {
        this.keys = {};
        this.joystick = { x: 0, y: 0, active: false };
        this.fireButton.pressed = false;
    }
}

// 导出全局输入控制器实例
window.inputController = new InputController();