from django.urls import path
from .views import dashboard, auth, device, monitoring
# 使用views导入，因为ai_assistant_simple是通过__init__.py导入的
from . import views

urlpatterns = [
    # 认证相关
    path('login/', auth.login_view, name='login'),
    path('register/', auth.register_view, name='register'),
    path('logout/', auth.logout_view, name='logout'),
    path('profile/', auth.profile_view, name='profile'),
    
    # 仪表盘
    path('', dashboard.dashboard_view, name='dashboard'),
    path('admin_dashboard/', dashboard.admin_dashboard, name='admin_dashboard'),
    path('elderly/dashboard/', dashboard.elder_dashboard, name='elderly_dashboard'),
    path('family_dashboard/', dashboard.family_dashboard, name='family_dashboard'),
    path('family/', dashboard.family_dashboard, name='family'),
    
    # 设备相关
    path('devices/', device.device_list, name='device_list'),
    path('devices/<str:device_id>/', device.device_detail, name='device_detail'),
    path('devices/<str:device_id>/status/', device.device_status, name='device_status'),
    path('devices/<str:device_id>/update/', device.update_device_status, name='update_device_status'),
    
    # 监控相关
    path('monitoring/', monitoring.monitoring_dashboard, name='monitoring_dashboard'),
    path('monitoring/elder/<int:elder_id>/', monitoring.elder_monitoring, name='elder_monitoring'),
    path('monitoring/elder/<int:elder_id>/data/', monitoring.get_real_time_data, name='get_real_time_data'),
    path('monitoring/alerts/', monitoring.alert_list, name='alert_list'),
    
    # 告警API
    path('api/check_new_alerts/', monitoring.check_new_alerts, name='check_new_alerts'),
    path('api/process_alert/', monitoring.process_alert, name='process_alert'),
    path('api/trigger_emergency/', monitoring.trigger_emergency, name='trigger_emergency'),
    
    # 健康数据API
    path('get_elder_health_data/<int:elder_id>/', monitoring.get_elder_health_data, name='get_elder_health_data'),
    path('get_elder_latest_health_data/<int:elder_id>/', monitoring.get_elder_latest_health_data, name='get_elder_latest_health_data'),
    path('export_health_data/excel/<int:elder_id>/', monitoring.export_health_data_excel, name='export_health_data_excel'),
    path('export_health_data/word/<int:elder_id>/', monitoring.export_health_data_word, name='export_health_data_word'),
    
    # 老人关联申请
    path('elder_association_request/submit/', dashboard.submit_elder_association_request, name='submit_elder_association_request'),
    path('elder_association_request/process/<int:request_id>/', dashboard.process_elder_association_request, name='process_elder_association_request'),
    
    # AI助手相关 - 使用简化版的视图
    path('ai_assistant/query/', views.ai_query, name='ai_query'),
    path('ai_assistant/feedback/', views.provide_feedback, name='provide_feedback'),
    path('ai_assistant/<int:elder_id>/', views.ai_assistant_view, name='ai_assistant_with_elder'),
    path('ai_assistant/', views.ai_assistant_view, name='ai_assistant'),
]
