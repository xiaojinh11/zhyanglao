/**
 * WebRTC 视频/语音通话功能模块
 */
class WebRTCClient {
    constructor(userId, userName) {
        this.userId = userId;
        this.userName = userName;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.webSocket = null;
        this.remoteUserId = null;
        this.callType = null; // 'video' 或 'audio'
        this.isInitiator = false;
        this.roomName = null;
        this.callInProgress = false;
        this.callTimer = null;

        // ICE服务器配置 - 使用免费的公共STUN服务器
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        // 事件回调
        this.onCallRequest = null;    // 收到通话请求时的回调
        this.onCallAccepted = null;   // 通话被接受时的回调
        this.onCallRejected = null;   // 通话被拒绝时的回调
        this.onCallEnded = null;      // 通话结束时的回调
        this.onError = null;          // 错误发生时的回调
        this.onConnectionStateChange = null; // 连接状态变化时的回调
    }

    /**
     * 初始化WebSocket连接
     * @param {string} roomName 房间名称
     */
    connect(roomName) {
        this.roomName = roomName;
        const wsUrl = `ws://${window.location.host}/ws/webrtc/${roomName}/`;
        
        console.log(`正在连接到WebRTC WebSocket: ${wsUrl}`);
        this.webSocket = new WebSocket(wsUrl);

        this.webSocket.onopen = () => {
            console.log('WebRTC WebSocket连接已建立');
            // 通知其他用户加入房间
            this.webSocket.send(JSON.stringify({
                type: 'join',
                user: this.userId,
                message: `${this.userName} 加入房间`
            }));
        };

        this.webSocket.onclose = (e) => {
            console.log('WebRTC WebSocket连接已关闭', e.code, e.reason);
            // 自动重连
            setTimeout(() => {
                this.connect(roomName);
            }, 3000);
        };

        this.webSocket.onerror = (error) => {
            console.error('WebRTC WebSocket错误:', error);
            if (this.onError) {
                this.onError('WebSocket连接错误');
            }
        };

        this.webSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleSignalingData(data);
        };
    }

    /**
     * 处理信令数据
     * @param {Object} data 信令数据
     */
    handleSignalingData(data) {
        const type = data.type;

        switch (type) {
            case 'offer':
                this.handleOffer(data.offer, data.sender_id);
                break;
            case 'answer':
                this.handleAnswer(data.answer);
                break;
            case 'ice':
                this.handleIceCandidate(data.ice);
                break;
            case 'call_request':
                this.handleCallRequest(data.sender_id, data.sender_name, data.call_type);
                break;
            case 'call_response':
                this.handleCallResponse(data.sender_id, data.accepted);
                break;
            case 'end_call':
                this.handleEndCall();
                break;
            case 'user_join':
                console.log(`用户加入: ${data.message}`);
                break;
            case 'user_leave':
                console.log(`用户离开: ${data.message}`);
                break;
            case 'user_disconnect':
                if (this.callInProgress && data.user === this.remoteUserId) {
                    this.handleEndCall();
                }
                console.log(`用户断开连接: ${data.message}`);
                break;
            default:
                console.log('未知信令类型:', type);
        }
    }

    /**
     * 创建对等连接
     */
    async createPeerConnection() {
        try {
            console.log('创建对等连接...');
            this.peerConnection = new RTCPeerConnection(this.iceServers);

            // 添加本地流轨道到对等连接
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // 处理远程流
            this.peerConnection.ontrack = (event) => {
                console.log('收到远程轨道', event.streams[0]);
                this.remoteStream = event.streams[0];
                // 如果提供了远程视频元素，将远程流附加到它
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = this.remoteStream;
                }
            };

            // 收集和发送ICE候选者
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('发送ICE候选者', event.candidate);
                    this.sendIceCandidate(event.candidate);
                }
            };

            // 连接状态变化
            this.peerConnection.onconnectionstatechange = (event) => {
                console.log('连接状态变化:', this.peerConnection.connectionState);
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange(this.peerConnection.connectionState);
                }
                
                // 处理连接关闭
                if (this.peerConnection.connectionState === 'disconnected' ||
                    this.peerConnection.connectionState === 'failed' ||
                    this.peerConnection.connectionState === 'closed') {
                    this.endCall();
                }
            };

            console.log('对等连接创建成功');
        } catch (error) {
            console.error('创建对等连接时出错:', error);
            if (this.onError) {
                this.onError('创建通话连接失败: ' + error.message);
            }
        }
    }

    /**
     * 获取本地媒体流
     * @param {boolean} video 是否包含视频
     * @returns {Promise<MediaStream>}
     */
    async getLocalStream(video = true) {
        try {
            const constraints = {
                audio: true,
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false
            };

            console.log('请求本地媒体流:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('获取本地流成功:', stream);
            this.localStream = stream;

            // 如果提供了本地视频元素，将本地流附加到它
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }

            return stream;
        } catch (error) {
            console.error('获取本地流时出错:', error);
            if (this.onError) {
                this.onError('无法访问摄像头或麦克风: ' + error.message);
            }
            throw error;
        }
    }

    /**
     * 发起通话请求
     * @param {string} userId 接收者的用户ID
     * @param {string} callType 通话类型 'video' 或 'audio'
     */
    startCall(userId, callType = 'video') {
        if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
            if (this.onError) {
                this.onError('WebSocket连接未建立，无法发起通话');
            }
            return;
        }

        this.remoteUserId = userId;
        this.callType = callType;
        this.isInitiator = true;
        
        console.log(`向用户 ${userId} 发起${callType === 'video' ? '视频' : '语音'}通话请求`);
        
        // 发送通话请求
        this.webSocket.send(JSON.stringify({
            type: 'call_request',
            sender_id: this.userId,
            receiver_id: userId,
            call_type: callType
        }));
    }

    /**
     * 接受通话请求
     */
    async acceptCall() {
        try {
            // 获取本地流
            await this.getLocalStream(this.callType === 'video');
            
            // 创建对等连接
            await this.createPeerConnection();
            
            // 发送接受通话的响应
            this.webSocket.send(JSON.stringify({
                type: 'call_response',
                sender_id: this.userId,
                receiver_id: this.remoteUserId,
                accepted: true
            }));
            
            // 如果是发起者，创建并发送提议
            if (this.isInitiator) {
                await this.createAndSendOffer();
            }
            
            // 标记通话正在进行
            this.callInProgress = true;
            
            // 启动通话计时器
            this.startCallTimer();
            
        } catch (error) {
            console.error('接受通话时出错:', error);
            if (this.onError) {
                this.onError('接受通话失败: ' + error.message);
            }
        }
    }

    /**
     * 拒绝通话请求
     */
    rejectCall() {
        // 发送拒绝通话的响应
        this.webSocket.send(JSON.stringify({
            type: 'call_response',
            sender_id: this.userId,
            receiver_id: this.remoteUserId,
            accepted: false
        }));
        
        // 重置状态
        this.remoteUserId = null;
        this.callType = null;
        this.isInitiator = false;
    }

    /**
     * 结束通话
     */
    endCall() {
        // 通知对方通话结束
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN && this.remoteUserId) {
            this.webSocket.send(JSON.stringify({
                type: 'end_call',
                sender_id: this.userId,
                receiver_id: this.remoteUserId
            }));
        }
        
        // 停止计时器
        this.stopCallTimer();
        
        // 关闭对等连接
        this.closePeerConnection();
        
        // 停止本地和远程流
        this.stopStreams();
        
        // 重置状态
        this.remoteUserId = null;
        this.callType = null;
        this.isInitiator = false;
        this.callInProgress = false;
        
        // 触发通话结束回调
        if (this.onCallEnded) {
            this.onCallEnded();
        }
    }

    /**
     * 创建并发送提议
     */
    async createAndSendOffer() {
        try {
            console.log('创建提议...');
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            console.log('发送提议:', offer);
            this.webSocket.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                sender_id: this.userId,
                receiver_id: this.remoteUserId
            }));
        } catch (error) {
            console.error('创建提议时出错:', error);
            if (this.onError) {
                this.onError('创建通话连接失败: ' + error.message);
            }
        }
    }

    /**
     * 处理接收到的提议
     * @param {RTCSessionDescriptionInit} offer 提议
     * @param {string} senderId 发送者ID
     */
    async handleOffer(offer, senderId) {
        try {
            console.log('收到提议:', offer, '来自用户:', senderId);
            this.remoteUserId = senderId;
            
            // 如果还没有创建对等连接，先创建
            if (!this.peerConnection) {
                await this.createPeerConnection();
            }
            
            // 设置远程描述
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            // 创建应答
            console.log('创建应答...');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            // 发送应答
            console.log('发送应答:', answer);
            this.webSocket.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                sender_id: this.userId,
                receiver_id: this.remoteUserId
            }));
            
            // 标记通话正在进行
            this.callInProgress = true;
            
            // 启动通话计时器
            this.startCallTimer();
            
        } catch (error) {
            console.error('处理提议时出错:', error);
            if (this.onError) {
                this.onError('处理通话请求失败: ' + error.message);
            }
        }
    }

    /**
     * 处理接收到的应答
     * @param {RTCSessionDescriptionInit} answer 应答
     */
    async handleAnswer(answer) {
        try {
            console.log('收到应答:', answer);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('处理应答时出错:', error);
            if (this.onError) {
                this.onError('处理通话响应失败: ' + error.message);
            }
        }
    }

    /**
     * 发送ICE候选者
     * @param {RTCIceCandidate} candidate ICE候选者
     */
    sendIceCandidate(candidate) {
        this.webSocket.send(JSON.stringify({
            type: 'ice',
            ice: candidate,
            sender_id: this.userId,
            receiver_id: this.remoteUserId
        }));
    }

    /**
     * 处理接收到的ICE候选者
     * @param {RTCIceCandidate} candidate ICE候选者
     */
    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection && candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('添加ICE候选者时出错:', error);
        }
    }

    /**
     * 处理接收到的通话请求
     * @param {string} senderId 发送者ID
     * @param {string} senderName 发送者名称
     * @param {string} callType 通话类型 'video' 或 'audio'
     */
    handleCallRequest(senderId, senderName, callType) {
        console.log(`收到来自 ${senderName}(${senderId}) 的${callType === 'video' ? '视频' : '语音'}通话请求`);
        
        this.remoteUserId = senderId;
        this.callType = callType;
        this.isInitiator = false;
        
        // 触发通话请求回调
        if (this.onCallRequest) {
            this.onCallRequest(senderId, senderName, callType);
        }
    }

    /**
     * 处理接收到的通话响应
     * @param {string} senderId 发送者ID
     * @param {boolean} accepted 是否接受通话
     */
    async handleCallResponse(senderId, accepted) {
        console.log(`用户 ${senderId} ${accepted ? '接受' : '拒绝'}了通话请求`);
        
        if (accepted) {
            try {
                // 如果通话被接受且本地流还没有准备好
                if (!this.localStream) {
                    await this.getLocalStream(this.callType === 'video');
                }
                
                // 如果对等连接还没有创建
                if (!this.peerConnection) {
                    await this.createPeerConnection();
                }
                
                // 如果是发起者，创建并发送提议
                if (this.isInitiator) {
                    await this.createAndSendOffer();
                }
                
                // 触发通话接受回调
                if (this.onCallAccepted) {
                    this.onCallAccepted();
                }
            } catch (error) {
                console.error('处理通话接受响应时出错:', error);
                if (this.onError) {
                    this.onError('建立通话失败: ' + error.message);
                }
            }
        } else {
            // 通话被拒绝
            // 重置状态
            this.remoteUserId = null;
            this.callType = null;
            this.isInitiator = false;
            
            // 触发通话拒绝回调
            if (this.onCallRejected) {
                this.onCallRejected();
            }
        }
    }

    /**
     * 处理通话结束
     */
    handleEndCall() {
        // 停止计时器
        this.stopCallTimer();
        
        // 关闭对等连接
        this.closePeerConnection();
        
        // 停止流
        this.stopStreams();
        
        // 重置状态
        this.callInProgress = false;
        
        // 触发通话结束回调
        if (this.onCallEnded) {
            this.onCallEnded();
        }
    }

    /**
     * 关闭对等连接
     */
    closePeerConnection() {
        if (this.peerConnection) {
            try {
                this.peerConnection.close();
                this.peerConnection = null;
            } catch (error) {
                console.error('关闭对等连接时出错:', error);
            }
        }
    }

    /**
     * 停止流
     */
    stopStreams() {
        // 停止本地流
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
            
            // 清除本地视频元素
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = null;
            }
        }
        
        // 清除远程流
        this.remoteStream = null;
        
        // 清除远程视频元素
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
    }

    /**
     * 开始通话计时器
     */
    startCallTimer() {
        let seconds = 0;
        const timerElement = document.getElementById('callTimer');
        
        // 清除现有计时器
        this.stopCallTimer();
        
        // 创建新计时器
        this.callTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            // 如果存在计时器元素则更新
            if (timerElement) {
                timerElement.textContent = formattedTime;
            }
        }, 1000);
    }

    /**
     * 停止通话计时器
     */
    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
            
            // 重置计时器显示
            const timerElement = document.getElementById('callTimer');
            if (timerElement) {
                timerElement.textContent = '00:00';
            }
        }
    }

    /**
     * 切换视频
     * @returns {boolean} 当前视频状态
     */
    toggleVideo() {
        if (!this.localStream) return false;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            return videoTrack.enabled;
        }
        return false;
    }

    /**
     * 切换音频
     * @returns {boolean} 当前音频状态
     */
    toggleAudio() {
        if (!this.localStream) return false;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return audioTrack.enabled;
        }
        return false;
    }

    /**
     * 切换扬声器
     * @param {string} deviceId 设备ID
     */
    async switchSpeaker(deviceId) {
        try {
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo && typeof remoteVideo.setSinkId === 'function') {
                await remoteVideo.setSinkId(deviceId);
                console.log('已切换扬声器到:', deviceId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('切换扬声器时出错:', error);
            return false;
        }
    }

    /**
     * 枚举设备
     * @returns {Promise<MediaDeviceInfo[]>} 设备列表
     */
    async enumDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices;
        } catch (error) {
            console.error('枚举设备时出错:', error);
            return [];
        }
    }

    /**
     * 关闭连接
     */
    close() {
        // 如果正在通话中，结束通话
        if (this.callInProgress) {
            this.endCall();
        }
        
        // 如果WebSocket连接存在，关闭它
        if (this.webSocket) {
            // 通知其他用户离开房间
            if (this.webSocket.readyState === WebSocket.OPEN) {
                this.webSocket.send(JSON.stringify({
                    type: 'leave',
                    user: this.userId,
                    message: `${this.userName} 离开房间`
                }));
            }
            
            this.webSocket.close();
            this.webSocket = null;
        }
    }
}

// 导出WebRTCClient类
window.WebRTCClient = WebRTCClient; 