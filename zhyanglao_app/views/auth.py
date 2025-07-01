from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.db import transaction
from ..models import UserProfile
from zhyanglao_app.models import UserProfile
from django.db import transaction

def login_view(request):
    """用户登录视图"""
    # 如果用户已经登录，直接跳转到首页
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            # 更新登录IP
            if hasattr(user, 'userprofile'):
                user.userprofile.last_login_ip = request.META.get('REMOTE_ADDR')
                user.userprofile.save()
            # 获取next参数，如果没有则跳转到首页
            next_url = request.GET.get('next', 'dashboard')
            return redirect(next_url)
        else:
            messages.error(request, '用户名或密码错误')
    
    return render(request, 'auth/login.html')

@transaction.atomic
def register_view(request):
    """用户注册视图"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        user_type = request.POST.get('user_type')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, '用户名已存在')
            return render(request, 'auth/register.html')
        
        # 创建用户和用户信息
        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(
            user=user,
            user_type=user_type,
            phone=phone
        )
        
        messages.success(request, '注册成功，请登录')
        return redirect('login')
    
    return render(request, 'auth/register.html', {
        'user_types': UserProfile.USER_TYPES
    })

@login_required
def profile_view(request):
    """用户个人信息视图"""
    if request.method == 'POST':
        user = request.user
        profile = user.userprofile
        
        # 更新个人信息
        user.email = request.POST.get('email', user.email)
        profile.phone = request.POST.get('phone', profile.phone)
        profile.department = request.POST.get('department', profile.department)
        
        if request.FILES.get('avatar'):
            profile.avatar = request.FILES['avatar']
        
        user.save()
        profile.save()
        messages.success(request, '个人信息更新成功')
        
    return render(request, 'auth/profile.html')

@login_required
def logout_view(request):
    """用户登出视图"""
    logout(request)
    return redirect('login')
