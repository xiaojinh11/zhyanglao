from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Elder, Device, HealthData, Alert, AIInteraction, DailyReport, ElderAssociationRequest

# 扩展User Admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name = '用户信息'
    verbose_name_plural = '用户信息'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_user_type')
    
    def get_user_type(self, obj):
        try:
            return obj.userprofile.get_user_type_display()
        except UserProfile.DoesNotExist:
            return '-'
    get_user_type.short_description = '用户类型'

# 卸载默认的User admin
admin.site.unregister(User)
# 注册我们的User admin
admin.site.register(User, CustomUserAdmin)

@admin.register(Elder)
class ElderAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'gender', 'phone', 'emergency_contact', 'created_at')
    search_fields = ('name', 'phone', 'address')
    list_filter = ('gender', 'created_at')

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'device_type', 'elder', 'location', 'status', 'last_active')
    list_filter = ('device_type', 'status')
    search_fields = ('name', 'device_id', 'location')

@admin.register(HealthData)
class HealthDataAdmin(admin.ModelAdmin):
    list_display = ('elder', 'timestamp', 'heart_rate', 'blood_pressure_sys', 'blood_pressure_dia', 'temperature')
    list_filter = ('timestamp',)
    search_fields = ('elder__name',)

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('elder', 'alert_type', 'alert_level', 'processed', 'timestamp')
    list_filter = ('alert_level', 'processed', 'timestamp')
    search_fields = ('elder__name', 'description')

@admin.register(ElderAssociationRequest)
class ElderAssociationRequestAdmin(admin.ModelAdmin):
    list_display = ('requester', 'elder_name', 'relationship', 'status', 'created_at', 'is_read')
    list_filter = ('status', 'relationship', 'is_read', 'created_at')
    search_fields = ('requester__username', 'elder_name', 'elder_phone')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('申请信息', {
            'fields': ('requester', 'elder_name', 'elder_phone', 'elder_address', 'relationship', 'request_reason')
        }),
        ('处理信息', {
            'fields': ('status', 'processed_by', 'processed_at', 'elder', 'remarks', 'is_read')
        }),
        ('时间信息', {
            'fields': ('created_at',)
        }),
    )

# 注册其他模型
admin.site.register(AIInteraction)
admin.site.register(DailyReport)
