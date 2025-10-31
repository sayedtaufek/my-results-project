from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
import os
import logging
import uuid
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import hashlib
import asyncio
from io import BytesIO
import jwt
from passlib.context import CryptContext
import secrets

# Security and Configuration
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security configurations
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# MongoDB connection with error handling
try:
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    logger.info("Database connection established successfully")
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    raise

# FastAPI app with enhanced security
app = FastAPI(
    title="نظام الاستعلام الذكي عن النتائج - الإصدار المتكامل",
    description="نظام متطور للاستعلام عن نتائج الطلاب مع لوحة تحكم أدمن وصفحة عامة محسّنة للSEO",
    version="3.0.0"
)

# زيادة حد رفع الملفات
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# تخصيص حد حجم الـ request body (100 MB)
from starlette.requests import Request
from starlette.responses import Response
import json

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Middleware لتحديد حجم الملفات المرفوعة"""
    # تحديد الحد الأقصى حسب المسار
    if "/admin/upload-excel" in str(request.url):
        max_size = 100 * 1024 * 1024  # 100 MB للملفات
    else:
        max_size = 10 * 1024 * 1024   # 10 MB للطلبات العادية
    
    if request.headers.get("content-length"):
        content_length = int(request.headers["content-length"])
        if content_length > max_size:
            return Response(
                content=json.dumps({"detail": f"حجم الطلب كبير جداً. الحد الأقصى {max_size // (1024*1024)} MB"}),
                status_code=413,
                media_type="application/json"
            )
    
    response = await call_next(request)
    return response

api_router = APIRouter(prefix="/api")

# Enhanced Pydantic Models with Educational Stages
class EducationalStage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200)  # اسم المرحلة
    name_en: str = Field(..., min_length=1, max_length=200)  # الاسم بالإنجليزية
    description: str = Field(default="", max_length=500)  # وصف المرحلة
    icon: str = Field(default="🎓", max_length=10)  # أيقونة المرحلة
    color: str = Field(default="#3b82f6", max_length=20)  # لون المرحلة
    regions: List[str] = Field(default_factory=list)  # المحافظات/المناطق
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0)  # ترتيب العرض
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(...)
    hashed_password: str
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class AdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(...)
    password: str = Field(..., min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class SiteContent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_title: str = Field(..., max_length=200)
    meta_description: str = Field(..., max_length=300)
    hero_title: str = Field(..., max_length=200)
    hero_subtitle: str = Field(..., max_length=500)
    about_section: str = Field(..., max_length=2000)
    features: List[Dict[str, str]] = Field(default_factory=list)
    footer_text: str = Field(..., max_length=500)
    contact_info: Dict[str, str] = Field(default_factory=dict)
    social_links: Dict[str, str] = Field(default_factory=dict)
    seo_keywords: str = Field(..., max_length=500)
    custom_css: Optional[str] = Field(default="")
    custom_js: Optional[str] = Field(default="")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentSubject(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    score: Union[float, int] = Field(..., ge=0, le=100)
    max_score: Union[float, int] = Field(default=100, ge=1, le=100)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)
    
    @validator('percentage', always=True)
    def calculate_percentage(cls, v, values):
        if 'score' in values and 'max_score' in values:
            return round((values['score'] / values['max_score']) * 100, 2)
        return v

class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    subjects: List[StudentSubject] = Field(default_factory=list)
    total_score: Optional[float] = Field(default=None, ge=0)
    average: Optional[float] = Field(default=None, ge=0, le=100)
    grade: Optional[str] = Field(default=None, max_length=10)
    class_name: Optional[str] = Field(default=None, max_length=100)
    section: Optional[str] = Field(default=None, max_length=50)
    
    # معلومات المرحلة والمنطقة
    educational_stage_id: Optional[str] = Field(default=None, min_length=1)  # معرف المرحلة التعليمية
    region: Optional[str] = Field(default=None, max_length=100)  # المحافظة/المنطقة
    school_name: Optional[str] = Field(default=None, max_length=200)  # اسم المدرسة
    administration: Optional[str] = Field(default=None, max_length=200)  # الإدارة التعليمية
    school_code: Optional[str] = Field(default=None, max_length=50)  # كود المدرسة
    
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('total_score', always=True)
    def calculate_total(cls, v, values):
        if 'subjects' in values and values['subjects']:
            return sum(subject.score for subject in values['subjects'])
        return v
    
    @validator('average', always=True)
    def calculate_average(cls, v, values):
        if 'subjects' in values and values['subjects']:
            return round(sum(subject.score for subject in values['subjects']) / len(values['subjects']), 2)
        return v
    
    @validator('grade', always=True)
    def calculate_grade(cls, v, values):
        if 'average' in values and values['average'] is not None:
            avg = values['average']
            if avg >= 90: return "ممتاز"
            elif avg >= 80: return "جيد جداً"
            elif avg >= 70: return "جيد"
            elif avg >= 60: return "مقبول"
            else: return "ضعيف"
        return v

class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site_name: str = Field(default="نظام الاستعلام الذكي عن النتائج", max_length=200)
    system_email: str = Field(default="admin@system.com")
    timezone: str = Field(default="Asia/Riyadh", max_length=50)
    language: str = Field(default="ar", max_length=10)
    maintenance_mode: bool = Field(default=False)
    allow_registration: bool = Field(default=False)
    max_file_size: int = Field(default=50, ge=1, le=500)  # MB - زيادة الحد الأقصى إلى 500 MB
    session_timeout: int = Field(default=1440, ge=30, le=10080)  # minutes
    
    # إعدادات الأمان
    password_min_length: int = Field(default=8, ge=6, le=50)
    require_special_chars: bool = Field(default=True)
    enable_two_factor: bool = Field(default=False)
    max_login_attempts: int = Field(default=5, ge=3, le=10)
    lockout_duration: int = Field(default=30, ge=5, le=1440)  # minutes
    force_password_change: bool = Field(default=False)
    
    # إعدادات النسخ الاحتياطي
    auto_backup: bool = Field(default=True)
    backup_frequency: str = Field(default="daily", pattern="^(daily|weekly|monthly)$")
    retention_days: int = Field(default=30, ge=7, le=365)
    last_backup: Optional[datetime] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=100)
    max_score: float = Field(..., ge=0, le=1000)
    passing_score: Optional[float] = Field(default=None, ge=0)
    weight: float = Field(default=1.0, ge=0, le=10)  # الوزن النسبي
    include_in_total: bool = Field(default=True)  # هل تدخل في المجموع
    is_core_subject: bool = Field(default=True)  # مادة أساسية أم لا
    subject_type: str = Field(default="regular", pattern="^(regular|optional|extra)$")
    display_order: int = Field(default=0)

class StageTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stage_id: str = Field(..., min_length=1)  # معرف المرحلة التعليمية
    name: str = Field(..., min_length=1, max_length=200)  # اسم القالب
    term: str = Field(..., pattern="^(first|second|final|annual)$")  # الترم
    subjects: List[SubjectTemplate] = Field(default_factory=list)
    total_max_score: Optional[float] = Field(default=None)
    total_passing_score: Optional[float] = Field(default=None)
    grading_system: str = Field(default="percentage", pattern="^(percentage|letter|points)$")
    grade_boundaries: Dict[str, float] = Field(default_factory=dict)  # حدود التقديرات
    is_default: bool = Field(default=False)
    created_by: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MappingTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200)  # اسم القالب
    stage_id: Optional[str] = Field(default=None)  # مرتبط بمرحلة معينة
    description: str = Field(default="", max_length=500)
    mapping: Dict[str, Any] = Field(default_factory=dict)  # تخصيص الأعمدة
    usage_count: int = Field(default=0)  # عدد مرات الاستخدام
    is_public: bool = Field(default=False)  # متاح للجميع أم خاص
    created_by: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = Field(default=None)

class DataValidationResult(BaseModel):
    is_valid: bool = Field(default=True)
    warnings: List[Dict[str, Any]] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    statistics: Dict[str, Any] = Field(default_factory=dict)
    suggestions: List[Dict[str, Any]] = Field(default_factory=list)

class StageTemplateCreate(BaseModel):
    stage_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=200)
    term: str = Field(..., pattern="^(first|second|final|annual)$")
    subjects: List[SubjectTemplate] = Field(default_factory=list)
    total_max_score: Optional[float] = Field(default=None)
    total_passing_score: Optional[float] = Field(default=None)
    grading_system: str = Field(default="percentage")
    grade_boundaries: Dict[str, float] = Field(default_factory=dict)

class MappingTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    stage_id: Optional[str] = Field(default=None)
    description: str = Field(default="", max_length=500)
    mapping: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = Field(default=False)

class PageTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = Field(..., pattern="^(stage|student|region)$")  # نوع الصفحة
    stage_id: Optional[str] = Field(default=None)  # للصفحات المرتبطة بمرحلة
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(default="", max_length=500)
    content: str = Field(..., min_length=1)  # محتوى HTML
    variables: Dict[str, str] = Field(default_factory=dict)  # المتغيرات المتاحة
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CertificateTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    html_content: str = Field(..., min_length=1)  # محتوى HTML للشهادة
    css_styles: str = Field(default="")  # CSS مخصص للشهادة
    variables: Dict[str, str] = Field(default_factory=dict)  # المتغيرات
    preview_image: Optional[str] = Field(default=None)  # صورة معاينة
    category: str = Field(default="general", max_length=50)  # تصنيف الشهادة
    is_active: bool = Field(default=True)
    usage_count: int = Field(default=0)  # عدد مرات الاستخدام
    created_by: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CertificateTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    html_content: str = Field(..., min_length=1)
    css_styles: str = Field(default="")
    variables: Dict[str, str] = Field(default_factory=dict)
    category: str = Field(default="general", max_length=50)

class SystemSettingsUpdate(BaseModel):
    site_name: Optional[str] = Field(None, max_length=200)
    system_email: Optional[str] = None
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    maintenance_mode: Optional[bool] = None
    allow_registration: Optional[bool] = None
    max_file_size: Optional[int] = Field(None, ge=1, le=500)
    session_timeout: Optional[int] = Field(None, ge=30, le=10080)
    
    # إعدادات الأمان
    password_min_length: Optional[int] = Field(None, ge=6, le=50)
    require_special_chars: Optional[bool] = None
    enable_two_factor: Optional[bool] = None
    max_login_attempts: Optional[int] = Field(None, ge=3, le=10)
    lockout_duration: Optional[int] = Field(None, ge=5, le=1440)
    force_password_change: Optional[bool] = None
    
    # إعدادات النسخ الاحتياطي
    auto_backup: Optional[bool] = None
    backup_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")
    retention_days: Optional[int] = Field(None, ge=7, le=365)

class ExcelAnalysis(BaseModel):
    filename: str
    columns: List[str]
    sample_data: List[Dict[str, Any]]
    suggested_mappings: Dict[str, str]
    total_rows: int
    file_hash: str

class ColumnMapping(BaseModel):
    student_id_column: str = Field(..., min_length=1)
    name_column: str = Field(..., min_length=1)
    subject_columns: List[str] = Field(..., min_items=1)
    total_column: Optional[str] = None
    class_column: Optional[str] = None
    section_column: Optional[str] = None
    school_column: Optional[str] = None
    administration_column: Optional[str] = None
    school_code_column: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    search_type: str = Field(default="all", pattern="^(student_id|name|all)$")
    class_filter: Optional[str] = None
    section_filter: Optional[str] = None
    educational_stage_id: Optional[str] = None  # فلترة حسب المرحلة التعليمية
    region_filter: Optional[str] = None  # فلترة حسب المحافظة
    administration_filter: Optional[str] = None  # فلترة حسب الإدارة التعليمية

class StageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    name_en: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    icon: str = Field(default="🎓", max_length=10)
    color: str = Field(default="#3b82f6", max_length=20)
    regions: List[str] = Field(default_factory=list)
    display_order: int = Field(default=0)

class GradeCalculatorSubject(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    score: float = Field(..., ge=0)
    max_score: float = Field(..., gt=0, le=1000)
    weight: float = Field(default=1.0, ge=0, le=10)

class GradeCalculatorRequest(BaseModel):
    subjects: List[GradeCalculatorSubject] = Field(..., min_items=1)

# ========== نماذج نظام الإشعارات ==========

class Subscriber(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')  # التحقق من صحة الإيميل
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    subscription_date: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    # تفضيلات الإشعارات
    notification_preferences: Dict[str, bool] = Field(default_factory=lambda: {
        "new_results": True,
        "system_updates": True,
        "educational_content": True,
        "emergency_notifications": True
    })
    
    # بيانات إضافية
    educational_stage: Optional[str] = Field(None)  # المرحلة التعليمية المهتم بها
    region: Optional[str] = Field(None)  # المحافظة
    
    # تتبع النشاط
    last_notification_sent: Optional[datetime] = Field(None)
    notification_count: int = Field(default=0)
    
    # حالة التفعيل
    verification_token: Optional[str] = Field(None)
    is_verified: bool = Field(default=False)
    unsubscribe_token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    summary: str = Field(default="", max_length=300)  # ملخص قصير
    
    # نوع الإشعار
    notification_type: str = Field(..., pattern="^(new_results|system_update|educational_content|emergency|custom)$")
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    
    # استهداف المشتركين
    target_audience: str = Field(default="all", pattern="^(all|stage|region|custom)$")
    target_stage: Optional[str] = Field(None)  # استهداف مرحلة معينة
    target_region: Optional[str] = Field(None)  # استهداف محافظة معينة
    target_subscribers: List[str] = Field(default_factory=list)  # استهداف مشتركين معينين
    
    # جدولة الإرسال
    send_immediately: bool = Field(default=True)
    scheduled_send_time: Optional[datetime] = Field(None)
    
    # حالة الإرسال
    status: str = Field(default="draft", pattern="^(draft|scheduled|sending|sent|failed)$")
    sent_at: Optional[datetime] = Field(None)
    sent_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    
    # إعدادات إضافية
    include_unsubscribe_link: bool = Field(default=True)
    email_template: str = Field(default="default")
    
    # معلومات المرسل
    created_by: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# نماذج الطلبات للإشعارات

class SubscriberCreate(BaseModel):
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    educational_stage: Optional[str] = Field(None)
    region: Optional[str] = Field(None)
    notification_preferences: Optional[Dict[str, bool]] = Field(None)

class SubscriberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    educational_stage: Optional[str] = Field(None)
    region: Optional[str] = Field(None)
    notification_preferences: Optional[Dict[str, bool]] = Field(None)
    is_active: Optional[bool] = Field(None)

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    summary: str = Field(default="", max_length=300)
    notification_type: str = Field(..., pattern="^(new_results|system_update|educational_content|emergency|custom)$")
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    target_audience: str = Field(default="all", pattern="^(all|stage|region|custom)$")
    target_stage: Optional[str] = Field(None)
    target_region: Optional[str] = Field(None)
    target_subscribers: List[str] = Field(default_factory=list)
    send_immediately: bool = Field(default=True)
    scheduled_send_time: Optional[datetime] = Field(None)
    email_template: str = Field(default="default")

class NotificationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    summary: Optional[str] = Field(None, max_length=300)
    notification_type: Optional[str] = Field(None, pattern="^(new_results|system_update|educational_content|emergency|custom)$")
    priority: Optional[str] = Field(None, pattern="^(low|normal|high|urgent)$")
    target_audience: Optional[str] = Field(None, pattern="^(all|stage|region|custom)$")
    target_stage: Optional[str] = Field(None)
    target_region: Optional[str] = Field(None)
    send_immediately: Optional[bool] = Field(None)
    scheduled_send_time: Optional[datetime] = Field(None)
    status: Optional[str] = Field(None, pattern="^(draft|scheduled|sending|sent|failed)$")

# ========== نماذج نظام البلوكات وتخصيص الصفحة الرئيسية ==========

class SiteSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # معلومات الموقع الأساسية
    site_name: str = Field(default="نظام الاستعلام الذكي عن النتائج", max_length=200)
    site_description: str = Field(default="نظام متطور للبحث والاستعلام عن النتائج التعليمية", max_length=500)
    site_keywords: str = Field(default="نتائج، امتحانات، تعليم، طلاب", max_length=300)
    
    # اللوجو والصور
    logo_url: Optional[str] = Field(None)  # رابط اللوجو
    logo_base64: Optional[str] = Field(None)  # اللوجو كـ base64
    favicon_url: Optional[str] = Field(None)
    hero_background: Optional[str] = Field(None)  # خلفية القسم الرئيسي
    
    # الألوان والتصميم
    primary_color: str = Field(default="#3B82F6")  # اللون الأساسي
    secondary_color: str = Field(default="#1E40AF")  # اللون الثانوي
    accent_color: str = Field(default="#F59E0B")  # لون التمييز
    text_color: str = Field(default="#1F2937")  # لون النص
    background_color: str = Field(default="#FFFFFF")  # لون الخلفية
    
    # الخطوط
    primary_font: str = Field(default="Cairo")  # الخط الأساسي
    secondary_font: str = Field(default="Tajawal")  # الخط الثانوي
    font_size: str = Field(default="medium")  # حجم الخط
    
    # معلومات الاتصال
    contact_email: Optional[str] = Field(None)
    contact_phone: Optional[str] = Field(None)
    contact_address: Optional[str] = Field(None)
    
    # روابط التواصل الاجتماعي
    facebook_url: Optional[str] = Field(None)
    twitter_url: Optional[str] = Field(None)
    instagram_url: Optional[str] = Field(None)
    youtube_url: Optional[str] = Field(None)
    telegram_url: Optional[str] = Field(None)
    whatsapp_number: Optional[str] = Field(None)
    
    # إعدادات SEO
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    google_analytics_id: Optional[str] = Field(None)
    google_search_console: Optional[str] = Field(None)
    
    # إعدادات عامة
    language: str = Field(default="ar")
    timezone: str = Field(default="Africa/Cairo")
    date_format: str = Field(default="DD/MM/YYYY")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PageBlock(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # معلومات البلوك الأساسية
    block_type: str = Field(..., pattern="^(hero|features|statistics|testimonials|news|faq|search|newsletter|contact|custom_html|spacer|gallery)$")
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=300)
    
    # المحتوى
    content: Dict = Field(default_factory=dict)  # محتوى البلوك (JSON)
    html_content: str = Field(default="")  # محتوى HTML مخصص
    css_styles: str = Field(default="")  # CSS مخصص
    
    # الإعدادات
    settings: Dict = Field(default_factory=dict)  # إعدادات البلوك
    is_visible: bool = Field(default=True)
    is_container: bool = Field(default=True)  # هل يكون داخل container
    
    # الترتيب والتموضع
    order_index: int = Field(default=0)
    section: str = Field(default="main")  # main, sidebar, footer
    
    # المتجاوبية
    show_on_desktop: bool = Field(default=True)
    show_on_tablet: bool = Field(default=True)
    show_on_mobile: bool = Field(default=True)
    
    # التوقيت
    start_date: Optional[datetime] = Field(None)
    end_date: Optional[datetime] = Field(None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Homepage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # معلومات الصفحة
    title: str = Field(default="الصفحة الرئيسية")
    slug: str = Field(default="home")
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    meta_keywords: Optional[str] = Field(None, max_length=300)
    
    # البلوكات
    blocks: List[str] = Field(default_factory=list)  # قائمة IDs البلوكات مرتبة
    
    # الإعدادات
    is_active: bool = Field(default=True)
    template: str = Field(default="default")  # قالب الصفحة
    
    # SEO
    canonical_url: Optional[str] = Field(None)
    robots: str = Field(default="index,follow")
    og_image: Optional[str] = Field(None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# نماذج الطلبات

class SiteSettingsUpdate(BaseModel):
    site_name: Optional[str] = Field(None, max_length=200)
    site_description: Optional[str] = Field(None, max_length=500)
    site_keywords: Optional[str] = Field(None, max_length=300)
    logo_base64: Optional[str] = Field(None)
    primary_color: Optional[str] = Field(None)
    secondary_color: Optional[str] = Field(None)
    accent_color: Optional[str] = Field(None)
    contact_email: Optional[str] = Field(None)
    contact_phone: Optional[str] = Field(None)
    contact_address: Optional[str] = Field(None)
    facebook_url: Optional[str] = Field(None)
    twitter_url: Optional[str] = Field(None)
    instagram_url: Optional[str] = Field(None)
    youtube_url: Optional[str] = Field(None)
    telegram_url: Optional[str] = Field(None)
    whatsapp_number: Optional[str] = Field(None)
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    google_analytics_id: Optional[str] = Field(None)

class PageBlockCreate(BaseModel):
    block_type: str = Field(..., pattern="^(hero|features|statistics|testimonials|news|faq|search|newsletter|contact|custom_html|spacer|gallery)$")
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=300)
    content: Dict = Field(default_factory=dict)
    html_content: str = Field(default="")
    css_styles: str = Field(default="")
    settings: Dict = Field(default_factory=dict)
    is_visible: bool = Field(default=True)
    section: str = Field(default="main")
    show_on_desktop: bool = Field(default=True)
    show_on_tablet: bool = Field(default=True)
    show_on_mobile: bool = Field(default=True)

class PageBlockUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    content: Optional[Dict] = Field(None)
    html_content: Optional[str] = Field(None)
    css_styles: Optional[str] = Field(None)
    settings: Optional[Dict] = Field(None)
    is_visible: Optional[bool] = Field(None)
    order_index: Optional[int] = Field(None)
    show_on_desktop: Optional[bool] = Field(None)
    show_on_tablet: Optional[bool] = Field(None)
    show_on_mobile: Optional[bool] = Field(None)

class HomepageUpdate(BaseModel):
    title: Optional[str] = Field(None)
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    meta_keywords: Optional[str] = Field(None, max_length=300)
    blocks: Optional[List[str]] = Field(None)  # ترتيب البلوكات الجديد
    is_active: Optional[bool] = Field(None)
    template: Optional[str] = Field(None)

# Authentication utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توكن المصادقة مطلوب",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="توكن غير صالح",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توكن غير صالح",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await db.admin_users.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="المستخدم غير موجود",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return AdminUser(**user)

# Enhanced utility functions
def sanitize_string(text: str) -> str:
    """تنظيف وتعقيم النصوص المدخلة"""
    if not isinstance(text, str):
        return str(text)
    cleaned = re.sub(r'[<>"\';=&]', '', text)
    return cleaned.strip()

def detect_column_type(column_data: pd.Series, column_name: str) -> str:
    """كشف نوع العمود تلقائياً باستخدام الذكاء الاصطناعي"""
    column_name_lower = column_name.lower()
    
    if any(keyword in column_name_lower for keyword in ['id', 'رقم', 'number', 'seat']):
        return 'student_id'
    elif any(keyword in column_name_lower for keyword in ['name', 'اسم', 'student']):
        return 'name'
    elif any(keyword in column_name_lower for keyword in ['total', 'مجموع', 'sum']):
        return 'total'
    elif any(keyword in column_name_lower for keyword in ['class', 'فصل', 'grade']):
        return 'class'
    elif any(keyword in column_name_lower for keyword in ['section', 'شعبة']):
        return 'section'
    
    non_null_data = column_data.dropna()
    if len(non_null_data) > 0:
        try:
            numeric_data = pd.to_numeric(non_null_data, errors='coerce').dropna()
            if len(numeric_data) > 0:
                max_val = numeric_data.max()
                if 0 <= max_val <= 100:
                    return 'subject'
                elif max_val > 100:
                    return 'total'
        except:
            pass
        
        if non_null_data.dtype == 'object':
            avg_length = non_null_data.str.len().mean()
            if avg_length > 10:
                return 'name'
    
    return 'subject'

def calculate_file_hash(content: bytes) -> str:
    """حساب hash للملف للتحقق من التكرار"""
    return hashlib.sha256(content).hexdigest()

def smart_data_validation(df: pd.DataFrame, stage_template: Optional[StageTemplate] = None, mapping: Optional[Dict] = None) -> DataValidationResult:
    """فحص ذكي للبيانات مع اقتراحات للإصلاح"""
    result = DataValidationResult()
    
    try:
        # الإحصائيات الأساسية
        total_rows = len(df)
        result.statistics = {
            "total_rows": total_rows,
            "total_columns": len(df.columns),
            "empty_cells": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum())
        }
        
        if mapping and stage_template:
            # فحص أعمدة المواد
            for subject_col in mapping.get('subject_columns', []):
                if subject_col in df.columns:
                    subject_data = df[subject_col].dropna()
                    if len(subject_data) > 0:
                        # البحث عن القالب المناسب للمادة
                        subject_template = None
                        for subj in stage_template.subjects:
                            if subj.name in subject_col or subject_col in subj.name:
                                subject_template = subj
                                break
                        
                        if subject_template:
                            max_score = subject_template.max_score
                            
                            # فحص الدرجات خارج النطاق
                            invalid_scores = subject_data[(subject_data < 0) | (subject_data > max_score)]
                            if len(invalid_scores) > 0:
                                result.errors.append({
                                    "type": "invalid_scores",
                                    "column": subject_col,
                                    "message": f"درجات خارج النطاق المسموح (0-{max_score})",
                                    "count": len(invalid_scores),
                                    "values": invalid_scores.tolist()[:5]
                                })
                                result.is_valid = False
                            
                            # فحص الدرجات المشبوهة (متطرفة)
                            mean_score = subject_data.mean()
                            std_score = subject_data.std()
                            outliers = subject_data[abs(subject_data - mean_score) > 2 * std_score]
                            if len(outliers) > 0 and len(outliers) < total_rows * 0.05:  # أقل من 5%
                                result.warnings.append({
                                    "type": "outlier_scores",
                                    "column": subject_col,
                                    "message": f"درجات شاذة قد تحتاج مراجعة",
                                    "count": len(outliers),
                                    "mean": round(mean_score, 2),
                                    "std": round(std_score, 2)
                                })
                            
                            # اقتراح إصلاح للدرجات الخاطئة
                            if len(invalid_scores) > 0:
                                result.suggestions.append({
                                    "type": "fix_invalid_scores",
                                    "column": subject_col,
                                    "message": f"يُقترح تعديل الدرجات الخاطئة لتكون بين 0 و {max_score}",
                                    "action": "cap_values",
                                    "parameters": {"min_value": 0, "max_value": max_score}
                                })
        
        # فحص البيانات المكررة
        if result.statistics["duplicate_rows"] > 0:
            result.warnings.append({
                "type": "duplicate_data",
                "message": f"تم العثور على {result.statistics['duplicate_rows']} صف مكرر",
                "count": result.statistics["duplicate_rows"]
            })
            result.suggestions.append({
                "type": "remove_duplicates",
                "message": "يُقترح حذف الصفوف المكررة",
                "action": "drop_duplicates"
            })
        
        # فحص البيانات المفقودة
        missing_data = df.isnull().sum()
        high_missing = missing_data[missing_data > total_rows * 0.3]  # أكثر من 30%
        if len(high_missing) > 0:
            for col in high_missing.index:
                result.warnings.append({
                    "type": "high_missing_data",
                    "column": col,
                    "message": f"بيانات مفقودة عالية: {high_missing[col]} من {total_rows}",
                    "percentage": round((high_missing[col] / total_rows) * 100, 1)
                })
        
        # اقتراحات عامة للتحسين
        if mapping:
            student_id_col = mapping.get('student_id_column')
            name_col = mapping.get('name_column')
            
            if student_id_col and student_id_col in df.columns:
                # فحص أرقام الجلوس المكررة
                duplicate_ids = df[student_id_col].duplicated().sum()
                if duplicate_ids > 0:
                    result.errors.append({
                        "type": "duplicate_student_ids",
                        "column": student_id_col,
                        "message": f"أرقام جلوس مكررة: {duplicate_ids}",
                        "count": duplicate_ids
                    })
                    result.is_valid = False
            
            if name_col and name_col in df.columns:
                # فحص الأسماء الفارغة
                empty_names = df[name_col].isnull().sum()
                if empty_names > 0:
                    result.warnings.append({
                        "type": "empty_names",
                        "column": name_col,
                        "message": f"أسماء فارغة: {empty_names}",
                        "count": empty_names
                    })
        
        # تقييم جودة البيانات العامة
        quality_score = 100
        if result.statistics["empty_cells"] > 0:
            quality_score -= min(30, (result.statistics["empty_cells"] / (total_rows * len(df.columns))) * 100)
        if len(result.errors) > 0:
            quality_score -= len(result.errors) * 10
        if len(result.warnings) > 0:
            quality_score -= len(result.warnings) * 5
            
        result.statistics["quality_score"] = max(0, round(quality_score, 1))
        
    except Exception as e:
        result.errors.append({
            "type": "validation_error",
            "message": f"خطأ في فحص البيانات: {str(e)}"
        })
        result.is_valid = False
    
    return result

async def create_indexes():
    """إنشاء فهارس قاعدة البيانات للبحث السريع"""
    try:
        await db.students.create_index([("student_id", 1)], unique=True)
        await db.students.create_index([("name", "text")])
        await db.students.create_index([("class_name", 1)])
        await db.students.create_index([("section", 1)])
        await db.students.create_index([("educational_stage_id", 1)])  # فهرس المرحلة التعليمية
        await db.students.create_index([("region", 1)])  # فهرس المحافظة
        await db.excel_files.create_index([("file_hash", 1)], unique=True)
        await db.admin_users.create_index([("username", 1)], unique=True)
        await db.admin_users.create_index([("email", 1)], unique=True)
        await db.educational_stages.create_index([("name", 1)])  # فهرس المراحل
        await db.educational_stages.create_index([("display_order", 1)])
        await db.system_settings.create_index([("id", 1)], unique=True)  # فهرس الإعدادات
        await db.excel_data_chunks.create_index([("file_hash", 1)])  # فهرس البيانات المقسمة
        await db.excel_data_chunks.create_index([("file_hash", 1), ("chunk_index", 1)])  # فهرس مركب
        await db.stage_templates.create_index([("stage_id", 1)])  # فهرس قوالب المراحل
        await db.stage_templates.create_index([("created_by", 1)])
        await db.mapping_templates.create_index([("created_by", 1)])  # فهرس قوالب الربط
        await db.mapping_templates.create_index([("stage_id", 1)])
        await db.mapping_templates.create_index([("usage_count", -1)])  # للترتيب حسب الاستخدام
        await db.page_templates.create_index([("type", 1), ("stage_id", 1)])  # فهرس قوالب الصفحات
        await db.certificate_templates.create_index([("category", 1)])  # فهرس قوالب الشهادات
        await db.certificate_templates.create_index([("usage_count", -1)])  # للترتيب حسب الاستخدام
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")

async def create_default_admin():
    """إنشاء مدير افتراضي"""
    try:
        existing_admin = await db.admin_users.find_one({"username": "admin"})
        if not existing_admin:
            default_admin = AdminUser(
                username="admin",
                email="admin@system.com",
                hashed_password=get_password_hash("admin123"),
                is_superuser=True
            )
            await db.admin_users.insert_one(default_admin.dict())
            logger.info("Default admin created: username=admin, password=admin123")
    except Exception as e:
        logger.error(f"Error creating default admin: {str(e)}")

async def create_default_educational_stages():
    """إنشاء المراحل التعليمية الافتراضية للنظام المصري"""
    try:
        existing_stages = await db.educational_stages.count_documents({})
        if existing_stages == 0:
            default_stages = [
                EducationalStage(
                    name="الشهادة الإعدادية",
                    name_en="Preparatory Certificate", 
                    description="نتائج الشهادة الإعدادية لجميع المحافظات",
                    icon="📚",
                    color="#10b981",
                    regions=[
                        "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "البحيرة", "المنوفية",
                        "الغربية", "كفر الشيخ", "الدقهلية", "دمياط", "الشرقية", "الإسماعيلية",
                        "بورسعيد", "السويس", "شمال سيناء", "جنوب سيناء", "المنيا", "أسيوط",
                        "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
                        "مطروح", "الفيوم", "بني سويف"
                    ],
                    display_order=1
                ),
                EducationalStage(
                    name="الثانوية العامة",
                    name_en="General Secondary Certificate",
                    description="نتائج الثانوية العامة (المسار العلمي والأدبي)",
                    icon="🎓",
                    color="#3b82f6",
                    regions=[
                        "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "البحيرة", "المنوفية",
                        "الغربية", "كفر الشيخ", "الدقهلية", "دمياط", "الشرقية", "الإسماعيلية",
                        "بورسعيد", "السويس", "شمال سيناء", "جنوب سيناء", "المنيا", "أسيوط",
                        "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
                        "مطروح", "الفيوم", "بني سويف"
                    ],
                    display_order=2
                ),
                EducationalStage(
                    name="الثانوية الأزهرية",
                    name_en="Al-Azhar Secondary Certificate",
                    description="نتائج الثانوية الأزهرية (العلمي والأدبي)",
                    icon="🕌",
                    color="#f59e0b",
                    regions=[
                        "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "البحيرة", "المنوفية",
                        "الغربية", "كفر الشيخ", "الدقهلية", "دمياط", "الشرقية", "الإسماعيلية",
                        "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان"
                    ],
                    display_order=3
                ),
                EducationalStage(
                    name="الدبلومات الفنية",
                    name_en="Technical Diplomas",
                    description="نتائج الدبلومات الفنية (صناعي، تجاري، زراعي، فندقي)",
                    icon="🔧",
                    color="#ef4444",
                    regions=[
                        "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "البحيرة", "المنوفية",
                        "الغربية", "كفر الشيخ", "الدقهلية", "دمياط", "الشرقية", "الإسماعيلية",
                        "بورسعيد", "السويس", "المنيا", "أسيوط", "سوهاج", "قنا", "الفيوم"
                    ],
                    display_order=4
                ),
                EducationalStage(
                    name="الشهادة الابتدائية",
                    name_en="Primary Certificate",
                    description="نتائج الشهادة الابتدائية",
                    icon="✏️",
                    color="#8b5cf6",
                    regions=[
                        "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "البحيرة", "المنوفية",
                        "الغربية", "كفر الشيخ", "الدقهلية", "دمياط", "الشرقية", "الإسماعيلية",
                        "بورسعيد", "السويس", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان"
                    ],
                    display_order=0
                )
            ]
            
            for stage in default_stages:
                await db.educational_stages.insert_one(stage.dict())
            
            logger.info("Default educational stages created successfully")
    except Exception as e:
        logger.error(f"Error creating default educational stages: {str(e)}")

async def create_default_stage_templates():
    """إنشاء قوالب افتراضية للمراحل التعليمية مع درجات مصر الرسمية"""
    try:
        existing_templates = await db.stage_templates.count_documents({})
        if existing_templates == 0:
            # البحث عن المراحل الموجودة
            preparatory_stage = await db.educational_stages.find_one({"name": "الشهادة الإعدادية"})
            secondary_stage = await db.educational_stages.find_one({"name": "الثانوية العامة"})
            
            templates = []
            
            if preparatory_stage:
                # قالب الشهادة الإعدادية - الترم الأول
                prep_first_term = StageTemplate(
                    stage_id=preparatory_stage["id"],
                    name="الشهادة الإعدادية - الترم الأول",
                    term="first",
                    subjects=[
                        SubjectTemplate(name="اللغة العربية", max_score=40, passing_score=None, include_in_total=True, display_order=1),
                        SubjectTemplate(name="اللغة الإنجليزية", max_score=30, passing_score=None, include_in_total=True, display_order=2),
                        SubjectTemplate(name="الدراسات الاجتماعية", max_score=20, passing_score=None, include_in_total=True, display_order=3),
                        SubjectTemplate(name="الرياضيات", max_score=30, passing_score=None, include_in_total=True, display_order=4),
                        SubjectTemplate(name="العلوم", max_score=20, passing_score=None, include_in_total=True, display_order=5),
                        SubjectTemplate(name="التربية الدينية", max_score=40, passing_score=None, include_in_total=False, display_order=6),
                        SubjectTemplate(name="التربية الفنية", max_score=20, passing_score=None, include_in_total=False, display_order=7),
                        SubjectTemplate(name="الحاسب الآلي", max_score=20, passing_score=None, include_in_total=False, display_order=8),
                    ],
                    total_max_score=140,
                    total_passing_score=None,
                    grading_system="percentage",
                    grade_boundaries={
                        "ممتاز": 90.0,
                        "جيد جداً": 80.0,
                        "جيد": 70.0,
                        "مقبول": 60.0,
                        "ضعيف": 0.0
                    },
                    is_default=True,
                    created_by="system"
                )
                
                # قالب الشهادة الإعدادية - الترم الثاني
                prep_second_term = StageTemplate(
                    stage_id=preparatory_stage["id"],
                    name="الشهادة الإعدادية - الترم الثاني",
                    term="second",
                    subjects=[
                        SubjectTemplate(name="اللغة العربية", max_score=80, passing_score=40, include_in_total=True, display_order=1),
                        SubjectTemplate(name="اللغة الإنجليزية", max_score=60, passing_score=30, include_in_total=True, display_order=2),
                        SubjectTemplate(name="الدراسات الاجتماعية", max_score=40, passing_score=20, include_in_total=True, display_order=3),
                        SubjectTemplate(name="الرياضيات", max_score=60, passing_score=30, include_in_total=True, display_order=4),
                        SubjectTemplate(name="العلوم", max_score=40, passing_score=20, include_in_total=True, display_order=5),
                        SubjectTemplate(name="التربية الدينية", max_score=40, passing_score=20, include_in_total=False, display_order=6),
                        SubjectTemplate(name="التربية الفنية", max_score=20, passing_score=10, include_in_total=False, display_order=7),
                        SubjectTemplate(name="الحاسب الآلي", max_score=20, passing_score=10, include_in_total=False, display_order=8),
                    ],
                    total_max_score=280,
                    total_passing_score=140,
                    grading_system="percentage",
                    grade_boundaries={
                        "ممتاز": 90.0,
                        "جيد جداً": 80.0,
                        "جيد": 70.0,
                        "مقبول": 50.0,
                        "ضعيف": 0.0
                    },
                    is_default=True,
                    created_by="system"
                )
                
                templates.extend([prep_first_term, prep_second_term])
            
            if secondary_stage:
                # قالب الثانوية العامة - علمي
                secondary_science = StageTemplate(
                    stage_id=secondary_stage["id"],
                    name="الثانوية العامة - الشعبة العلمية",
                    term="final",
                    subjects=[
                        SubjectTemplate(name="اللغة العربية", max_score=80, passing_score=40, include_in_total=True, display_order=1),
                        SubjectTemplate(name="اللغة الإنجليزية", max_score=50, passing_score=25, include_in_total=True, display_order=2),
                        SubjectTemplate(name="اللغة الأجنبية الثانية", max_score=40, passing_score=20, include_in_total=True, display_order=3),
                        SubjectTemplate(name="الكيمياء", max_score=60, passing_score=30, include_in_total=True, display_order=4),
                        SubjectTemplate(name="الفيزياء", max_score=60, passing_score=30, include_in_total=True, display_order=5),
                        SubjectTemplate(name="الرياضيات (الجبر والهندسة الفراغية)", max_score=60, passing_score=30, include_in_total=True, display_order=6),
                        SubjectTemplate(name="الرياضيات (التفاضل والتكامل)", max_score=60, passing_score=30, include_in_total=True, display_order=7),
                    ],
                    total_max_score=410,
                    total_passing_score=205,
                    grading_system="percentage",
                    grade_boundaries={
                        "ممتاز": 85.0,
                        "جيد جداً": 75.0,
                        "جيد": 65.0,
                        "مقبول": 50.0,
                        "ضعيف": 0.0
                    },
                    is_default=True,
                    created_by="system"
                )
                
                # قالب الثانوية العامة - أدبي
                secondary_arts = StageTemplate(
                    stage_id=secondary_stage["id"],
                    name="الثانوية العامة - الشعبة الأدبية",
                    term="final",
                    subjects=[
                        SubjectTemplate(name="اللغة العربية", max_score=80, passing_score=40, include_in_total=True, display_order=1),
                        SubjectTemplate(name="اللغة الإنجليزية", max_score=50, passing_score=25, include_in_total=True, display_order=2),
                        SubjectTemplate(name="اللغة الأجنبية الثانية", max_score=40, passing_score=20, include_in_total=True, display_order=3),
                        SubjectTemplate(name="التاريخ", max_score=60, passing_score=30, include_in_total=True, display_order=4),
                        SubjectTemplate(name="الجغرافيا", max_score=60, passing_score=30, include_in_total=True, display_order=5),
                        SubjectTemplate(name="الفلسفة والمنطق", max_score=60, passing_score=30, include_in_total=True, display_order=6),
                        SubjectTemplate(name="علم النفس والاجتماع", max_score=60, passing_score=30, include_in_total=True, display_order=7),
                    ],
                    total_max_score=410,
                    total_passing_score=205,
                    grading_system="percentage",
                    grade_boundaries={
                        "ممتاز": 85.0,
                        "جيد جداً": 75.0,
                        "جيد": 65.0,
                        "مقبول": 50.0,
                        "ضعيف": 0.0
                    },
                    is_default=True,
                    created_by="system"
                )
                
                templates.extend([secondary_science, secondary_arts])
            
            # حفظ القوالب
            for template in templates:
                await db.stage_templates.insert_one(template.dict())
            
            logger.info(f"Default stage templates created successfully: {len(templates)} templates")
    except Exception as e:
        logger.error(f"Error creating default stage templates: {str(e)}")

async def create_default_educational_content():
    """إنشاء محتوى تعليمي افتراضي"""
    try:
        # إنشاء أسئلة شائعة افتراضية
        existing_faq = await db.faq.count_documents({})
        if existing_faq == 0:
            default_faqs = [
                FAQ(
                    question="كيف يمكنني الاستعلام عن نتيجتي؟",
                    answer="يمكنك الاستعلام عن نتيجتك بإدخال رقم الجلوس أو الاسم في صفحة البحث. اختر المرحلة التعليمية أولاً، ثم ادخل البيانات المطلوبة.",
                    category="الاستعلام",
                    order=1
                ),
                FAQ(
                    question="ماذا أفعل إذا لم أجد نتيجتي؟",
                    answer="تأكد من إدخال رقم الجلوس بشكل صحيح، وتأكد من اختيار المرحلة التعليمية والمحافظة الصحيحة. إذا استمرت المشكلة، تواصل مع الإدارة.",
                    category="الاستعلام",
                    order=2
                ),
                FAQ(
                    question="كيف يتم حساب النسبة المئوية؟",
                    answer="النسبة المئوية = (مجموع الدرجات ÷ المجموع الكلي) × 100. يتم حساب المتوسط لجميع المواد مع مراعاة الدرجة النهائية لكل مادة.",
                    category="التقديرات",
                    order=3
                ),
                FAQ(
                    question="ما هي التقديرات المعتمدة؟",
                    answer="التقديرات هي: ممتاز (90% فأكثر)، جيد جداً (80-89%)، جيد (70-79%)، مقبول (60-69%)، ضعيف (أقل من 60%).",
                    category="التقديرات",
                    order=4
                ),
                FAQ(
                    question="هل يمكنني طباعة النتيجة؟",
                    answer="نعم، يمكنك طباعة النتيجة من خلال الضغط على زر الطباعة في صفحة النتيجة، أو حفظها كملف PDF.",
                    category="الطباعة والحفظ",
                    order=5
                ),
                FAQ(
                    question="كيف يمكنني الحصول على شهادة تقدير؟",
                    answer="يمكنك إنشاء شهادة تقدير من صفحة النتيجة الخاصة بك. اختر القالب المناسب واضغط على إنشاء شهادة.",
                    category="الشهادات",
                    order=6
                ),
                FAQ(
                    question="هل يمكنني مشاركة نتيجتي على وسائل التواصل؟",
                    answer="نعم، يمكنك مشاركة نتيجتك على فيسبوك وتويتر وواتساب وتيليجرام من خلال أزرار المشاركة في صفحة النتيجة.",
                    category="المشاركة",
                    order=7
                )
            ]
            
            for faq in default_faqs:
                await db.faq.insert_one(faq.dict())
            
            logger.info(f"Default FAQ created: {len(default_faqs)} questions")

        # إنشاء أدلة تعليمية افتراضية
        existing_guides = await db.educational_guides.count_documents({})
        if existing_guides == 0:
            default_guides = [
                EducationalGuide(
                    title="فهم نظام التقديرات المصري",
                    content="""
