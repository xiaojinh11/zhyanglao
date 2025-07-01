from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from ..models import Device, HealthData, Alert
import json

@login_required
def device_list(request):
    """设备列表视图"""
    devices = Device.objects.all()
    return render(request, 'device/device_list.html', {'devices': devices})

@login_required
def device_detail(request, device_id):
    """设备详情视图"""
    device = get_object_or_404(Device, device_id=device_id)
    health_data = HealthData.objects.filter(elder=device.elder).order_by('-timestamp')[:10]
    alerts = Alert.objects.filter(device=device).order_by('-timestamp')[:5]
    
    context = {
        'device': device,
        'health_data': health_data,
        'alerts': alerts,
    }
    return render(request, 'device/device_detail.html', context)

@login_required
def device_status(request, device_id):
    """获取设备实时状态"""
    device = get_object_or_404(Device, device_id=device_id)
    health_data = HealthData.objects.filter(elder=device.elder).order_by('-timestamp').first()
    
    data = {
        'status': device.status,
        'last_active': device.last_active.isoformat() if device.last_active else None,
        'health_data': {
            'heart_rate': health_data.heart_rate if health_data else None,
            'blood_pressure_sys': health_data.blood_pressure_sys if health_data else None,
            'blood_pressure_dia': health_data.blood_pressure_dia if health_data else None,
            'temperature': str(health_data.temperature) if health_data and health_data.temperature else None,
        } if health_data else None
    }
    return JsonResponse(data)

@login_required
def update_device_status(request, device_id):
    """更新设备状态"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        device = get_object_or_404(Device, device_id=device_id)
        data = json.loads(request.body)
        device.status = data.get('status', device.status)
        device.last_active = timezone.now()
        device.save()
        
        # 如果有健康数据，同时更新健康数据
        if 'health_data' in data:
            health_data = data['health_data']
            HealthData.objects.create(
                elder=device.elder,
                heart_rate=health_data.get('heart_rate'),
                blood_pressure_sys=health_data.get('blood_pressure_sys'),
                blood_pressure_dia=health_data.get('blood_pressure_dia'),
                temperature=health_data.get('temperature'),
                sleep_quality=health_data.get('sleep_quality'),
                activity_level=health_data.get('activity_level')
            )
        
        return JsonResponse({'status': 'success'})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
