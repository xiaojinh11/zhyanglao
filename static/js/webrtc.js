/**
 * 智慧养老平台 - WebRTC视频通话模块
 * 提供点对点视频通话功能
 */

// WebRTC连接管理类
class WebRTCManager {
    constructor() {
        // ICE服务器配置（使用免费的公共STUN服务器）
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        // 本地媒体流
        this.localStream = null;
        
        // 远程媒体流
        this.remoteStream = null;
        
        // WebRTC连接对象
        this.peerConnection = null;
        
        // 信令服务器连接（使用WebSocket）
        this.signallingServer = null;
        
        // 当前用户ID
        this.userId = null;
        
        // 远程用户ID
        this.remoteUserId = null;
        
        // 通话状态
        this.callStatus = 'idle'; // idle, calling, connected
        
        // 绑定方法到实例
        this.initializeCall = this.initializeCall.bind(this);
        this.startCall = this.startCall.bind(this);
        this.endCall = this.endCall.bind(this);
        this.handleICECandidate = this.handleICECandidate.bind(this);
        this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this);
        this.handleRemoteStreamRemoved = this.handleRemoteStreamRemoved.bind(this);
        this.handleICEConnectionStateChange = this.handleICEConnectionStateChange.bind(this);
        this.handleSignallingMessage = this.handleSignallingMessage.bind(this);
        this.createVideoCallUI = this.createVideoCallUI.bind(this);
        this.toggleMute = this.toggleMute.bind(this);
        this.toggleVideo = this.toggleVideo.bind(this);
    }
    
    // 初始化WebRTC通话
    async initializeCall(remoteUserId) {
        try {
            // 设置远程用户ID
            this.remoteUserId = remoteUserId;
            
            // 创建通话UI
            this.createVideoCallUI();
            
            // 请求本地媒体流
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // 显示本地视频
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
            
            // 创建RTCPeerConnection
            this.peerConnection = new RTCPeerConnection(this.iceServers);
            
            // 添加本地媒体轨道到连接
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            
            // 设置ICE候选事件处理
            this.peerConnection.onicecandidate = this.handleICECandidate;
            
            // 设置远程流添加事件处理
            this.peerConnection.ontrack = this.handleRemoteStreamAdded;
            
            // 设置远程流移除事件处理
            this.peerConnection.onremovetrack = this.handleRemoteStreamRemoved;
            
            // 设置ICE连接状态变化事件处理
            this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChange;
            
            // 连接信令服务器
            this.connectSignallingServer();
            
            // 更新状态
            this.updateCallStatus('connecting');
            
            return true;
        } catch (error) {
            console.error('初始化WebRTC通话失败:', error);
            this.showNotification('无法初始化视频通话: ' + error.message, 'error');
            return false;
        }
    }
    
    // 连接信令服务器
    connectSignallingServer() {
        // 在实际应用中，这里应该连接到真实的信令服务器
        // 由于这是一个示例，我们模拟信令过程
        console.log('连接信令服务器...');
        
        // 生成随机用户ID
        this.userId = 'user_' + Math.floor(Math.random() * 1000000);
        
        // 模拟连接成功
        setTimeout(() => {
            console.log('信令服务器连接成功，用户ID:', this.userId);
            this.showNotification('信令服务器连接成功', 'success');
        }, 1000);
    }
    
    // 发起通话
    async startCall() {
        try {
            // 创建提议
            const offer = await this.peerConnection.createOffer();
            
            // 设置本地描述
            await this.peerConnection.setLocalDescription(offer);
            
            // 通过信令服务器发送提议给远程用户
            console.log('发送通话提议:', offer);
            this.sendSignallingMessage({
                type: 'offer',
                offer: offer,
                from: this.userId,
                to: this.remoteUserId
            });
            
            // 更新状态
            this.updateCallStatus('calling');
            
            this.showNotification('正在呼叫对方...', 'info');
            
            // 模拟远程用户接受通话
            setTimeout(async () => {
                // 模拟收到应答
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                
                console.log('收到通话应答:', answer);
                
                // 更新状态
                this.updateCallStatus('connected');
                
                this.showNotification('通话已连接', 'success');
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('发起通话失败:', error);
            this.showNotification('发起通话失败: ' + error.message, 'error');
            return false;
        }
    }
    
    // 结束通话
    endCall() {
        // 关闭连接
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // 停止本地媒体流
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // 移除视频元素
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = null;
        }
        
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        
        // 移除通话UI
        const videoCallPanel = document.getElementById('videoCallPanel');
        if (videoCallPanel) {
            videoCallPanel.remove();
        }
        
        // 更新状态
        this.callStatus = 'idle';
        
        this.showNotification('通话已结束', 'info');
        
        console.log('通话已结束');
    }
    
    // 处理ICE候选
    handleICECandidate(event) {
        if (event.candidate) {
            console.log('发现ICE候选:', event.candidate);
            
            // 通过信令服务器发送ICE候选给远程用户
            this.sendSignallingMessage({
                type: 'ice_candidate',
                candidate: event.candidate,
                from: this.userId,
                to: this.remoteUserId
            });
        }
    }
    
    // 处理远程流添加
    handleRemoteStreamAdded(event) {
        console.log('远程流已添加:', event.streams[0]);
        
        this.remoteStream = event.streams[0];
        
        // 显示远程视频
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = this.remoteStream;
        }
        
        // 更新状态
        this.updateCallStatus('connected');
    }
    
    // 处理远程流移除
    handleRemoteStreamRemoved(event) {
        console.log('远程流已移除');
        
        this.remoteStream = null;
        
        // 移除远程视频
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        
        // 如果通话仍在进行中，则结束通话
        if (this.callStatus !== 'idle') {
            this.endCall();
        }
    }
    
    // 处理ICE连接状态变化
    handleICEConnectionStateChange(event) {
        console.log('ICE连接状态变化:', this.peerConnection.iceConnectionState);
        
        // 更新连接状态指示器
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.connection-status-text');
        
        if (statusIndicator && statusText) {
            switch (this.peerConnection.iceConnectionState) {
                case 'connected':
                case 'completed':
                    statusIndicator.className = 'status-indicator connected';
                    statusText.textContent = '已连接';
                    break;
                case 'disconnected':
                case 'failed':
                case 'closed':
                    statusIndicator.className = 'status-indicator';
                    statusText.textContent = '已断开';
                    
                    // 如果通话仍在进行中，则结束通话
                    if (this.callStatus !== 'idle') {
                        this.endCall();
                    }
                    break;
                default:
                    statusIndicator.className = 'status-indicator connecting';
                    statusText.textContent = '正在连接...';
                    break;
            }
        }
    }
    
    // 处理信令消息
    handleSignallingMessage(message) {
        console.log('收到信令消息:', message);
        
        switch (message.type) {
            case 'offer':
                this.handleOffer(message);
                break;
            case 'answer':
                this.handleAnswer(message);
                break;
            case 'ice_candidate':
                this.handleRemoteICECandidate(message);
                break;
            case 'hang_up':
                this.endCall();
                break;
        }
    }
    
    // 处理远程提议
    async handleOffer(message) {
        try {
            // 设置远程描述
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            
            // 创建应答
            const answer = await this.peerConnection.createAnswer();
            
            // 设置本地描述
            await this.peerConnection.setLocalDescription(answer);
            
            // 通过信令服务器发送应答给远程用户
            this.sendSignallingMessage({
                type: 'answer',
                answer: answer,
                from: this.userId,
                to: message.from
            });
            
            // 更新状态
            this.updateCallStatus('connected');
        } catch (error) {
            console.error('处理远程提议失败:', error);
        }
    }
    
    // 处理远程应答
    async handleAnswer(message) {
        try {
            // 设置远程描述
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
            
            // 更新状态
            this.updateCallStatus('connected');
        } catch (error) {
            console.error('处理远程应答失败:', error);
        }
    }
    
    // 处理远程ICE候选
    async handleRemoteICECandidate(message) {
        try {
            // 添加ICE候选
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (error) {
            console.error('添加远程ICE候选失败:', error);
        }
    }
    
    // 发送信令消息
    sendSignallingMessage(message) {
        // 在实际应用中，这里应该通过WebSocket发送消息到信令服务器
        // 由于这是一个示例，我们只打印消息
        console.log('发送信令消息:', message);
        
        // 模拟接收消息
        setTimeout(() => {
            this.handleSignallingMessage(message);
        }, 500);
    }
    
    // 创建视频通话UI
    createVideoCallUI() {
        // 检查是否已存在视频通话面板
        let videoCallPanel = document.getElementById('videoCallPanel');
        
        if (!videoCallPanel) {
            // 创建视频通话面板
            videoCallPanel = document.createElement('div');
            videoCallPanel.id = 'videoCallPanel';
            videoCallPanel.className = 'media-control-panel video-call-panel';
            videoCallPanel.style.width = '80vw';
            videoCallPanel.style.maxWidth = '1000px';
            videoCallPanel.style.height = '80vh';
            videoCallPanel.innerHTML = `
                <div class="panel-header">
                    <h3>视频通话</h3>
                    <div class="connection-status">
                        <div class="status-indicator connecting"></div>
                        <span class="connection-status-text">正在连接...</span>
                    </div>
                    <button class="close-btn" id="endCallBtn"><i class="fas fa-times"></i></button>
                </div>
                <div class="panel-body video-call-container">
                    <div class="remote-video-container">
                        <video id="remoteVideo" autoplay playsinline></video>
                        <div class="local-video-container">
                            <video id="localVideo" autoplay playsinline muted></video>
                        </div>
                    </div>
                    <div class="call-controls">
                        <button class="call-btn mute" id="toggleMuteBtn" title="静音">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button class="call-btn end-call" id="endCallBtnBottom" title="结束通话">
                            <i class="fas fa-phone-slash"></i>
                        </button>
                        <button class="call-btn video-toggle" id="toggleVideoBtn" title="关闭视频">
                            <i class="fas fa-video"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.appendChild(videoCallPanel);
            
            // 添加事件监听
            document.getElementById('endCallBtn').addEventListener('click', () => {
                this.endCall();
            });
            
            document.getElementById('endCallBtnBottom').addEventListener('click', () => {
                this.endCall();
            });
            
            document.getElementById('toggleMuteBtn').addEventListener('click', () => {
                this.toggleMute();
            });
            
            document.getElementById('toggleVideoBtn').addEventListener('click', () => {
                this.toggleVideo();
            });
        }
        
        // 显示面板
        videoCallPanel.style.display = 'block';
    }
    
    // 切换静音
    toggleMute() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            
            if (audioTracks.length > 0) {
                const isEnabled = !audioTracks[0].enabled;
                audioTracks[0].enabled = isEnabled;
                
                // 更新按钮状态
                const toggleMuteBtn = document.getElementById('toggleMuteBtn');
                
                if (toggleMuteBtn) {
                    if (isEnabled) {
                        toggleMuteBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                        toggleMuteBtn.classList.remove('active');
                        this.showNotification('麦克风已打开', 'info');
                    } else {
                        toggleMuteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                        toggleMuteBtn.classList.add('active');
                        this.showNotification('麦克风已静音', 'info');
                    }
                }
            }
        }
    }
    
    // 切换视频
    toggleVideo() {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            
            if (videoTracks.length > 0) {
                const isEnabled = !videoTracks[0].enabled;
                videoTracks[0].enabled = isEnabled;
                
                // 更新按钮状态
                const toggleVideoBtn = document.getElementById('toggleVideoBtn');
                
                if (toggleVideoBtn) {
                    if (isEnabled) {
                        toggleVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
                        toggleVideoBtn.classList.remove('active');
                        this.showNotification('视频已打开', 'info');
                    } else {
                        toggleVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                        toggleVideoBtn.classList.add('active');
                        this.showNotification('视频已关闭', 'info');
                    }
                }
            }
        }
    }
    
    // 更新通话状态
    updateCallStatus(status) {
        this.callStatus = status;
        
        // 更新UI状态
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.connection-status-text');
        
        if (statusIndicator && statusText) {
            switch (status) {
                case 'connected':
                    statusIndicator.className = 'status-indicator connected';
                    statusText.textContent = '已连接';
                    break;
                case 'calling':
                    statusIndicator.className = 'status-indicator connecting';
                    statusText.textContent = '正在呼叫...';
                    break;
                case 'connecting':
                    statusIndicator.className = 'status-indicator connecting';
                    statusText.textContent = '正在连接...';
                    break;
                default:
                    statusIndicator.className = 'status-indicator';
                    statusText.textContent = '空闲';
                    break;
            }
        }
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        // 检查是否已存在通知容器
        let notificationContainer = document.getElementById('mediaNotificationContainer');
        
        if (!notificationContainer) {
            // 创建通知容器
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'mediaNotificationContainer';
            notificationContainer.className = 'media-notification-container';
            
            // 添加到页面
            document.body.appendChild(notificationContainer);
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `media-notification ${type}`;
        
        // 设置图标
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                ${message}
            </div>
        `;
        
        // 添加到容器
        notificationContainer.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.classList.add('fade-out');
            
            setTimeout(() => {
                notification.remove();
                
                // 如果容器中没有通知了，则移除容器
                if (notificationContainer.children.length === 0) {
                    notificationContainer.remove();
                }
            }, 300);
        }, 3000);
    }
}