## نظام التقديرات في التعليم المصري

### التقديرات الأساسية:
- **ممتاز**: 90% فأكثر
- **جيد جداً**: من 80% إلى أقل من 90%
- **جيد**: من 70% إلى أقل من 80%
- **مقبول**: من 60% إلى أقل من 70%
- **ضعيف**: أقل من 60%

### كيفية حساب النسبة المئوية:
النسبة المئوية = (مجموع الدرجات المحصل عليها ÷ المجموع الكلي للدرجات) × 100

### مثال عملي:
إذا حصل الطالب على:
- الرياضيات: 85 من 100
- العربي: 92 من 100  
- الإنجليزي: 78 من 100

المجموع = 85 + 92 + 78 = 255
المجموع الكلي = 300
النسبة المئوية = (255 ÷ 300) × 100 = 85%
التقدير = جيد جداً
                    """,
                    category="التقديرات",
                    is_featured=True,
                    order=1
                ),
                EducationalGuide(
                    title="دليل الطالب للنجاح الأكاديمي",
                    content="""
## نصائح للنجاح الأكاديمي

### قبل الامتحانات:
1. **التخطيط المسبق**: ضع جدولاً زمنياً للمراجعة
2. **المراجعة المنتظمة**: لا تترك المذاكرة للحظة الأخيرة
3. **النوم الكافي**: احرص على الراحة قبل الامتحان
4. **التغذية السليمة**: تناول وجبات متوازنة

