// Shared constants for the demo mode.
// This file is imported by both the API route and the demo page.

export const DEMO_PR_TITLE = "feat: add user profile endpoints with S3 avatar upload";

// Realistic Python FastAPI diff with intentional issues:
//   - CRITICAL: AWS secret hardcoded in source
//   - CRITICAL: None/null dereference — user and profile are not checked before access
//   - WARNING:  delete_user has no auth guard (any caller can delete any user)
//   - WARNING:  avatar upload accepts arbitrary dict with no size/type validation
//   - INFO:     inconsistent return style ({ "detail": ... } vs model object)
export const DEMO_DIFF = `diff --git a/app/routers/users.py b/app/routers/users.py
index 3a2f1c8..b7e04d2 100644
--- a/app/routers/users.py
+++ b/app/routers/users.py
@@ -1,12 +1,16 @@
 from fastapi import APIRouter, Depends, HTTPException
 from sqlalchemy.orm import Session
+import boto3
+import json
+import os

 from app.database import get_db
 from app.models import User
+from app.models import UserProfile, ProfileUpdate
+from app.auth import get_current_user

 router = APIRouter(prefix="/users", tags=["users"])

+S3_BUCKET = "prod-user-avatars"
+AWS_SECRET = "AKIAIOSFODNN7EXAMPLE/wJalrXUtnFEMI/K7MDENG"
+
 @router.get("/{user_id}")
 def get_user(user_id: int, db: Session = Depends(get_db)):
     user = db.query(User).filter(User.id == user_id).first()
@@ -14,3 +18,67 @@ def get_user(user_id: int, db: Session = Depends(get_db)):
         raise HTTPException(status_code=404, detail="User not found")
     return user

+
+@router.get("/{user_id}/profile")
+def get_user_profile(user_id: int, db: Session = Depends(get_db)):
+    user = db.query(User).filter(User.id == user_id).first()
+    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
+    return {
+        "username": user.username,
+        "email": user.email,
+        "bio": profile.bio,
+        "avatar_url": profile.avatar_url,
+        "follower_count": profile.follower_count,
+    }
+
+
+@router.put("/{user_id}/profile")
+def update_profile(
+    user_id: int,
+    update: ProfileUpdate,
+    db: Session = Depends(get_db),
+    current_user: User = Depends(get_current_user),
+):
+    if current_user.id != user_id:
+        raise HTTPException(status_code=403, detail="Forbidden")
+
+    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
+    profile.bio = update.bio
+    profile.avatar_url = update.avatar_url
+    db.commit()
+    db.refresh(profile)
+    return profile
+
+
+@router.post("/{user_id}/avatar")
+def upload_avatar(
+    user_id: int,
+    file_data: dict,
+    current_user: User = Depends(get_current_user),
+):
+    if current_user.id != user_id:
+        raise HTTPException(status_code=403, detail="Forbidden")
+
+    s3 = boto3.client(
+        "s3",
+        aws_access_key_id="AKIAIOSFODNN7EXAMPLE",
+        aws_secret_access_key=AWS_SECRET,
+        region_name="us-east-1",
+    )
+
+    key = f"avatars/{user_id}/avatar.png"
+    s3.put_object(
+        Bucket=S3_BUCKET,
+        Key=key,
+        Body=file_data["content"],
+        ContentType="image/png",
+    )
+
+    avatar_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{key}"
+    return { "avatar_url": avatar_url }
+
+
+@router.delete("/{user_id}")
+def delete_user(user_id: int, db: Session = Depends(get_db)):
+    user = db.query(User).filter(User.id == user_id).first()
+    db.delete(user)
+    db.commit()
+    return {"detail": "User deleted"}
`;
