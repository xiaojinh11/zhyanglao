/**
 * 智慧养老平台 - 媒体设备访问模块（简化版）
 */

// 在文档加载完成后初始化媒体设备管理器
document.addEventListener('DOMContentLoaded', function() {
    console.log("初始化媒体访问面板...");
    
    // 创建媒体访问面板
    const panel = document.createElement('div');
    panel.id = 'mediaAccessPanel';
    panel.className = 'media-access-panel';
    
    // 设置位置在左下角
    panel.style.left = '20px';
    panel.style.right = 'auto';
    
    panel.innerHTML = `
        <div class="media-access-buttons">
            <button id="microphoneBtn" class="media-btn" title="麦克风">
                <i class="fas fa-microphone"></i>
            </button>
            <button id="cameraBtn" class="media-btn" title="摄像头">
                <i class="fas fa-video"></i>
            </button>
            <button id="speakerBtn" class="media-btn" title="扬声器">
                <i class="fas fa-volume-up"></i>
            </button>
            <button id="videoCallBtn" class="media-btn" title="视频通话">
                <i class="fas fa-phone"></i>
            </button>
            <button id="closeMediaBtn" class="media-btn close-media-btn" title="关闭媒体面板">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(panel);
    console.log("媒体访问面板已添加到页面");
    
    // 为老人端添加更大的按钮和简化界面
    if (document.body.classList.contains('elderly-view')) {
        panel.classList.add('elderly-view');
        
        // 增大按钮尺寸
        const buttons = panel.querySelectorAll('.media-btn');
        buttons.forEach(btn => {
            btn.classList.add('elderly-btn');
            // 增加文字说明
            const text = document.createElement('span');
            text.className = 'btn-text';
            
            if (btn.id === 'microphoneBtn') {
                text.textContent = '麦克风';
            } else if (btn.id === 'cameraBtn') {
                text.textContent = '摄像头';
            } else if (btn.id === 'speakerBtn') {
                text.textContent = '扬声器';
            } else if (btn.id === 'videoCallBtn') {
                text.textContent = '视频通话';
            } else if (btn.id === 'closeMediaBtn') {
                text.textContent = '关闭';
            }
            
            btn.appendChild(text);
        });
    }
    
    // 添加事件处理
    document.getElementById('microphoneBtn').addEventListener('click', function() {
        alert('请允许麦克风访问权限');
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    alert('麦克风已成功连接！');
                })
                .catch(function(err) {
                    alert('麦克风访问失败: ' + err.message);
                });
        } else {
            alert('您的浏览器不支持麦克风访问');
        }
    });
    
    document.getElementById('cameraBtn').addEventListener('click', function() {
        alert('请允许摄像头访问权限');
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    alert('摄像头已成功连接！');
                })
                .catch(function(err) {
                    alert('摄像头访问失败: ' + err.message);
                });
        } else {
            alert('您的浏览器不支持摄像头访问');
        }
    });
    
    document.getElementById('speakerBtn').addEventListener('click', function() {
        alert('正在测试扬声器...');
        
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建振荡器
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440Hz - A4音
        
        // 创建增益节点（用于控制音量）
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 设置较低的音量
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放音频
        oscillator.start();
        
        // 1秒后停止
        setTimeout(function() {
            oscillator.stop();
            alert('扬声器测试完成！');
        }, 1000);
    });
    
    document.getElementById('videoCallBtn').addEventListener('click', function() {
        alert('正在初始化视频通话...');
    });
    
    // 添加关闭按钮功能
    document.getElementById('closeMediaBtn').addEventListener('click', function() {
        // 关闭面板
        panel.style.display = 'none';
        
        // 创建一个小的重新打开按钮
        createReopenButton();
    });
    
    // 创建重新打开按钮
    function createReopenButton() {
        // 检查是否已存在重新打开按钮
        if (document.getElementById('reopenMediaBtn')) {
            return;
        }
        
        const reopenBtn = document.createElement('button');
        reopenBtn.id = 'reopenMediaBtn';
        reopenBtn.className = 'reopen-media-btn';
        reopenBtn.title = '打开媒体面板';
        reopenBtn.innerHTML = '<i class="fas fa-plug"></i>';
        
        // 设置样式
        reopenBtn.style.position = 'fixed';
        reopenBtn.style.left = '20px';
        reopenBtn.style.bottom = '20px';
        reopenBtn.style.width = '40px';
        reopenBtn.style.height = '40px';
        reopenBtn.style.borderRadius = '50%';
        reopenBtn.style.backgroundColor = '#4a90e2';
        reopenBtn.style.color = 'white';
        reopenBtn.style.border = 'none';
        reopenBtn.style.display = 'flex';
        reopenBtn.style.alignItems = 'center';
        reopenBtn.style.justifyContent = 'center';
        reopenBtn.style.cursor = 'pointer';
        reopenBtn.style.zIndex = '1000';
        reopenBtn.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        
        // 老人端样式
        if (document.body.classList.contains('elderly-view')) {
            reopenBtn.style.width = '60px';
            reopenBtn.style.height = '60px';
            reopenBtn.style.fontSize = '24px';
        }
        
        // 添加到页面
        document.body.appendChild(reopenBtn);
        
        // 添加事件监听
        reopenBtn.addEventListener('click', function() {
            // 显示媒体面板
            panel.style.display = 'block';
            
            // 移除重新打开按钮
            reopenBtn.remove();
        });
    }
});