// 在文档加载完成后初始化WebRTC管理器
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局WebRTC管理器实例
    window.webRTCManager = new WebRTCManager();
    
    // 添加视频通话按钮到媒体访问面板
    setTimeout(() => {
        const mediaAccessButtons = document.querySelector('.media-access-buttons');
        
        if (mediaAccessButtons) {
            const videoCallBtn = document.createElement('button');
            videoCallBtn.id = 'videoCallBtn';
            videoCallBtn.className = 'media-btn';
            videoCallBtn.title = '视频通话';
            videoCallBtn.innerHTML = '<i class="fas fa-phone"></i>';
            
            videoCallBtn.addEventListener('click', () => {
                // 初始化视频通话
                if (window.webRTCManager) {
                    window.webRTCManager.initializeCall('remote_user_123').then(success => {
                        if (success) {
                            // 发起通话
                            window.webRTCManager.startCall();
                        }
                    });
                }
            });
            
            mediaAccessButtons.appendChild(videoCallBtn);
            
            // 为老人端添加文字说明
            if (document.body.classList.contains('elderly-view')) {
                const text = document.createElement('span');
                text.className = 'btn-text';
                text.textContent = '视频通话';
                videoCallBtn.appendChild(text);
                videoCallBtn.classList.add('elderly-btn');
            }
        }
    }, 1000);
}); 