// 紧急求助功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('紧急求助JS已加载');
    // 初始化紧急求助功能
    initEmergencyHelp();
});

// 初始化紧急求助功能
function initEmergencyHelp() {
    console.log('初始化紧急求助功能');
    // DOM元素
    const emergencyHelpBtn = document.getElementById('emergencyHelp');
    const confirmEmergencyBtn = document.getElementById('confirmEmergencyBtn');
    const emergencyDescription = document.getElementById('emergencyDescription');
    const emergencyModal = document.getElementById('emergencyConfirmModal');
    
    console.log('紧急求助按钮:', emergencyHelpBtn);
    console.log('确认按钮:', confirmEmergencyBtn);
    console.log('模态框:', emergencyModal);
    
    // 获取老人ID
    const elderId = document.querySelector('meta[name="elder-id"]')?.content;
    
    // 如果找不到紧急求助按钮，则退出
    if (!emergencyHelpBtn) {
        console.error('找不到紧急求助按钮');
        return;
    }
    
    console.log('紧急求助按钮已找到');
    
    // 创建Bootstrap模态框实例
    let emergencyModal;
    try {
        const modalElement = document.getElementById('emergencyConfirmModal');
        console.log('模态框元素:', modalElement);
        
        // 确保模态框在DOM中
        if (!modalElement) {
            console.error('找不到模态框元素');
            return;
        }
        
        // 使用静态配置初始化模态框
        emergencyModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false,
            focus: true
        });
        
        console.log('模态框实例已创建:', emergencyModal);
    } catch (e) {
        console.error('无法初始化紧急求助模态框', e);
        console.error(e.stack);
        return;
    }
    
    // 点击紧急求助按钮
    emergencyHelpBtn.addEventListener('click', function() {
        // 添加按钮激活状态
        emergencyHelpBtn.classList.add('active');
        
        // 振动反馈（如果设备支持）
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
        
        // 确保模态框背景和模态框本身都在最顶层
        document.querySelector('.modal-backdrop')?.classList.add('emergency-backdrop');
        
        // 显示确认模态框
        try {
            // 如果模态框已经存在，先销毁再重新创建
            if (typeof bootstrap !== 'undefined') {
                const modalElement = document.getElementById('emergencyConfirmModal');
                if (modalElement) {
                    const existingModal = bootstrap.Modal.getInstance(modalElement);
                    if (existingModal) existingModal.dispose();
                    emergencyModal = new bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    emergencyModal.show();
                }
            } else {
                console.error('Bootstrap未加载');
            }
        } catch (e) {
            console.error('显示模态框时出错', e);
        }
        
        // 300ms后移除按钮激活状态
        setTimeout(() => {
            emergencyHelpBtn.classList.remove('active');
        }, 300);
    });
    
    // 确认发送紧急求助
    if (confirmEmergencyBtn) {
        confirmEmergencyBtn.addEventListener('click', function() {
            // 禁用按钮，防止重复点击
            confirmEmergencyBtn.disabled = true;
            confirmEmergencyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...';
            
            // 发送紧急求助请求
            fetch('/api/trigger_emergency/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    elder_id: elderId,
                    alert_type: '紧急求助',
                    description: emergencyDescription.value || '老人触发紧急求助'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // 关闭模态框
                    emergencyModal.hide();
                    
                    // 显示成功提示
                    showAlert('紧急求助已发送，请等待工作人员联系', 'success');
                    
                    // 振动反馈（如果设备支持）
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]);
                    }
                } else {
                    showAlert('发送失败：' + data.message, 'danger');
                }
            })
            .catch(error => {
                showAlert('发送失败，请重试', 'danger');
                console.error('Error:', error);
            })
            .finally(() => {
                // 恢复按钮状态
                confirmEmergencyBtn.disabled = false;
                confirmEmergencyBtn.innerHTML = '确认发送';
            });
        });
    }
}

// 获取CSRF Token
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

// 显示提示信息
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到页面
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // 5秒后自动关闭
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
} 