from django.db import models
from django.contrib.auth.models import AbstractUser, User
from django.utils import timezone

class UserProfile(models.Model):
    """用户扩展信息"""
    USER_TYPES = [
        ('family', '家属'),
        ('caregiver', '护工'),
        ('doctor', '医生'),
        ('admin', '管理员'),
        ('elderly', '老人'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    user_type = models.CharField('用户类型', max_length=20, choices=USER_TYPES)
    phone = models.CharField('手机号', max_length=15, unique=True)
    related_elder = models.ForeignKey('Elder', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联老人')
    department = models.CharField('部门/科室', max_length=50, blank=True)
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)
    last_login_ip = models.GenericIPAddressField('最后登录IP', null=True, blank=True)
    
    class Meta:
        verbose_name = '用户信息'
        verbose_name_plural = verbose_name
    
    def __str__(self):
        return f'{self.user.username} ({self.get_user_type_display()})'

class Elder(models.Model):
    """老人信息模型"""
    name = models.CharField('姓名', max_length=50)
    age = models.IntegerField('年龄')
    gender = models.CharField('性别', max_length=10, choices=[('M', '男'), ('F', '女')])
    address = models.TextField('居住地址')
    phone = models.CharField('联系电话', max_length=15)
    medical_history = models.TextField('病史', blank=True)
    emergency_contact = models.CharField('紧急联系人', max_length=50)
    emergency_phone = models.CharField('紧急联系电话', max_length=15)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '老人信息'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name

class ElderAssociationRequest(models.Model):
    """老人关联申请模型"""
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('approved', '已批准'),
        ('rejected', '已拒绝')
    ]
    RELATIONSHIP_CHOICES = [
        ('子女', '子女'),
        ('配偶', '配偶'),
        ('孙辈', '孙辈'),
        ('其他亲属', '其他亲属')
    ]
    
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='elder_requests', verbose_name='申请人')
    elder_name = models.CharField('老人姓名', max_length=50)
    elder_phone = models.CharField('老人联系电话', max_length=15)
    elder_address = models.TextField('老人居住地址')
    relationship = models.CharField('与老人关系', max_length=20, choices=RELATIONSHIP_CHOICES)
    request_reason = models.TextField('申请原因')
    created_at = models.DateTimeField('申请时间', auto_now_add=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_requests', verbose_name='处理人')
    processed_at = models.DateTimeField('处理时间', null=True, blank=True)
    elder = models.ForeignKey(Elder, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联老人')
    remarks = models.TextField('备注', blank=True)
    is_read = models.BooleanField('已读', default=False)
    
    class Meta:
        verbose_name = '老人关联申请'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.requester.username}申请关联{self.elder_name} - {self.get_status_display()}"

class Device(models.Model):
    """智能设备模型"""
    DEVICE_TYPES = [
        ('camera', '摄像头'),
        ('sensor', '传感器'),
        ('switch', '智能开关'),
        ('lock', '智能门锁'),
        ('other', '其他设备'),
    ]
    
    name = models.CharField('设备名称', max_length=100)
    device_type = models.CharField('设备类型', max_length=20, choices=DEVICE_TYPES)
    brand = models.CharField('品牌', max_length=50)
    model = models.CharField('型号', max_length=50)
    location = models.CharField('安装位置', max_length=100)
    elder = models.ForeignKey(Elder, on_delete=models.CASCADE, verbose_name='所属老人')
    device_id = models.CharField('设备ID', max_length=100, unique=True)
    status = models.BooleanField('设备状态', default=True)
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)
    last_active = models.DateTimeField('最后活跃时间', null=True, blank=True)
    
    class Meta:
        verbose_name = '智能设备'
        verbose_name_plural = verbose_name

class HealthData(models.Model):
    """健康数据模型"""
    elder = models.ForeignKey(Elder, on_delete=models.CASCADE, verbose_name='老人')
    timestamp = models.DateTimeField('记录时间', default=timezone.now)
    heart_rate = models.IntegerField('心率', null=True, blank=True)
    blood_pressure_sys = models.IntegerField('收缩压', null=True, blank=True)
    blood_pressure_dia = models.IntegerField('舒张压', null=True, blank=True)
    temperature = models.DecimalField('体温', max_digits=4, decimal_places=1, null=True, blank=True)
    sleep_quality = models.CharField('睡眠质量', max_length=20, null=True, blank=True)
    activity_level = models.CharField('活动量', max_length=20, null=True, blank=True)
    
    class Meta:
        verbose_name = '健康数据'
        verbose_name_plural = verbose_name

class Alert(models.Model):
    """告警记录模型"""
    ALERT_LEVELS = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '紧急'),
    ]
    
    elder = models.ForeignKey(Elder, on_delete=models.CASCADE, verbose_name='老人')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, verbose_name='触发设备')
    alert_type = models.CharField('告警类型', max_length=50)
    alert_level = models.CharField('告警级别', max_length=20, choices=ALERT_LEVELS)
    description = models.TextField('告警描述')
    timestamp = models.DateTimeField('告警时间', auto_now_add=True)
    processed = models.BooleanField('是否处理', default=False)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='处理人')
    processed_time = models.DateTimeField('处理时间', null=True, blank=True)
    
    class Meta:
        verbose_name = '告警记录'
        verbose_name_plural = verbose_name

class AIInteraction(models.Model):
    """AI交互记录模型"""
    elder = models.ForeignKey(Elder, on_delete=models.CASCADE, verbose_name='老人')
    timestamp = models.DateTimeField('交互时间', auto_now_add=True)
    query = models.TextField('用户问题')
    response = models.TextField('AI回答')
    feedback = models.IntegerField('满意度', choices=[(1, '不满意'), (2, '一般'), (3, '满意')], null=True, blank=True)
    
    class Meta:
        verbose_name = 'AI交互记录'
        verbose_name_plural = verbose_name

class DailyReport(models.Model):
    """每日报告模型"""
    elder = models.ForeignKey(Elder, on_delete=models.CASCADE, verbose_name='老人')
    date = models.DateField('报告日期')
    health_summary = models.TextField('健康概况')
    activity_summary = models.TextField('活动概况')
    alert_summary = models.TextField('异常情况汇总', blank=True)
    ai_suggestions = models.TextField('AI建议', blank=True)
    
    class Meta:
        verbose_name = '每日报告'
        verbose_name_plural = verbose_name
        unique_together = ['elder', 'date']
