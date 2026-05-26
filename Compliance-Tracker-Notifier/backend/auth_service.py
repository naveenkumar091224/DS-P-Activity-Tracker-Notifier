from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from user_models import User
from auth_utils import (
    hash_password, 
    verify_password, 
    create_access_token,
    generate_reset_token,
    validate_password_strength
)
from auth_schemas import (
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserProfile
)


def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
    """Authenticate a user by username/email and password"""
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    if not user:
        return None
    
    if not user.is_active:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def register_user(db: Session, registration: RegisterRequest) -> tuple[Optional[User], str]:
    """
    Register a new user
    Returns: (user, error_message)
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == registration.username).first()
    if existing_user:
        return None, "Username already taken"
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == registration.email).first()
    if existing_email:
        return None, "Email already registered"
    
    # Validate password strength
    is_valid, message = validate_password_strength(registration.password)
    if not is_valid:
        return None, message
    
    # Create new user
    hashed_password = hash_password(registration.password)
    new_user = User(
        username=registration.username,
        email=registration.email,
        password_hash=hashed_password,
        full_name=registration.full_name,
        role=registration.role  # Use role from registration request
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user, ""


def initiate_password_reset(db: Session, email: str) -> tuple[bool, str, Optional[str]]:
    """
    Initiate password reset process
    Returns: (success, message, reset_token)
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if email exists for security
        return True, "If the email exists, a reset link has been sent", None
    
    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    
    db.commit()
    
    return True, "Password reset link sent to your email", reset_token


def reset_password(db: Session, token: str, new_password: str) -> tuple[bool, str]:
    """
    Reset password using token
    Returns: (success, message)
    """
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        return False, "Invalid or expired reset token"
    
    # Check if token is expired
    if user.reset_token_expiry < datetime.utcnow():
        return False, "Reset token has expired"
    
    # Validate new password
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        return False, message
    
    # Update password
    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    
    db.commit()
    
    return True, "Password reset successful"


def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> tuple[bool, str]:
    """
    Change password for authenticated user
    Returns: (success, message)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False, "User not found"
    
    # Verify old password
    if not verify_password(old_password, user.password_hash):
        return False, "Current password is incorrect"
    
    # Validate new password
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        return False, message
    
    # Update password
    user.password_hash = hash_password(new_password)
    db.commit()
    
    return True, "Password changed successfully"


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def user_to_profile(user: User) -> UserProfile:
    """Convert User model to UserProfile schema"""
    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at
    )


def create_demo_users(db: Session):
    """Create demo users for testing"""
    demo_users = [
        {
            "username": "aarav",
            "email": "aarav.sharma@company.com",
            "password": "Password123",
            "full_name": "Aarav Sharma",
            "role": "Compliance Manager"
        },
        {
            "username": "priya",
            "email": "priya.patel@company.com",
            "password": "Password123",
            "full_name": "Priya Patel",
            "role": "Compliance Analyst"
        },
        {
            "username": "admin",
            "email": "admin@company.com",
            "password": "Admin123",
            "full_name": "Admin User",
            "role": "System Administrator"
        }
    ]
    
    for user_data in demo_users:
        # Check if user already exists
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"]
            )
            db.add(user)
    
    db.commit()


# Made with Bob