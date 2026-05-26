from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Request model for user login - supports username or email"""
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=6, description="User password")


class RegisterRequest(BaseModel):
    """Request model for user registration"""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name")
    role: str = Field(default="User", description="User role (Compliance Manager, Compliance Analyst, System Administrator, User)")


class ForgotPasswordRequest(BaseModel):
    """Request model for forgot password"""
    email: EmailStr = Field(..., description="Email address")


class ResetPasswordRequest(BaseModel):
    """Request model for password reset"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")


class ChangePasswordRequest(BaseModel):
    """Request model for changing password (authenticated user)"""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")


class UserProfile(BaseModel):
    """User profile information"""
    id: Optional[int] = None
    username: str
    email: str
    full_name: str
    role: str
    created_at: Optional[datetime] = None


class LoginResponse(BaseModel):
    """Response model for login"""
    success: bool
    message: str
    user: Optional[UserProfile] = None
    token: Optional[str] = None  # JWT token for session management


class RegisterResponse(BaseModel):
    """Response model for registration"""
    success: bool
    message: str
    user: Optional[UserProfile] = None


class ForgotPasswordResponse(BaseModel):
    """Response model for forgot password"""
    success: bool
    message: str


class ResetPasswordResponse(BaseModel):
    """Response model for password reset"""
    success: bool
    message: str


class VerifyTokenResponse(BaseModel):
    """Response model for token verification"""
    valid: bool
    message: str


# Made with Bob
