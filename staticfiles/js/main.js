// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 强制移除所有卡片的背景图片
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.backgroundImage = 'none';
        card.style.background = 'rgba(255, 255, 255, 0.96)';
    });

    // 初始化所有工具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 自动隐藏警告消息
    var alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // 初始化所有下拉菜单
    var dropdownTriggerList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    var dropdownList = dropdownTriggerList.map(function(dropdownTriggerEl) {
        return new bootstrap.Dropdown(dropdownTriggerEl);
    });
    
    // AI助手功能初始化 - 确保它被正确调用
    console.log('初始化AI助手...');
    initAIAssistant();
    
    // 直接为发送按钮绑定点击事件
    const aiSendBtn = document.getElementById('aiAssistantSend');
    const aiInput = document.getElementById('aiAssistantInput');
    const aiChat = document.getElementById('aiAssistantChat');
    
    if (aiSendBtn && aiInput && aiChat) {
        console.log('直接绑定发送按钮事件');
        
        // 发送消息函数
        function directSendMessage() {
            console.log('发送按钮被点击');
            const message = aiInput.value.trim();
            if (!message) return;
            
            // 显示用户消息
            const messageHtml = `
                <div class="user-message mb-3 text-end">
                    <div class="d-flex justify-content-end">
                        <div class="message-bubble bg-primary text-white p-2 rounded">
                            ${message}
                        </div>
                        <div class="user-avatar ms-2">
                            <i class="fas fa-user-circle"></i>
                        </div>
                    </div>
                </div>
            `;
            aiChat.insertAdjacentHTML('beforeend', messageHtml);
            aiChat.scrollTop = aiChat.scrollHeight;
            
            // 清空输入框
            aiInput.value = '';
            
            // 显示AI正在输入的状态
            const typingHtml = `
                <div class="ai-message mb-3 ai-typing">
                    <div class="d-flex">
                        <div class="ai-avatar me-2">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-bubble bg-light p-2 rounded">
                            <div class="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            aiChat.insertAdjacentHTML('beforeend', typingHtml);
            aiChat.scrollTop = aiChat.scrollHeight;
            
            // 模拟AI回复
            setTimeout(() => {
                // 移除"正在输入"的提示
                const typingElement = document.querySelector('.ai-typing');
                if (typingElement) {
                    typingElement.remove();
                }
                
                // 生成回复
                let response;
                if (message.includes('你好') || message.includes('您好') || message.includes('hi') || message.includes('hello')) {
                    response = '您好！我是您的智能助手，有什么可以帮助您的吗？';
                } else if (message.includes('天气')) {
                    response = '今天天气晴朗，温度25°C，适合户外活动。';
                } else if (message.includes('时间') || message.includes('几点')) {
                    const now = new Date();
                    response = `现在的时间是 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
                } else if (message.includes('用药') || message.includes('药物') || message.includes('吃药')) {
                    response = '根据您的用药计划，今天需要在早上8点和晚上8点各服用一次降压药。您可以在"健康管理"中查看详细的用药提醒。';
                } else if (message.includes('健康') || message.includes('身体')) {
                    response = '您的最近健康数据显示一切正常。血压、心率都在理想范围内。建议您保持每天的散步习惯。';
                } else {
                    response = '感谢您的提问。我会尽快为您提供帮助。您可以询问我关于天气、时间、用药提醒、健康数据等问题。';
                }
                
                // 显示AI回复
                const aiMessageHtml = `
                    <div class="ai-message mb-3">
                        <div class="d-flex">
                            <div class="ai-avatar me-2">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-bubble bg-light p-2 rounded">
                                ${response}
                            </div>
                        </div>
                    </div>
                `;
                aiChat.insertAdjacentHTML('beforeend', aiMessageHtml);
                aiChat.scrollTop = aiChat.scrollHeight;
                
                // 如果是老人端，使用语音播放回复
                if (document.body.classList.contains('elderly-view') && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(response);
                    utterance.lang = 'zh-CN';
                    speechSynthesis.speak(utterance);
                }
            }, 1500);
        }
        
        // 直接绑定发送按钮点击事件
        aiSendBtn.addEventListener('click', directSendMessage);
        
        // 按Enter键发送消息
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                directSendMessage();
            }
        });
    }
});