### أثناء الامتحان:
1. **اقرأ الأسئلة بعناية**: تأكد من فهم المطلوب
2. **إدارة الوقت**: وزع الوقت على جميع الأسئلة
3. **ابدأ بالسهل**: حل الأسئلة السهلة أولاً
4. **راجع إجاباتك**: اترك وقتاً للمراجعة

### بعد الامتحانات:
1. **لا تقارن**: لا تقارن إجاباتك مع الآخرين
2. **استعد للتالي**: ركز على الامتحان القادم
3. **احتفل بإنجازاتك**: كافئ نفسك على الجهد المبذول
                    """,
                    category="نصائح الطلاب",
                    is_featured=True,
                    order=2
                ),
                EducationalGuide(
                    title="دليل أولياء الأمور",
                    content="""
## كيف تدعم طفلك أكاديمياً

### الدعم النفسي:
- شجع طفلك وتجنب المقارنات
- احتفل بالإنجازات الصغيرة والكبيرة
- كن صبوراً ومتفهماً لضغوط الدراسة
- ساعده في إدارة القلق والتوتر

### الدعم الأكاديمي:
- وفر بيئة دراسية هادئة ومناسبة
- ساعده في تنظيم الوقت ووضع جدول للمذاكرة
- تابع واجباته المدرسية بانتظام
- تواصل مع المدرسة لمتابعة مستواه

### الدعم الصحي:
- تأكد من حصوله على تغذية متوازنة
- احرص على نومه لساعات كافية
- شجعه على ممارسة الرياضة والأنشطة
- قلل من وقت الشاشات والألعاب

### التعامل مع النتائج:
- ركز على الجهد المبذول وليس فقط الدرجات
- حلل النتائج معه لفهم نقاط القوة والضعف
- ضع خطة للتحسن في المواد الضعيفة
- احتفل بالنجاحات واستخدم الأخطاء للتعلم
                    """,
                    category="أولياء الأمور",
                    is_featured=True,
                    order=3
                )
            ]
            
            for guide in default_guides:
                await db.educational_guides.insert_one(guide.dict())
            
            logger.info(f"Default educational guides created: {len(default_guides)} guides")

        # إنشاء مقالات إخبارية افتراضية
        existing_news = await db.news_articles.count_documents({})
        if existing_news == 0:
            default_news = [
                NewsArticle(
                    title="إطلاق النظام الذكي للاستعلام عن النتائج",
                    content="""
تم إطلاق النظام الجديد للاستعلام عن نتائج الطلاب بمميزات متطورة تشمل:

## المميزات الجديدة:
- **البحث المتقدم**: إمكانية البحث بالاسم أو رقم الجلوس
- **التصفية الذكية**: تصفية النتائج حسب المرحلة والمحافظة
- **الشهادات الرقمية**: إنشاء وطباعة شهادات التقدير
- **المشاركة الاجتماعية**: مشاركة النتائج على وسائل التواصل
- **الإحصائيات التفصيلية**: عرض إحصائيات شاملة للأداء

## سهولة الاستخدام:
النظام مصمم ليكون سهل الاستخدام لجميع فئات المستخدمين، مع واجهة عربية بالكامل ودعم للأجهزة المحمولة.

## الأمان والخصوصية:
تم تطوير النظام بأعلى معايير الأمان لحماية بيانات الطلاب وضمان سرية المعلومات.
                    """,
                    summary="إطلاق نظام متطور للاستعلام عن نتائج الطلاب بمميزات جديدة ومتقدمة",
                    tags=["إطلاق", "نظام جديد", "تطوير", "تقنية"],
                    is_published=True,
                    is_featured=True,
                    published_at=datetime.utcnow()
                ),
                NewsArticle(
                    title="نصائح هامة للطلاب قبل ظهور النتائج",
                    content="""
مع اقتراب موعد إعلان النتائج، نقدم للطلاب وأولياء الأمور بعض النصائح المهمة:

## للطلاب:
- **الهدوء والصبر**: انتظر النتائج بهدوء ولا تتوتر
- **تجنب الشائعات**: لا تصدق الأخبار غير المؤكدة
- **التحضير للمرحلة القادمة**: فكر في خططك المستقبلية
- **الثقة بالنفس**: تذكر أنك بذلت قصارى جهدك

## لأولياء الأمور:
- **الدعم النفسي**: كونوا مصدر دعم وتشجيع لأطفالكم
- **تجنب الضغط**: لا تضغطوا على الطلاب بتوقعات عالية
- **التركيز على المستقبل**: ساعدوا في التخطيط للخطوات التالية
- **الاحتفال بالإنجاز**: احتفلوا بالجهد المبذول مهما كانت النتيجة

## طرق الاستعلام:
- استخدم الموقع الرسمي للاستعلام
- تأكد من صحة رقم الجلوس والبيانات الشخصية
- احتفظ بنسخة من النتيجة للمراجع المستقبلية
                    """,
                    summary="نصائح مهمة للطلاب وأولياء الأمور قبل إعلان النتائج",
                    tags=["نصائح", "طلاب", "أولياء أمور", "نتائج"],
                    is_published=True,
                    is_featured=False,
                    published_at=datetime.utcnow() - timedelta(days=1)
                )
            ]
            
            for article in default_news:
                await db.news_articles.insert_one(article.dict())
            
            logger.info(f"Default news articles created: {len(default_news)} articles")
            
    except Exception as e:
        logger.error(f"Error creating default educational content: {str(e)}")

async def create_default_educational_content():
    """إنشاء محتوى تعليمي افتراضي"""
    try:
        # إنشاء أسئلة شائعة افتراضية
        existing_faq = await db.faq.count_documents({})
        if existing_faq == 0:
            default_faqs = [
                FAQ(
                    question="كيف يمكنني الاستعلام عن نتيجتي؟",
                    answer="يمكنك الاستعلام عن نتيجتك بإدخال رقم الجلوس أو الاسم في صفحة البحث. اختر المرحلة التعليمية أولاً، ثم ادخل البيانات المطلوبة.",
                    category="الاستعلام",
                    order=1
                ),
                FAQ(
                    question="ماذا أفعل إذا لم أجد نتيجتي؟",
                    answer="تأكد من إدخال رقم الجلوس بشكل صحيح، وتأكد من اختيار المرحلة التعليمية والمحافظة الصحيحة. إذا استمرت المشكلة، تواصل مع الإدارة.",
                    category="الاستعلام",
                    order=2
                ),
                FAQ(
                    question="كيف يتم حساب النسبة المئوية؟",
                    answer="النسبة المئوية = (مجموع الدرجات ÷ المجموع الكلي) × 100. يتم حساب المتوسط لجميع المواد مع مراعاة الدرجة النهائية لكل مادة.",
                    category="التقديرات",
                    order=3
                ),
                FAQ(
                    question="ما هي التقديرات المعتمدة؟",
                    answer="التقديرات هي: ممتاز (90% فأكثر)، جيد جداً (80-89%)، جيد (70-79%)، مقبول (60-69%)، ضعيف (أقل من 60%).",
                    category="التقديرات",
                    order=4
                ),
                FAQ(
                    question="هل يمكنني طباعة النتيجة؟",
                    answer="نعم، يمكنك طباعة النتيجة من خلال الضغط على زر الطباعة في صفحة النتيجة، أو حفظها كملف PDF.",
                    category="الطباعة والحفظ",
                    order=5
                ),
                FAQ(
                    question="كيف يمكنني الحصول على شهادة تقدير؟",
                    answer="يمكنك إنشاء شهادة تقدير من صفحة النتيجة الخاصة بك. اختر القالب المناسب واضغط على إنشاء شهادة.",
                    category="الشهادات",
                    order=6
                ),
                FAQ(
                    question="هل يمكنني مشاركة نتيجتي على وسائل التواصل؟",
                    answer="نعم، يمكنك مشاركة نتيجتك على فيسبوك وتويتر وواتساب وتيليجرام من خلال أزرار المشاركة في صفحة النتيجة.",
                    category="المشاركة",
                    order=7
                )
            ]
            
            for faq in default_faqs:
                await db.faq.insert_one(faq.dict())
            
            logger.info(f"Default FAQ created: {len(default_faqs)} questions")

        # إنشاء أدلة تعليمية افتراضية
        existing_guides = await db.educational_guides.count_documents({})
        if existing_guides == 0:
            default_guides = [
                EducationalGuide(
                    title="فهم نظام التقديرات المصري",
                    content="""
## نظام التقديرات في التعليم المصري

### التقديرات الأساسية:
- **ممتاز**: 90% فأكثر
- **جيد جداً**: من 80% إلى أقل من 90%
- **جيد**: من 70% إلى أقل من 80%
- **مقبول**: من 60% إلى أقل من 70%
- **ضعيف**: أقل من 60%

### كيفية حساب النسبة المئوية:
النسبة المئوية = (مجموع الدرجات المحصل عليها ÷ المجموع الكلي للدرجات) × 100

### مثال عملي:
إذا حصل الطالب على:
- الرياضيات: 85 من 100
- العربي: 92 من 100  
- الإنجليزي: 78 من 100

المجموع = 85 + 92 + 78 = 255
المجموع الكلي = 300
النسبة المئوية = (255 ÷ 300) × 100 = 85%
التقدير = جيد جداً
                    """,
                    category="التقديرات",
                    is_featured=True,
                    order=1
                ),
                EducationalGuide(
                    title="دليل الطالب للنجاح الأكاديمي",
                    content="""
## نصائح للنجاح الأكاديمي

### قبل الامتحانات:
1. **التخطيط المسبق**: ضع جدولاً زمنياً للمراجعة
2. **المراجعة المنتظمة**: لا تترك المذاكرة للحظة الأخيرة
3. **النوم الكافي**: احرص على الراحة قبل الامتحان
4. **التغذية السليمة**: تناول وجبات متوازنة

### أثناء الامتحان:
1. **اقرأ الأسئلة بعناية**: تأكد من فهم المطلوب
2. **إدارة الوقت**: وزع الوقت على جميع الأسئلة
3. **ابدأ بالسهل**: حل الأسئلة السهلة أولاً
4. **راجع إجاباتك**: اترك وقتاً للمراجعة

### بعد الامتحانات:
1. **لا تقارن**: لا تقارن إجاباتك مع الآخرين
2. **استعد للتالي**: ركز على الامتحان القادم
3. **احتفل بإنجازاتك**: كافئ نفسك على الجهد المبذول
                    """,
                    category="نصائح الطلاب",
                    is_featured=True,
                    order=2
                ),
                EducationalGuide(
                    title="دليل أولياء الأمور",
                    content="""
## كيف تدعم طفلك أكاديمياً

### الدعم النفسي:
- شجع طفلك وتجنب المقارنات
- احتفل بالإنجازات الصغيرة والكبيرة
- كن صبوراً ومتفهماً لضغوط الدراسة
- ساعده في إدارة القلق والتوتر

### الدعم الأكاديمي:
- وفر بيئة دراسية هادئة ومناسبة
- ساعده في تنظيم الوقت ووضع جدول للمذاكرة
- تابع واجباته المدرسية بانتظام
- تواصل مع المدرسة لمتابعة مستواه

### الدعم الصحي:
- تأكد من حصوله على تغذية متوازنة
- احرص على نومه لساعات كافية
- شجعه على ممارسة الرياضة والأنشطة
- قلل من وقت الشاشات والألعاب

### التعامل مع النتائج:
- ركز على الجهد المبذول وليس فقط الدرجات
- حلل النتائج معه لفهم نقاط القوة والضعف
- ضع خطة للتحسن في المواد الضعيفة
- احتفل بالنجاحات واستخدم الأخطاء للتعلم
                    """,
                    category="أولياء الأمور",
                    is_featured=True,
                    order=3
                )
            ]
            
            for guide in default_guides:
                await db.educational_guides.insert_one(guide.dict())
            
            logger.info(f"Default educational guides created: {len(default_guides)} guides")

        # إنشاء مقالات إخبارية افتراضية
        existing_news = await db.news_articles.count_documents({})
        if existing_news == 0:
            default_news = [
                NewsArticle(
                    title="إطلاق النظام الذكي للاستعلام عن النتائج",
                    content="""
تم إطلاق النظام الجديد للاستعلام عن نتائج الطلاب بمميزات متطورة تشمل:

## المميزات الجديدة:
- **البحث المتقدم**: إمكانية البحث بالاسم أو رقم الجلوس
- **التصفية الذكية**: تصفية النتائج حسب المرحلة والمحافظة
- **الشهادات الرقمية**: إنشاء وطباعة شهادات التقدير
- **المشاركة الاجتماعية**: مشاركة النتائج على وسائل التواصل
- **الإحصائيات التفصيلية**: عرض إحصائيات شاملة للأداء

## سهولة الاستخدام:
النظام مصمم ليكون سهل الاستخدام لجميع فئات المستخدمين، مع واجهة عربية بالكامل ودعم للأجهزة المحمولة.

## الأمان والخصوصية:
تم تطوير النظام بأعلى معايير الأمان لحماية بيانات الطلاب وضمان سرية المعلومات.
                    """,
                    summary="إطلاق نظام متطور للاستعلام عن نتائج الطلاب بمميزات جديدة ومتقدمة",
                    tags=["إطلاق", "نظام جديد", "تطوير", "تقنية"],
                    is_published=True,
                    is_featured=True,
                    published_at=datetime.utcnow()
                ),
                NewsArticle(
                    title="نصائح هامة للطلاب قبل ظهور النتائج",
                    content="""
مع اقتراب موعد إعلان النتائج، نقدم للطلاب وأولياء الأمور بعض النصائح المهمة:

## للطلاب:
- **الهدوء والصبر**: انتظر النتائج بهدوء ولا تتوتر
- **تجنب الشائعات**: لا تصدق الأخبار غير المؤكدة
- **التحضير للمرحلة القادمة**: فكر في خططك المستقبلية
- **الثقة بالنفس**: تذكر أنك بذلت قصارى جهدك

## لأولياء الأمور:
- **الدعم النفسي**: كونوا مصدر دعم وتشجيع لأطفالكم
- **تجنب الضغط**: لا تضغطوا على الطلاب بتوقعات عالية
- **التركيز على المستقبل**: ساعدوا في التخطيط للخطوات التالية
- **الاحتفال بالإنجاز**: احتفلوا بالجهد المبذول مهما كانت النتيجة

