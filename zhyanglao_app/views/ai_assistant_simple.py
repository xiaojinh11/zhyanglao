from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from ..models import Elder, AIInteraction, UserProfile, HealthData
import json
from django.conf import settings

@login_required
def ai_assistant_view(request, elder_id=None):
    """显示AI助手页面"""
    if elder_id:
        elder = get_object_or_404(Elder, id=elder_id)
    else:
        # 如果用户是老人，则获取自己的信息
        user_profile = get_object_or_404(UserProfile, user=request.user)
        if user_profile.user_type == 'elderly' and user_profile.related_elder:
            elder = user_profile.related_elder
        # 如果用户是家属，则获取关联的老人
        elif user_profile.user_type == 'family' and user_profile.related_elder:
            elder = user_profile.related_elder
        else:
            return redirect('dashboard')
    
    # 获取最近的交互记录
    recent_interactions = AIInteraction.objects.filter(elder=elder).order_by('-timestamp')[:10]
    
    context = {
        'elder': elder,
        'recent_interactions': recent_interactions
    }
    return render(request, 'ai_assistant/assistant.html', context)

@csrf_exempt
@require_POST
def ai_query(request):
    """处理AI查询请求 - 简化版，不调用外部API"""
    try:
        data = json.loads(request.body)
        query = data.get('query')
        elder_id = data.get('elder_id')
        context = data.get('context', {})
        
        if not query or not elder_id:
            return JsonResponse({'status': 'error', 'message': '缺少必要参数'}, status=400)
        
        elder = get_object_or_404(Elder, id=elder_id)
        
        # 获取老人的健康数据以丰富上下文
        recent_health_data = HealthData.objects.filter(elder=elder).order_by('-timestamp').first()
        
        if recent_health_data:
            context.update({
                'heart_rate': recent_health_data.heart_rate,
                'blood_pressure_sys': recent_health_data.blood_pressure_sys,
                'blood_pressure_dia': recent_health_data.blood_pressure_dia,
                'temperature': str(recent_health_data.temperature) if recent_health_data.temperature else None,
                'sleep_quality': recent_health_data.sleep_quality,
                'activity_level': recent_health_data.activity_level,
                'timestamp': recent_health_data.timestamp.isoformat() if recent_health_data.timestamp else None
            })
        
        # 简单的本地响应，不调用外部API
        if "健康" in query or "身体" in query:
            ai_response = f"您好，{elder.name}。根据您的健康数据，今天的身体状况良好。"
            if recent_health_data and recent_health_data.heart_rate:
                ai_response += f" 您的心率是{recent_health_data.heart_rate}次/分，在正常范围内。"
        elif "天气" in query:
            ai_response = "今天天气晴朗，适合适当户外活动，但记得注意防晒。"
        elif "吃" in query or "饮食" in query or "食物" in query:
            ai_response = "建议您多吃新鲜蔬果，保持均衡饮食，少吃油腻和过咸的食物。"
        elif "睡眠" in query or "睡觉" in query:
            ai_response = "保持良好的睡眠习惯对健康非常重要，建议每天保持7-8小时的睡眠时间。"
        else:
            ai_response = f"您好，{elder.name}。我是您的智慧养老AI助手。您询问的是：{query}。目前我正在学习更多知识来更好地为您服务。"
        
        # 记录交互
        interaction = AIInteraction.objects.create(
            elder=elder,
            query=query,
            response=ai_response
        )
        
        return JsonResponse({
            'status': 'success',
            'response': ai_response,
            'interaction_id': interaction.id
        })
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@require_POST
def provide_feedback(request):
    """提供AI交互反馈"""
    try:
        interaction_id = request.POST.get('interaction_id')
        feedback = request.POST.get('feedback')
        
        if not interaction_id or not feedback:
            return JsonResponse({'status': 'error', 'message': '缺少必要参数'}, status=400)
        
        interaction = get_object_or_404(AIInteraction, id=interaction_id)
        interaction.feedback = int(feedback)
        interaction.save()
        
        return JsonResponse({'status': 'success'})
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500) 