// AI助手功能初始化
function initAIAssistant() {
    console.log('AI助手初始化函数被调用');
    const aiBtn = document.getElementById('aiAssistantBtn');
    const aiModal = document.getElementById('aiAssistantModal');
    const aiInput = document.getElementById('aiAssistantInput');
    const aiSendBtn = document.getElementById('aiAssistantSend');
    const aiChat = document.getElementById('aiAssistantChat');
    
    // 调试输出
    console.log('AI按钮:', aiBtn);
    console.log('AI模态框:', aiModal);
    
    if (!aiBtn || !aiModal || !aiInput || !aiSendBtn || !aiChat) {
        console.error('AI助手元素未找到!');
        return;
    }
    
    // 初始化模态框 - 使用jQuery方式初始化以确保兼容性
    // let aiModalInstance = new bootstrap.Modal(aiModal);
    
    // 直接绑定点击事件，不使用Bootstrap的Modal API
    aiBtn.addEventListener('click', function(e) {
        console.log('AI助手按钮被点击');
        e.preventDefault();
        // 使用jQuery打开模态框，确保兼容性
        $('#aiAssistantModal').modal('show');
        
        // 如果jQuery方式不起作用，尝试使用Bootstrap原生API
        // if (typeof bootstrap !== 'undefined') {
        //     let modal = new bootstrap.Modal(aiModal);
        //     modal.show();
        // }
        
        setTimeout(() => {
            if (aiInput) aiInput.focus();
        }, 500);
    });
    
    // 确保模态框打开事件被触发
    aiModal.addEventListener('shown.bs.modal', function() {
        console.log('AI助手模态框已打开');
        if (aiInput) aiInput.focus();
    });

    // 注意：以下代码作为备份方案，但现在我们使用直接绑定的方式处理发送功能
    
    // 发送消息
    function sendMessage() {
        console.log('发送消息函数被调用');
        const message = aiInput.value.trim();
        if (!message) return;
        
        // 显示用户消息
        addUserMessage(message);
        
        // 清空输入框
        aiInput.value = '';
        
        // 显示AI正在输入的状态
        showAITyping();
        
        // 调用AI接口 (这里是模拟，实际使用时替换为真实的API调用)
        processAIRequest(message);
    }
    
    // 点击发送按钮发送消息
    aiSendBtn.addEventListener('click', function() {
        console.log('发送按钮被点击 (initAIAssistant内)');
        sendMessage();
    });
    
    // 按Enter键发送消息
    aiInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Enter键被按下');
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 添加用户消息到聊天窗口
    function addUserMessage(message) {
        console.log('添加用户消息:', message);
        const messageHtml = `
            <div class="user-message mb-3 text-end">
                <div class="d-flex justify-content-end">
                    <div class="message-bubble bg-primary text-white p-2 rounded">
                        ${message}
                    </div>
                    <div class="user-avatar ms-2">
                        <i class="fas fa-user-circle"></i>
                    </div>
                </div>
            </div>
        `;
        aiChat.insertAdjacentHTML('beforeend', messageHtml);
        scrollToBottom();
    }
    
    // 添加AI消息到聊天窗口
    function addAIMessage(message) {
        console.log('添加AI消息:', message);
        // 移除"正在输入"的提示
        const typingElement = document.querySelector('.ai-typing');
        if (typingElement) {
            typingElement.remove();
        }
        
        const messageHtml = `
            <div class="ai-message mb-3">
                <div class="d-flex">
                    <div class="ai-avatar me-2">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-bubble bg-light p-2 rounded">
                        ${message}
                    </div>
                </div>
            </div>
        `;
        aiChat.insertAdjacentHTML('beforeend', messageHtml);
        scrollToBottom();
    }
    
    // 显示AI正在输入的状态
    function showAITyping() {
        console.log('显示AI正在输入状态');
        const typingHtml = `
            <div class="ai-message mb-3 ai-typing">
                <div class="d-flex">
                    <div class="ai-avatar me-2">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-bubble bg-light p-2 rounded">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        aiChat.insertAdjacentHTML('beforeend', typingHtml);
        scrollToBottom();
    }
    
    // 将聊天窗口滚动到底部
    function scrollToBottom() {
        aiChat.scrollTop = aiChat.scrollHeight;
    }
    
    // 处理AI请求 (替换为实际的API调用)
    function processAIRequest(message) {
        console.log('处理AI请求:', message);
        // 模拟API调用延迟
        setTimeout(() => {
            // 这里替换为实际的AI接口调用
            // 示例响应
            let response;
            if (message.includes('你好') || message.includes('您好') || message.includes('hi') || message.includes('hello')) {
                response = '您好！我是您的智能助手，有什么可以帮助您的吗？';
            } else if (message.includes('天气')) {
                response = '今天天气晴朗，温度25°C，适合户外活动。';
            } else if (message.includes('时间') || message.includes('几点')) {
                const now = new Date();
                response = `现在的时间是 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            } else if (message.includes('用药') || message.includes('药物') || message.includes('吃药')) {
                response = '根据您的用药计划，今天需要在早上8点和晚上8点各服用一次降压药。您可以在"健康管理"中查看详细的用药提醒。';
            } else if (message.includes('健康') || message.includes('身体')) {
                response = '您的最近健康数据显示一切正常。血压、心率都在理想范围内。建议您保持每天的散步习惯。';
            } else {
                response = '感谢您的提问。我会尽快为您提供帮助。您可以询问我关于天气、时间、用药提醒、健康数据等问题。';
            }
            
            addAIMessage(response);
        }, 1500);
    }
    
    // 为老人端增加语音交互功能
    if (document.body.classList.contains('elderly-view')) {
        enableVoiceInteraction();
    }
    
    // 语音交互功能
    function enableVoiceInteraction() {
        // 添加语音按钮
        const voiceButton = document.createElement('button');
        voiceButton.className = 'btn btn-outline-secondary ms-2';
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.title = '语音输入';
        
        // 添加到输入框旁边
        const inputGroup = aiInput.parentElement;
        inputGroup.insertBefore(voiceButton, aiSendBtn);
        
        // 语音识别功能
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-CN';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            voiceButton.addEventListener('click', () => {
                recognition.start();
                voiceButton.innerHTML = '<i class="fas fa-microphone-alt text-danger"></i>';
                voiceButton.classList.add('active');
                
                // 添加提示
                addAIMessage('我在听，请说出您的问题...');
            });
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                aiInput.value = transcript;
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceButton.classList.remove('active');
                
                // 自动发送识别到的内容
                setTimeout(() => sendMessage(), 500);
            };
            
            recognition.onend = () => {
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceButton.classList.remove('active');
            };
            
            recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceButton.classList.remove('active');
                addAIMessage('抱歉，我没有听清楚，请再试一次。');
            };
        } else {
            voiceButton.addEventListener('click', () => {
                addAIMessage('抱歉，您的浏览器不支持语音识别功能。');
            });
        }
        
        // 添加语音合成功能
        if ('speechSynthesis' in window) {
            // 当AI回复时，自动朗读内容
            const originalAddAIMessage = addAIMessage;
            addAIMessage = function(message) {
                originalAddAIMessage(message);
                
                // 提取纯文本内容
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = message;
                const textContent = tempDiv.textContent || tempDiv.innerText;
                
                // 语音朗读
                const utterance = new SpeechSynthesisUtterance(textContent);
                utterance.lang = 'zh-CN';
                speechSynthesis.speak(utterance);
            };
        }
    }
    
    console.log('AI助手初始化完成');
}