## طرق الاستعلام:
- استخدم الموقع الرسمي للاستعلام
- تأكد من صحة رقم الجلوس والبيانات الشخصية
- احتفظ بنسخة من النتيجة للمراجع المستقبلية
                    """,
                    summary="نصائح مهمة للطلاب وأولياء الأمور قبل إعلان النتائج",
                    tags=["نصائح", "طلاب", "أولياء أمور", "نتائج"],
                    is_published=True,
                    is_featured=False,
                    published_at=datetime.utcnow() - timedelta(days=1)
                )
            ]
            
            for article in default_news:
                await db.news_articles.insert_one(article.dict())
            
            logger.info(f"Default news articles created: {len(default_news)} articles")
            
    except Exception as e:
        logger.error(f"Error creating default educational content: {str(e)}")

async def create_default_certificate_templates():
    """إنشاء قوالب شهادات افتراضية"""
    try:
        existing_templates = await db.certificate_templates.count_documents({})
        if existing_templates == 0:
            templates = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "شهادة تقدير كلاسيكية",
                    "description": "شهادة تقدير بتصميم كلاسيكي أنيق",
                    "category": "appreciation",
                    "html_content": """
                    <div class="certificate-classic">
                        <div class="border-frame">
                            <div class="header">
                                <div class="logo">🏆</div>
                                <h1>شهادة تقدير</h1>
                                <div class="line"></div>
                            </div>
                            
                            <div class="content">
                                <p class="intro">تُمنح هذه الشهادة تقديراً للطالب المتميز</p>
                                <h2 class="student-name">[اسم_الطالب]</h2>
                                <div class="details">
                                    <p>رقم الجلوس: <span>[رقم_الجلوس]</span></p>
                                    <p>المرحلة: <span>[اسم_المرحلة]</span></p>
                                    <p>المتوسط: <span class="score">[المتوسط]%</span></p>
                                    <p>التقدير: <span>[التقدير]</span></p>
                                </div>
                                <p class="message">نتمنى لك دوام النجاح والتفوق</p>
                            </div>
                            
                            <div class="footer">
                                <div class="signature">
                                    <div class="date">التاريخ: [التاريخ]</div>
                                    <div class="stamp">الختم</div>
                                    <div class="cert-id">رقم الشهادة: [رقم_الشهادة]</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    """,
                    "css_styles": """
                    .certificate-classic {
                        width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    }
                    .border-frame {
                        border: 8px double #1e40af;
                        border-radius: 20px;
                        padding: 40px;
                        background: white;
                        position: relative;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 60px;
                        margin-bottom: 10px;
                    }
                    .header h1 {
                        font-size: 48px;
                        color: #1e40af;
                        margin: 0;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    }
                    .line {
                        width: 150px;
                        height: 4px;
                        background: linear-gradient(to right, #3b82f6, #1e40af);
                        margin: 20px auto;
                        border-radius: 2px;
                    }
                    .content {
                        text-align: center;
                        margin: 40px 0;
                    }
                    .intro {
                        font-size: 20px;
                        color: #374151;
                        margin-bottom: 20px;
                    }
                    .student-name {
                        font-size: 36px;
                        color: #1e40af;
                        margin: 20px 0;
                        padding: 15px;
                        background: #f0f9ff;
                        border-radius: 10px;
                        border: 2px solid #bfdbfe;
                    }
                    .details {
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                    }
                    .details p {
                        margin: 10px 0;
                        font-size: 18px;
                        color: #374151;
                    }
                    .details span {
                        font-weight: bold;
                        color: #1e40af;
                    }
                    .score {
                        font-size: 24px !important;
                        color: #059669 !important;
                    }
                    .message {
                        font-size: 22px;
                        color: #1e40af;
                        font-weight: bold;
                        margin-top: 30px;
                    }
                    .footer {
                        margin-top: 40px;
                        border-top: 3px double #1e40af;
                        padding-top: 20px;
                    }
                    .signature {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .signature div {
                        font-size: 16px;
                        color: #374151;
                    }
                    .stamp {
                        border: 3px solid #1e40af;
                        border-radius: 50px;
                        padding: 10px 20px;
                        font-weight: bold;
                        color: #1e40af;
                    }
                    """,
                    "variables": {
                        "[اسم_الطالب]": "اسم الطالب",
                        "[رقم_الجلوس]": "رقم الجلوس",
                        "[اسم_المرحلة]": "المرحلة التعليمية",
                        "[المتوسط]": "النسبة المئوية",
                        "[التقدير]": "التقدير",
                        "[التاريخ]": "تاريخ الإصدار",
                        "[رقم_الشهادة]": "رقم الشهادة"
                    },
                    "is_active": True,
                    "usage_count": 0,
                    "created_by": "system",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "شهادة تفوق عصرية",
                    "description": "شهادة تفوق بتصميم عصري وألوان متدرجة",
                    "category": "excellence", 
                    "html_content": """
                    <div class="certificate-modern">
                        <div class="background-pattern"></div>
                        <div class="content-wrapper">
                            <div class="top-section">
                                <div class="achievement-badge">
                                    <div class="star">⭐</div>
                                    <div class="text">تفوق</div>
                                </div>
                                <h1>شهادة تفوق أكاديمي</h1>
                            </div>
                            
                            <div class="middle-section">
                                <p class="congrats">🎉 مبروك للطالب المتفوق</p>
                                <div class="student-card">
                                    <h2>[اسم_الطالب]</h2>
                                    <div class="student-info">
                                        <div class="info-item">
                                            <span class="label">رقم الجلوس</span>
                                            <span class="value">[رقم_الجلوس]</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="label">المرحلة</span>
                                            <span class="value">[اسم_المرحلة]</span>
                                        </div>
                                    </div>
                                    <div class="score-display">
                                        <div class="score-number">[المتوسط]%</div>
                                        <div class="grade-text">[التقدير]</div>
                                    </div>
                                </div>
                                <p class="achievement-text">لتحقيقه إنجازاً أكاديمياً متميزاً</p>
                            </div>
                            
                            <div class="bottom-section">
                                <div class="credentials">
                                    <span>شهادة رقم: [رقم_الشهادة]</span>
                                    <span>تاريخ الإصدار: [التاريخ]</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    """,
                    "css_styles": """
                    .certificate-modern {
                        width: 800px;
                        height: 600px;
                        margin: 0 auto;
                        position: relative;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 20px;
                        overflow: hidden;
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        color: white;
                    }
                    .background-pattern {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                        opacity: 0.3;
                    }
                    .content-wrapper {
                        position: relative;
                        z-index: 2;
                        padding: 40px;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .top-section {
                        text-align: center;
                    }
                    .achievement-badge {
                        display: inline-block;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50px;
                        padding: 10px 20px;
                        margin-bottom: 20px;
                        backdrop-filter: blur(10px);
                    }
                    .achievement-badge .star {
                        font-size: 24px;
                        display: inline-block;
                        margin-left: 10px;
                    }
                    .top-section h1 {
                        font-size: 42px;
                        margin: 0;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    .middle-section {
                        text-align: center;
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .congrats {
                        font-size: 24px;
                        margin-bottom: 30px;
                        opacity: 0.9;
                    }
                    .student-card {
                        background: rgba(255,255,255,0.15);
                        border-radius: 20px;
                        padding: 30px;
                        margin: 20px 0;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.2);
                    }
                    .student-card h2 {
                        font-size: 36px;
                        margin: 0 0 20px 0;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    }
                    .student-info {
                        display: flex;
                        justify-content: space-around;
                        margin: 20px 0;
                    }
                    .info-item {
                        text-align: center;
                    }
                    .info-item .label {
                        display: block;
                        font-size: 14px;
                        opacity: 0.8;
                        margin-bottom: 5px;
                    }
                    .info-item .value {
                        display: block;
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .score-display {
                        margin-top: 20px;
                    }
                    .score-number {
                        font-size: 48px;
                        font-weight: bold;
                        background: linear-gradient(45deg, #ffd700, #ffed4e);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        text-shadow: none;
                    }
                    .grade-text {
                        font-size: 20px;
                        margin-top: 5px;
                        opacity: 0.9;
                    }
                    .achievement-text {
                        font-size: 20px;
                        margin-top: 30px;
                        opacity: 0.9;
                    }
                    .bottom-section {
                        text-align: center;
                    }
                    .credentials {
                        display: flex;
                        justify-content: space-between;
                        font-size: 14px;
                        opacity: 0.8;
                        border-top: 1px solid rgba(255,255,255,0.3);
                        padding-top: 20px;
                    }
                    """,
                    "variables": {
                        "[اسم_الطالب]": "اسم الطالب",
                        "[رقم_الجلوس]": "رقم الجلوس", 
                        "[اسم_المرحلة]": "المرحلة التعليمية",
                        "[المتوسط]": "النسبة المئوية",
                        "[التقدير]": "التقدير",
                        "[التاريخ]": "تاريخ الإصدار",
                        "[رقم_الشهادة]": "رقم الشهادة"
                    },
                    "is_active": True,
                    "usage_count": 0,
                    "created_by": "system",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ]
            
            for template in templates:
                await db.certificate_templates.insert_one(template)
            
            logger.info(f"Default certificate templates created: {len(templates)} templates")
    except Exception as e:
        logger.error(f"Error creating default certificate templates: {str(e)}")

async def create_default_system_settings():
    """إنشاء الإعدادات الافتراضية للنظام"""
    try:
        existing_settings = await db.system_settings.find_one({})
        if not existing_settings:
            default_settings = SystemSettings()
            await db.system_settings.insert_one(default_settings.dict())
            logger.info("Default system settings created successfully")
    except Exception as e:
        logger.error(f"Error creating default system settings: {str(e)}")

async def create_default_notification_system():
    """إنشاء نظام الإشعارات الافتراضي"""
    try:
        # إنشاء فهارس نظام الإشعارات
        await db.subscribers.create_index([("email", 1)], unique=True)
        await db.subscribers.create_index([("is_active", 1)])
        await db.subscribers.create_index([("educational_stage", 1)])
        await db.subscribers.create_index([("region", 1)])
        await db.subscribers.create_index([("subscription_date", -1)])
        
        await db.notifications.create_index([("status", 1)])
        await db.notifications.create_index([("notification_type", 1)])
        await db.notifications.create_index([("target_audience", 1)])
        await db.notifications.create_index([("created_at", -1)])
        await db.notifications.create_index([("scheduled_send_time", 1)])
        
        logger.info("Default notification system created successfully")
    except Exception as e:
        logger.error(f"Error creating default notification system: {str(e)}")

async def create_default_homepage_system():
    """إنشاء نظام الصفحة الرئيسية الافتراضي"""
    try:
        # إنشاء فهارس نظام الصفحة الرئيسية
        await db.site_settings.create_index([("id", 1)], unique=True)
        await db.page_blocks.create_index([("block_type", 1)])
        await db.page_blocks.create_index([("is_visible", 1)])
        await db.page_blocks.create_index([("order_index", 1)])
        await db.page_blocks.create_index([("section", 1)])
        await db.homepage.create_index([("is_active", 1)])
        
        # إنشاء إعدادات الموقع الافتراضية
        existing_site_settings = await db.site_settings.find_one({})
        if not existing_site_settings:
            default_site_settings = SiteSettings()
            await db.site_settings.insert_one(default_site_settings.dict())
            logger.info("Default site settings created")
        
        # إنشاء صفحة رئيسية افتراضية
        existing_homepage = await db.homepage.find_one({})
        if not existing_homepage:
            default_homepage = Homepage()
            await db.homepage.insert_one(default_homepage.dict())
            logger.info("Default homepage created")
        
        logger.info("Default homepage system created successfully")
    except Exception as e:
        logger.error(f"Error creating default homepage system: {str(e)}")

async def create_default_content():
    """إنشاء محتوى افتراضي للموقع"""
    try:
        existing_content = await db.site_content.find_one({})
        if not existing_content:
            default_content = SiteContent(
                page_title="نظام الاستعلام الذكي عن النتائج",
                meta_description="نظام متطور وذكي للاستعلام عن نتائج الطلاب بسهولة وسرعة مع إمكانيات بحث متقدمة",
                hero_title="🎓 نظام الاستعلام الذكي عن النتائج",
                hero_subtitle="اكتشف نتائجك بسهولة وسرعة مع نظامنا المتطور الذي يوفر بحث دقيق وعرض تفصيلي لدرجات جميع المواد",
                about_section="نظام الاستعلام الذكي عن النتائج هو منصة متطورة تهدف إلى تسهيل عملية الاستعلام عن نتائج الطلاب بطريقة سريعة وآمنة. يوفر النظام إمكانيات بحث متقدمة وعرض تفصيلي للدرجات مع إحصائيات شاملة لكل طالب.",
                features=[
                    {
                        "title": "بحث سريع ودقيق",
                        "description": "ابحث عن النتائج برقم الجلوس أو الاسم بسرعة فائقة",
                        "icon": "🔍"
                    },
                    {
                        "title": "عرض تفصيلي للدرجات",
                        "description": "اطلع على درجات جميع المواد مع النسب والتقديرات",
                        "icon": "📊"
                    },
                    {
                        "title": "إحصائيات شاملة",
                        "description": "احصل على تحليل شامل للأداء الأكاديمي",
                        "icon": "📈"
                    },
                    {
                        "title": "واجهة سهلة الاستخدام",
                        "description": "تصميم عصري وسهل يدعم اللغة العربية بالكامل",
                        "icon": "🎨"
                    }
                ],
                footer_text="© 2024 نظام الاستعلام الذكي عن النتائج. جميع الحقوق محفوظة.",
                contact_info={
                    "phone": "0123456789",
                    "email": "info@results-system.com",
                    "address": "المملكة العربية السعودية"
                },
                social_links={
                    "twitter": "#",
                    "facebook": "#",
                    "instagram": "#"
                },
                seo_keywords="نتائج الطلاب, استعلام النتائج, نظام النتائج, درجات الطلاب, نتائج الامتحانات"
            )
            await db.site_content.insert_one(default_content.dict())
            logger.info("Default site content created")
    except Exception as e:
        logger.error(f"Error creating default content: {str(e)}")

# Educational Content Models
class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=2000)
    category: str = Field(default="عام")
    order: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EducationalGuide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    stage_id: Optional[str] = None  # مرتبط بمرحلة تعليمية محددة
    tags: List[str] = Field(default_factory=list)
    order: int = Field(default=0)
    is_featured: bool = Field(default=False)
    views_count: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NewsArticle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1, max_length=500)
    featured_image: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    stage_ids: List[str] = Field(default_factory=list)  # المراحل المتعلقة
    is_published: bool = Field(default=False)
    is_featured: bool = Field(default=False)
    views_count: int = Field(default=0)
    author: str = Field(default="الإدارة")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None

# SEO Enhancement Models
class SEOPage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_type: str = Field(..., pattern="^(stage|region|school|student|general)$")
    reference_id: Optional[str] = None  # معرف المرحلة أو المحافظة إلخ
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(..., min_length=1, max_length=300)
    meta_keywords: List[str] = Field(default_factory=list)
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    schema_markup: Optional[dict] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
@api_router.get("/stages", response_model=List[EducationalStage])
async def get_educational_stages():
    """جلب جميع المراحل التعليمية"""
    try:
        cursor = db.educational_stages.find({"is_active": True}).sort("display_order", 1)
        stages = await cursor.to_list(length=100)
        return [EducationalStage(**stage) for stage in stages]
    except Exception as e:
        logger.error(f"Error getting educational stages: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المراحل التعليمية")

@api_router.get("/stages/{stage_id}", response_model=EducationalStage)
async def get_educational_stage(stage_id: str):
    """جلب مرحلة تعليمية محددة"""
    try:
        stage = await db.educational_stages.find_one({"id": stage_id})
        if not stage:
            raise HTTPException(status_code=404, detail="المرحلة التعليمية غير موجودة")
        return EducationalStage(**stage)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting educational stage: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المرحلة التعليمية")

@api_router.post("/admin/stages", response_model=EducationalStage)
async def create_educational_stage(
    stage: StageCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء مرحلة تعليمية جديدة - أدمن فقط"""
    try:
        new_stage = EducationalStage(
            **stage.dict(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await db.educational_stages.insert_one(new_stage.dict())
        return new_stage
    except Exception as e:
        logger.error(f"Error creating educational stage: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء المرحلة التعليمية")

@api_router.put("/admin/stages/{stage_id}", response_model=EducationalStage)
async def update_educational_stage(
    stage_id: str,
    stage_update: StageCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث مرحلة تعليمية - أدمن فقط"""
    try:
        logger.info(f"Updating educational stage with ID: {stage_id}")
        logger.info(f"Update data: {stage_update.dict()}")
        
        existing_stage = await db.educational_stages.find_one({"id": stage_id})
        if not existing_stage:
            logger.warning(f"Educational stage not found: {stage_id}")
            raise HTTPException(status_code=404, detail="المرحلة التعليمية غير موجودة")
        
        logger.info(f"Found existing stage: {existing_stage.get('name')}")
        
        updated_data = {
            **stage_update.dict(),
            "updated_at": datetime.utcnow()
        }
        
        logger.info(f"Prepared update data: {updated_data}")
        
        result = await db.educational_stages.update_one(
            {"id": stage_id},
            {"$set": updated_data}
        )
        
        logger.info(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        
        updated_stage = await db.educational_stages.find_one({"id": stage_id})
        logger.info(f"Updated stage retrieved: {updated_stage.get('name')}")
        
        return EducationalStage(**updated_stage)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating educational stage: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {e}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث المرحلة التعليمية")

@api_router.delete("/admin/stages/{stage_id}")
async def delete_educational_stage(
    stage_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف مرحلة تعليمية - أدمن فقط"""
    try:
        # التحقق من وجود طلاب مرتبطين بهذه المرحلة
        students_count = await db.students.count_documents({"educational_stage_id": stage_id})
        if students_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"لا يمكن حذف المرحلة لوجود {students_count} طالب مرتبط بها"
            )
        
        result = await db.educational_stages.delete_one({"id": stage_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="المرحلة التعليمية غير موجودة")
        
        return {"message": "تم حذف المرحلة التعليمية بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting educational stage: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف المرحلة التعليمية")

@api_router.get("/admin/stages", response_model=List[EducationalStage])
async def get_all_educational_stages_admin(current_user: AdminUser = Depends(get_current_user)):
    """جلب جميع المراحل التعليمية (شامل غير النشطة) - أدمن فقط"""
    try:
        cursor = db.educational_stages.find({}).sort("display_order", 1)
        stages = await cursor.to_list(length=100)
        return [EducationalStage(**stage) for stage in stages]
    except Exception as e:
        logger.error(f"Error getting all educational stages: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المراحل التعليمية")

# Educational Content Management APIs
@api_router.get("/faq", response_model=List[FAQ])
async def get_faq():
    """جلب الأسئلة الشائعة"""
    try:
        cursor = db.faq.find({"is_active": True}).sort("order", 1)
        faqs = await cursor.to_list(length=100)
        return [FAQ(**faq) for faq in faqs]
    except Exception as e:
        logger.error(f"Error getting FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الأسئلة الشائعة")

@api_router.post("/admin/faq", response_model=FAQ)
async def create_faq(
    faq: FAQ,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء سؤال شائع جديد"""
    try:
        await db.faq.insert_one(faq.dict())
        return faq
    except Exception as e:
        logger.error(f"Error creating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء السؤال")

@api_router.put("/admin/faq/{faq_id}", response_model=FAQ)
async def update_faq(
    faq_id: str,
    faq_update: FAQ,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث سؤال شائع"""
    try:
        updated_data = {
            **faq_update.dict(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.faq.update_one(
            {"id": faq_id},
            {"$set": updated_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="السؤال غير موجود")
        
        updated_faq = await db.faq.find_one({"id": faq_id})
        return FAQ(**updated_faq)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث السؤال")

@api_router.get("/guides", response_model=List[EducationalGuide])
async def get_educational_guides(category: Optional[str] = None, stage_id: Optional[str] = None):
    """جلب الأدلة التعليمية"""
    try:
        filter_query = {"is_active": True}
        if category:
            filter_query["category"] = category
        if stage_id:
            filter_query["stage_id"] = stage_id
        
        cursor = db.educational_guides.find(filter_query).sort([("is_featured", -1), ("order", 1)])
        guides = await cursor.to_list(length=100)
        return [EducationalGuide(**guide) for guide in guides]
    except Exception as e:
        logger.error(f"Error getting educational guides: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الأدلة التعليمية")

@api_router.get("/guides/{guide_id}", response_model=EducationalGuide)
async def get_educational_guide(guide_id: str):
    """جلب دليل تعليمي محدد"""
    try:
        guide = await db.educational_guides.find_one({"id": guide_id, "is_active": True})
        if not guide:
            raise HTTPException(status_code=404, detail="الدليل التعليمي غير موجود")
        
        # زيادة عدد المشاهدات
        await db.educational_guides.update_one(
            {"id": guide_id},
            {"$inc": {"views_count": 1}}
        )
        
        return EducationalGuide(**guide)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting educational guide: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الدليل التعليمي")

@api_router.post("/admin/guides", response_model=EducationalGuide)
async def create_educational_guide(
    guide: EducationalGuide,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء دليل تعليمي جديد"""
    try:
        await db.educational_guides.insert_one(guide.dict())
        return guide
    except Exception as e:
        logger.error(f"Error creating educational guide: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الدليل التعليمي")

@api_router.get("/news", response_model=List[NewsArticle])
async def get_news_articles(featured_only: bool = False, limit: int = 20):
    """جلب الأخبار والمقالات"""
    try:
        filter_query = {"is_published": True}
        if featured_only:
            filter_query["is_featured"] = True
        
        cursor = db.news_articles.find(filter_query).sort([("is_featured", -1), ("published_at", -1)]).limit(limit)
        articles = await cursor.to_list(length=limit)
        return [NewsArticle(**article) for article in articles]
    except Exception as e:
        logger.error(f"Error getting news articles: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الأخبار")

@api_router.get("/news/{article_id}", response_model=NewsArticle)
async def get_news_article(article_id: str):
    """جلب مقال إخباري محدد"""
    try:
        article = await db.news_articles.find_one({
            "id": article_id, 
            "is_published": True
        })
        if not article:
            raise HTTPException(status_code=404, detail="المقال غير موجود")
        
        # زيادة عدد المشاهدات
        await db.news_articles.update_one(
            {"id": article_id},
            {"$inc": {"views_count": 1}}
        )
        
        return NewsArticle(**article)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting news article: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المقال")

@api_router.post("/admin/news", response_model=NewsArticle)
async def create_news_article(
    article: NewsArticle,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء مقال إخباري جديد"""
    try:
        if article.is_published and not article.published_at:
            article.published_at = datetime.utcnow()
        
        await db.news_articles.insert_one(article.dict())
        return article
    except Exception as e:
        logger.error(f"Error creating news article: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء المقال")

# Stage Templates Management APIs
@api_router.get("/admin/stage-templates", response_model=List[StageTemplate])
async def get_stage_templates(
    stage_id: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب قوالب المراحل التعليمية"""
    try:
        query = {}
        if stage_id:
            query["stage_id"] = stage_id
        
        cursor = db.stage_templates.find(query).sort("created_at", -1)
        templates = await cursor.to_list(length=100)
        return [StageTemplate(**template) for template in templates]
    except Exception as e:
        logger.error(f"Error getting stage templates: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب قوالب المراحل")

@api_router.post("/admin/stage-templates", response_model=StageTemplate)
async def create_stage_template(
    template: StageTemplateCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء قالب مرحلة تعليمية جديد"""
    try:
        new_template = StageTemplate(
            **template.dict(),
            created_by=current_user.username
        )
        await db.stage_templates.insert_one(new_template.dict())
        return new_template
    except Exception as e:
        logger.error(f"Error creating stage template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء قالب المرحلة")

@api_router.put("/admin/stage-templates/{template_id}", response_model=StageTemplate)
async def update_stage_template(
    template_id: str,
    template_update: StageTemplateCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث قالب مرحلة تعليمية"""
    try:
        update_data = {
            **template_update.dict(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.stage_templates.update_one(
            {"id": template_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        
        updated_template = await db.stage_templates.find_one({"id": template_id})
        return StageTemplate(**updated_template)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stage template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث قالب المرحلة")

@api_router.delete("/admin/stage-templates/{template_id}")
async def delete_stage_template(
    template_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف قالب مرحلة تعليمية"""
    try:
        result = await db.stage_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        return {"message": "تم حذف القالب بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stage template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف القالب")

# Mapping Templates Management APIs
@api_router.get("/admin/mapping-templates", response_model=List[MappingTemplate])
async def get_mapping_templates(
    stage_id: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب قوالب الربط"""
    try:
        query = {"$or": [{"created_by": current_user.username}, {"is_public": True}]}
        if stage_id:
            query["stage_id"] = stage_id
        
        cursor = db.mapping_templates.find(query).sort([("usage_count", -1), ("created_at", -1)])
        templates = await cursor.to_list(length=100)
        return [MappingTemplate(**template) for template in templates]
    except Exception as e:
        logger.error(f"Error getting mapping templates: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب قوالب الربط")

@api_router.post("/admin/mapping-templates", response_model=MappingTemplate)
async def create_mapping_template(
    template: MappingTemplateCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء قالب ربط جديد"""
    try:
        new_template = MappingTemplate(
            **template.dict(),
            created_by=current_user.username
        )
        await db.mapping_templates.insert_one(new_template.dict())
        return new_template
    except Exception as e:
        logger.error(f"Error creating mapping template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء قالب الربط")

@api_router.put("/admin/mapping-templates/{template_id}/use")
async def use_mapping_template(
    template_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """استخدام قالب ربط (زيادة عداد الاستخدام)"""
    try:
        await db.mapping_templates.update_one(
            {"id": template_id},
            {
                "$inc": {"usage_count": 1},
                "$set": {"last_used": datetime.utcnow()}
            }
        )
        return {"message": "تم تحديث عداد الاستخدام"}
    except Exception as e:
        logger.error(f"Error updating template usage: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث الاستخدام")

@api_router.delete("/admin/mapping-templates/{template_id}")
async def delete_mapping_template(
    template_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف قالب ربط"""
    try:
        # التحقق من أن المستخدم هو منشئ القالب أو مدير
        template = await db.mapping_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        
        if template["created_by"] != current_user.username and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="غير مسموح بحذف هذا القالب")
        
        await db.mapping_templates.delete_one({"id": template_id})
        return {"message": "تم حذف القالب بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mapping template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف القالب")

# School and Administration Results APIs
@api_router.get("/schools-summary")
async def get_schools_summary(
    educational_stage_id: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    administration: Optional[str] = Query(None)
):
    """جلب ملخص نتائج المدارس"""
    try:
        match_query = {}
        if educational_stage_id:
            match_query["educational_stage_id"] = educational_stage_id
        if region:
            match_query["region"] = region
        if administration:
            match_query["administration"] = administration
        
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": {
                        "school_name": "$school_name",
                        "administration": "$administration",
                        "region": "$region"
                    },
                    "total_students": {"$sum": 1},
                    "average_score": {"$avg": "$average"},
                    "total_passed": {
                        "$sum": {
                            "$cond": [{"$gte": ["$average", 60]}, 1, 0]
                        }
                    },
                    "highest_score": {"$max": "$average"},
                    "lowest_score": {"$min": "$average"},
                    "students": {"$push": {
                        "student_id": "$student_id",
                        "name": "$name",
                        "average": "$average",
                        "grade": "$grade",
                        "total_score": "$total_score"
                    }}
                }
            },
            {
                "$addFields": {
                    "pass_rate": {
                        "$multiply": [
                            {"$divide": ["$total_passed", "$total_students"]},
                            100
                        ]
                    }
                }
            },
            {"$sort": {"average_score": -1}}
        ]
        
        results = await db.students.aggregate(pipeline).to_list(length=None)
        
        # تنظيم النتائج
        schools_data = []
        for result in results:
            school_info = result["_id"]
            school_data = {
                "school_name": school_info.get("school_name", "غير محدد"),
                "administration": school_info.get("administration", "غير محدد"),
                "region": school_info.get("region", "غير محدد"),
                "statistics": {
                    "total_students": result["total_students"],
                    "average_score": round(result["average_score"], 2),
                    "pass_rate": round(result["pass_rate"], 2),
                    "total_passed": result["total_passed"],
                    "highest_score": round(result["highest_score"], 2),
                    "lowest_score": round(result["lowest_score"], 2)
                },
                "top_students": sorted(result["students"], 
                                     key=lambda x: x["average"], 
                                     reverse=True)[:10]
            }
            schools_data.append(school_data)
        
        return {
            "schools": schools_data,
            "total_schools": len(schools_data),
            "overall_stats": {
                "total_students": sum(s["statistics"]["total_students"] for s in schools_data),
                "overall_average": round(sum(s["statistics"]["average_score"] * s["statistics"]["total_students"] for s in schools_data) / 
                                       sum(s["statistics"]["total_students"] for s in schools_data), 2) if schools_data else 0,
                "overall_pass_rate": round(sum(s["statistics"]["total_passed"] for s in schools_data) / 
                                         sum(s["statistics"]["total_students"] for s in schools_data) * 100, 2) if schools_data else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting schools summary: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب ملخص المدارس")

@api_router.get("/school/{school_name}/students")
async def get_school_students(
    school_name: str,
    educational_stage_id: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """جلب طلاب مدرسة محددة"""
    try:
        query = {"school_name": school_name}
        if educational_stage_id:
            query["educational_stage_id"] = educational_stage_id
        if region:
            query["region"] = region
            
        cursor = db.students.find(query).sort("average", -1)
        students = await cursor.to_list(length=None)
        
        return {
            "school_name": school_name,
            "students": [Student(**student) for student in students],
            "total_students": len(students),
            "statistics": {
                "average_score": round(sum(s["average"] for s in students) / len(students), 2) if students else 0,
                "pass_rate": round(len([s for s in students if s["average"] >= 60]) / len(students) * 100, 2) if students else 0,
                "highest_score": max(s["average"] for s in students) if students else 0,
                "lowest_score": min(s["average"] for s in students) if students else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting school students: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب طلاب المدرسة")

# Dynamic Pages Management APIs
@api_router.get("/stage/{stage_id}/page")
async def get_stage_page(stage_id: str):
    """جلب صفحة مرحلة تعليمية"""
    try:
        # جلب بيانات المرحلة
        stage = await db.educational_stages.find_one({"id": stage_id})
        if not stage:
            raise HTTPException(status_code=404, detail="المرحلة غير موجودة")
        
        # جلب قالب الصفحة
        page_template = await db.page_templates.find_one({"type": "stage", "stage_id": stage_id})
        if not page_template:
            # إنشاء قالب افتراضي
            default_template = {
                "id": str(uuid.uuid4()),
                "type": "stage",
                "stage_id": stage_id,
                "title": f"نتائج {stage['name']}",
                "meta_description": f"استعلام عن نتائج {stage['name']} - [عدد_الطلاب] طالب",
                "content": f"""
                <h1>🎓 نتائج مرحلة {stage['name']}</h1>
                <p>مرحباً بكم في صفحة الاستعلام عن نتائج {stage['name']}</p>
                <p>عدد الطلاب المسجلين: [عدد_الطلاب]</p>
                <p>المحافظات المتاحة: [عدد_المحافظات]</p>
                """,
                "variables": {
                    "[اسم_المرحلة]": stage['name'],
                    "[عدد_الطلاب]": "{{student_count}}",
                    "[عدد_المحافظات]": "{{region_count}}"
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.page_templates.insert_one(default_template)
            page_template = default_template
        
        # حساب الإحصائيات
        student_count = await db.students.count_documents({"educational_stage_id": stage_id})
        regions = await db.students.distinct("region", {"educational_stage_id": stage_id})
        region_count = len([r for r in regions if r])
        
        # استبدال المتغيرات
        content = page_template["content"]
        meta_description = page_template["meta_description"]
        
        variables = {
            "{{student_count}}": str(student_count),
            "{{region_count}}": str(region_count),
            "[اسم_المرحلة]": stage['name'],
            "[عدد_الطلاب]": str(student_count),
            "[عدد_المحافظات]": str(region_count)
        }
        
        for var, value in variables.items():
            content = content.replace(var, value)
            meta_description = meta_description.replace(var, value)
        
        return {
            "stage": stage,
            "template": page_template,
            "content": content,
            "meta": {
                "title": page_template["title"],
                "description": meta_description,
                "keywords": f"{stage['name']}, نتائج, استعلام"
            },
            "statistics": {
                "student_count": student_count,
                "region_count": region_count,
                "regions": regions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stage page: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب صفحة المرحلة")

@api_router.get("/student/{student_id}/page")
async def get_student_page(student_id: str):
    """جلب صفحة الطالب الشخصية"""
    try:
        # جلب بيانات الطالب
        student_data = await db.students.find_one({"student_id": student_id})
        if not student_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الطالب")
        
        student = Student(**student_data)
        
        # جلب معلومات المرحلة
        stage = None
        if student.educational_stage_id:
            stage = await db.educational_stages.find_one({"id": student.educational_stage_id})
        
        # حساب نسبة النجاح المحسنة بناءً على المجموع الكلي
        total_possible = sum(subject.max_score for subject in student.subjects)
        total_achieved = sum(subject.score for subject in student.subjects)
        success_percentage = round((total_achieved / total_possible) * 100, 2) if total_possible > 0 else 0
        
        # جلب قالب صفحة الطالب
        page_template = await db.page_templates.find_one({"type": "student"})
        if not page_template:
            # إنشاء قالب افتراضي
            default_template = {
                "id": str(uuid.uuid4()),
                "type": "student",
                "title": "نتيجة الطالب [اسم_الطالب]",
                "meta_description": "نتيجة الطالب [اسم_الطالب] - رقم الجلوس [رقم_الجلوس] - [اسم_المرحلة]",
                "content": f"""
                <h1>🎓 نتيجة الطالب [اسم_الطالب]</h1>
                <div class="student-info">
                    <p><strong>رقم الجلوس:</strong> [رقم_الجلوس]</p>
                    <p><strong>المرحلة التعليمية:</strong> [اسم_المرحلة]</p>
                    <p><strong>النسبة المئوية:</strong> [النسبة_المئوية]%</p>
                    <p><strong>التقدير:</strong> [التقدير]</p>
                    <p><strong>المدرسة:</strong> [اسم_المدرسة]</p>
                </div>
                """,
                "variables": {
                    "[اسم_الطالب]": "{{student_name}}",
                    "[رقم_الجلوس]": "{{student_id}}",
                    "[اسم_المرحلة]": "{{stage_name}}",
                    "[النسبة_المئوية]": "{{success_percentage}}",
                    "[التقدير]": "{{grade}}",
                    "[اسم_المدرسة]": "{{school_name}}"
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.page_templates.insert_one(default_template)
            page_template = default_template
        
        # استبدال المتغيرات
        content = page_template["content"]
        title = page_template["title"]
        meta_description = page_template["meta_description"]
        
        variables = {
            "{{student_name}}": student.name,
            "{{student_id}}": student.student_id,
            "{{stage_name}}": stage['name'] if stage else "غير محدد",
            "{{success_percentage}}": str(success_percentage),
            "{{grade}}": student.grade or "غير محدد",
            "{{school_name}}": student.school_name or "غير محدد",
            "[اسم_الطالب]": student.name,
            "[رقم_الجلوس]": student.student_id,
            "[اسم_المرحلة]": stage['name'] if stage else "غير محدد",
            "[النسبة_المئوية]": str(success_percentage),
            "[التقدير]": student.grade or "غير محدد",
            "[اسم_المدرسة]": student.school_name or "غير محدد"
        }
        
        for var, value in variables.items():
            content = content.replace(var, value)
            title = title.replace(var, value)
            meta_description = meta_description.replace(var, value)
        
        return {
            "student": student,
            "stage": stage,
            "template": page_template,
            "content": content,
            "success_percentage": success_percentage,
            "meta": {
                "title": title,
                "description": meta_description,
                "keywords": f"{student.name}, {student.student_id}, نتيجة, {stage['name'] if stage else ''}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting student page: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب صفحة الطالب")

# Certificate Generation API  
@api_router.get("/student/{student_id}/certificate")
async def generate_student_certificate(
    student_id: str,
    certificate_type: str = Query("appreciation", pattern="^(appreciation|excellence|honor)$")
):
    """إنشاء شهادة تقدير للطالب"""
    try:
        student_data = await db.students.find_one({"student_id": student_id})
        if not student_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الطالب")
        
        student = Student(**student_data)
        
        # جلب معلومات المرحلة التعليمية
        stage_info = None
        if student.educational_stage_id:
            stage_data = await db.educational_stages.find_one({"id": student.educational_stage_id})
            if stage_data:
                stage_info = stage_data
        
        # تحديد نوع الشهادة
        certificate_templates = {
            "appreciation": {
                "title": "شهادة تقدير",
                "subtitle": "نشهد بأن الطالب/الطالبة",
                "message": "قد حقق/ت نتائج متميزة في الامتحانات",
                "color": "#1e40af"
            },
            "excellence": {
                "title": "شهادة تفوق",
                "subtitle": "نشهد بأن الطالب/الطالبة المتفوق/ة",
                "message": "قد حقق/ت التفوق الأكاديمي",
                "color": "#dc2626"
            },
            "honor": {
                "title": "شهادة شرف",
                "subtitle": "تُمنح هذه الشهادة للطالب/الطالبة المتميز/ة",
                "message": "تقديراً للإنجاز الاستثنائي",
                "color": "#059669"
            }
        }
        
        template = certificate_templates[certificate_type]
        
        certificate_data = {
            "student": {
                "name": student.name,
                "student_id": student.student_id,
                "average": student.average,
                "grade": student.grade,
                "total_score": student.total_score,
                "school_name": student.school_name,
                "administration": student.administration,
                "region": student.region
            },
            "stage": stage_info,
            "template": template,
            "issue_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "certificate_id": f"CERT-{student_id}-{datetime.utcnow().strftime('%Y%m%d')}"
        }
        
        return certificate_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating certificate: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الشهادة")

# Social Share API
@api_router.get("/student/{student_id}/share-card")
async def generate_share_card(
    student_id: str,
    theme: str = Query("default", pattern="^(default|success|excellence|modern)$")
):
    """إنشاء كارد مشاركة النتيجة"""
    try:
        student_data = await db.students.find_one({"student_id": student_id})
        if not student_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الطالب")
        
        student = Student(**student_data)
        
        # جلب معلومات المرحلة
        stage_name = "غير محدد"
        if student.educational_stage_id:
            stage_data = await db.educational_stages.find_one({"id": student.educational_stage_id})
            if stage_data:
                stage_name = stage_data["name"]
        
        # تحديد الثيم
        themes = {
            "default": {
                "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "accent": "#4f46e5",
                "text_color": "#ffffff"
            },
            "success": {
                "background": "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                "accent": "#059669",
                "text_color": "#065f46"
            },
            "excellence": {
                "background": "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                "accent": "#dc2626",
                "text_color": "#7f1d1d"
            },
            "modern": {
                "background": "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                "accent": "#8b5cf6",
                "text_color": "#581c87"
            }
        }
        
        selected_theme = themes[theme]
        
        share_data = {
            "student": {
                "name": student.name,
                "student_id": student.student_id,
                "average": student.average,
                "grade": student.grade,
                "rank_emoji": "🥇" if student.average >= 90 else "🥈" if student.average >= 80 else "🥉" if student.average >= 70 else "📜"
            },
            "stage_name": stage_name,
            "school_name": student.school_name or "غير محدد",
            "theme": selected_theme,
            "share_url": f"https://your-domain.com/result/{student_id}",
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return share_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating share card: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء كارد المشاركة")

# Data Validation API
@api_router.post("/admin/validate-excel-data", response_model=DataValidationResult)
async def validate_excel_data(
    file_hash: str = Query(...),
    mapping: ColumnMapping = None,
    stage_template_id: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """فحص ذكي لبيانات الإكسيل مع اقتراحات للإصلاح"""
    try:
        # جلب بيانات الملف
        file_data = await db.excel_files.find_one({"file_hash": file_hash})
        if not file_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الملف")
        
        # جلب البيانات (مع دعم البيانات المقسمة)
        if "raw_data" in file_data:
            raw_data = file_data['raw_data']
        else:
            chunks = []
            async for chunk in db.excel_data_chunks.find({"file_hash": file_hash}).sort("chunk_index", 1):
                chunks.extend(chunk["chunk_data"])
            raw_data = chunks
            
        df = pd.DataFrame(raw_data)
        
        # جلب قالب المرحلة إذا تم تحديده
        stage_template = None
        if stage_template_id:
            template_data = await db.stage_templates.find_one({"id": stage_template_id})
            if template_data:
                stage_template = StageTemplate(**template_data)
        
        # تنفيذ الفحص الذكي
        validation_result = smart_data_validation(df, stage_template, mapping.dict() if mapping else None)
        
        return validation_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating excel data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في فحص البيانات: {str(e)}")

# Advanced Statistics and Analytics APIs
@api_router.get("/analytics/overview")
async def get_analytics_overview():
    """جلب إحصائيات شاملة للنظام"""
    try:
        # إحصائيات عامة
        total_students = await db.students.count_documents({})
        total_stages = await db.educational_stages.count_documents({"is_active": True})
        
        # إحصائيات حسب المراحل
        stage_stats = []
        stages = await db.educational_stages.find({"is_active": True}).to_list(length=100)
        
        for stage in stages:
            stage_student_count = await db.students.count_documents({"educational_stage_id": stage["id"]})
            if stage_student_count > 0:
                # حساب المتوسط العام للمرحلة
                pipeline = [
                    {"$match": {"educational_stage_id": stage["id"]}},
                    {"$group": {
                        "_id": None,
                        "avg_score": {"$avg": "$average"},
                        "max_score": {"$max": "$average"},
                        "min_score": {"$min": "$average"},
                        "count": {"$sum": 1}
                    }}
                ]
                
                stage_agg = await db.students.aggregate(pipeline).to_list(length=1)
                if stage_agg:
                    stats = stage_agg[0]
                    stage_stats.append({
                        "stage_id": stage["id"],
                        "stage_name": stage["name"],
                        "stage_icon": stage["icon"],
                        "stage_color": stage["color"],
                        "total_students": stage_student_count,
                        "average_score": round(stats["avg_score"], 2) if stats["avg_score"] is not None else 0,
                        "highest_score": stats["max_score"] if stats["max_score"] is not None else 0,
                        "lowest_score": stats["min_score"] if stats["min_score"] is not None else 0,
                        "regions_count": len(stage.get("regions", []))
                    })
        
        # إحصائيات حسب المحافظات
        regions_pipeline = [
            {"$group": {
                "_id": "$region",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"}
            }},
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"count": -1}},
            {"$limit": 20}
        ]
        
        region_stats = await db.students.aggregate(regions_pipeline).to_list(length=20)
        region_stats = [
            {
                "region_name": stat["_id"],
                "total_students": stat["count"],
                "average_score": round(stat["avg_score"], 2) if stat["avg_score"] is not None else 0
            }
            for stat in region_stats
        ]
        
        # أفضل المدارس
        schools_pipeline = [
            {"$match": {"school_name": {"$ne": None, "$ne": ""}}},
            {"$group": {
                "_id": "$school_name",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"},
                "region": {"$first": "$region"},
                "stage": {"$first": "$educational_stage_id"}
            }},
            {"$match": {"count": {"$gte": 5}}},  # مدارس بها 5 طلاب على الأقل
            {"$sort": {"avg_score": -1}},
            {"$limit": 20}
        ]
        
        top_schools = await db.students.aggregate(schools_pipeline).to_list(length=20)
        top_schools = [
            {
                "school_name": school["_id"],
                "total_students": school["count"],
                "average_score": round(school["avg_score"], 2) if school["avg_score"] is not None else 0,
                "region": school["region"],
                "stage_id": school["stage"]
            }
            for school in top_schools
        ]
        
        return {
            "overview": {
                "total_students": total_students,
                "total_stages": total_stages,
                "last_updated": datetime.utcnow().isoformat()
            },
            "stages": stage_stats,
            "regions": region_stats,
            "top_schools": top_schools
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics overview: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الإحصائيات التحليلية")

@api_router.get("/analytics/stage/{stage_id}")
async def get_stage_analytics(stage_id: str):
    """جلب إحصائيات تفصيلية لمرحلة تعليمية"""
    try:
        # التحقق من وجود المرحلة
        stage = await db.educational_stages.find_one({"id": stage_id})
        if not stage:
            raise HTTPException(status_code=404, detail="المرحلة التعليمية غير موجودة")
        
        # إحصائيات عامة للمرحلة
        total_students = await db.students.count_documents({"educational_stage_id": stage_id})
        
        if total_students == 0:
            return {
                "stage_info": {
                    "id": stage["id"],
                    "name": stage["name"],
                    "description": stage["description"],
                    "icon": stage["icon"],
                    "color": stage["color"]
                },
                "statistics": {
                    "total_students": 0,
                    "message": "لا توجد بيانات طلاب لهذه المرحلة"
                }
            }
        
        # إحصائيات تفصيلية
        pipeline = [
            {"$match": {"educational_stage_id": stage_id}},
            {"$group": {
                "_id": None,
                "avg_score": {"$avg": "$average"},
                "max_score": {"$max": "$average"},
                "min_score": {"$min": "$average"},
                "count": {"$sum": 1}
            }}
        ]
        
        stats = await db.students.aggregate(pipeline).to_list(length=1)
        main_stats = stats[0] if stats else {}
        
        # توزيع التقديرات
        grades_pipeline = [
            {"$match": {"educational_stage_id": stage_id}},
            {"$group": {
                "_id": "$grade",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        grades_dist = await db.students.aggregate(grades_pipeline).to_list(length=10)
        
        # إحصائيات المحافظات في هذه المرحلة
        regions_pipeline = [
            {"$match": {"educational_stage_id": stage_id}},
            {"$group": {
                "_id": "$region",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"}
            }},
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"count": -1}}
        ]
        
        regions = await db.students.aggregate(regions_pipeline).to_list(length=50)
        
        # أفضل المدارس في هذه المرحلة
        schools_pipeline = [
            {"$match": {
                "educational_stage_id": stage_id,
                "school_name": {"$ne": None, "$ne": ""}
            }},
            {"$group": {
                "_id": "$school_name",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"},
                "region": {"$first": "$region"}
            }},
            {"$match": {"count": {"$gte": 3}}},
            {"$sort": {"avg_score": -1}},
            {"$limit": 20}
        ]
        
        schools = await db.students.aggregate(schools_pipeline).to_list(length=20)
        
        return {
            "stage_info": {
                "id": stage["id"],
                "name": stage["name"],
                "description": stage["description"],
                "icon": stage["icon"],
                "color": stage["color"],
                "regions": stage.get("regions", [])
            },
            "statistics": {
                "total_students": total_students,
                "average_score": round(main_stats.get("avg_score", 0), 2),
                "highest_score": main_stats.get("max_score", 0),
                "lowest_score": main_stats.get("min_score", 0)
            },
            "grade_distribution": [
                {
                    "grade": item["_id"],
                    "count": item["count"],
                    "percentage": round((item["count"] / total_students) * 100, 2)
                }
                for item in grades_dist
            ],
            "regions_performance": [
                {
                    "region": item["_id"],
                    "total_students": item["count"],
                    "average_score": round(item["avg_score"], 2)
                }
                for item in regions
            ],
            "top_schools": [
                {
                    "school_name": school["_id"],
                    "total_students": school["count"],
                    "average_score": round(school["avg_score"], 2),
                    "region": school["region"]
                }
                for school in schools
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stage analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب إحصائيات المرحلة")

@api_router.get("/analytics/region/{region_name}")
async def get_region_analytics(region_name: str):
    """جلب إحصائيات تفصيلية لمحافظة"""
    try:
        # إحصائيات عامة للمحافظة
        total_students = await db.students.count_documents({"region": region_name})
        
        if total_students == 0:
            raise HTTPException(status_code=404, detail="لا توجد بيانات لهذه المحافظة")
        
        # إحصائيات أساسية
        pipeline = [
            {"$match": {"region": region_name}},
            {"$group": {
                "_id": None,
                "avg_score": {"$avg": "$average"},
                "max_score": {"$max": "$average"},
                "min_score": {"$min": "$average"}
            }}
        ]
        
        stats = await db.students.aggregate(pipeline).to_list(length=1)
        main_stats = stats[0] if stats else {}
        
        # إحصائيات حسب المراحل في هذه المحافظة
        stages_pipeline = [
            {"$match": {"region": region_name}},
            {"$group": {
                "_id": "$educational_stage_id",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        stages_data = await db.students.aggregate(stages_pipeline).to_list(length=10)
        
        # الحصول على أسماء المراحل
        stages_with_names = []
        for stage_data in stages_data:
            stage = await db.educational_stages.find_one({"id": stage_data["_id"]})
            if stage:
                stages_with_names.append({
                    "stage_id": stage["id"],
                    "stage_name": stage["name"],
                    "stage_icon": stage["icon"],
                    "total_students": stage_data["count"],
                    "average_score": round(stage_data["avg_score"], 2)
                })
        
        # أفضل المدارس في المحافظة
        schools_pipeline = [
            {"$match": {
                "region": region_name,
                "school_name": {"$ne": None, "$ne": ""}
            }},
            {"$group": {
                "_id": "$school_name",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$average"},
                "stage": {"$first": "$educational_stage_id"}
            }},
            {"$match": {"count": {"$gte": 3}}},
            {"$sort": {"avg_score": -1}},
            {"$limit": 15}
        ]
        
        schools = await db.students.aggregate(schools_pipeline).to_list(length=15)
        
        return {
            "region_info": {
                "name": region_name,
                "total_students": total_students
            },
            "statistics": {
                "average_score": round(main_stats.get("avg_score", 0), 2),
                "highest_score": main_stats.get("max_score", 0),
                "lowest_score": main_stats.get("min_score", 0)
            },
            "stages_performance": stages_with_names,
            "top_schools": [
                {
                    "school_name": school["_id"],
                    "total_students": school["count"],
                    "average_score": round(school["avg_score"], 2),
                    "stage_id": school["stage"]
                }
                for school in schools
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting region analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب إحصائيات المحافظة")

# SEO and Sitemap APIs
@api_router.get("/seo/sitemap.xml")
async def generate_sitemap():
    """إنشاء خريطة الموقع XML"""
    try:
        # جلب المراحل التعليمية
        stages = await db.educational_stages.find({"is_active": True}).to_list(length=100)
        
        # جلب المحافظات المتاحة
        regions_pipeline = [
            {"$group": {"_id": "$region"}},
            {"$match": {"_id": {"$ne": None, "$ne": ""}}},
            {"$sort": {"_id": 1}}
        ]
        regions = await db.students.aggregate(regions_pipeline).to_list(length=50)
        region_names = [region["_id"] for region in regions]
        
        # جلب المدارس الشائعة
        schools_pipeline = [
            {"$match": {"school_name": {"$ne": None, "$ne": ""}}},
            {"$group": {
                "_id": "$school_name",
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gte": 5}}},
            {"$sort": {"count": -1}},
            {"$limit": 100}
        ]
        schools = await db.students.aggregate(schools_pipeline).to_list(length=100)
        school_names = [school["_id"] for school in schools]
        
        # بناء XML
        from urllib.parse import quote
        
        sitemap_urls = []
        base_url = "https://results-system.com"  # يجب تغييرها للدومين الفعلي
        
        # الصفحة الرئيسية
        sitemap_urls.append({
            "loc": base_url,
            "lastmod": datetime.utcnow().strftime("%Y-%m-%d"),
            "changefreq": "daily",
            "priority": "1.0"
        })
        
        # صفحات المراحل
        for stage in stages:
            stage_name = str(stage['name']) if stage['name'] else ""
            sitemap_urls.append({
                "loc": f"{base_url}/stage/{quote(stage_name)}",
                "lastmod": stage.get("updated_at", datetime.utcnow()).strftime("%Y-%m-%d"),
                "changefreq": "weekly",
                "priority": "0.8"
            })
        
        # صفحات المحافظات
        for region in region_names:
            region_name = str(region) if region else ""
            sitemap_urls.append({
                "loc": f"{base_url}/region/{quote(region_name)}",
                "lastmod": datetime.utcnow().strftime("%Y-%m-%d"),
                "changefreq": "weekly",
                "priority": "0.7"
            })
        
        # صفحات المدارس الرئيسية
        for school in school_names[:50]:  # أول 50 مدرسة فقط
            school_name = str(school) if school else ""
            sitemap_urls.append({
                "loc": f"{base_url}/school/{quote(school_name)}",
                "lastmod": datetime.utcnow().strftime("%Y-%m-%d"),
                "changefreq": "monthly",
                "priority": "0.6"
            })
        
        # صفحات إضافية
        additional_pages = [
            {"path": "/analytics", "priority": "0.7"},
            {"path": "/faq", "priority": "0.6"},
            {"path": "/guide", "priority": "0.6"},
            {"path": "/calculator", "priority": "0.5"},
        ]
        
        for page in additional_pages:
            sitemap_urls.append({
                "loc": f"{base_url}{page['path']}",
                "lastmod": datetime.utcnow().strftime("%Y-%m-%d"),
                "changefreq": "monthly",
                "priority": page["priority"]
            })
        
        # تكوين XML
        xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        for url in sitemap_urls:
            xml_content += f'  <url>\n'
            xml_content += f'    <loc>{url["loc"]}</loc>\n'
            xml_content += f'    <lastmod>{url["lastmod"]}</lastmod>\n'
            xml_content += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
            xml_content += f'    <priority>{url["priority"]}</priority>\n'
            xml_content += f'  </url>\n'
        
        xml_content += '</urlset>'
        
        return Response(content=xml_content, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error generating sitemap: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء خريطة الموقع")

# Calculator API
@api_router.post("/calculator/grade")
async def calculate_grade(request: GradeCalculatorRequest):
    """حاسبة الدرجات والنسب المئوية"""
    try:
        subjects = request.subjects
        
        total_weighted_score = 0
        total_weighted_max = 0
        subject_percentages = []
        
        for subject in subjects:
            if subject.score > subject.max_score:
                raise HTTPException(
                    status_code=400, 
                    detail=f"درجة مادة {subject.name} أكبر من الدرجة النهائية"
                )
            
            percentage = (subject.score / subject.max_score) * 100
            weighted_score = subject.score * subject.weight
            weighted_max = subject.max_score * subject.weight
            
            subject_percentages.append({
                "name": subject.name,
                "score": subject.score,
                "max_score": subject.max_score,
                "weight": subject.weight,
                "percentage": round(percentage, 2)
            })
            
            total_weighted_score += weighted_score
            total_weighted_max += weighted_max
        
        overall_percentage = (total_weighted_score / total_weighted_max) * 100 if total_weighted_max > 0 else 0
        
        # تحديد التقدير
        if overall_percentage >= 90:
            grade = "ممتاز"
        elif overall_percentage >= 80:
            grade = "جيد جداً"
        elif overall_percentage >= 70:
            grade = "جيد"
        elif overall_percentage >= 60:
            grade = "مقبول"
        else:
            grade = "ضعيف"
        
        return {
            "subjects": subject_percentages,
            "total_score": round(total_weighted_score, 2),
            "max_total": round(total_weighted_max, 2),
            "average": round(overall_percentage, 2),
            "grade": grade,
            "success_rate": round((len([s for s in subject_percentages if s["percentage"] >= 50]) / len(subject_percentages)) * 100, 2)
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="يجب إدخال أرقام صحيحة للدرجات")
    except Exception as e:
        logger.error(f"Error in grade calculator: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حساب الدرجات")

# Search suggestions API
@api_router.get("/search/suggestions")
async def get_search_suggestions(q: str = ""):
    """اقتراحات البحث التلقائية"""
    try:
        if len(q) < 2:
            return {"suggestions": []}
        
        suggestions = []
        
        # البحث في أسماء الطلاب
        name_suggestions = await db.students.find(
            {"name": {"$regex": q, "$options": "i"}},
            {"name": 1, "student_id": 1}
        ).limit(5).to_list(length=5)
        
        for student in name_suggestions:
            suggestions.append({
                "type": "student",
                "text": student["name"],
                "subtitle": f"رقم الجلوس: {student['student_id']}",
                "value": student["name"]
            })
        
        # البحث في أرقام الجلوس
        if q.isdigit():
            id_suggestions = await db.students.find(
                {"student_id": {"$regex": f"^{q}"}},
                {"name": 1, "student_id": 1}
            ).limit(3).to_list(length=3)
            
            for student in id_suggestions:
                suggestions.append({
                    "type": "student_id",
                    "text": student["student_id"],
                    "subtitle": student["name"],
                    "value": student["student_id"]
                })
        
        # البحث في أسماء المدارس
        school_suggestions = await db.students.find(
            {
                "school_name": {"$regex": q, "$options": "i"},
                "school_name": {"$ne": None, "$ne": ""}
            },
            {"school_name": 1}
        ).limit(3).to_list(length=3)
        
        unique_schools = list({s["school_name"] for s in school_suggestions})
        for school in unique_schools:
            suggestions.append({
                "type": "school",
                "text": school,
                "subtitle": "مدرسة",
                "value": school
            })
        
        return {"suggestions": suggestions[:10]}
        
    except Exception as e:
        logger.error(f"Error getting search suggestions: {str(e)}")
        return {"suggestions": []}

# ========== Notification System APIs ==========

# Public APIs for subscription
@api_router.post("/subscribe", response_model=Subscriber)
async def subscribe_to_notifications(subscriber: SubscriberCreate):
    """اشتراك في الإشعارات - API عام"""
    try:
        # التحقق من عدم وجود اشتراك مسبق
        existing = await db.subscribers.find_one({"email": subscriber.email})
        if existing:
            # إعادة تفعيل الاشتراك إذا كان معطلاً
            if existing.get("is_active", False):
                raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
            else:
                # إعادة تفعيل الاشتراك
                await db.subscribers.update_one(
                    {"email": subscriber.email},
                    {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
                )
                updated_subscriber = await db.subscribers.find_one({"email": subscriber.email})
                return Subscriber(**updated_subscriber)
        
        # إنشاء مشترك جديد
        subscriber_data = subscriber.dict()
        # التأكد من وجود notification_preferences
        if subscriber_data.get('notification_preferences') is None:
            subscriber_data['notification_preferences'] = {
                "new_results": True,
                "system_updates": True,
                "educational_content": True,
                "emergency_notifications": True
            }
        
        new_subscriber = Subscriber(**subscriber_data)
        await db.subscribers.insert_one(new_subscriber.dict())
        
        # محاكاة إرسال بريد ترحيب
        logger.info(f"Welcome email would be sent to: {subscriber.email}")
        
        return new_subscriber
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subscribing: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في الاشتراك")

@api_router.post("/unsubscribe/{token}")
async def unsubscribe_from_notifications(token: str):
    """إلغاء الاشتراك في الإشعارات"""
    try:
        result = await db.subscribers.update_one(
            {"unsubscribe_token": token},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="رابط إلغاء الاشتراك غير صالح")
        
        return {"message": "تم إلغاء الاشتراك بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إلغاء الاشتراك")

# Admin APIs for notification management
@api_router.get("/admin/subscribers", response_model=List[Subscriber])
async def get_all_subscribers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب جميع المشتركين - أدمن فقط"""
    try:
        total = await db.subscribers.count_documents({})
        cursor = db.subscribers.find({}).sort("subscription_date", -1).skip(skip).limit(limit)
        subscribers = await cursor.to_list(length=limit)
        
        return [Subscriber(**subscriber) for subscriber in subscribers]
        
    except Exception as e:
        logger.error(f"Error getting subscribers: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المشتركين")

@api_router.get("/admin/subscribers/stats")
async def get_subscribers_stats(current_user: AdminUser = Depends(get_current_user)):
    """إحصائيات المشتركين - أدمن فقط"""
    try:
        total_subscribers = await db.subscribers.count_documents({})
        active_subscribers = await db.subscribers.count_documents({"is_active": True})
        verified_subscribers = await db.subscribers.count_documents({"is_verified": True})
        
        # إحصائيات حسب المرحلة التعليمية
        stage_stats = await db.subscribers.aggregate([
            {"$match": {"is_active": True, "educational_stage": {"$ne": None}}},
            {"$group": {"_id": "$educational_stage", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(length=10)
        
        # إحصائيات حسب المحافظة
        region_stats = await db.subscribers.aggregate([
            {"$match": {"is_active": True, "region": {"$ne": None}}},
            {"$group": {"_id": "$region", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(length=15)
        
        return {
            "total_subscribers": total_subscribers,
            "active_subscribers": active_subscribers,
            "verified_subscribers": verified_subscribers,
            "inactive_subscribers": total_subscribers - active_subscribers,
            "stage_distribution": [
                {"stage": stat["_id"], "count": stat["count"]} 
                for stat in stage_stats
            ],
            "region_distribution": [
                {"region": stat["_id"], "count": stat["count"]} 
                for stat in region_stats
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting subscribers stats: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب إحصائيات المشتركين")

@api_router.put("/admin/subscribers/{subscriber_id}", response_model=Subscriber)
async def update_subscriber(
    subscriber_id: str,
    subscriber_update: SubscriberUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث بيانات مشترك - أدمن فقط"""
    try:
        update_data = {k: v for k, v in subscriber_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.subscribers.update_one(
            {"id": subscriber_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المشترك غير موجود")
        
        updated_subscriber = await db.subscribers.find_one({"id": subscriber_id})
        return Subscriber(**updated_subscriber)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subscriber: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث المشترك")

@api_router.delete("/admin/subscribers/{subscriber_id}")
async def delete_subscriber(
    subscriber_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف مشترك - أدمن فقط"""
    try:
        result = await db.subscribers.delete_one({"id": subscriber_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="المشترك غير موجود")
        
        return {"message": "تم حذف المشترك بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting subscriber: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف المشترك")

# Notification management APIs
@api_router.get("/admin/notifications", response_model=List[Notification])
async def get_all_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب جميع الإشعارات - أدمن فقط"""
    try:
        query = {}
        if status:
            query["status"] = status
            
        total = await db.notifications.count_documents(query)
        cursor = db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
        notifications = await cursor.to_list(length=limit)
        
        return [Notification(**notification) for notification in notifications]
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الإشعارات")

@api_router.post("/admin/notifications", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء إشعار جديد - أدمن فقط"""
    try:
        new_notification = Notification(
            **notification.dict(),
            created_by=current_user.username
        )
        
        await db.notifications.insert_one(new_notification.dict())
        
        # إرسال الإشعار فوراً إذا كان مطلوباً
        if notification.send_immediately:
            asyncio.create_task(send_notification_to_subscribers(new_notification))
        
        return new_notification
        
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الإشعار")

@api_router.put("/admin/notifications/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: str,
    notification_update: NotificationUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث إشعار - أدمن فقط"""
    try:
        # التحقق من عدم إرسال الإشعار بعد
        existing = await db.notifications.find_one({"id": notification_id})
        if not existing:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        if existing.get("status") == "sent":
            raise HTTPException(status_code=400, detail="لا يمكن تعديل إشعار تم إرساله")
        
        update_data = {k: v for k, v in notification_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.notifications.update_one(
            {"id": notification_id},
            {"$set": update_data}
        )
        
        updated_notification = await db.notifications.find_one({"id": notification_id})
        return Notification(**updated_notification)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث الإشعار")

@api_router.post("/admin/notifications/{notification_id}/send")
async def send_notification(
    notification_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """إرسال إشعار للمشتركين - أدمن فقط"""
    try:
        notification_data = await db.notifications.find_one({"id": notification_id})
        if not notification_data:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        notification = Notification(**notification_data)
        
        if notification.status == "sent":
            raise HTTPException(status_code=400, detail="تم إرسال هذا الإشعار مسبقاً")
        
        # تحديث حالة الإشعار
        await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"status": "sending", "updated_at": datetime.utcnow()}}
        )
        
        # إرسال الإشعار في background task
        asyncio.create_task(send_notification_to_subscribers(notification))
        
        return {"message": "بدأ إرسال الإشعار للمشتركين"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إرسال الإشعار")

@api_router.delete("/admin/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف إشعار - أدمن فقط"""
    try:
        # التحقق من عدم إرسال الإشعار
        existing = await db.notifications.find_one({"id": notification_id})
        if existing and existing.get("status") == "sent":
            raise HTTPException(status_code=400, detail="لا يمكن حذف إشعار تم إرساله")
        
        result = await db.notifications.delete_one({"id": notification_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        return {"message": "تم حذف الإشعار بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف الإشعار")

# Helper function for sending notifications
async def send_notification_to_subscribers(notification: Notification):
    """إرسال الإشعار للمشتركين (background task)"""
    try:
        # تحديد المشتركين المستهدفين
        query = {"is_active": True}
        
        if notification.target_audience == "stage" and notification.target_stage:
            query["educational_stage"] = notification.target_stage
        elif notification.target_audience == "region" and notification.target_region:
            query["region"] = notification.target_region
        elif notification.target_audience == "custom" and notification.target_subscribers:
            query["id"] = {"$in": notification.target_subscribers}
        
        # تصفية حسب تفضيلات الإشعارات
        if notification.notification_type != "emergency":
            query[f"notification_preferences.{notification.notification_type}"] = True
        
        subscribers = await db.subscribers.find(query).to_list(length=10000)
        
        sent_count = 0
        failed_count = 0
        
        for subscriber in subscribers:
            try:
                # محاكاة إرسال البريد الإلكتروني
                await send_email_notification(subscriber, notification)
                sent_count += 1
                
                # تحديث إحصائيات المشترك
                await db.subscribers.update_one(
                    {"id": subscriber["id"]},
                    {
                        "$set": {"last_notification_sent": datetime.utcnow()},
                        "$inc": {"notification_count": 1}
                    }
                )
                
            except Exception as e:
                logger.error(f"Failed to send notification to {subscriber['email']}: {str(e)}")
                failed_count += 1
        
        # تحديث حالة الإشعار
        await db.notifications.update_one(
            {"id": notification.id},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": datetime.utcnow(),
                    "sent_count": sent_count,
                    "failed_count": failed_count,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Notification {notification.id} sent to {sent_count} subscribers, {failed_count} failed")
        
    except Exception as e:
        logger.error(f"Error in send_notification_to_subscribers: {str(e)}")
        
        # تحديث حالة الإشعار كفاشل
        await db.notifications.update_one(
            {"id": notification.id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.utcnow()
                }
            }
        )

async def send_email_notification(subscriber: dict, notification: Notification):
    """إرسال البريد الإلكتروني (محاكاة)"""
    try:
        # هنا يمكن إضافة تكامل مع خدمة إرسال البريد الإلكتروني مثل SendGrid
        # مثال:
        # import sendgrid
        # sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        
        email_content = f"""
        مرحباً {subscriber['name']},
        
        {notification.content}
        
        ---
        نظام الاستعلام الذكي عن النتائج
        
        لإلغاء الاشتراك: http://localhost:3000/unsubscribe/{subscriber['unsubscribe_token']}
        """
        
        # محاكاة الإرسال
        await asyncio.sleep(0.1)  # محاكاة وقت الإرسال
        
        logger.info(f"Email notification sent to {subscriber['email']}: {notification.title}")
        
    except Exception as e:
        logger.error(f"Error sending email to {subscriber['email']}: {str(e)}")
        raise

# ========== Site Settings & Homepage Builder APIs ==========

# Site Settings APIs
@api_router.get("/site-settings", response_model=SiteSettings)
async def get_site_settings():
    """جلب إعدادات الموقع العامة"""
    try:
        settings = await db.site_settings.find_one({})
        if not settings:
            # إنشاء إعدادات افتراضية
            default_settings = SiteSettings()
            await db.site_settings.insert_one(default_settings.dict())
            return default_settings
        
        return SiteSettings(**settings)
        
    except Exception as e:
        logger.error(f"Error getting site settings: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب إعدادات الموقع")

@api_router.put("/admin/site-settings", response_model=SiteSettings)
async def update_site_settings(
    settings_update: SiteSettingsUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث إعدادات الموقع - أدمن فقط"""
    try:
        # الحصول على الإعدادات الحالية أو إنشاء جديدة
        existing_settings = await db.site_settings.find_one({})
        if not existing_settings:
            settings = SiteSettings()
            await db.site_settings.insert_one(settings.dict())
            existing_settings = settings.dict()
        
        # تحديث الحقول المُرسلة فقط
        update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.site_settings.update_one(
            {"id": existing_settings["id"]},
            {"$set": update_data}
        )
        
        # جلب الإعدادات المحدثة
        updated_settings = await db.site_settings.find_one({"id": existing_settings["id"]})
        return SiteSettings(**updated_settings)
        
    except Exception as e:
        logger.error(f"Error updating site settings: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث إعدادات الموقع")

# Homepage & Blocks APIs
@api_router.get("/homepage", response_model=Homepage)
async def get_homepage():
    """جلب تكوين الصفحة الرئيسية"""
    try:
        homepage = await db.homepage.find_one({})
        if not homepage:
            # إنشاء صفحة رئيسية افتراضية
            default_homepage = Homepage()
            await db.homepage.insert_one(default_homepage.dict())
            return default_homepage
        
        return Homepage(**homepage)
        
    except Exception as e:
        logger.error(f"Error getting homepage: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الصفحة الرئيسية")

@api_router.get("/homepage/blocks")
async def get_homepage_blocks():
    """جلب جميع بلوكات الصفحة الرئيسية مرتبة"""
    try:
        # جلب تكوين الصفحة الرئيسية
        homepage = await db.homepage.find_one({})
        if not homepage:
            return {"blocks": []}
        
        # جلب البلوكات بالترتيب المحدد
        blocks = []
        if homepage.get("blocks"):
            for block_id in homepage["blocks"]:
                block = await db.page_blocks.find_one({"id": block_id})
                if block:
                    blocks.append(PageBlock(**block))
        
        # إضافة البلوكات غير المرتبة
        unordered_blocks = await db.page_blocks.find({
            "id": {"$nin": homepage.get("blocks", [])},
            "is_visible": True
        }).sort("order_index", 1).to_list(length=50)
        
        for block in unordered_blocks:
            blocks.append(PageBlock(**block))
        
        return {"blocks": blocks}
        
    except Exception as e:
        logger.error(f"Error getting homepage blocks: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب بلوكات الصفحة")

@api_router.put("/admin/homepage/blocks-order")
async def update_blocks_order(
    blocks_order: List[str],
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث ترتيب البلوكات - أدمن فقط"""
    try:
        # تحديث ترتيب البلوكات في الصفحة الرئيسية
        homepage = await db.homepage.find_one({})
        if not homepage:
            homepage = Homepage()
            await db.homepage.insert_one(homepage.dict())
            homepage = homepage.dict()
        
        await db.homepage.update_one(
            {"id": homepage["id"]},
            {
                "$set": {
                    "blocks": blocks_order,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # تحديث order_index لكل بلوك
        for index, block_id in enumerate(blocks_order):
            await db.page_blocks.update_one(
                {"id": block_id},
                {"$set": {"order_index": index}}
            )
        
        return {"message": "تم تحديث ترتيب البلوكات بنجاح"}
        
    except Exception as e:
        logger.error(f"Error updating blocks order: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث ترتيب البلوكات")

# Page Blocks CRUD APIs
@api_router.get("/admin/blocks", response_model=List[PageBlock])
async def get_all_blocks(
    block_type: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب جميع البلوكات - أدمن فقط"""
    try:
        query = {}
        if block_type:
            query["block_type"] = block_type
        if section:
            query["section"] = section
        
        blocks = await db.page_blocks.find(query).sort("order_index", 1).to_list(length=100)
        return [PageBlock(**block) for block in blocks]
        
    except Exception as e:
        logger.error(f"Error getting blocks: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب البلوكات")

@api_router.post("/admin/blocks", response_model=PageBlock)
async def create_block(
    block: PageBlockCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء بلوك جديد - أدمن فقط"""
    try:
        # تحديد المحتوى الافتراضي حسب نوع البلوك
        default_content = get_default_block_content(block.block_type)
        
        new_block = PageBlock(
            **block.dict(),
            content={**default_content, **block.content}
        )
        
        await db.page_blocks.insert_one(new_block.dict())
        return new_block
        
    except Exception as e:
        logger.error(f"Error creating block: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء البلوك")

@api_router.put("/admin/blocks/{block_id}", response_model=PageBlock)
async def update_block(
    block_id: str,
    block_update: PageBlockUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث بلوك - أدمن فقط"""
    try:
        update_data = {k: v for k, v in block_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.page_blocks.update_one(
            {"id": block_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="البلوك غير موجود")
        
        updated_block = await db.page_blocks.find_one({"id": block_id})
        return PageBlock(**updated_block)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating block: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث البلوك")

@api_router.delete("/admin/blocks/{block_id}")
async def delete_block(
    block_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف بلوك - أدمن فقط"""
    try:
        result = await db.page_blocks.delete_one({"id": block_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="البلوك غير موجود")
        
        # إزالة البلوك من ترتيب الصفحة الرئيسية
        await db.homepage.update_one(
            {},
            {"$pull": {"blocks": block_id}}
        )
        
        return {"message": "تم حذف البلوك بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting block: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف البلوك")

@api_router.get("/admin/blocks/templates")
async def get_block_templates(current_user: AdminUser = Depends(get_current_user)):
    """جلب قوالب البلوكات المتاحة - أدمن فقط"""
    try:
        templates = {
            "hero": {
                "name": "قسم البطل الرئيسي",
                "description": "قسم ترحيبي بعنوان وزر إجراء",
                "icon": "🚀",
                "fields": ["title", "subtitle", "button_text", "button_link", "background_image"]
            },
            "features": {
                "name": "المميزات",
                "description": "عرض مميزات وخدمات الموقع",
                "icon": "✨",
                "fields": ["title", "subtitle", "features_list"]
            },
            "statistics": {
                "name": "الإحصائيات",
                "description": "عرض أرقام وإحصائيات مهمة",
                "icon": "📊",
                "fields": ["title", "stats_list"]
            },
            "testimonials": {
                "name": "آراء المستخدمين",
                "description": "عرض تقييمات وآراء العملاء",
                "icon": "💬",
                "fields": ["title", "testimonials_list"]
            },
            "news": {
                "name": "آخر الأخبار",
                "description": "عرض آخر الأخبار والمقالات",
                "icon": "📰",
                "fields": ["title", "subtitle", "news_count", "show_excerpt"]
            },
            "faq": {
                "name": "الأسئلة الشائعة",
                "description": "عرض الأسئلة المتكررة وإجاباتها",
                "icon": "❓",
                "fields": ["title", "subtitle", "faq_count"]
            },
            "search": {
                "name": "نموذج البحث",
                "description": "نموذج البحث الرئيسي للموقع",
                "icon": "🔍",
                "fields": ["title", "placeholder", "show_voice_search"]
            },
            "newsletter": {
                "name": "النشرة الإخبارية",
                "description": "نموذج الاشتراك في الإشعارات",
                "icon": "📧",
                "fields": ["title", "subtitle", "show_advanced_form"]
            },
            "contact": {
                "name": "معلومات التواصل",
                "description": "عرض معلومات الاتصال والعنوان",
                "icon": "📞",
                "fields": ["title", "show_map", "show_social_links"]
            },
            "custom_html": {
                "name": "HTML مخصص",
                "description": "محتوى HTML مخصص",
                "icon": "🔧",
                "fields": ["html_content", "css_styles"]
            },
            "gallery": {
                "name": "معرض الصور",
                "description": "عرض مجموعة من الصور",
                "icon": "🖼️",
                "fields": ["title", "images_list", "layout_type"]
            },
            "spacer": {
                "name": "فاصل",
                "description": "مساحة فارغة للتنسيق",
                "icon": "📏",
                "fields": ["height", "background_color"]
            }
        }
        
        return {"templates": templates}
        
    except Exception as e:
        logger.error(f"Error getting block templates: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب قوالب البلوكات")

def get_default_block_content(block_type: str) -> Dict:
    """الحصول على المحتوى الافتراضي لنوع البلوك"""
    defaults = {
        "hero": {
            "title": "مرحباً بك في نظام الاستعلام الذكي",
            "subtitle": "اكتشف نتائجك بسهولة وسرعة مع أطلما النظام المتطور",
            "button_text": "ابدأ الاستعلام الآن",
            "button_link": "#search",
            "background_image": ""
        },
        "features": {
            "title": "مميزات النظام",
            "subtitle": "أدوات وخدمات متقدمة للطلاب وأولياء الأمور",
            "features_list": [
                {
                    "icon": "🔍",
                    "title": "بحث ذكي",
                    "description": "بحث سريع ودقيق عن النتائج"
                },
                {
                    "icon": "📊",
                    "title": "إحصائيات مفصلة",
                    "description": "تحليل شامل للدرجات والأداء"
                },
                {
                    "icon": "🏆",
                    "title": "شهادات تقدير",
                    "description": "إنشاء شهادات احترافية قابلة للطباعة"
                }
            ]
        },
        "statistics": {
            "title": "إحصائيات النظام",
            "stats_list": [
                {"label": "إجمالي الطلاب", "value": "10,000+", "icon": "👥"},
                {"label": "المدارس المشاركة", "value": "500+", "icon": "🏫"},
                {"label": "معدل النجاح", "value": "95%", "icon": "📈"},
                {"label": "رضا المستخدمين", "value": "4.9/5", "icon": "⭐"}
            ]
        },
        "testimonials": {
            "title": "آراء المستخدمين",
            "testimonials_list": [
                {
                    "name": "أحمد محمد",
                    "role": "ولي أمر",
                    "content": "نظام رائع وسهل الاستخدام، ساعدني في متابعة نتائج أبنائي بسهولة",
                    "rating": 5
                }
            ]
        },
        "news": {
            "title": "آخر الأخبار",
            "subtitle": "تابع آخر الأخبار والتحديثات",
            "news_count": 6,
            "show_excerpt": True
        },
        "faq": {
            "title": "الأسئلة الشائعة",
            "subtitle": "إجابات على الأسئلة الأكثر تكراراً",
            "faq_count": 5
        },
        "search": {
            "title": "ابحث عن نتيجتك",
            "placeholder": "ابحث برقم الجلوس أو الاسم...",
            "show_voice_search": True
        },
        "newsletter": {
            "title": "احصل على إشعارات فورية",
            "subtitle": "كن أول من يعلم بظهور النتائج الجديدة",
            "show_advanced_form": True
        },
        "contact": {
            "title": "تواصل معنا",
            "show_map": False,
            "show_social_links": True
        },
        "custom_html": {
            "html_content": "<div class='text-center p-8'><h2>محتوى مخصص</h2><p>يمكنك إضافة أي محتوى HTML هنا</p></div>",
            "css_styles": ""
        },
        "gallery": {
            "title": "معرض الصور",
            "images_list": [],
            "layout_type": "grid"
        },
        "spacer": {
            "height": "50px",
            "background_color": "transparent"
        }
    }
    
    return defaults.get(block_type, {})
@api_router.get("/certificate-templates", response_model=List[CertificateTemplate])
async def get_public_certificate_templates():
    """جلب قوالب الشهادات - API عام"""
    try:
        cursor = db.certificate_templates.find({"is_active": True}).sort("usage_count", -1)
        templates = await cursor.to_list(length=100)
        return [CertificateTemplate(**template) for template in templates]
    except Exception as e:
        logger.error(f"Error getting public certificate templates: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب قوالب الشهادات")

@api_router.get("/admin/certificate-templates", response_model=List[CertificateTemplate])
async def get_certificate_templates(current_user: AdminUser = Depends(get_current_user)):
    """جلب قوالب الشهادات"""
    try:
        cursor = db.certificate_templates.find({}).sort("usage_count", -1)
        templates = await cursor.to_list(length=100)
        return [CertificateTemplate(**template) for template in templates]
    except Exception as e:
        logger.error(f"Error getting certificate templates: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب قوالب الشهادات")

@api_router.post("/admin/certificate-templates", response_model=CertificateTemplate)
async def create_certificate_template(
    template: CertificateTemplateCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """إنشاء قالب شهادة جديد"""
    try:
        new_template = CertificateTemplate(
            **template.dict(),
            created_by=current_user.username
        )
        await db.certificate_templates.insert_one(new_template.dict())
        return new_template
    except Exception as e:
        logger.error(f"Error creating certificate template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء قالب الشهادة")

@api_router.put("/admin/certificate-templates/{template_id}", response_model=CertificateTemplate)
async def update_certificate_template(
    template_id: str,
    template_update: CertificateTemplateCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث قالب شهادة"""
    try:
        update_data = {
            **template_update.dict(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.certificate_templates.update_one(
            {"id": template_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        
        updated_template = await db.certificate_templates.find_one({"id": template_id})
        return CertificateTemplate(**updated_template)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating certificate template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث القالب")

@api_router.delete("/admin/certificate-templates/{template_id}")
async def delete_certificate_template(
    template_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف قالب شهادة"""
    try:
        result = await db.certificate_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        return {"message": "تم حذف القالب بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting certificate template: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف القالب")

@api_router.get("/student/{student_id}/certificate/{template_id}")
async def generate_certificate_from_template(
    student_id: str,
    template_id: str
):
    """إنشاء شهادة من قالب محدد"""
    try:
        # جلب بيانات الطالب
        student_data = await db.students.find_one({"student_id": student_id})
        if not student_data:
            raise HTTPException(status_code=404, detail="الطالب غير موجود")
        
        student = Student(**student_data)
        
        # جلب قالب الشهادة
        template = await db.certificate_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(status_code=404, detail="قالب الشهادة غير موجود")
        
        # جلب معلومات المرحلة
        stage = None
        if student.educational_stage_id:
            stage = await db.educational_stages.find_one({"id": student.educational_stage_id})
        
        # استبدال المتغيرات
        html_content = template["html_content"]
        css_styles = template["css_styles"]
        
        variables = {
            "[اسم_الطالب]": student.name,
            "[رقم_الجلوس]": student.student_id,
            "[المتوسط]": str(student.average),
            "[التقدير]": student.grade or "غير محدد",
            "[اسم_المرحلة]": stage['name'] if stage else "غير محدد",
            "[اسم_المدرسة]": student.school_name or "غير محدد",
            "[الإدارة]": student.administration or "غير محدد",
            "[المحافظة]": student.region or "غير محدد",
            "[التاريخ]": datetime.utcnow().strftime("%Y-%m-%d"),
            "[رقم_الشهادة]": f"{student.student_id}-{datetime.utcnow().strftime('%Y%m%d')}"
        }
        
        for var, value in variables.items():
            html_content = html_content.replace(var, value)
            css_styles = css_styles.replace(var, value)
        
        # تحديث عداد الاستخدام
        await db.certificate_templates.update_one(
            {"id": template_id},
            {"$inc": {"usage_count": 1}}
        )
        
        return {
            "template": template,
            "student": student,
            "stage": stage,
            "html_content": html_content,
            "css_styles": css_styles,
            "certificate_id": f"{student.student_id}-{datetime.utcnow().strftime('%Y%m%d')}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating certificate: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الشهادة")

# System Settings Management APIs
@api_router.get("/admin/settings", response_model=SystemSettings)
async def get_system_settings(current_user: AdminUser = Depends(get_current_user)):
    """جلب إعدادات النظام - أدمن فقط"""
    try:
        settings = await db.system_settings.find_one({})
        if not settings:
            await create_default_system_settings()
            settings = await db.system_settings.find_one({})
        return SystemSettings(**settings)
    except Exception as e:
        logger.error(f"Error getting system settings: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب إعدادات النظام")

@api_router.put("/admin/settings", response_model=SystemSettings)
async def update_system_settings(
    settings_update: SystemSettingsUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث إعدادات النظام - أدمن فقط"""
    try:
        # جلب الإعدادات الحالية
        existing_settings = await db.system_settings.find_one({})
        if not existing_settings:
            await create_default_system_settings()
            existing_settings = await db.system_settings.find_one({})
        
        # تحديث الحقول المرسلة فقط
        update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await db.system_settings.update_one(
            {"id": existing_settings["id"]},
            {"$set": update_data}
        )
        
        # جلب الإعدادات المحدثة
        updated_settings = await db.system_settings.find_one({"id": existing_settings["id"]})
        return SystemSettings(**updated_settings)
        
    except Exception as e:
        logger.error(f"Error updating system settings: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث إعدادات النظام")

@api_router.post("/admin/settings/backup")
async def create_backup(current_user: AdminUser = Depends(get_current_user)):
    """إنشاء نسخة احتياطية - أدمن فقط"""
    try:
        # محاكاة عملية النسخ الاحتياطي
        await asyncio.sleep(2)  # محاكاة وقت المعالجة
        
        # تحديث وقت آخر نسخة احتياطية
        await db.system_settings.update_one(
            {},
            {"$set": {"last_backup": datetime.utcnow(), "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "تم إنشاء النسخة الاحتياطية بنجاح", "timestamp": datetime.utcnow().isoformat()}
        
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء النسخة الاحتياطية")

# Public API Endpoints (للصفحة العامة)
@api_router.get("/")
async def root():
    return {
        "message": "نظام الاستعلام الذكي عن النتائج - الإصدار المتكامل",
        "version": "3.0.0",
        "status": "active"
    }

@api_router.get("/content")
async def get_site_content():
    """جلب محتوى الموقع للصفحة العامة"""
    try:
        content = await db.site_content.find_one({})
        if not content:
            await create_default_content()
            content = await db.site_content.find_one({})
        
        return SiteContent(**content)
    except Exception as e:
        logger.error(f"Error getting site content: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب محتوى الموقع")

@api_router.post("/search", response_model=List[Student])
async def search_students(request: SearchRequest):
    """البحث عن الطلاب - API عام"""
    try:
        query = {}
        
        if request.search_type == "student_id":
            query["student_id"] = {"$regex": sanitize_string(request.query), "$options": "i"}
        elif request.search_type == "name":
            query["name"] = {"$regex": sanitize_string(request.query), "$options": "i"}
        else:
            search_term = sanitize_string(request.query)
            query["$or"] = [
                {"student_id": {"$regex": search_term, "$options": "i"}},
                {"name": {"$regex": search_term, "$options": "i"}}
            ]
        
        # إضافة فلاتر المرحلة التعليمية والمحافظة
        if request.educational_stage_id:
            query["educational_stage_id"] = sanitize_string(request.educational_stage_id)
        
        if request.region_filter:
            query["region"] = sanitize_string(request.region_filter)
        
        if request.class_filter:
            query["class_name"] = sanitize_string(request.class_filter)
        
        if request.section_filter:
            query["section"] = sanitize_string(request.section_filter)
        
        # فلتر الإدارة التعليمية
        if hasattr(request, 'administration_filter') and request.administration_filter:
            query["administration"] = sanitize_string(request.administration_filter)
        
        cursor = db.students.find(query).limit(50)
        results = await cursor.to_list(length=50)
        
        return [Student(**student) for student in results]
        
    except Exception as e:
        logger.error(f"Error searching students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في البحث: {str(e)}")

@api_router.get("/student/{student_id}", response_model=Student)
async def get_student(student_id: str):
    """الحصول على بيانات طالب محدد - API عام"""
    try:
        sanitized_id = sanitize_string(student_id)
        student_data = await db.students.find_one({"student_id": sanitized_id})
        
        if not student_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الطالب")
        
        return Student(**student_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب بيانات الطالب: {str(e)}")

@api_router.get("/stats")
async def get_statistics(stage_id: Optional[str] = Query(None), region: Optional[str] = Query(None)):
    """إحصائيات عامة للنظام - API عام مع إمكانية الفلترة"""
    try:
        query = {}
        if stage_id:
            query["educational_stage_id"] = stage_id
        if region:
            query["region"] = region
            
        total_students = await db.students.count_documents(query)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None,
                "avg_total": {"$avg": "$total_score"},
                "max_total": {"$max": "$total_score"},
                "min_total": {"$min": "$total_score"}
            }}
        ]
        stats_result = await db.students.aggregate(pipeline).to_list(1)
        
        stats = {
            "total_students": total_students,
            "average_score": round(stats_result[0]["avg_total"], 2) if stats_result else 0,
            "highest_score": stats_result[0]["max_total"] if stats_result else 0,
            "lowest_score": stats_result[0]["min_total"] if stats_result else 0
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإحصائيات: {str(e)}")

# Admin Authentication Endpoints
@api_router.post("/admin/login", response_model=Token)
async def admin_login(login_data: AdminLogin):
    """تسجيل دخول الأدمن"""
    try:
        user = await db.admin_users.find_one({"username": login_data.username})
        if not user or not verify_password(login_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="اسم المستخدم أو كلمة المرور غير صحيحة",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="الحساب غير مفعل"
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin login: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تسجيل الدخول")

@api_router.get("/admin/me", response_model=AdminUser)
async def get_current_admin(current_user: AdminUser = Depends(get_current_user)):
    """الحصول على بيانات الأدمن الحالي"""
    return current_user

# Admin Management Endpoints
@api_router.post("/admin/upload-excel", response_model=ExcelAnalysis)
async def admin_upload_excel(
    file: UploadFile = File(...),
    current_user: AdminUser = Depends(get_current_user)
):
    """رفع وتحليل ملف الإكسيل - أدمن فقط"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم. يرجى رفع ملف Excel فقط")
        
        content = await file.read()
        file_hash = calculate_file_hash(content)
        
        # التحقق من حجم الملف
        file_size_mb = len(content) / (1024 * 1024)  # حساب الحجم بالميجابايت
        
        # جلب الحد الأقصى من إعدادات النظام
        system_settings = await db.system_settings.find_one({})
        max_file_size = system_settings.get('max_file_size', 50) if system_settings else 50  # افتراضي 50 MB
        
        if file_size_mb > max_file_size:
            raise HTTPException(status_code=413, detail=f"حجم الملف ({file_size_mb:.1f} MB) يتجاوز الحد الأقصى المسموح ({max_file_size} MB)")
        
        existing_file = await db.excel_files.find_one({"file_hash": file_hash})
        if existing_file:
            return ExcelAnalysis(**existing_file)
        
        try:
            df = pd.read_excel(BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"خطأ في قراءة ملف الإكسيل: {str(e)}")
        
        if df.empty:
            raise HTTPException(status_code=400, detail="الملف فارغ أو لا يحتوي على بيانات صالحة")
        
        df.columns = [sanitize_string(str(col)) for col in df.columns]
        
        columns = df.columns.tolist()
        suggested_mappings = {}
        
        for col in columns:
            suggested_type = detect_column_type(df[col], col)
            if suggested_type not in suggested_mappings.values() or suggested_type == 'subject':
                suggested_mappings[col] = suggested_type
        
        sample_data = []
        for _, row in df.head(5).iterrows():
            sample_row = {}
            for col in columns:
                value = row[col]
                if pd.isna(value):
                    sample_row[col] = ""
                else:
                    sample_row[col] = sanitize_string(str(value))
            sample_data.append(sample_row)
        
        analysis = ExcelAnalysis(
            filename=sanitize_string(file.filename),
            columns=columns,
            sample_data=sample_data,
            suggested_mappings=suggested_mappings,
            total_rows=len(df),
            file_hash=file_hash
        )
        
        # حفظ البيانات بطريقة محسنة للملفات الكبيرة
        file_data = {
            **analysis.dict(),
            "uploaded_by": current_user.username,
            "created_at": datetime.utcnow(),
            "file_size_mb": round(file_size_mb, 2)
        }
        
        # تقسيم البيانات إذا كانت كبيرة لتجنب حد MongoDB
        raw_data = df.to_dict('records')
        
        # حفظ البيانات في مجموعات أصغر إذا لزم الأمر
        if len(raw_data) > 1000:  # إذا كان أكثر من 1000 صف
            # حفظ البيانات الأساسية بدون raw_data أولاً
            await db.excel_files.insert_one(file_data)
            
            # حفظ البيانات الخام في مجموعات منفصلة
            chunk_size = 1000
            for i in range(0, len(raw_data), chunk_size):
                chunk = raw_data[i:i + chunk_size]
                chunk_data = {
                    "file_hash": file_hash,
                    "chunk_index": i // chunk_size,
                    "chunk_data": chunk,
                    "created_at": datetime.utcnow()
                }
                await db.excel_data_chunks.insert_one(chunk_data)
        else:
            # للملفات الصغيرة، احفظ كما هو
            file_data["raw_data"] = raw_data
            await db.excel_files.insert_one(file_data)
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في معالجة الملف: {str(e)}")

@api_router.post("/admin/process-excel")
async def admin_process_excel(
    file_hash: str = Query(...),
    mapping: ColumnMapping = None,
    educational_stage_id: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_user)
):
    """معالجة ملف الإكسيل وحفظ بيانات الطلاب - أدمن فقط"""
    try:
        file_data = await db.excel_files.find_one({"file_hash": file_hash})
        if not file_data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الملف")
        
        # جلب البيانات - إما من raw_data أو من الـ chunks
        if "raw_data" in file_data:
            # ملف صغير - البيانات محفوظة مباشرة
            raw_data = file_data['raw_data']
        else:
            # ملف كبير - البيانات مقسمة في chunks
            chunks = []
            async for chunk in db.excel_data_chunks.find({"file_hash": file_hash}).sort("chunk_index", 1):
                chunks.extend(chunk["chunk_data"])
            raw_data = chunks
            
        if not raw_data:
            raise HTTPException(status_code=400, detail="لا توجد بيانات في الملف")
        
        df = pd.DataFrame(raw_data)
        processed_students = []
        errors = []
        
        required_columns = [mapping.student_id_column, mapping.name_column] + mapping.subject_columns
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"أعمدة مفقودة: {', '.join(missing_columns)}")
        
        for index, row in df.iterrows():
            try:
                student_id = sanitize_string(str(row[mapping.student_id_column]))
                name = sanitize_string(str(row[mapping.name_column]))
                
                if not student_id or not name:
                    errors.append(f"الصف {index + 1}: بيانات ناقصة")
                    continue
                
                subjects = []
                for subject_col in mapping.subject_columns:
                    try:
                        score = pd.to_numeric(row[subject_col], errors='coerce')
                        if not pd.isna(score):
                            subjects.append(StudentSubject(
                                name=sanitize_string(subject_col),
                                score=float(score)
                            ))
                    except Exception as e:
                        logger.warning(f"Error processing subject {subject_col} for student {student_id}: {str(e)}")
                
                additional_info = {}
                class_name = None
                section = None
                total_score = None
                school_name = None
                administration = None
                school_code = None
                
                if mapping.class_column and mapping.class_column in df.columns:
                    class_name = sanitize_string(str(row[mapping.class_column]))
                
                if mapping.section_column and mapping.section_column in df.columns:
                    section = sanitize_string(str(row[mapping.section_column]))
                
                if mapping.total_column and mapping.total_column in df.columns:
                    try:
                        total_score = float(pd.to_numeric(row[mapping.total_column], errors='coerce'))
                    except:
                        pass
                
                # معالجة معلومات المدرسة والإدارة
                if hasattr(mapping, 'school_column') and mapping.school_column and mapping.school_column in df.columns:
                    school_name = sanitize_string(str(row[mapping.school_column]))
                
                if hasattr(mapping, 'administration_column') and mapping.administration_column and mapping.administration_column in df.columns:
                    administration = sanitize_string(str(row[mapping.administration_column]))
                    
                if hasattr(mapping, 'school_code_column') and mapping.school_code_column and mapping.school_code_column in df.columns:
                    school_code = sanitize_string(str(row[mapping.school_code_column]))
                
                student = Student(
                    student_id=student_id,
                    name=name,
                    subjects=subjects,
                    total_score=total_score,
                    class_name=class_name,
                    section=section,
                    educational_stage_id=educational_stage_id,  # ربط بالمرحلة التعليمية
                    region=region,  # ربط بالمحافظة
                    school_name=school_name,  # اسم المدرسة
                    administration=administration,  # الإدارة التعليمية
                    school_code=school_code,  # كود المدرسة
                    additional_info=additional_info
                )
                
                processed_students.append(student)
                
            except Exception as e:
                errors.append(f"الصف {index + 1}: {str(e)}")
                continue
        
        if processed_students:
            students_data = [student.dict() for student in processed_students]
            
            for student_data in students_data:
                student_data['processed_by'] = current_user.username
                student_data['processed_at'] = datetime.utcnow()
                await db.students.replace_one(
                    {"student_id": student_data["student_id"]},
                    student_data,
                    upsert=True
                )
        
        return {
            "message": "تم معالجة البيانات بنجاح",
            "processed_count": len(processed_students),
            "error_count": len(errors),
            "errors": errors[:10]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في معالجة البيانات: {str(e)}")

@api_router.get("/admin/content", response_model=SiteContent)
async def get_admin_content(current_user: AdminUser = Depends(get_current_user)):
    """جلب محتوى الموقع للأدمن"""
    try:
        content = await db.site_content.find_one({})
        if not content:
            await create_default_content()
            content = await db.site_content.find_one({})
        
        return SiteContent(**content)
    except Exception as e:
        logger.error(f"Error getting admin content: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب محتوى الموقع")

@api_router.put("/admin/content")
async def update_site_content(
    content: SiteContent,
    current_user: AdminUser = Depends(get_current_user)
):
    """تحديث محتوى الموقع - أدمن فقط"""
    try:
        content.updated_at = datetime.utcnow()
        await db.site_content.replace_one(
            {},
            {**content.dict(), "updated_by": current_user.username},
            upsert=True
        )
        
        return {"message": "تم تحديث محتوى الموقع بنجاح"}
        
    except Exception as e:
        logger.error(f"Error updating site content: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث محتوى الموقع")

@api_router.get("/admin/students")
async def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: AdminUser = Depends(get_current_user)
):
    """جلب جميع الطلاب مع pagination - أدمن فقط"""
    try:
        total = await db.students.count_documents({})
        cursor = db.students.find({}).skip(skip).limit(limit)
        students = await cursor.to_list(length=limit)
        
        return {
            "total": total,
            "students": [Student(**student) for student in students],
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error getting all students: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب بيانات الطلاب")

@api_router.delete("/admin/students/{student_id}")
async def delete_student(
    student_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """حذف طالب - أدمن فقط"""
    try:
        result = await db.students.delete_one({"student_id": sanitize_string(student_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="الطالب غير موجود")
        
        return {"message": "تم حذف الطالب بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting student: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف الطالب")

@api_router.delete("/admin/students")
async def delete_all_students(current_user: AdminUser = Depends(get_current_user)):
    """حذف جميع الطلاب - أدمن فقط"""
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="صلاحية المدير العام مطلوبة")
        
        result = await db.students.delete_many({})
        
        return {
            "message": f"تم حذف {result.deleted_count} طالب بنجاح",
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting all students: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف البيانات")

# Include router and startup events
@app.on_event("startup")
async def startup_event():
    """أحداث بدء التطبيق"""
    try:
        logger.info("Starting up the application...")
        await create_indexes()
        await create_default_admin()
        await create_default_educational_stages()
        await create_default_content()
        await create_default_system_settings()
        await create_default_stage_templates()  # إضافة القوالب الافتراضية
        await create_default_certificate_templates()  # إضافة قوالب الشهادات الافتراضية
        await create_default_educational_content()
        await create_default_notification_system()
        await create_default_homepage_system()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """إعداد التطبيق عند البداية"""
    await create_indexes()
    await create_default_admin()
    await create_default_educational_stages()
    await create_default_content()
    logger.info("Application started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """تنظيف الموارد عند الإغلاق"""
    client.close()
    logger.info("Application shutdown completed")