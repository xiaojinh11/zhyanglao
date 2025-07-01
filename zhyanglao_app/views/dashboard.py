from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from ..models import Elder, Device, HealthData, Alert, UserProfile, ElderAssociationRequest
from django.db import models

@login_required
def dashboard_view(request):
    """仪表盘视图 - 根据用户类型进行重定向"""
    user = request.user
    user_type = user.userprofile.user_type
    
    # 根据用户类型重定向到对应仪表盘
    if user_type == 'admin':
        return redirect('admin_dashboard')
    elif user_type == 'elderly':  # 只有老人类型才去老人端页面
        return redirect('elderly_dashboard')
    else:  # 所有其他类型都走family_dashboard
        return redirect('family_dashboard')

@login_required
def original_dashboard_view(request):
    """原始仪表盘视图"""
    user = request.user
    context = {
        'user_type': user.userprofile.user_type,
    }
    
    # 根据用户类型显示不同的数据
    if user.userprofile.user_type == 'family':
        # 家属查看关联老人的信息
        elder = user.userprofile.related_elder
        if elder:
            context.update({
                'elder': elder,
                'recent_health_data': HealthData.objects.filter(elder=elder).order_by('-timestamp')[:5],
                'recent_alerts': Alert.objects.filter(elder=elder).order_by('-timestamp')[:5],
                'devices': Device.objects.filter(elder=elder),
            })
    
    elif user.userprofile.user_type == 'caregiver':
        # 护工查看所有关联老人的信息
        elders = Elder.objects.all()  # 这里可以根据实际需求筛选
        context.update({
            'elders': elders,
            'total_alerts': Alert.objects.filter(processed=False).count(),
        })
    
    elif user.userprofile.user_type in ['doctor', 'admin']:
        # 医生和管理员可以查看所有信息
        context.update({
            'total_elders': Elder.objects.count(),
            'total_devices': Device.objects.count(),
            'total_alerts': Alert.objects.filter(processed=False).count(),
            'recent_alerts': Alert.objects.order_by('-timestamp')[:10],
        })
    
    return render(request, 'dashboard.html', context)

@login_required
def elderly_dashboard(request):
    """老人端仪表盘视图"""
    user = request.user
    elder = None
    
    # 尝试获取老人信息，可能是关联的老人或用户本身就是老人类型
    if user.userprofile.related_elder:
        elder = user.userprofile.related_elder
    elif user.userprofile.user_type == 'elderly':
        # 尝试查找以此用户关联的老人记录
        try:
            elder = Elder.objects.get(name=user.username)
        except Elder.DoesNotExist:
            # 对于elderly类型用户，如果没有找到关联的Elder记录，则自动创建一个
            elder = Elder.objects.create(
                name=user.username,
                age=60,  # 默认年龄
                gender='M',  # 默认性别
                address='待完善',
                phone=user.userprofile.phone,
                emergency_contact='待完善',
                emergency_phone='待完善'
            )
            # 关联新创建的Elder记录到用户
            user.userprofile.related_elder = elder
            user.userprofile.save()
    
    # 即使没有elder记录，也不重定向，而是显示空的elderly_dashboard
    # 获取最新的健康数据
    health_data = HealthData.objects.filter(elder=elder).order_by('-timestamp').first() if elder else None
    
    # 获取该老人的所有设备
    devices = Device.objects.filter(elder=elder) if elder else []
    
    context = {
        'elder': elder,
        'health_data': health_data,
        'devices': devices,
    }
    
    return render(request, 'elderly_dashboard.html', context)