// 也可以直接在文档加载后立即设置点击事件
document.addEventListener('DOMContentLoaded', function() {
    // 直接为按钮绑定点击事件处理程序
    const aiBtn = document.getElementById('aiAssistantBtn');
    if (aiBtn) {
        console.log('直接绑定AI助手按钮点击事件');
        aiBtn.onclick = function() {
            console.log('按钮被点击 (直接绑定)');
            $('#aiAssistantModal').modal('show');
        };
    }
});

// 表单验证
function validateForm(formId) {
    var form = document.getElementById(formId);
    if (form) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    }
    return form.checkValidity();
}

// 显示消息提示
function showMessage(type, message) {
    var alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    var messagesContainer = document.querySelector('.messages');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        document.body.appendChild(messagesContainer);
    }
    
    messagesContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    setTimeout(function() {
        var alerts = messagesContainer.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
}

// AJAX 请求处理
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        showMessage('danger', '请求失败，请稍后重试');
        throw error;
    }
}

// 获取Cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 格式化日期时间
function formatDateTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// 生成设备状态标签
function generateStatusBadge(status) {
    return `<span class="status-badge ${status ? 'status-online' : 'status-offline'}">
        ${status ? '在线' : '离线'}
    </span>`;
}

// 处理表单提交
document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.hasAttribute('data-ajax')) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const method = form.method.toUpperCase();
        const url = form.action;
        
        fetchData(url, {
            method: method,
            body: method !== 'GET' ? formData : undefined
        })
        .then(response => {
            if (response.success) {
                showMessage('success', response.message || '操作成功');
                if (response.redirect) {
                    window.location.href = response.redirect;
                }
            } else {
                showMessage('danger', response.message || '操作失败');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('danger', '请求失败，请稍后重试');
        });
    }
});
