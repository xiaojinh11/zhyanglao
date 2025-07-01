from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db import models
from django.http import JsonResponse
from .models import Elder, FamilyMember

def elder_dashboard(request):
    """老人用户的仪表盘页面"""
    if not request.user.is_authenticated:
        return redirect('login')

    try:
        elder = Elder.objects.get(user=request.user)
        
        # 获取与老人关联的家庭成员
        family_members = FamilyMember.objects.filter(
            elder_associations__elder=elder,
            elder_associations__is_active=True
        ).values('id', 'user__username', 'name')
        
        # 转为JSON安全的列表
        family_members_list = list(family_members)
        
        return render(request, 'elderly_dashboard.html', {
            'elder': elder,
            'family_members': family_members_list,
        })
    except Elder.DoesNotExist:
        # 如果登录的用户不是老人用户，重定向到适当的页面
        return redirect('home')  # 或其他适当的页面
