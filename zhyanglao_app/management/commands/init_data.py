from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from zhyanglao_app.models import UserProfile, Elder, Device

class Command(BaseCommand):
    help = '创建初始用户组和权限'

    def handle(self, *args, **kwargs):
        # 创建用户组
        admin_group, _ = Group.objects.get_or_create(name='管理员')
        doctor_group, _ = Group.objects.get_or_create(name='医生')
        caregiver_group, _ = Group.objects.get_or_create(name='护工')
        family_group, _ = Group.objects.get_or_create(name='家属')

        # 创建管理员用户
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        UserProfile.objects.create(
            user=admin_user,
            user_type='admin',
            phone='13800000000'
        )
        admin_user.groups.add(admin_group)

        # 创建示例医生用户
        doctor_user = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='doctor123'
        )
        UserProfile.objects.create(
            user=doctor_user,
            user_type='doctor',
            phone='13800000001',
            department='内科'
        )
        doctor_user.groups.add(doctor_group)

        # 创建示例护工用户
        caregiver_user = User.objects.create_user(
            username='caregiver',
            email='caregiver@example.com',
            password='caregiver123'
        )
        UserProfile.objects.create(
            user=caregiver_user,
            user_type='caregiver',
            phone='13800000002'
        )
        caregiver_user.groups.add(caregiver_group)

        self.stdout.write(self.style.SUCCESS('初始用户和用户组创建成功'))