@login_required
def family_dashboard(request):
    """家属/护工/医生端仪表盘视图"""
    user = request.user
    
    # 验证用户是否为允许的身份
    if user.userprofile.user_type not in ['family', 'caregiver', 'doctor']:
        return redirect('dashboard')
    
    # 获取关联的老人信息
    elder = user.userprofile.related_elder
    
    # 如果是护工或医生，可以显示所有老人或按照某种规则筛选
    if user.userprofile.user_type in ['caregiver', 'doctor'] and not elder:
        # 暂时简单处理，使用第一个老人的数据
        elder = Elder.objects.first()
    
    # 默认context
    context = {
        'elder': elder,
        'user_type': user.userprofile.user_type,
    }
    
    # 如果有关联老人（或选择的老人）
    if elder:
        # 获取该老人的健康数据
        recent_health_data = HealthData.objects.filter(elder=elder).order_by('-timestamp')[:10]
        
        # 获取所有设备
        devices = Device.objects.filter(elder=elder)
        
        # 获取最近的告警信息
        recent_alerts = Alert.objects.filter(elder=elder).order_by('-timestamp')[:5]
        
        context.update({
            'health_data': recent_health_data.first() if recent_health_data else None,
            'health_data_history': recent_health_data,
            'devices': devices,
            'recent_alerts': recent_alerts,
        })
    elif user.userprofile.user_type == 'family':
        # 如果是家属但无关联老人，获取关联请求状态
        elder_requests = ElderAssociationRequest.objects.filter(requester=user).order_by('-created_at')
        context.update({
            'no_elder_data': True,
            'elder_requests': elder_requests
        })
    
    # 始终使用family_elder_dashboard.html模板
    return render(request, 'family_elder_dashboard.html', context)

@login_required
def admin_dashboard(request):
    """管理员仪表盘视图"""
    user = request.user
    
    # 验证用户是否为管理员
    if user.userprofile.user_type != 'admin':
        return redirect('dashboard')
    
    # 获取统计数据
    all_users = User.objects.all()
    all_elders = Elder.objects.all()
    all_devices = Device.objects.all()
    
    # 7天内新增用户数
    one_week_ago = timezone.now() - timedelta(days=7)
    new_users_count = User.objects.filter(date_joined__gte=one_week_ago).count()
    
    # 7天内新增老人数
    new_elders_count = Elder.objects.filter(created_at__gte=one_week_ago).count()
    
    # 在线设备数
    online_devices_count = Device.objects.filter(status=True).count()
    
    # 今日告警数
    today = timezone.now().date()
    today_alerts = Alert.objects.filter(timestamp__date=today)
    today_alerts_count = today_alerts.count()
    
    # 未处理告警数
    unprocessed_alerts_count = Alert.objects.filter(processed=False).count()
    
    # 获取用户资料列表
    user_profiles = UserProfile.objects.select_related('user').all()
    
    # 获取最近告警
    all_alerts = Alert.objects.select_related('elder', 'device').order_by('-timestamp')[:10]
    
    # 获取最近设备
    recent_devices = Device.objects.select_related('elder').order_by('-last_active')[:5]
    
    # 获取未读的关联申请
    unread_requests = ElderAssociationRequest.objects.filter(is_read=False, status='pending').count()
    all_association_requests = ElderAssociationRequest.objects.all().order_by('-created_at')[:10]
    
    context = {
        'all_users': all_users,
        'all_elders': all_elders,
        'all_devices': all_devices,
        'new_users_count': new_users_count,
        'new_elders_count': new_elders_count,
        'online_devices_count': online_devices_count,
        'today_alerts_count': today_alerts_count,
        'unprocessed_alerts_count': unprocessed_alerts_count,
        'user_profiles': user_profiles,
        'all_alerts': all_alerts,
        'recent_devices': recent_devices,
        'unread_requests': unread_requests,
        'all_association_requests': all_association_requests,
    }
    
    return render(request, 'admin_dashboard.html', context)

