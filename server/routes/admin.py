from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
from db import SessionLocal, User, Attendance
from utils.storage import upload_bytes_to_gcp
from models.face_recognition import extract_face_embedding, embedding_to_bytes

router = APIRouter()

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
async def upload_face(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Invalid file format")

    try:
        content: bytes = await file.read()

        # Upload image to Google Cloud Storage or local fallback
        file_url = await upload_bytes_to_gcp(file.filename, content)

        # Generate face embedding
        embedding = extract_face_embedding(content)

        # Save user data to DB
        new_user = User(name=name, face_image_url=file_url, face_embedding=embedding_to_bytes(embedding))
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "User added successfully", "user_id": new_user.id}
    except HTTPException:
        raise
    except Exception as e:
        # Surface a clear message to the client (still JSON)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/users")
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {"id": u.id, "name": u.name, "face_image_url": u.face_image_url}
        for u in users
    ]


@router.get("/attendance")
async def list_attendance(db: Session = Depends(get_db)):
    # Simple join to attach user name
    rows = (
        db.query(Attendance, User)
        .join(User, Attendance.user_id == User.id)
        .order_by(Attendance.timestamp.desc())
        .all()
    )
    return [
        {
            "attendance_id": a.id,
            "user_id": u.id,
            "user_name": u.name,
            "timestamp": a.timestamp.isoformat(),
        }
        for a, u in rows
    ]