@login_required
@require_POST
def submit_elder_association_request(request):
    """提交关联老人申请"""
    user = request.user
    
    # 检查该用户是否已经提交了待处理的申请
    existing_request = ElderAssociationRequest.objects.filter(
        requester=user, 
        status='pending'
    ).exists()
    
    if existing_request:
        messages.warning(request, "您已有一个待处理的申请，请等待管理员审核。")
        return redirect('family_dashboard')
    
    # 获取表单数据
    elder_name = request.POST.get('elderName')
    elder_phone = request.POST.get('elderPhone')
    elder_address = request.POST.get('elderAddress')
    relationship = request.POST.get('relationship')
    request_reason = request.POST.get('requestReason')
    
    # 验证数据
    if not all([elder_name, elder_phone, elder_address, relationship, request_reason]):
        messages.error(request, "请填写所有必填字段。")
        return redirect('family_dashboard')
    
    # 创建关联申请
    ElderAssociationRequest.objects.create(
        requester=user,
        elder_name=elder_name,
        elder_phone=elder_phone,
        elder_address=elder_address,
        relationship=relationship,
        request_reason=request_reason
    )
    
    messages.success(request, "申请已提交，等待管理员审核。")
    return redirect('family_dashboard')

@login_required
@require_POST
def process_elder_association_request(request, request_id):
    """处理老人关联申请"""
    if request.user.userprofile.user_type != 'admin':
        return JsonResponse({'status': 'error', 'message': '无权限执行此操作'}, status=403)
    
    action = request.POST.get('action')
    remarks = request.POST.get('remarks', '')
    
    try:
        association_request = ElderAssociationRequest.objects.get(id=request_id)
        
        # 标记为已读
        association_request.is_read = True
        
        if action == 'approve':
            # 查找是否已存在该老人记录
            elder = None
            try:
                # 尝试通过姓名和电话查找
                elder = Elder.objects.get(name=association_request.elder_name, phone=association_request.elder_phone)
            except Elder.DoesNotExist:
                # 创建新老人记录
                elder = Elder.objects.create(
                    name=association_request.elder_name,
                    age=60,  # 默认年龄，可以后续更新
                    gender='M',  # 默认性别，可以后续更新
                    address=association_request.elder_address,
                    phone=association_request.elder_phone,
                    emergency_contact=association_request.requester.username,
                    emergency_phone=association_request.requester.userprofile.phone
                )
            
            # 更新申请状态
            association_request.status = 'approved'
            association_request.elder = elder
            
            # 更新用户关联
            requester_profile = association_request.requester.userprofile
            requester_profile.related_elder = elder
            requester_profile.save()
            
            # 添加成功消息，通知用户查看新的家属看护页面
            messages.success(
                request, 
                f"已批准 {association_request.requester.username} 关联老人 {elder.name} 的申请。用户下次登录将看到完整的老人看护页面。"
            )
            
        elif action == 'reject':
            association_request.status = 'rejected'
        else:
            return JsonResponse({'status': 'error', 'message': '无效的操作'}, status=400)
        
        # 保存处理结果
        association_request.processed_by = request.user
        association_request.processed_at = timezone.now()
        association_request.remarks = remarks
        association_request.save()
        
        return JsonResponse({
            'status': 'success', 
            'message': '申请已' + ('批准' if action == 'approve' else '拒绝')
        })
        
    except ElderAssociationRequest.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': '找不到该申请'}, status=404)

def elder_dashboard(request):
    """老人用户的仪表盘页面"""
    if not request.user.is_authenticated:
        return redirect('login')

    try:
        # 先获取当前用户的UserProfile
        user_profile = UserProfile.objects.get(user=request.user, user_type='elderly')
        
        # 从UserProfile获取关联的老人
        elder = user_profile.related_elder
        
        if not elder:
            return render(request, 'error.html', {'message': '您的账号未关联老人信息'})
        
        # 获取与老人关联的家庭成员（用户类型为family的用户）
        family_members = UserProfile.objects.filter(
            user_type='family',
            related_elder=elder
        ).values('user_id', 'user__username', 'phone')
        
        # 转为JSON安全的列表
        family_members_list = list(family_members)
        
        return render(request, 'elderly_dashboard.html', {
            'elder': elder,
            'family_members': family_members_list,
        })
    except UserProfile.DoesNotExist:
        # 如果登录的用户不是老人用户，重定向到适当的页面
        return redirect('home')  # 或其他适当的页面
